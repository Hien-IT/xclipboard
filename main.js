const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, screen, clipboard, nativeImage } = require('electron');
const path = require('path');
const ClipboardMonitor = require('./src/clipboard-monitor');
const StorageManager = require('./src/storage');

let mainWindow;
let tray;
let monitor;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowHeight = 350;

  mainWindow = new BrowserWindow({
    width: width,
    height: windowHeight,
    x: 0,
    y: height - windowHeight, // bottom of screen
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'renderer', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Hide window when clicking outside
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    // Reposition window to the active display based on cursor position
    const cursorPoint = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
    const { width, height, x, y } = currentDisplay.workArea;
    const windowHeight = 350;

    mainWindow.setBounds({
      width: width,
      height: windowHeight,
      x: x,
      y: y + height - windowHeight
    });

    mainWindow.show();
    mainWindow.focus();
    // Send latest data to renderer when opened
    mainWindow.webContents.send('clipboard-data', StorageManager.getAllItems());
  }
}

function createTray() {
  // Use template image for macOS auto dark/light mode support
  const iconPath = path.join(__dirname, 'assets', 'newTrayTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('XClipBoard');

  const startAtLogin = app.getLoginItemSettings().openAtLogin;

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Clipboard', accelerator: 'CmdOrCtrl+Shift+V', click: toggleWindow },
    { type: 'separator' },
    { 
      label: 'Start at Login', 
      type: 'checkbox', 
      checked: startAtLogin, 
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          openAsHidden: true // Khởi động ngầm
        });
      }
    },
    { type: 'separator' },
    { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.on('click', toggleWindow);
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu);
  });
}

app.whenReady().then(() => {
  // Hide from Dock - app lives only in menu bar
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createWindow();
  createTray();

  // Register global shortcut
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    toggleWindow();
  });

  // Start monitoring
  monitor = new ClipboardMonitor();
  monitor.on('clipboard-change', (item) => {
    const savedItem = StorageManager.addItem(item);
    if (mainWindow) {
      mainWindow.webContents.send('clipboard-new-item', savedItem);
    }
  });
  monitor.start();

  // IPC Handlers
  ipcMain.handle('get-items', () => {
    return StorageManager.getAllItems();
  });

  ipcMain.handle('delete-item', (event, id) => {
    StorageManager.deleteItem(id);
    return true;
  });

  ipcMain.handle('toggle-favorite', (event, id) => {
    return StorageManager.toggleFavorite(id);
  });

  ipcMain.handle('clear-history', () => {
    StorageManager.clearHistory();
    return true;
  });

  ipcMain.handle('check-accessibility', (event, prompt) => {
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron');
      return systemPreferences.isTrustedAccessibilityClient(prompt);
    }
    return true;
  });

  ipcMain.handle('get-settings', () => {
    return StorageManager.getSettings();
  });

  ipcMain.handle('update-settings', (event, newSettings) => {
    StorageManager.updateSettings(newSettings);
    return true;
  });

  ipcMain.handle('paste-item', (event, item) => {
    // Write back to system clipboard
    if (item.type === 'text' || item.type === 'link') {
      clipboard.writeText(item.content);
    } else if (item.type === 'image') {
       // Convert data URL back to NativeImage
       const nativeImage = require('electron').nativeImage.createFromDataURL(item.content);
       clipboard.writeImage(nativeImage);
    }
    
    // Hide window and app to guarantee focus returns to the previous application
    mainWindow.hide();
    if (process.platform === 'darwin') {
      app.hide();
    }

    // Use AppleScript to trigger Cmd+V on macOS
    if (process.platform === 'darwin') {
      const { exec } = require('child_process');
      // Wait 150ms for the Electron window to hide completely and the previous app to regain focus
      setTimeout(() => {
        exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', (err, stdout, stderr) => {
          if (err) console.log("Auto-paste AppleScript error:", stderr);
        });
      }, 150);
    }
    
    return true;
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (monitor) monitor.stop();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
