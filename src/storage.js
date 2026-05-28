const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

const store = new Store({
  defaults: {
    clipboardHistory: [],
    settings: {
      retentionDays: 30
    }
  }
});

const MAX_ITEMS = 1000;

class StorageManager {
  static getSettings() {
    return store.get('settings') || {};
  }

  static updateSettings(newSettings) {
    const currentSettings = this.getSettings();
    store.set('settings', { ...currentSettings, ...newSettings });
    this.cleanOldItems();
  }

  static cleanOldItems() {
    const settings = this.getSettings();
    // Default to 30 if undefined
    const retentionDays = settings.retentionDays !== undefined ? settings.retentionDays : 30;
    
    if (retentionDays <= 0) return; // 0 means keep forever

    let history = store.get('clipboardHistory') || [];
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    const initialLength = history.length;
    history = history.filter(item => {
      // Always keep favorites
      if (item.favorite) return true;
      // Safety check: if timestamp is missing, keep it
      if (!item.timestamp) return true;
      // Delete if older than maxAge
      return (now - item.timestamp) < maxAgeMs;
    });

    if (history.length !== initialLength) {
      store.set('clipboardHistory', history);
    }
  }

  static getAllItems() {
    this.cleanOldItems();
    return store.get('clipboardHistory');
  }

  static addItem(item) {
    this.cleanOldItems();
    const history = store.get('clipboardHistory');
    
    // Check for duplicate text
    if (item.type === 'text') {
      const existingIndex = history.findIndex(i => i.type === 'text' && i.content === item.content);
      if (existingIndex !== -1) {
        // Move to top if exists, unless it's favorited (then we just update timestamp)
        const existing = history[existingIndex];
        history.splice(existingIndex, 1);
        existing.timestamp = item.timestamp;
        history.unshift(existing);
        store.set('clipboardHistory', history);
        return existing;
      }
    }

    // Add new item
    const newItem = {
      id: uuidv4(),
      favorite: false,
      ...item
    };

    history.unshift(newItem);

    // Keep within limits (don't delete favorites when cleaning up)
    if (history.length > MAX_ITEMS) {
      const nonFavorites = history.filter(i => !i.favorite);
      if (nonFavorites.length > 0) {
        // Remove oldest non-favorite
        const oldestIndex = history.lastIndexOf(nonFavorites[nonFavorites.length - 1]);
        history.splice(oldestIndex, 1);
      }
    }

    store.set('clipboardHistory', history);
    return newItem;
  }

  static deleteItem(id) {
    let history = store.get('clipboardHistory');
    history = history.filter(item => item.id !== id);
    store.set('clipboardHistory', history);
  }

  static toggleFavorite(id) {
    const history = store.get('clipboardHistory');
    const item = history.find(i => i.id === id);
    if (item) {
      item.favorite = !item.favorite;
      store.set('clipboardHistory', history);
    }
    return item;
  }

  static clearHistory() {
    const history = store.get('clipboardHistory');
    const favoritesOnly = history.filter(item => item.favorite);
    store.set('clipboardHistory', favoritesOnly);
  }
}

module.exports = StorageManager;
