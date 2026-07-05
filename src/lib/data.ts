import type { Question, NotionCategory, QuestionSet, StudyMode } from "@/domain/question";
import type { StudyProgress } from "@/domain/progress";
import type { SourceDocument } from "@/domain/source";
import {
  CUSTOMIZATION_CHANGED_EVENT,
  applyQuestionCustomizations,
  filterVisibleQuestions,
  getHiddenQuestionIds,
} from "./question-customizations";
import { weakScore, todayString } from "./srs";

import notionInterview from "@/data/questions/notion/interview.json";
import notionProductDeepDive from "@/data/questions/notion/product-deep-dive.json";
import relatedGeneral from "@/data/questions/related/general.json";

import sourcesInterview from "@/data/sources/notion/interview.json";
import sourcesProductDeepDive from "@/data/sources/notion/product-deep-dive.json";
import sourcesRelated from "@/data/sources/related/general.json";

const RAW_NOTION_QUESTIONS: Question[] = [
  ...(notionInterview as Question[]),
  ...(notionProductDeepDive as Question[]),
];

const RAW_RELATED_QUESTIONS: Question[] = relatedGeneral as Question[];

const RAW_ALL_QUESTIONS: Question[] = [
  ...RAW_NOTION_QUESTIONS,
  ...RAW_RELATED_QUESTIONS,
];

const ALL_SOURCES: SourceDocument[] = [
  ...(sourcesInterview as SourceDocument[]),
  ...(sourcesProductDeepDive as SourceDocument[]),
  ...(sourcesRelated as SourceDocument[]),
];

type QuestionCache = {
  notion: Question[];
  related: Question[];
  all: Question[];
};

let visibleCache: QuestionCache | null = null;

function rebuildVisibleCache(): QuestionCache {
  visibleCache = {
    notion: filterVisibleQuestions(RAW_NOTION_QUESTIONS),
    related: filterVisibleQuestions(RAW_RELATED_QUESTIONS),
    all: filterVisibleQuestions(RAW_ALL_QUESTIONS),
  };
  return visibleCache;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getVisibleCache(): QuestionCache {
  if (!visibleCache) return rebuildVisibleCache();
  return visibleCache;
}

export function getAllQuestions(questionSet?: QuestionSet): Question[] {
  if (!isBrowser()) {
    if (questionSet === "notion") return RAW_NOTION_QUESTIONS;
    if (questionSet === "related") return RAW_RELATED_QUESTIONS;
    return RAW_ALL_QUESTIONS;
  }

  const cache = getVisibleCache();
  if (questionSet === "notion") return cache.notion;
  if (questionSet === "related") return cache.related;
  return cache.all;
}

if (isBrowser()) {
  window.addEventListener(CUSTOMIZATION_CHANGED_EVENT, () => {
    visibleCache = null;
  });
}

export function getQuestionById(id: string): Question | undefined {
  return getAllQuestions().find((q) => q.id === id);
}

export function getRawQuestionById(id: string): Question | undefined {
  return RAW_ALL_QUESTIONS.find((q) => q.id === id);
}

export function getHiddenQuestions(): Question[] {
  return getHiddenQuestionIds()
    .map((id) => RAW_ALL_QUESTIONS.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined)
    .map(applyQuestionCustomizations);
}

export function getAllSources(questionSet?: QuestionSet): SourceDocument[] {
  if (questionSet === "notion") {
    return ALL_SOURCES.filter((s) => s.questionSet === "notion");
  }
  if (questionSet === "related") {
    return ALL_SOURCES.filter((s) => s.questionSet === "related");
  }
  return ALL_SOURCES;
}

export function getSourceById(id: string): SourceDocument | undefined {
  return ALL_SOURCES.find((s) => s.id === id);
}

export function getSourceForQuestion(question: Question): SourceDocument | undefined {
  if (!question.sourceId) return undefined;
  return getSourceById(question.sourceId);
}

export function getQuestionsForSource(sourceId: string): Question[] {
  return getAllQuestions().filter((q) => q.sourceId === sourceId);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function selectQuestions(
  all: Question[],
  progress: StudyProgress,
  mode: StudyMode,
  options: {
    category?: NotionCategory;
    sourceId?: string;
    weakTags?: string[];
    limit?: number;
    interleave?: boolean;
  } = {}
): Question[] {
  const today = todayString();
  const limit = options.limit ?? all.length;
  let pool = [...all];

  if (options.category) {
    pool = pool.filter((q) => q.category === options.category);
  }
  if (options.sourceId) {
    pool = pool.filter((q) => q.sourceId === options.sourceId);
  }

  switch (mode) {
    case "due-today":
      pool = pool.filter((q) => {
        const p = progress.questions[q.id];
        if (!p) return true;
        return p.nextReviewDate <= today;
      });
      break;
    case "new":
      pool = pool.filter((q) => !progress.questions[q.id]);
      break;
    case "weak":
      pool = pool
        .filter((q) => progress.questions[q.id])
        .sort((a, b) => {
          const pa = progress.questions[a.id];
          const pb = progress.questions[b.id];
          return (
            weakScore(pb.gradeHistory, pb.nextReviewDate, today) -
            weakScore(pa.gradeHistory, pa.nextReviewDate, today)
          );
        });
      break;
    case "tag-linked":
      if (options.weakTags?.length) {
        pool = pool.filter((q) =>
          q.relatedToTags?.some((t) => options.weakTags?.includes(t))
        );
      }
      break;
    case "source":
      break;
    case "all":
    default:
      break;
  }

  if (options.interleave !== false && mode !== "weak") {
    pool = shuffle(pool);
  }

  return pool.slice(0, limit);
}

export function getWeakTagsFromNotionProgress(
  notionProgress: StudyProgress,
  limit = 5
): string[] {
  const tagScores = new Map<string, number>();
  const notionQuestions = getAllQuestions("notion");
  for (const q of notionQuestions) {
    const p = notionProgress.questions[q.id];
    if (!p) continue;
    const score = weakScore(p.gradeHistory, p.nextReviewDate, todayString());
    if (score <= 0) continue;
    for (const tag of q.tags) {
      tagScores.set(tag, (tagScores.get(tag) ?? 0) + score);
    }
  }
  return [...tagScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function countByMode(
  questions: Question[],
  progress: StudyProgress,
  mode: StudyMode
): number {
  return selectQuestions(questions, progress, mode, { limit: 9999 }).length;
}

export function getQuestionStatus(
  questionId: string,
  progress: StudyProgress
): "new" | "due" | "learning" | "mastered" {
  const p = progress.questions[questionId];
  if (!p) return "new";
  const today = todayString();
  if (p.nextReviewDate <= today) return "due";
  const recent = p.gradeHistory.slice(-3);
  if (recent.length >= 3 && recent.every((g) => g === "known")) return "mastered";
  return "learning";
}
