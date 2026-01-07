// 範囲選択モードを開始する関数
window.startSelectionMode = () => {
  if (document.getElementById('nbs-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'nbs-overlay';
  document.body.appendChild(overlay);

  let startX, startY;
  let selectionBox = null;

  const onMouseDown = (e) => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;

    selectionBox = document.createElement('div');
    selectionBox.id = 'nbs-selection-box';
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    document.body.appendChild(selectionBox);

    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
  };

  const onMouseUp = (e) => {
    overlay.removeEventListener('mousemove', onMouseMove);
    overlay.removeEventListener('mouseup', onMouseUp);

    // 座標データを取得してPopupへ送信（保存）
    const rect = selectionBox.getBoundingClientRect();
    const area = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio
    };

    // UIを掃除
    document.body.removeChild(selectionBox);
    document.body.removeChild(overlay);

    // バックグラウンドにキャプチャ依頼
    chrome.runtime.sendMessage({ action: "capture_area", area: area }, (response) => {
      if (response && response.success) {
        // キャプチャ画像をストレージに保存してPopupで開けるようにする
        chrome.storage.local.set({ capturedImage: response.imageData }, () => {
          alert("キャプチャしました！拡張機能アイコンをクリックして生成してください。");
        });
      }
    });
  };

  overlay.addEventListener('mousedown', onMouseDown);
};

// Popupからのメッセージ受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_selection") {
    window.startSelectionMode();
  }
});
