# データモデル — Study Quiz

フロントエンドのみで完結するため、**問題データは Git 管理の静的ファイル**、**学習進捗は localStorage** に分離する。

---

## 1. 問題データ（静的 JSON）

### 1.1 ファイル構成

```
src/data/
├── sources/
│   ├── index.ts              # SourceDocument 集約
│   ├── notion/               # Notion ページ単位の資料
│   │   ├── interview.json
│   │   ├── product-deep-dive.json
│   │   └── ...
│   └── related/              # 周辺知識用参考資料（外部 URL 可）
├── questions/
│   ├── index.ts              # 全問題の集約・型 export
│   ├── notion/               # 本編問題集
│   │   ├── interview.json
│   │   ├── product-deep-dive.json
│   │   ├── company.json
│   │   ├── leetcode.json
│   │   └── resume.json
│   └── related/              # 周辺知識問題集（別問題集）
│       ├── spanner.json
│       ├── go.json
│       └── ...
└── tags.ts
```

### 1.2 型定義

```typescript
/** 問題集 — 優先度が異なる 2 系統 */
type QuestionSet = "notion" | "related";

/** 本編内カテゴリ（Notion 構造に対応） */
type NotionCategory =
  | "interview"
  | "product-deep-dive"
  | "company"
  | "leetcode"
  | "resume";

type SelfGrade = "known" | "partial" | "unknown";

/** 資料 — 問題から独立し、いつでも閲覧可能 */
type SourceDocument = {
  id: string;
  /** 資料が属する問題集（notion 資料 / related 参考） */
  questionSet: QuestionSet;
  title: string;
  /** Notion URL または外部参考 URL */
  url: string;
  /** アプリ内表示用（長文可） */
  excerpt: string;
  section?: string;
  /** 紐づく Notion カテゴリ（資料一覧フィルタ用） */
  notionCategory?: NotionCategory;
};

type Question = {
  id: string;
  /** 本編 or 周辺知識 — 出題・SRS は問題集単位で独立 */
  questionSet: QuestionSet;
  /** 本編のみ。周辺知識は optional */
  category?: NotionCategory;
  tags: string[];
  /** 周辺知識のみ: 関連する本編タグ */
  relatedToTags?: string[];
  prompt: string;
  answer: string;
  keyPoints?: string[];
  /** 資料 ID（sources/ を参照）— 周辺知識は null 可（参考 URL のみ） */
  sourceId: string | null;
  difficulty?: 1 | 2 | 3;
};
```

### 1.3 データ例

#### 資料（SourceDocument）

```json
{
  "id": "source-interview-go",
  "questionSet": "notion",
  "notionCategory": "interview",
  "title": "質問集",
  "section": "使用言語の仕様Go",
  "url": "https://yielding-driver-de6.notion.site/34dc019fa92580ce9e8bd9f69e67bbd1",
  "excerpt": "GoはGCを持つ静的型付け言語です。GCはConcurrent Mark and Sweep方式で..."
}
```

#### 本編問題（questionSet: notion）

```json
{
  "id": "notion-interview-go-gc-001",
  "questionSet": "notion",
  "category": "interview",
  "tags": ["Go", "GC"],
  "prompt": "Go の GC はどの方式で、どんな特徴がありますか？",
  "answer": "Concurrent Mark and Sweep 方式。停止時間（STW）が短い。",
  "keyPoints": ["Concurrent Mark and Sweep", "STW が短い"],
  "sourceId": "source-interview-go",
  "difficulty": 2
}
```

#### 周辺知識問題（questionSet: related）

```json
{
  "id": "related-spanner-cap-001",
  "questionSet": "related",
  "tags": ["Spanner", "分散システム"],
  "relatedToTags": ["Spanner"],
  "prompt": "CAP 定理において Spanner はどのトレードオフを取っているか？",
  "answer": "TrueTime により外部一貫性を実現しつつ、障害時は可用性を犠牲にできる設計。",
  "keyPoints": ["TrueTime", "外部一貫性", "CP に近い"],
  "sourceId": "source-related-spanner-docs",
  "difficulty": 3
}
```

### 1.4 問題作成ガイドライン

#### 本編問題集（`notion`）

Notion「勉強」配下の **すべての記載内容** を漏れなく問題化する。

| ルール | 理由 |
| ------ | ---- |
| Notion 1 論点 = 1 問 を基本 | 想起単位を小さく保つ |
| 全カテゴリを対象 | 質問集・深掘り・会社情報・leetcode・職務経歴書 |
| 各問題に `sourceId` を必須 | 資料一覧・常時閲覧と紐づけ |
| 1 資料 → 複数問題 OK | 資料タブから関連問題へ導線 |

#### 周辺知識問題集（`related`）

| ルール | 理由 |
| ------ | ---- |
| Notion 本文に **ない** 知識のみ | 本編との重複を避ける |
| `relatedToTags` で本編タグと関連付け | 後から「Spanner 苦手 → 周辺問題」提案 |
| 本編と **別 JSON・別 SRS** | 優先度を分離 |
| `sourceId` は公式ドキュメント等でも可 | Notion 外の根拠を明示 |

**周辺知識の作成フロー:**

1. 本編問題の `tags` から技術一覧を抽出（Go, Spanner, Pub/Sub…）
2. 各技術について「Notion に書いていないが面接で聞かれうる点」を列挙
3. `questions/related/` に追加（本編完成後 or 並行）

**本編の変換例:**

