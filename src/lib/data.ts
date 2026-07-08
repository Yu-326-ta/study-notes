import type { Question, NotionCategory, QuestionSet, StudyMode } from "@/domain/question";
import type { StudyProgress } from "@/domain/progress";
import type { SourceDocument } from "@/domain/source";
import {
  CUSTOMIZATION_CHANGED_EVENT,
  applyQuestionCustomizations,
  filterVisibleQuestions,
  getHiddenQuestionIds,
} from "./question-customizations";
import { loadProgress } from "./storage";
import { weakScore, todayString } from "./srs";

import notionInterview from "@/data/questions/notion/interview.json";
import notionProductDeepDive from "@/data/questions/notion/product-deep-dive.json";
import relatedGeneral from "@/data/questions/related/general.json";
import systemDesignGeneral from "@/data/questions/systemdesign/general.json";

import sourcesInterview from "@/data/sources/notion/interview.json";
import sourcesProductDeepDive from "@/data/sources/notion/product-deep-dive.json";
import sourcesRelated from "@/data/sources/related/general.json";
import sourcesSystemDesign from "@/data/sources/systemdesign/index.json";

const RAW_NOTION_QUESTIONS: Question[] = [
  ...(notionInterview as Question[]),
  ...(notionProductDeepDive as Question[]),
];

const RAW_RELATED_QUESTIONS: Question[] = relatedGeneral as Question[];

const RAW_SYSTEMDESIGN_QUESTIONS: Question[] = systemDesignGeneral as Question[];

const RAW_ALL_QUESTIONS: Question[] = [
  ...RAW_NOTION_QUESTIONS,
  ...RAW_RELATED_QUESTIONS,
  ...RAW_SYSTEMDESIGN_QUESTIONS,
];

const ALL_SOURCES: SourceDocument[] = [
  ...(sourcesInterview as SourceDocument[]),
  ...(sourcesProductDeepDive as SourceDocument[]),
  ...(sourcesRelated as SourceDocument[]),
  ...(sourcesSystemDesign as SourceDocument[]),
];

type QuestionCache = {
  notion: Question[];
  related: Question[];
  systemdesign: Question[];
  all: Question[];
};

let visibleCache: QuestionCache | null = null;

function rebuildVisibleCache(): QuestionCache {
  visibleCache = {
    notion: filterVisibleQuestions(RAW_NOTION_QUESTIONS),
    related: filterVisibleQuestions(RAW_RELATED_QUESTIONS),
    systemdesign: filterVisibleQuestions(RAW_SYSTEMDESIGN_QUESTIONS),
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
    if (questionSet === "systemdesign") return RAW_SYSTEMDESIGN_QUESTIONS;
    return RAW_ALL_QUESTIONS;
  }

  const cache = getVisibleCache();
  if (questionSet === "notion") return cache.notion;
  if (questionSet === "related") return cache.related;
  if (questionSet === "systemdesign") return cache.systemdesign;
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
  if (questionSet === "systemdesign") {
    return ALL_SOURCES.filter((s) => s.questionSet === "systemdesign");
  }
  return ALL_SOURCES;
}

export function getSystemDesignSourceBySlug(slug: string): SourceDocument | undefined {
  return ALL_SOURCES.find((s) => s.slug === slug && s.questionSet === "systemdesign");
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
    tags?: string[];
    questionIds?: string[];
    limit?: number;
    interleave?: boolean;
  } = {}
): Question[] {
  const today = todayString();
  let pool = [...all];

  if (options.questionIds?.length) {
    const idSet = new Set(options.questionIds);
    pool = pool.filter((q) => idSet.has(q.id));
  }

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
    case "tag":
      if (options.tags?.length) {
        pool = pool.filter((q) =>
          options.tags?.some((tag) => q.tags.includes(tag))
        );
      } else {
        pool = [];
      }
      break;
    case "retry-missed":
      pool = pool.filter((q) => {
        const p = progress.questions[q.id];
        return p?.lastGrade === "partial" || p?.lastGrade === "unknown";
      });
      break;
    case "retry-partial":
      pool = pool.filter((q) => progress.questions[q.id]?.lastGrade === "partial");
      break;
    case "retry-unknown":
      pool = pool.filter((q) => progress.questions[q.id]?.lastGrade === "unknown");
      break;
    case "source":
      break;
    case "all":
    case "category":
    default:
      break;
  }

  const shouldShuffle = options.interleave !== false && mode !== "weak";
  if (shouldShuffle) {
    pool = shuffle(pool);
  }

  const limit = options.limit ?? pool.length;
  return pool.slice(0, limit);
}

export function getStudyTags(
  questions: Question[]
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    for (const tag of q.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count < questions.length)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

export function countQuestionsByTags(
  questions: Question[],
  tags: string[]
): number {
  if (tags.length === 0) return 0;
  return questions.filter((q) => tags.some((tag) => q.tags.includes(tag))).length;
}

export function buildStudyHref(options: {
  set?: QuestionSet | "all";
  mode?: StudyMode;
  tags?: string[];
  ids?: string[];
  continuous?: boolean;
  category?: NotionCategory;
  sourceId?: string;
}): string {
  const params = new URLSearchParams();
  if (options.set) params.set("set", options.set);
  if (options.mode) params.set("mode", options.mode);
  if (options.continuous) params.set("continuous", "1");
  if (options.tags?.length) params.set("tags", options.tags.join(","));
  if (options.ids?.length) params.set("ids", options.ids.join(","));
  if (options.category) params.set("category", options.category);
  if (options.sourceId) params.set("sourceId", options.sourceId);
  return `/study?${params.toString()}`;
}

const ALL_QUESTION_SETS: QuestionSet[] = ["notion", "related", "systemdesign"];

export function resolveQuestionSets(
  set: QuestionSet | "all"
): QuestionSet[] {
  return set === "all" ? ALL_QUESTION_SETS : [set];
}

export function countRetryQuestions(
  sets: QuestionSet[],
  mode: "retry-missed" | "retry-partial" | "retry-unknown"
): number {
  return sets.reduce(
    (sum, set) =>
      sum + countByMode(getAllQuestions(set), loadProgress(set), mode),
    0
  );
}

export function selectRetryQuestions(
  sets: QuestionSet[],
  mode: "retry-missed" | "retry-partial" | "retry-unknown",
  options: { limit?: number; interleave?: boolean } = {}
): Question[] {
  let pool: Question[] = [];
  for (const set of sets) {
    pool.push(
      ...selectQuestions(getAllQuestions(set), loadProgress(set), mode, {
        interleave: false,
      })
    );
  }
  if (options.interleave !== false) {
    pool = shuffle(pool);
  }
  const limit = options.limit ?? pool.length;
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
