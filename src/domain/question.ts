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
  | "source";

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
