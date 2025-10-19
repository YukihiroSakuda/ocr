# 要件定義書（Tailwind + Local OCR版）

**プロジェクト名**：Screenshot OCR App  
**バージョン**：1.1  
**作成日**：2025年10月18日  
**作成者**：Yukihiro Sakuda

---

## 1. 概要

### 1.1 目的
スクリーンショットや画像資料から、ワンクリックで文字を抽出・コピーできるデスクトップアプリを提供する。  
クラウド依存せずローカルでOCRを実行し、Tailwindベースのモダンで軽量なUIを実現する。

### 1.2 背景
- 会議や図面、ホワイトボードの内容を即テキスト化したいニーズが高い。  
- 従来ツールは操作が重く、クラウド通信が前提。  
- TailwindとElectronを用いることで、軽快で一貫性のあるUXを実装可能。

---

## 2. システム概要

| 項目 | 内容 |
|------|------|
| 種別 | デスクトップアプリ（Electron + Next.js + Tailwind） |
| 処理方式 | ローカルOCR（Tesseract.js + OpenCV.js） |
| 入力 | クリップボード画像／画像ファイル／PDF（単ページ） |
| 出力 | テキスト |
| 言語 | 日本語＋英語（`jpn+eng`） |
| 履歴 | SQLite（ローカル保存） |
| ネットワーク | 不要（完全オフライン） |

---

## 3. ユースケース

### 3.1 ワンクリックOCR
1. ユーザーがスクショを撮る（クリップボードに画像）  
2. アプリを起動  
3. 画像を自動取得 → OCR実行  
4. 結果画面で画像＋テキスト並列表示  
5. 「📋コピー」クリックでテキストコピー＆アプリ終了

### 3.2 詳細モード（右クリック起動）
- クリップボードOCR  
- ファイル選択してOCR  
- 履歴を閲覧（画像プレビュー＋再コピー）  
- 設定（言語・整形）  
- 終了

---

## 4. 機能要件

### 4.1 OCR処理
| 項目 | 内容 |
|------|------|
| OCRエンジン | Tesseract.js (LSTMモデル) |
| 言語 | 日本語＋英語 |
| 前処理 | OpenCV.js：グレースケール、二値化、傾き補正、コントラスト強調 |
| 整形 | 改行・空白削除（オプション） |
| 出力 | UTF-8 テキスト |

---

### 4.2 UI（Tailwindベース）

#### 構成
| エリア | 内容 |
|--------|------|
| 左ペイン | 画像プレビュー（ズーム/パン対応） |
| 右ペイン | OCR結果テキスト（scroll, select） |
| 下部 | アイコンバー（Lucideアイコン6種） |

#### Tailwindクラス設計例
| 要素 | 主なクラス |
|------|-------------|
| 画面全体 | `flex flex-col bg-gray-50 text-gray-800` |
| コンテナ | `rounded-lg shadow-md border border-gray-200` |
| 左ペイン | `flex items-center justify-center bg-gray-100 rounded-md` |
| 右ペイン | `p-4 overflow-y-auto whitespace-pre-wrap font-sans` |
| アイコンボタン | `w-10 h-10 flex items-center justify-center rounded-md hover:scale-105 hover:bg-gray-200 transition` |
| 強調ボタン | `bg-blue-600 text-white hover:bg-blue-700` |
| ダークモード | `dark:bg-gray-900 dark:text-gray-100` |

#### 配色テーマ
| 状態 | 背景 | 文字 | アクセント |
|------|------|------|-------------|
| Light | #F9FAFB | #111827 | #2563EB |
| Dark | #1F2937 | #F9FAFB | #60A5FA |

---

### 4.3 履歴機能
| 項目 | 内容 |
|------|------|
| 保存先 | SQLite（`userData/ocr_history.db`） |
| 保存項目 | 日時・画像パス・結果・信頼度・言語 |
| 閲覧 | 画像サムネイル＋テキスト要約表示 |
| 操作 | コピー／再OCR／削除 |
| 最大件数 | 200件（設定変更可） |

---

## 5. 非機能要件

| 分類 | 要件 |
|------|------|
| 性能 | OCR完了まで3秒以内（1080p画像） |
| 起動 | 1秒以内にUI表示 |
| 容量 | 100MB以下（日本語モデル含む） |
| 操作性 | クリック2回以内でコピー完了 |
| セキュリティ | 完全オフライン、履歴はローカル保存のみ |
| アクセシビリティ | アイコンに`aria-label`／ツールチップ表示 |
| スケーラビリティ | Tailwind変数で容易にテーマ変更可 |

---

## 6. 技術構成

| 層 | 技術 |
|----|------|
| フロント | Next.js (App Router, React 18) |
| UI | Tailwind CSS + Lucide Icons |
| バック | Electron (Main / Preload / Renderer分離) |
| OCR | Tesseract.js + OpenCV.js |
| DB | better-sqlite3 |
| 状態管理 | Zustand |
| 設定保存 | electron-store |
| 言語 | TypeScript |
| ビルド | electron-builder |

---

## 7. データ定義

```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  image_path TEXT NOT NULL,
  text_result TEXT NOT NULL,
  engine TEXT DEFAULT 'local',
  lang TEXT DEFAULT 'jpn+eng',
  confidence REAL
);
```

---

## 8. エラーハンドリング

| ケース | 表示メッセージ |
|--------|----------------|
| 画像なし | 「クリップボードに画像がありません」 |
| OCR失敗 | 「OCRに失敗しました。再試行してください。」 |
| DBエラー | 「履歴を保存できませんでした」 |
| ファイルアクセス失敗 | 「ファイルを開けません」 |

---

## 9. 操作フロー

```
[起動] → [クリップボード画像取得]
   ↓
[OpenCV前処理] → [Tesseract OCR]
   ↓
[結果画面表示]
   ↓
[📋コピー] → [終了]
```

---

## 10. Tailwindテーマ設定例

```js
module.exports = {
  darkMode: 'media',
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        accent: '#22C55E',
        surface: '#F9FAFB',
      },
      borderRadius: { md: '8px' },
      boxShadow: { soft: '0 2px 8px rgba(0,0,0,0.05)' },
    },
  },
  plugins: [],
};
```

---

## 11. 拡張計画
- 多言語モデル対応（`fra`, `deu`, `chi_sim` など）
- PDFマルチページOCR
- 履歴暗号化（`sqlcipher`）
- ダークモード切替（Tailwindテーマ拡張）
- ホットキー操作（例: Cmd+Shift+O 起動）

---

## 12. 開発スケジュール

| 期間 | 内容 |
|------|------|
| Day1–2 | Tailwind導入・UI構築（ResultWindow） |
| Day3 | OpenCV前処理・Tesseract連携 |
| Day4 | アイコンバー（Lucide）＋アニメーション設定 |
| Day5 | 履歴一覧・保存実装 |
| Day6 | 設定画面・デザイン調整 |
| Day7 | ビルド・テスト・配布準備 |

---

## 13. 承認
| 氏名 | 役割 | 承認日 |
|------|------|--------|
| Yukihiro Sakuda | 開発責任者 | YYYY/MM/DD |
| （レビュー者） | UIデザイン | - |
| （レビュー者） | 品質保証 | - |
