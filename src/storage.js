const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

const store = new Store({
  defaults: {
    clipboardHistory: []
  }
});

const MAX_ITEMS = 1000;

class StorageManager {
  static getAllItems() {
    return store.get('clipboardHistory');
  }

  static addItem(item) {
    const history = this.getAllItems();
    
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
    let history = this.getAllItems();
    history = history.filter(item => item.id !== id);
    store.set('clipboardHistory', history);
  }

  static toggleFavorite(id) {
    const history = this.getAllItems();
    const item = history.find(i => i.id === id);
    if (item) {
      item.favorite = !item.favorite;
      store.set('clipboardHistory', history);
    }
    return item;
  }

  static clearHistory() {
    const history = this.getAllItems();
    const favoritesOnly = history.filter(item => item.favorite);
    store.set('clipboardHistory', favoritesOnly);
  }
}

module.exports = StorageManager;
