document.addEventListener('DOMContentLoaded', () => {
  const btnSelect = document.getElementById('btnSelect');
  const btnGenerate = document.getElementById('btnGenerate');
  const capturedImg = document.getElementById('capturedImg');
  const resultImg = document.getElementById('resultImg');
  const status = document.getElementById('status');
  const promptInput = document.getElementById('prompt');
  const apiKeyInput = document.getElementById('apiKey');

  // APIキーの読み込み
  chrome.storage.local.get(['apiKey', 'capturedImage'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.capturedImage) {
      capturedImg.src = result.capturedImage;
      capturedImg.style.display = 'block';
    }
  });

  // APIキー保存
  apiKeyInput.addEventListener('change', () => {
    chrome.storage.local.set({ apiKey: apiKeyInput.value });
  });

  // 1. 範囲選択モード起動
  btnSelect.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => { window.startSelectionMode(); }
      });
      window.close(); // ポップアップを閉じて選択しやすくする
    });
  });

  // 2. 画像生成 (Nano Banana Pro / Gemini API)
  btnGenerate.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value;
    const imageBase64 = capturedImg.src.split(',')[1]; // DataURLからBase64部分のみ抽出
    const promptText = promptInput.value;

    if (!apiKey) { alert('APIキーを設定してください'); return; }
    if (!imageBase64) { alert('画像をキャプチャしてください'); return; }
    if (!promptText) { alert('プロンプトを入力してください'); return; }

    status.textContent = "生成中... (Nano Banana Pro)";
    btnGenerate.disabled = true;

    try {
      // Google GenAI API エンドポイント (Gemini 3 Pro Vision / Image)
      // ※モデル名は実際のNano Banana ProのAPI名に合わせて変更してください
      // ここでは標準的なGemini Visionの形式を想定しています
      const modelName = "models/gemini-1.5-pro-latest"; // または "gemini-3.0-pro-image" など
      const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{
          parts: [
            { text: promptText + " Generate an image based on this reference." },
            {
              inline_data: {
                mime_type: "image/png",
                data: imageBase64
              }
            }
          ]
        }],
        // 画像生成を強制するための設定（モデル仕様による）
        // 現行APIではテキストで返ってくる場合があるため、画像生成モデルを明示的に呼ぶ必要があります
      };

      // ※注意: もしNano Banana Proが専用の画像生成エンドポイントを持つ場合（Imagen 3など）
      // ペイロード構造が異なる可能性があります。以下は一般的なマルチモーダルチャットの例です。

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // レスポンスの解析（モデルによって異なる）
      // 画像が返ってくる場合、Base64などで格納されているはずです
      if (data.candidates && data.candidates[0].content) {
         // ここで画像データを抽出して表示
         // 現状のGemini APIはテキストで返すことが多いですが、画像生成モデルの場合は
         // 画像URLまたはBase64が返ります。
         status.textContent = "生成完了（レスポンスを確認してください）";
         console.log(data);
         // 仮にBase64が返ってきた場合の表示処理
         // resultImg.src = ...
      } else {
        throw new Error('画像生成に失敗しました');
      }

    } catch (error) {
      console.error(error);
      status.textContent = "エラー: " + error.message;
    } finally {
      btnGenerate.disabled = false;
    }
  });
});
