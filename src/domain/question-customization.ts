import type { Question } from "./question";

/** ユーザーが編集したフィールド（localStorage に保存） */
export type QuestionOverride = {
  prompt?: string;
  answer?: string;
  keyPoints?: string[];
  updatedAt: string;
};

export type QuestionCustomizations = {
  version: 1;
  /** 非表示（削除）にした問題 ID */
  hiddenIds: string[];
  /** 問題 ID → 編集内容 */
  overrides: Record<string, QuestionOverride>;
};

export type QuestionEditForm = Pick<Question, "prompt" | "answer" | "keyPoints">;
