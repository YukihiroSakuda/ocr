# Screenshot OCR App

デスクトップ用のスクリーンショット OCR アプリケーションです。Electron + Next.js（App Router） + Tailwind を組み合わせ、ローカルでスクリーンショットやクリップボード画像を読み込み、Tesseract.js を利用してテキスト化します。OpenCV.js による前処理・履歴管理・設定の保存にも対応しています。

## 主な機能

- クリップボード／ファイルから画像を読み込み、ワンクリックで OCR を実行
- OpenCV.js を用いた前処理（閾値処理、デスキューなど）
- 抽出テキストの編集、コピー、行数・文字数表示
- 抽出履歴の保存／再適用／削除
- 言語・テーマなどのユーザー設定を保存
- Electron Builder によるマルチプラットフォームパッケージ

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（renderer, electron を並列実行）
npm run dev
```

以下の URL にアクセスすると renderer の UI を確認できます。

- http://localhost:3000

## プロジェクト構成

- `renderer/` … Next.js (App Router) フロントエンド
- `electron/` … Electron メインプロセスの TypeScript ソース（`dist-electron` に出力）
- `dist/` … Electron Builder で生成されるパッケージ出力フォルダ
- `CHANGELOG.md` … リリース履歴

## ビルド・配布

```bash
# 1. クリーンビルド
npm run clean

# 2. Lint とビルド
cmd /c npm run lint
cmd /c npm run build

# 3. パッケージ生成（NSIS インストーラ等）
cmd /c npm run package
```

生成物は `dist/` 配下（Windows の場合 `Screenshot OCR App Setup <version>.exe`）に出力されます。

> Windows でエラーが出る場合は「開発者モード」を有効にし、十分なディスク空き容量を確保した上で上記コマンドを実行してください。

## 追加メモ

- OpenCV.js 読み込み時の型エラーを避けるため、`renderer/lib/ocr.ts` では OpenCV モジュールの型を明示しています。
- Tesseract.js のワーカーは言語切り替えに対応できるようキャッシュ／再初期化を実装しています。
- Lint は `eslint .` を使用し、Next.js 本番ビルドも `npm run build` で検証可能です。

## ライセンス

ライセンスはリポジトリの方針に従ってください（未設定の場合は適宜追加してください）。
