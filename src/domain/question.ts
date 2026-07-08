export type QuestionSet = "notion" | "related" | "systemdesign";

export type NotionCategory =
  | "interview"
  | "product-deep-dive";

export type SystemDesignCategory = "systemdesign";

/** アプリで問題化する本編カテゴリ */
export const ACTIVE_NOTION_CATEGORIES: NotionCategory[] = [
  "interview",
  "product-deep-dive",
];

export type QuestionFormat = "recall" | "multiple-choice" | "fill-blank";

export type Question = {
  id: string;
  questionSet: QuestionSet;
  category?: NotionCategory | SystemDesignCategory;
  tags: string[];
  relatedToTags?: string[];
  prompt: string;
  answer: string;
  keyPoints?: string[];
  sourceId: string | null;
  sectionId?: string;
  difficulty?: 1 | 2 | 3;
  format?: QuestionFormat;
  choices?: string[];
  correctChoiceIndex?: number;
  fillBlankAnswer?: string;
};

export type StudyMode =
  | "due-today"
  | "new"
  | "weak"
  | "all"
  | "category"
  | "tag-linked"
  | "tag"
  | "retry-missed"
  | "retry-partial"
  | "retry-unknown"
  | "source";

export type RetryGradeFilter = "all" | "partial" | "unknown";

export const RETRY_GRADE_FILTER_LABELS: Record<RetryGradeFilter, string> = {
  all: "うろ覚え + 忘れた",
  partial: "うろ覚えのみ",
  unknown: "忘れたのみ",
};

export function retryModeFromGradeFilter(
  filter: RetryGradeFilter
): "retry-missed" | "retry-partial" | "retry-unknown" {
  if (filter === "partial") return "retry-partial";
  if (filter === "unknown") return "retry-unknown";
  return "retry-missed";
}

export const NOTION_CATEGORY_LABELS: Record<NotionCategory, string> = {
  interview: "質問集",
  "product-deep-dive": "プロダクト深掘り",
};

export const QUESTION_SET_LABELS: Record<QuestionSet, string> = {
  notion: "本編",
  related: "周辺知識",
  systemdesign: "システムデザイン",
};

export function questionSetBadgeVariant(
  set: QuestionSet
): "notion" | "related" | "systemdesign" {
  if (set === "notion") return "notion";
  if (set === "related") return "related";
  return "systemdesign";
}
