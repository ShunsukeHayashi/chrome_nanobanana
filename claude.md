# Nano Banana Snapper

Chrome extension for capturing screen areas and generating images using Google's Gemini API (Nano Banana / Nano Banana Pro).

## Project Structure

```
nano-banana-grabber/
├── manifest.json      # Chrome extension manifest (v3)
├── background.js      # Service worker for screenshot capture
├── content.js         # Area selection overlay UI
├── content.css        # Selection box styling
├── popup.html         # Extension popup interface
├── popup.js           # API communication and logic
└── icon.svg           # Extension icon
```

## Features

- **Area Selection**: Click and drag to select any region on a webpage
- **Image-to-Image Generation**: Use captured images as reference for AI generation
- **Model Selection**:
  - Nano Banana (gemini-2.5-flash-image): Fast, efficient
  - Nano Banana Pro (gemini-3-pro-image-preview): High quality, up to 4K
- **Aspect Ratio**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9
- **Resolution** (Pro only): 1K, 2K, 4K

## Development

### Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `nano-banana-grabber` folder

### API Key

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Tech Stack

- Chrome Extension Manifest V3
- Google GenAI API (Gemini 2.5 Flash Image / Gemini 3 Pro Image)
- Vanilla JavaScript
- OffscreenCanvas for image cropping

## API Reference

- [Gemini Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- Model endpoints:
  - `gemini-2.5-flash-image` - Fast image generation
  - `gemini-3-pro-image-preview` - High quality with thinking mode
