# Git Operations

Press `Ctrl+G` to open the git popup for the selected pane's working directory. The popup shows a file list with individual file staging using vim-style navigation.

## File List Navigation

| Key      | Action                      |
| -------- | --------------------------- |
| `j`/`k`  | Move cursor up/down         |
| `Space`  | Toggle file selection       |
| `a`      | Select/deselect all files   |
| `g`/`G`  | Jump to top/bottom          |
| `Enter`  | Stage selected files        |
| `Ctrl+A` | Stage all files (git add -A)|
| `Ctrl+P` | Push to remote              |
| `q`/`Esc`| Close                       |

## File Status Colors

- Yellow (M) — modified
- Green (A) — added
- Red (D) — deleted
- Blue (R) — renamed
- Dim (??) — untracked

## Workflow

1. Press `Ctrl+G` to open
2. Navigate with `j`/`k`, select files with `Space`
3. Press `Enter` to stage selected files, or `Ctrl+A` to stage all
4. Type a commit message and press `Enter`
5. Press `Ctrl+P` to push

## Requirements

Git operations use the pane's current working directory. The popup only appears when the pane's CWD is inside a git repository.
