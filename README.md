# huge-mouse

A floating desktop app that sends input to tmux sessions running `claude` or `codex`.

[日本語版はこちら](README.ja.md)

## What it does

huge-mouse sits on top of your other windows and lets you type commands to AI coding assistants (`claude`, `codex`) running in tmux — without switching to your terminal.

It auto-discovers active AI panes, shows their status, and even lets you click numbered choices when the AI asks a question.

## Requirements

- macOS
- [tmux](https://github.com/tmux/tmux) with at least one session running `claude` or `codex`

## Install

### Homebrew (recommended)

```bash
brew install --cask yugo-ibuki/tap/huge-mouse
```

### Manual

Download the latest DMG from the [Releases](https://github.com/yugo-ibuki/huge-mouse/releases) page and drag the app to `/Applications`.

### macOS Gatekeeper warning

On first launch, macOS may block the app because it is not notarized. To open it:

**System Settings → Privacy & Security** → scroll down and click **Open Anyway** next to the blocked message.

## How to use

1. Start `claude` or `codex` inside a tmux pane
2. Open huge-mouse — it automatically finds your AI panes
3. Select a pane from the tags at the top
4. Type your message and press `Cmd+Enter` to send (configurable to `Enter` in settings)

### Pane badges

Each pane tag shows a badge indicating which tool is running: **CC** (Claude Code) in blue, **CX** (Codex) in green.

### Status indicators

| Indicator | Meaning |
|-----------|---------|
| Green dot | Ready for input |
| Orange dot | Busy, processing |
| Gray dot | Waiting for your response — choice buttons appear |

### When the AI asks a question

When `claude` or `codex` presents numbered choices (e.g. "1. Yes / 2. No"), clickable buttons appear next to the pane tag. Click one to respond instantly.

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` or `Enter` | Send input (configurable) |
| `Cmd+↑` | Switch to previous pane |
| `Cmd+↓` | Switch to next pane |
| `Ctrl+1-9` | Send numbered choice directly (modifier key configurable) |
| `Ctrl+H` / `Ctrl+L` | Switch to previous / next pane |
| `Ctrl+P` | Open pane content preview (key configurable) |
| `Ctrl+N` | Create a new session (select target tmux session and command) |
| `Ctrl+D` | Open session detail popup (key configurable) |
| `Ctrl+C` | Close session with confirmation (when detail panel is open) |
| `Ctrl+G` | Open git operations popup (key configurable) |
| `Ctrl+W` | Toggle compact mode — shrinks window to tab bar only (key configurable) |
| `↑` / `↓` | Navigate input history |
| `Cmd+Shift+H` | Focus huge-mouse from any app (key configurable) |
| `Escape` | Close popup / refocus textarea |

Popups support vim-style navigation: `j`/`k` (scroll), `d`/`u` (half-page), `g`/`G` (top/bottom), `q` (close).

The pane preview (`Ctrl+P`) opens scrolled to the bottom and highlights Claude's last response with a blue accent border.

### Session detail

Press `Ctrl+D` to view details of the selected pane: target, command, model, session ID, PID, CWD, and git branch/status. The detail panel also has a **Close Session** button to terminate the pane. Pressing `Ctrl+C` while the detail panel is open shows a confirmation dialog before closing.

### Session management

Press `Ctrl+N` to create a new session. A dialog lets you pick a target tmux session and choose whether to launch `claude` or `codex`. The new window is created in the selected tmux session and the pane list refreshes automatically.

### Git operations

Press `Ctrl+G` to open git operations for the selected pane's working directory. You can **Add All**, **Commit** (with a message), and **Push** directly from the popup. Shortcuts within the popup: `Ctrl+A` (add all), `Ctrl+P` (push).

### Settings

Click the gear icon to access settings:

- **Always on Top** — keep the window above other windows
- **Opacity** — adjust window transparency (50%–100%)
- **Font Size** — adjust text size for textarea and preview log
- **Theme** — switch between Dark and Light
- **Choice Key** — change the modifier for quick choice shortcuts (`Ctrl` or `Cmd`)
- **Send Key** — choose between `Cmd+Enter` or `Enter` to send (the other key inserts a newline)
- **Vim Mode** — enable Escape+i insert mode switch for Claude CLI's vim editor mode
- **Compact Key** — change the key for compact mode toggle (`Ctrl+<key>`)
- **Preview Key** — change the key for pane content preview (`Ctrl+<key>`)
- **Detail Key** — change the key for session detail popup (`Ctrl+<key>`)
- **Git Key** — change the key for git operations popup (`Ctrl+<key>`)
- **Focus Key** — change the global shortcut to focus huge-mouse (`Cmd+Shift+<key>`)

## License

MIT
