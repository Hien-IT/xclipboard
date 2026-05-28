const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getItems: () => ipcRenderer.invoke('get-items'),
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
  toggleFavorite: (id) => ipcRenderer.invoke('toggle-favorite', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  pasteItem: (item) => ipcRenderer.invoke('paste-item', item),
  checkAccessibility: (prompt) => ipcRenderer.invoke('check-accessibility', prompt),
  
  onClipboardData: (callback) => {
    ipcRenderer.removeAllListeners('clipboard-data');
    ipcRenderer.on('clipboard-data', (_event, data) => callback(data));
  },
  onNewItem: (callback) => {
    ipcRenderer.removeAllListeners('clipboard-new-item');
    ipcRenderer.on('clipboard-new-item', (_event, item) => callback(item));
  }
});
