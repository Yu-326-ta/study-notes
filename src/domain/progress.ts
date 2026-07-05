import type { QuestionSet } from "./question";

export type SelfGrade = "known" | "partial" | "unknown";

export type QuestionProgress = {
  questionId: string;
  firstAnsweredAt: string;
  lastAnsweredAt: string;
  lastGrade: SelfGrade;
  nextReviewDate: string;
  reviewCount: number;
  gradeHistory: SelfGrade[];
  note?: string;
};

export type StudyProgress = {
  version: 1;
  questionSet: QuestionSet;
  questions: Record<string, QuestionProgress>;
  lastStudyDate: string;
  streakDays: number;
};

export type StudySettings = {
  sessionSize: number;
  interleave: boolean;
  thinkingPrompt: boolean;
  defaultQuestionSet: QuestionSet;
  mixedMode: boolean;
};

export const DEFAULT_SETTINGS: StudySettings = {
  sessionSize: 10,
  interleave: true,
  thinkingPrompt: true,
  defaultQuestionSet: "notion",
  mixedMode: false,
};

export const SELF_GRADE_LABELS: Record<SelfGrade, string> = {
  known: "覚えていた",
  partial: "うろ覚え",
  unknown: "忘れていた",
};
