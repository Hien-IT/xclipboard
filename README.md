<![CDATA[# ✂️ XClipBoard

A sleek, lightweight clipboard manager for macOS built with Electron. XClipBoard lives in your menu bar and gives you instant access to your full clipboard history with a beautiful glassmorphism UI.

## ✨ Features

- **📋 Clipboard History** — Automatically saves everything you copy (text, links, images).
- **🔍 Search** — Instantly search through your clipboard history.
- **🏷️ Smart Filters** — Filter by type: All, Text, Links, Images, or Favorites.
- **⭐ Favorites** — Star important items so they never get deleted.
- **⌨️ Keyboard Shortcuts** — Quick paste with `Cmd+1` to `Cmd+9`, navigate with arrow keys.
- **🖥️ Multi-Monitor Support** — Popup appears on the screen where your cursor is.
- **⚙️ Retention Settings** — Configure how many days to keep history (default: 30 days).
- **🎨 Modern UI** — Dark glassmorphism design with smooth animations.
- **📌 Menu Bar App** — Runs quietly in your menu bar, always ready.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- macOS 12+

### Installation

```bash
# Clone the repository
git clone https://github.com/Hien-IT/xclipboard.git
cd xclipboard

# Install dependencies
npm install
```

### Run (Development)

```bash
npm start
```

The app will appear in your menu bar. Press **`Cmd + Shift + V`** to toggle the clipboard panel.

### Build (Production DMG)

```bash
chmod +x build.sh
./build.sh
```

The `.dmg` installer will be available in the `dist/` folder.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd + Shift + V` | Toggle clipboard panel |
| `Cmd + 1` to `Cmd + 9` | Quick paste item by position |
| `←` / `→` | Navigate between items |
| `Enter` | Paste selected item |
| `Esc` | Close panel |

## 🏗️ Project Structure

```
xclipboard/
├── main.js                 # Electron main process
├── src/
│   ├── clipboard-monitor.js # Clipboard polling & change detection
│   └── storage.js           # Data persistence (electron-store)
├── renderer/
│   ├── index.html           # UI layout
│   ├── styles.css           # Glassmorphism styling
│   ├── app.js               # UI logic & interactions
│   └── preload.js           # Secure IPC bridge
├── assets/                  # App & tray icons
├── build.sh                 # Build script for DMG
└── package.json
```

## ⚙️ Configuration

Click the **⚙️ gear icon** in the top-right corner of the panel to access settings:

| Setting | Default | Description |
|---|---|---|
| Keep history for (days) | 30 | Number of days to retain clipboard history. Set to `0` to keep forever. Favorites are always kept. |

## 🔐 Permissions

XClipBoard requires **Accessibility** permission on macOS to enable the auto-paste feature.

1. Go to **System Settings → Privacy & Security → Accessibility**
2. Click the **+** button and add the app
3. Toggle the switch to enable

> **Note:** If you rebuild the app, macOS may require you to re-grant this permission due to code signature changes.

## 🛠️ Tech Stack

- **[Electron](https://www.electronjs.org/)** — Cross-platform desktop framework
- **[electron-store](https://github.com/sindresorhus/electron-store)** — Persistent JSON storage
- **Vanilla JS/CSS** — No frontend framework, pure performance

## 📄 License

ISC © [Hien-IT](https://github.com/Hien-IT)
]]>
