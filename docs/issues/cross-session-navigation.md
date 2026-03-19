# Add cross-session navigation with Ctrl+Cmd+H/L

## Summary

Add keyboard shortcuts to navigate between tmux **sessions** (not just individual panes). Currently, `Ctrl+H` / `Ctrl+L` cycle through panes one by one within the flat pane list. The new shortcuts should jump across session boundaries.

## Current Behavior

- `Ctrl+H` / `Ctrl+L` navigate to the previous/next **pane** in the flat list, wrapping around at the ends.
- Panes are visually grouped by tmux session in the UI, but navigation treats them as a single flat list.

## Desired Behavior

- **`Ctrl+Cmd+H`**: Jump to the **previous session** group.
- **`Ctrl+Cmd+L`**: Jump to the **next session** group.
- When landing on a new session, **select the first pane** in that session group.
- **Wrap around**: navigating past the last session should wrap to the first session, and vice versa (consistent with existing pane navigation behavior).

## Example

Given sessions `[A (3 panes), B (2 panes), C (1 pane)]` with the current selection on B's 2nd pane:

- `Ctrl+Cmd+L` → selects C's 1st pane
- `Ctrl+Cmd+L` again → wraps to A's 1st pane
- `Ctrl+Cmd+H` → wraps to C's 1st pane

## Implementation Notes

- The session grouping logic already exists in `App.tsx` (panes are grouped by `target.split(':')[0]`).
- The keyboard handler in `App.tsx` (around line 186) can be extended with additional key combo checks for `e.ctrlKey && e.metaKey`.
