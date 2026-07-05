# Study Quiz — 問題集プロダクト

Notion「勉強」の内容をもとに、記憶定着のための問題集 Web アプリを構築する。

## ドキュメント一覧

| ファイル | 内容 |
| -------- | ---- |
| [requirements.md](./requirements.md) | 用件定義（目的・機能要件・非機能要件・スコープ） |
| [ui-ux-spec.md](./ui-ux-spec.md) | UI/UX 設計・学習フロー・画面構成 |
| [data-model.md](./data-model.md) | 問題データ構造・資料・進捗の扱い |

## 設計の要点

| 項目 | 方針 |
| ---- | ---- |
| **問題集** | **本編**（Notion 記載内容すべて）と **周辺知識**（別問題集・優先度低） |
| **資料** | 回答画面に限らず、**いつでも** 資料タブ・セッション 📎 から閲覧 |
| **技術** | Next.js フロントのみ、JSON + localStorage |

## 参照

- Notion 元データ: [notion-link.md](../../notion/notion-link.md)

## 前提

- **フロントエンドのみ**で完結（Next.js）
- **DB・バックエンド不要**（問題データはリポジトリ内の静的ファイル、進捗は `localStorage`）
