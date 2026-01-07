document.addEventListener('DOMContentLoaded', () => {
  const btnSelect = document.getElementById('btnSelect');
  const btnGenerate = document.getElementById('btnGenerate');
  const capturedImg = document.getElementById('capturedImg');
  const resultImg = document.getElementById('resultImg');
  const status = document.getElementById('status');
  const promptInput = document.getElementById('prompt');
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const aspectRatioSelect = document.getElementById('aspectRatio');
  const resolutionSelect = document.getElementById('resolution');

  // 設定の読み込み
  chrome.storage.local.get(['apiKey', 'capturedImage', 'model', 'aspectRatio', 'resolution'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.capturedImage) {
      capturedImg.src = result.capturedImage;
      capturedImg.style.display = 'block';
    }
    if (result.model) modelSelect.value = result.model;
    if (result.aspectRatio) aspectRatioSelect.value = result.aspectRatio;
    if (result.resolution) resolutionSelect.value = result.resolution;
    updateResolutionVisibility();
  });

  // 設定の保存
  apiKeyInput.addEventListener('change', () => {
    chrome.storage.local.set({ apiKey: apiKeyInput.value });
  });

  modelSelect.addEventListener('change', () => {
    chrome.storage.local.set({ model: modelSelect.value });
    updateResolutionVisibility();
  });

  aspectRatioSelect.addEventListener('change', () => {
    chrome.storage.local.set({ aspectRatio: aspectRatioSelect.value });
  });

  resolutionSelect.addEventListener('change', () => {
    chrome.storage.local.set({ resolution: resolutionSelect.value });
  });

  // Nano Banana Pro のみ解像度選択を表示
  function updateResolutionVisibility() {
    const resolutionContainer = document.getElementById('resolutionContainer');
    if (modelSelect.value === 'gemini-3-pro-image-preview') {
      resolutionContainer.style.display = 'block';
    } else {
      resolutionContainer.style.display = 'none';
    }
  }

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

  // 2. 画像生成 (Nano Banana / Nano Banana Pro)
  btnGenerate.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value;
    const imageBase64 = capturedImg.src ? capturedImg.src.split(',')[1] : null;
    const promptText = promptInput.value;
    const selectedModel = modelSelect.value;
    const aspectRatio = aspectRatioSelect.value;
    const resolution = resolutionSelect.value;

    if (!apiKey) { alert('APIキーを設定してください'); return; }
    if (!imageBase64) { alert('画像をキャプチャしてください'); return; }
    if (!promptText) { alert('プロンプトを入力してください'); return; }

    const modelDisplayName = selectedModel === 'gemini-3-pro-image-preview'
      ? 'Nano Banana Pro'
      : 'Nano Banana';
    status.textContent = `生成中... (${modelDisplayName})`;
    btnGenerate.disabled = true;
    resultImg.style.display = 'none';

    try {
      // Google GenAI API エンドポイント
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

      // 画像設定
      const imageConfig = {
        aspectRatio: aspectRatio
      };

      // Nano Banana Pro の場合は解像度も設定
      if (selectedModel === 'gemini-3-pro-image-preview') {
        imageConfig.imageSize = resolution;
      }

      const payload = {
        contents: [{
          parts: [
            {
              text: promptText
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: imageConfig
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API エラーが発生しました');
      }

      // レスポンスの解析
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        let foundImage = false;
        let responseText = '';

        for (const part of parts) {
          // テキスト部分
          if (part.text) {
            responseText += part.text;
          }
          // 画像部分 (inline_data)
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType;
            const imageData = part.inlineData.data;
            resultImg.src = `data:${mimeType};base64,${imageData}`;
            resultImg.style.display = 'block';
            foundImage = true;
          }
        }

        if (foundImage) {
          status.textContent = "生成完了!";
          if (responseText) {
            console.log('モデルからのテキスト:', responseText);
          }
        } else if (responseText) {
          // 画像が生成されなかった場合（テキストのみ）
          status.textContent = "テキストのみ返却されました: " + responseText.substring(0, 100);
          console.log('フルレスポンス:', responseText);
        } else {
          throw new Error('画像が生成されませんでした');
        }
      } else {
        console.error('予期しないレスポンス形式:', data);
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
