import type { NotionCategory, QuestionSet } from "./question";

export type SystemDesignSection = {
  id: string;
  title: string;
  content: string;
  order: number;
};

export type SourceDocument = {
  id: string;
  questionSet: QuestionSet;
  title: string;
  url: string;
  excerpt: string;
  section?: string;
  notionCategory?: NotionCategory;
  slug?: string;
  sections?: SystemDesignSection[];
  content?: string;
};
