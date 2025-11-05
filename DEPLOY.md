# GitHub Pagesへのデプロイ方法

このOCR WebアプリをGitHub Pagesで公開する手順です。

## 🚀 デプロイ手順

### 1. GitHub Pagesを有効化

1. GitHubのリポジトリページにアクセス
   https://github.com/YukihiroSakuda/ocr

2. **Settings** タブをクリック

3. 左サイドバーの **Pages** をクリック

4. **Source** セクションで以下を設定：
   - Source: **GitHub Actions** を選択

5. 保存されると、自動的にデプロイが開始されます

### 2. デプロイの確認

1. リポジトリの **Actions** タブを開く

2. "Deploy to GitHub Pages" ワークフローが実行中であることを確認

3. ワークフローが完了したら、以下のURLでアクセス可能：
   **https://yukihirosakuda.github.io/ocr/**

### 3. 今後の更新

以降、`main`ブランチに変更をプッシュするたびに自動的にデプロイされます：

```bash
git add .
git commit -m "Update something"
git push origin main
```

## 🌐 公開されるURL

```
https://yukihirosakuda.github.io/ocr/
```

## 📋 デプロイされる内容

- 完全に静的なWebアプリ
- すべてのOCR処理はクライアントサイドで実行
- サーバー不要
- オフライン動作可能（初回アクセス後）

## 🔧 トラブルシューティング

### デプロイが失敗する場合

1. **Actions** タブでエラーログを確認
2. `renderer/package-lock.json` が最新であることを確認
3. ローカルでビルドが成功することを確認：
   ```bash
   cd renderer
   npm run build
   ```

### ページが表示されない場合

1. GitHub Pages が有効になっているか確認
2. Actions のビルドが成功しているか確認
3. 数分待ってからリロード（DNS更新に時間がかかる場合があります）

### 404エラーが出る場合

1. `renderer/next.config.ts` の `repoName` がリポジトリ名と一致しているか確認
2. 正しいURLでアクセスしているか確認（`/ocr/` が必要）

## 📱 PWA（Progressive Web App）として使用

ブラウザで開いた後、「ホーム画面に追加」することでアプリのように使用できます：

- **Chrome/Edge**: メニュー → アプリをインストール
- **Safari**: 共有 → ホーム画面に追加
- **Android**: メニュー → ホーム画面に追加

## 🔒 プライバシー

すべての処理はブラウザ内で完結します：
- 画像はサーバーに送信されません
- OCR処理はローカルで実行されます
- 履歴はブラウザのIndexedDBに保存されます

## 📦 カスタムドメインの使用（オプション）

カスタムドメインを使用したい場合：

1. `renderer/public/CNAME` ファイルを作成
2. ファイルに独自ドメインを記述（例：`ocr.example.com`）
3. DNS設定でGitHub Pagesを指定
4. GitHub Settings → Pages でカスタムドメインを設定