| Notion | 問題 prompt |
| ------ | ----------- |
| 箇条書き「PRレビューではどんなところを見る」+ 複数 text | 「PR レビューで確認する観点を 4 つ挙げてください」 |
| text ブロック単体 | その内容を説明させる問いに変換 |

**プロダクト深掘りの変換例:**

| Notion | 問題 prompt |
| ------ | ----------- |
| ページタイトル「Spanner」 | 「なぜ Spanner を選んだのか？RDBMS としての特徴は？」 |
| 比較トピック | 「GraphQL と REST/gRPC の使い分け基準は？」 |

---

**周辺知識の変換例:**

| 本編タグ | 周辺知識 prompt |
| -------- | --------------- |
| Spanner | TrueTime は何を解決するか |
| Pub/Sub | at-least-once と exactly-once の違い |
| Go | JVM GC と Go GC の比較 |

---

## 2. 学習進捗（localStorage）

### 2.1 ストレージキー

```
study-quiz:v1:progress:notion
study-quiz:v1:progress:related
study-quiz:v1:settings
study-quiz:v1:streak
```

> 本編と周辺知識の SRS は **キーを分けて独立管理** する。

### 2.2 Progress 型

```typescript
type QuestionProgress = {
  questionId: string;
  /** 初回回答日時 ISO8601 */
  firstAnsweredAt: string;
  /** 最終回答日時 */
  lastAnsweredAt: string;
  /** 直近の自己採点 */
  lastGrade: SelfGrade;
  /** 次回復習予定日 YYYY-MM-DD */
  nextReviewDate: string;
  /** 復習回数 */
  reviewCount: number;
  /** 直近 N 回の採点履歴（最大 10） */
  gradeHistory: SelfGrade[];
};

type StudyProgress = {
  version: 1;
  /** 問題集 ID */
  questionSet: QuestionSet;
  questions: Record<string, QuestionProgress>;
  lastStudyDate: string;
  streakDays: number;
};
```

### 2.3 簡易 SRS アルゴリズム

自己採点後に `nextReviewDate` を更新する。

| 採点 | 初回 | 2 回目以降（前回が known の場合） |
| ---- | ---- | ----------------------------------- |
| known | +3 日 | 間隔 × 2（最大 30 日） |
| partial | +1 日 | +2 日 |
| unknown | 翌日 | 翌日（`gradeHistory` 先頭 2 件が unknown なら優先度フラグ） |

```typescript
function computeNextReviewDate(
  lastGrade: SelfGrade,
  reviewCount: number,
  previousIntervalDays: number
): string {
  // 実装は ui 層 or lib/srs.ts に配置
}
```

### 2.4 Settings 型

```typescript
type StudySettings = {
  sessionSize: number;
  /** 本編内カテゴリ混在（周辺知識とは混ぜない） */
  interleave: boolean;
  thinkingPrompt: boolean;
  /** デフォルト問題集 */
  defaultQuestionSet: QuestionSet; // default: "notion"
};
```

---

## 3. ドメインモデルとレイヤー

型安全性ルールに従い、`Tables<>` は使わずアプリ内型を定義する。

```
src/
├── domain/
│   ├── question.ts      # Question, QuestionSet
│   ├── source.ts        # SourceDocument
│   └── progress.ts
├── lib/
│   ├── questions.ts
│   ├── sources.ts       # 資料取得・問題との紐づけ
│   ├── srs.ts
│   └── storage.ts
├── data/
│   ├── sources/
│   └── questions/
└── app/
    ├── sources/         # 資料一覧・詳細（常時アクセス）
    └── study/
```

---

## 4. 出題ロジック

### 4.1 モード別クエリ

```typescript
type StudyMode =
  | "due-today"
  | "new"
  | "weak"
  | "all"
  | "category";

function selectQuestions(
  all: Question[],
  progress: StudyProgress,
  mode: StudyMode,
  options: {
    questionSet: QuestionSet; // 必須 — 混在不可
    category?: NotionCategory;
    limit?: number;
  }
): Question[];
```

> `questionSet` を必ず指定し、本編と周辺知識を **同一セッションに混在させない**。

### 4.2 優先度スコア（weak モード）

```
score = (unknown_count * 3) + (partial_count * 1) - (known_count * 2)
      + (is_overdue ? 5 : 0)
```

スコア降順で出題。

---

## 5. 資料（SourceDocument）の扱い

- 資料は `sources/` に **問題と独立** して定義
- UI の「資料」タブは `SourceDocument[]` を一覧表示
- 問題から `sourceId` で参照。逆引きで「この資料の問題 N 問」も表示
- 学習セッションでは `getSourceByQuestionId()` で資料を取得し `SourcePanel` に表示

---

## 6. Notion 連携（データ投入）

Phase 1 では **手動 + 半自動** を想定。

| 方法 | 説明 |
| ---- | ---- |
| 手動 | Notion 全ページを走査し、本編 JSON + sources JSON を作成 |
| スクリプト（Phase 2） | 全子ページ再帰取得 → 本編下書き。周辺知識は別途人手で追加 |

スクリプトは `scripts/notion-export/` に置き、**ビルドには含めない**。

---

## 7. バージョニング

| 変更 | 対応 |
| ---- | ---- |
| 問題文の修正（同一 id） | 進捗維持 |
| 問題削除 | 進捗からも削除（garbage collect on load） |
| `Question` 型の破壊的変更 | `study-quiz:v2:progress` にマイグレーション |
