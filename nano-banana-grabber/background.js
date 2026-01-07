chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture_area") {
    // 現在のタブをキャプチャ
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      cropImage(dataUrl, request.area).then(croppedDataUrl => {
        sendResponse({ success: true, imageData: croppedDataUrl });
      });
    });
    return true; // 非同期レスポンスのために必要
  }
});

// 画像を座標に合わせて切り抜く関数
async function cropImage(dataUrl, area) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(area.width, area.height);
      const ctx = canvas.getContext('2d');
      // Device Pixel Ratioを考慮（Retinaディスプレイ対応など）
      const dpr = area.devicePixelRatio || 1;

      ctx.drawImage(
        img,
        area.x * dpr, area.y * dpr, area.width * dpr, area.height * dpr,
        0, 0, area.width, area.height
      );

      canvas.convertToBlob({ type: "image/png" }).then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };
    img.src = dataUrl;
  });
}
