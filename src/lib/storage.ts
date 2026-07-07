import {
  DEFAULT_SETTINGS,
  type QuestionProgress,
  type SelfGrade,
  type StudyProgress,
  type StudySettings,
} from "@/domain/progress";
import type { QuestionSet } from "@/domain/question";
import type { QuestionCustomizations } from "@/domain/question-customization";
import {
  exportCustomizations,
  importCustomizations,
} from "./question-customizations";
import {
  computeNextReviewDate,
  previousIntervalDays,
  todayString,
} from "./srs";

const PROGRESS_KEY = (set: QuestionSet) => `study-quiz:v1:progress:${set}`;
const SETTINGS_KEY = "study-quiz:v1:settings";
const STREAK_KEY = "study-quiz:v1:streak";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadProgress(questionSet: QuestionSet): StudyProgress {
  if (!isBrowser()) {
    return emptyProgress(questionSet);
  }
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(questionSet));
    if (!raw) return emptyProgress(questionSet);
    return JSON.parse(raw) as StudyProgress;
  } catch {
    return emptyProgress(questionSet);
  }
}

export function saveProgress(progress: StudyProgress): void {
  if (!isBrowser()) return;
  localStorage.setItem(PROGRESS_KEY(progress.questionSet), JSON.stringify(progress));
}

function emptyProgress(questionSet: QuestionSet): StudyProgress {
  return {
    version: 1,
    questionSet,
    questions: {},
    lastStudyDate: "",
    streakDays: 0,
  };
}

export function loadSettings(): StudySettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: StudySettings): void {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function updateStreak(): number {
  if (!isBrowser()) return 0;
  const today = todayString();
  const raw = localStorage.getItem(STREAK_KEY);
  let streak = 0;
  let lastDate = "";
  if (raw) {
    const parsed = JSON.parse(raw) as { streakDays: number; lastDate: string };
    streak = parsed.streakDays;
    lastDate = parsed.lastDate;
  }
  if (lastDate === today) return streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  streak = lastDate === yesterdayStr ? streak + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ streakDays: streak, lastDate: today }));
  return streak;
}

export function getStreak(): number {
  if (!isBrowser()) return 0;
  const raw = localStorage.getItem(STREAK_KEY);
  if (!raw) return 0;
  const parsed = JSON.parse(raw) as { streakDays: number; lastDate: string };
  const today = todayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (parsed.lastDate === today || parsed.lastDate === yesterdayStr) {
    return parsed.streakDays;
  }
  return 0;
}

export function recordAnswer(
  questionSet: QuestionSet,
  questionId: string,
  grade: SelfGrade,
  note?: string
): QuestionProgress {
  const progress = loadProgress(questionSet);
  const today = todayString();
  const now = new Date().toISOString();
  const existing = progress.questions[questionId];
  const reviewCount = (existing?.reviewCount ?? 0) + 1;
  const prevInterval = existing
    ? previousIntervalDays(existing.nextReviewDate, existing.lastAnsweredAt)
    : 1;
  const gradeHistory = [...(existing?.gradeHistory ?? []), grade].slice(-10);
  const nextReviewDate = computeNextReviewDate(
    grade,
    reviewCount,
    prevInterval
  );
  const entry: QuestionProgress = {
    questionId,
    firstAnsweredAt: existing?.firstAnsweredAt ?? now,
    lastAnsweredAt: now,
    lastGrade: grade,
    nextReviewDate,
    reviewCount,
    gradeHistory,
    note: note ?? existing?.note,
  };
  progress.questions[questionId] = entry;
  progress.lastStudyDate = today;
  progress.streakDays = updateStreak();
  saveProgress(progress);
  return entry;
}

export type ExportBundle = {
  version: 1;
  exportedAt: string;
  progress: {
    notion: StudyProgress;
    related: StudyProgress;
    systemdesign: StudyProgress;
  };
  settings: StudySettings;
  streak: { streakDays: number; lastDate: string };
  customizations: QuestionCustomizations;
};

export function exportAllData(): ExportBundle {
  const streakRaw = isBrowser() ? localStorage.getItem(STREAK_KEY) : null;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: {
      notion: loadProgress("notion"),
      related: loadProgress("related"),
      systemdesign: loadProgress("systemdesign"),
    },
    settings: loadSettings(),
    streak: streakRaw
      ? (JSON.parse(streakRaw) as { streakDays: number; lastDate: string })
      : { streakDays: 0, lastDate: "" },
    customizations: exportCustomizations(),
  };
}

export function importAllData(bundle: ExportBundle): void {
  if (!isBrowser()) return;
  saveProgress(bundle.progress.notion);
  saveProgress(bundle.progress.related);
  if (bundle.progress.systemdesign) {
    saveProgress(bundle.progress.systemdesign);
  }
  saveSettings(bundle.settings);
  localStorage.setItem(STREAK_KEY, JSON.stringify(bundle.streak));
  if (bundle.customizations) {
    importCustomizations(bundle.customizations);
  }
}
