<div align="center">

<img src="public/icon-bg-512.png" alt="Mayoのアイコン" width="128">

# Mayo

**思いついたら、すぐメモ。**

Windows 11向けの、ちいさなクイックメモアプリです。<br>
ショートカットでさっと開いて、書いて、また作業に戻れます。

[ダウンロード](https://github.com/Manju2367/mayo/releases/latest) · [不具合を報告](https://github.com/Manju2367/mayo/issues)

</div>

## Mayoでできること

- `Ctrl + Alt + M` でいつでもメモを呼び出し
- メモはテキストファイルとして保存
- 保存したメモを一覧から開いて、続きから編集
- 矢印キーとEnterでメモを選択
- 不要なメモを確認して削除、またはショートカットですぐ削除
- 終了時に未保存の変更があれば確認
- 新しいバージョンをバックグラウンドで取得し、アプリ内から更新

## キーボードショートカット

| キー | 動作 |
| --- | --- |
| `Ctrl + Alt + M` | Mayoを表示／隠す |
| `Ctrl + S` | メモを保存 |
| `Ctrl + N` | 新しいメモを作成 |
| `Ctrl + L` | メモ一覧と編集画面を切り替え |
| `Esc` | 編集画面を隠す／一覧からメモに戻る |
| `Tab` | メモ本文にタブ文字を入力 |
| `↑` / `↓`、`Enter` | 一覧でメモを選んで開く |
| `D` / `Delete` | 選択中のメモを確認して削除 |
| `Ctrl + Shift + D` | 選択中のメモをすぐに削除 |

## インストール

[最新リリース](https://github.com/Manju2367/mayo/releases/latest)からWindows用インストーラー（`.exe`）をダウンロードして実行してください。

## 開発

Node.js 22を用意してから、依存関係をインストールします。

```powershell
npm ci
```

開発時はターミナルを2つ使います。先にViteを起動します。

```powershell
npx vite --host 127.0.0.1
```

別のターミナルでElectronを起動します。

```powershell
npm start
```

本番用のWindowsインストーラーは次のコマンドで作成できます。成果物は `release` フォルダーに出力されます。

```powershell
npm run package:win
```

## リリース（メンテナー向け）

1. リリースしたい変更を `main` ブランチにマージします。
2. `npm version patch` を実行します。マイナー更新なら `npm version minor` を使います。コミットと `vX.Y.Z` タグが作成されます。
3. `git push origin main --follow-tags` でGitHubへpushします。
4. GitHub ActionsがWindowsインストーラーをビルドし、GitHub ReleaseのDraftを作成します。
5. Draftにインストーラーと `latest.yml` が添付されたことを確認して、Releaseを公開します。

ReleaseのDraftはActionsが作成するため、手動で先に作る必要はありません。
