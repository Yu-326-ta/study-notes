import type { NotionCategory, QuestionSet } from "./question";

export type SourceDocument = {
  id: string;
  questionSet: QuestionSet;
  title: string;
  url: string;
  excerpt: string;
  section?: string;
  notionCategory?: NotionCategory;
};
