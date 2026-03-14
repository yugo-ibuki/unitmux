# huge-mouse

A floating desktop app that sends input to tmux sessions running `claude` or `codex`.

[日本語版はこちら](README.ja.md)

## What it does

huge-mouse is a small always-on-top Electron window that discovers tmux panes running AI coding assistants (`claude`, `codex`) and lets you send text input to them. It's useful when you want a lightweight, persistent UI for interacting with CLI-based AI tools without switching terminal windows.

## Features

- Auto-discovers tmux panes running `claude` or `codex`
- Pane status detection: idle, busy, or waiting for input
- One-click choice selection when the AI assistant presents numbered options
- Always-on-top floating window (toggleable)
- Keyboard shortcuts: `Cmd+Enter` to send, `Cmd+↑/↓` to switch panes

## Prerequisites

- **macOS / Linux** (tmux required)
- **Node.js** >= 18
- **tmux** installed and running with at least one session
- A `claude` or `codex` process running inside a tmux pane

## Installation

```bash
git clone https://github.com/yugo-ibuki/huge-mouse.git
cd huge-mouse
npm install
```

## Usage

### Development

```bash
npm run dev
```

### Build

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

### How to use

1. Start a tmux session and run `claude` or `codex` in a pane
2. Launch huge-mouse (`npm run dev` or the built app)
3. The app automatically finds active AI panes and shows them as selectable tags
4. Type your input in the textarea and press `Cmd+Enter` to send
5. When the AI presents numbered choices (e.g. Yes/No prompts), click the choice buttons to respond directly

### Pane status indicators

- **Green dot** — idle, ready for input
- **Yellow dot** — waiting for a response (choice buttons appear)
- **Gray dot** — busy, processing

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Send input to selected pane |
| `Cmd+↑` | Select previous pane |
| `Cmd+↓` | Select next pane |

## Development Commands

```bash
npm run dev              # Start development mode
npm run build            # Full build (typecheck + compile)
npm run lint             # ESLint
npm run format           # Prettier formatting
npm run typecheck        # TypeScript check
```

## Tech Stack

- Electron 39
- React 19
- TypeScript 5.9
- electron-vite + electron-builder

## License

MIT
