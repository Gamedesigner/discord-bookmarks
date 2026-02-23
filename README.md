# Discord Bookmark Companion

A desktop companion app for bookmarking Discord conversations with reminders. Save conversation links, add notes, set priorities, and schedule reminders to revisit them later.

## Features

- **Quick Add**: Save Discord links in seconds with preset options
- **Priority Tags**: Mark bookmarks as Urgent, Follow-up, or Read later
- **Smart Reminders**: Preset options (1h, Tonight, Tomorrow, Weekend) or custom date/time
- **Desktop Notifications**: Get notified when reminders are due
- **Snooze Actions**: Quick snooze presets (+15m, +1h, Tomorrow)
- **Search & Filter**: Find bookmarks by note, URL, or filter by status
- **Keyboard First**: Global hotkey (Ctrl+Shift+B) and keyboard shortcuts throughout

## Tech Stack

- **Desktop Shell**: Electron
- **UI**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (Discord-inspired dark theme)
- **Storage**: SQLite (better-sqlite3)
- **State**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd desktop
npm install
```

### Development

```bash
npm run electron:dev
```

This starts Vite dev server and Electron concurrently with hot reload.

### Build

```bash
npm run electron:build
```

Outputs platform-specific installers to `desktop/release/`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Open app and show Quick Add (global) |
| `Ctrl+N` | Open Quick Add modal |
| `Ctrl+Enter` | Save bookmark in Quick Add |
| `Escape` | Close modals |

## Project Structure

```
desktop/
├── electron/           # Main process code
│   ├── main.ts        # App entry, window, tray, IPC
│   ├── preload.ts     # Context bridge API
│   ├── database.ts    # SQLite setup
│   └── reminderScheduler.ts
├── src/
│   ├── app/           # App shell
│   ├── components/    # Shared components
│   ├── features/
│   │   ├── bookmarks/ # Bookmark UI components
│   │   └── reminders/ # Reminder services
│   ├── lib/           # Utilities, store, types
│   └── styles/        # Tailwind CSS
└── package.json
```

## Data Storage

Bookmarks are stored locally in SQLite at:
- Windows: `%APPDATA%/discord-bookmark-companion/bookmarks.db`
- macOS: `~/Library/Application Support/discord-bookmark-companion/bookmarks.db`
- Linux: `~/.config/discord-bookmark-companion/bookmarks.db`

## License

MIT
