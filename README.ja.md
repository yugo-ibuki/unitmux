# huge-mouse

tmux セッションで動作する `claude` や `codex` にテキスト入力を送信するフローティングデスクトップアプリです。

[English version](README.md)

## 概要

huge-mouse は、AIコーディングアシスタント（`claude`、`codex`）が動作している tmux ペインを自動検出し、テキスト入力を送信できる小さな常時最前面表示の Electron ウィンドウです。ターミナルウィンドウを切り替えることなく、CLI ベースの AI ツールとやり取りするための軽量で常駐型の UI として便利です。

## 機能

- `claude` または `codex` が動作している tmux ペインを自動検出
- ペインの状態検出：アイドル、ビジー、入力待ち
- AI アシスタントが番号付き選択肢を提示した際のワンクリック選択
- 常時最前面表示のフローティングウィンドウ（切り替え可能）
- キーボードショートカット：`Cmd+Enter` で送信、`Cmd+↑/↓` でペイン切り替え

## 前提条件

- **macOS / Linux**（tmux が必要）
- **Node.js** >= 18
- **tmux** がインストールされ、少なくとも1つのセッションが動作中であること
- tmux ペイン内で `claude` または `codex` プロセスが動作していること

## インストール

```bash
git clone https://github.com/yugo-ibuki/huge-mouse.git
cd huge-mouse
npm install
```

## 使い方

### 開発モード

```bash
npm run dev
```

### ビルド

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

### 操作方法

1. tmux セッションを開始し、ペイン内で `claude` または `codex` を実行する
2. huge-mouse を起動する（`npm run dev` またはビルド済みアプリ）
3. アプリがアクティブな AI ペインを自動検出し、選択可能なタグとして表示する
4. テキストエリアに入力し、`Cmd+Enter` で送信する
5. AI が番号付き選択肢（Yes/No プロンプトなど）を提示した場合、選択ボタンをクリックして直接応答できる

### ペインのステータス表示

- **緑のドット** — アイドル状態、入力受付可能
- **黄色のドット** — 応答待ち（選択ボタンが表示される）
- **グレーのドット** — ビジー、処理中

### キーボードショートカット

| ショートカット | アクション |
|---------------|-----------|
| `Cmd+Enter` | 選択中のペインに入力を送信 |
| `Cmd+↑` | 前のペインを選択 |
| `Cmd+↓` | 次のペインを選択 |

## 開発コマンド

```bash
npm run dev              # 開発モード起動
npm run build            # フルビルド（型チェック + コンパイル）
npm run lint             # ESLint
npm run format           # Prettier フォーマット
npm run typecheck        # TypeScript 型チェック
```

## 技術スタック

- Electron 39
- React 19
- TypeScript 5.9
- electron-vite + electron-builder

## ライセンス

MIT
