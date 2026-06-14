# rmux and Rust Migration Notes

This page records the discussion and follow-up work from 2026-06-14 around `rmux`, Ratatui, and the current
Electron-to-Rust migration branch.

## Context

The starting question was whether `rmux` would be a good fit for unitmux.

`rmux` is a Rust terminal multiplexer with a tmux-compatible CLI surface and a typed Rust SDK. The interesting part
for unitmux is not just that it can behave like tmux, but that it exposes programmable terminal automation primitives
from Rust: sessions, windows, panes, snapshots, input, waits, and pane events.

The important constraint is that tmux compatibility does not mean tmux and rmux share the same daemon or session
store. A pane created in rmux cannot be partly controlled by tmux commands. The reusable part is the operational
knowledge, not the daemon state.

## Current Architecture

The Rust branch already moved the desktop shell from Electron to Tauri.

The relevant shape is:

```text
src-tauri/src/main.rs
  -> AppState::new(TmuxRuntime::new(SystemRunner::default()))

crates/unitmux-core/src/tmux.rs
  -> TmuxRuntime
  -> SystemRunner
  -> tmux CLI commands

src/renderer/src/tauriApi.ts
  -> renderer API bridge
  -> Tauri invoke commands
```

This means the renderer already depends on the same high-level pane/session contract as before, while the terminal
backend logic lives in Rust. That is the right place to add a future backend abstraction.

## Findings

### rmux Fit

`rmux` is a plausible future backend for unitmux because the current core already depends on tmux-like operations:

- `list-panes`
- `display-message`
- `send-keys`
- `capture-pane`
- `new-window`
- `new-session`
- `kill-pane`

The safest first step would be an `rmux` CLI backend that mirrors the current tmux command usage. The stronger long
term step would be an `rmux-sdk` backend that uses typed Rust handles and structured snapshots instead of text-only
CLI scraping.

### Ratatui Fit

Ratatui is a Rust library for building terminal UIs. It is useful for apps like `htop`, `lazygit`, or a terminal-native
unitmux.

For the current Tauri + React app, Ratatui is not the main integration path. `ratatui-rmux` would matter if unitmux
also grows a terminal-native UI. For the desktop app, `rmux-sdk` is the more relevant part.

### tmux Workarounds

The existing tmux implementation contains real operational knowledge, such as the Codex Enter workaround in
`send_input`. That knowledge should be kept, but implemented per backend.

The right model is:

```text
MuxBackend
  -> TmuxBackend
  -> RmuxCliBackend
  -> RmuxSdkBackend
```

The wrong model is using tmux commands against rmux-owned panes, or mixing the two daemons for the same pane.

## Work Completed

Before considering rmux, the Rust migration needed to be checked. The current Rust branch was verified with:

```bash
npm run verify:migration
npm run smoke:mac-gui
```

The static migration verification passed. It covers Rust formatting, web typecheck, lint, script syntax, Rust tests,
Vitest tests, clippy, normal build, macOS bundle build, `Info.plist`, icon, codesign, docs build, dependency listing,
and Rust dependency tree output.

The first GUI smoke run exposed a problem in the smoke script, not in the app runtime:

- It looked up `process "unitmux"` by name.
- A previously installed `/Applications/Unitmux.app` and other local unitmux processes could be present at the same
  time.
- The AppleScript also referenced `frontmost of process "unitmux"` from inside `tell process "unitmux"`, which produced
  a type conversion error in System Events.

The smoke script was fixed to:

- record existing app PIDs before launch,
- open the packaged app,
- find the newly launched app PID by executable path,
- query System Events by `unix id`,
- read `frontmost` directly inside the selected process,
- terminate only the app process launched by the smoke test.

The fix was committed and pushed to the `to-rust` branch:

```text
1f3ede65b5be3c5c0b4d7fc5a585b89c6e210f1a
Fix macOS GUI smoke process targeting
```

After the fix, both checks passed:

```text
npm run verify:migration
npm run smoke:mac-gui
```

The GUI smoke result confirmed a frontmost packaged window at `700x400`.

## Current Recommendation

Do not introduce rmux yet.

First finish stabilizing and merging the Rust/Tauri migration. The migration branch now has stronger evidence because
the packaged macOS GUI smoke check passes in addition to static verification.

After that, introduce rmux as an experimental backend behind an explicit backend boundary.

## Proposed Plan

1. Finish the Rust/Tauri migration.
   Keep `tmux` as the default backend and avoid changing terminal behavior while merging the runtime migration.

2. Rename the core abstractions away from tmux-specific names.
   For example, move from `TmuxRuntime` / `CommandRunner` toward `MuxRuntime` / `MuxBackend`, while preserving the
   public renderer contract.

3. Keep `TmuxBackend` as the stable default.
   This preserves all existing behavior, including Codex and Claude-specific handling.

4. Add an experimental `RmuxCliBackend`.
   Start with the tmux-compatible command surface and verify parity for list, send, capture, create, shell-pane, and
   kill flows.

5. Add backend identity to pane references before mixing backends.
   A target like `work:0.0` can collide across daemons, so the internal reference should include the backend.

```ts
type PaneRef = {
  backend: 'tmux' | 'rmux'
  target: string
}
```

6. Evaluate `rmux-sdk` after the CLI backend proves useful.
   The SDK path is where rmux could provide real additional value: typed pane handles, structured snapshots, waits,
   and events.

7. Treat Ratatui as a separate product direction.
   It is relevant only if unitmux gains a terminal-native UI, not for the current Tauri + React desktop app.

## Open Questions

- Should unitmux support both tmux and rmux in the same UI at once, or should it be a single selected backend per app
  session?
- Should pane identity be changed in the renderer API now, or hidden inside the Rust core until multiple backends are
  actually enabled?
- Does rmux reproduce the same Codex Enter behavior that required the tmux `run-shell` workaround?
- Which rmux features are worth using first: CLI compatibility, SDK snapshots, output waits, or pane events?

