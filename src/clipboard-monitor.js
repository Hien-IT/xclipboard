const { clipboard } = require('electron');
const EventEmitter = require('events');

class ClipboardMonitor extends EventEmitter {
  constructor() {
    super();
    this.intervalId = null;
    this.lastText = '';
    this.lastImage = null;
    this.pollingInterval = 500;
  }

  start() {
    this.lastText = clipboard.readText();
    const currentImage = clipboard.readImage();
    this.lastImage = currentImage && !currentImage.isEmpty() ? currentImage.toDataURL() : null;

    this.intervalId = setInterval(() => {
      this.checkClipboard();
    }, this.pollingInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkClipboard() {
    const text = clipboard.readText();
    const html = clipboard.readHTML();
    const rtf = clipboard.readRTF();
    const image = clipboard.readImage();
    
    // Prioritize checking image first as copying image might also have text fallback
    if (image && !image.isEmpty()) {
      const imgDataUrl = image.toDataURL();
      if (imgDataUrl !== this.lastImage) {
        this.lastImage = imgDataUrl;
        // If image changed, we don't care about text for this poll to prevent duplicate entries
        this.lastText = text; 
        
        this.emit('clipboard-change', {
          type: 'image',
          content: imgDataUrl,
          timestamp: Date.now()
        });
        return;
      }
    }

    if (text && text !== this.lastText) {
      this.lastText = text;
      
      let type = 'text';
      if (this.isUrl(text)) {
        type = 'link';
      }

      this.emit('clipboard-change', {
        type,
        content: text,
        html: html || null, // store html format if available
        rtf: rtf || null,
        timestamp: Date.now()
      });
    }
  }

  isUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ClipboardMonitor;
