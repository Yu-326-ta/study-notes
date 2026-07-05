import type {
  QuestionCustomizations,
  QuestionEditForm,
  QuestionOverride,
} from "@/domain/question-customization";
import type { Question } from "@/domain/question";

const STORAGE_KEY = "study-quiz:v1:question-customizations";
export const CUSTOMIZATION_CHANGED_EVENT = "study-quiz:customization-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emptyCustomizations(): QuestionCustomizations {
  return { version: 1, hiddenIds: [], overrides: {} };
}

let cachedCustomizations: QuestionCustomizations | null = null;

export function loadCustomizations(): QuestionCustomizations {
  if (!isBrowser()) return emptyCustomizations();
  if (cachedCustomizations) return cachedCustomizations;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedCustomizations = emptyCustomizations();
      return cachedCustomizations;
    }
    const parsed = JSON.parse(raw) as QuestionCustomizations;
    cachedCustomizations = {
      version: 1,
      hiddenIds: parsed.hiddenIds ?? [],
      overrides: parsed.overrides ?? {},
    };
    return cachedCustomizations;
  } catch {
    cachedCustomizations = emptyCustomizations();
    return cachedCustomizations;
  }
}

function saveCustomizations(data: QuestionCustomizations): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  cachedCustomizations = data;
  window.dispatchEvent(new CustomEvent(CUSTOMIZATION_CHANGED_EVENT));
}

function applyOverride(
  question: Question,
  override: QuestionOverride | undefined
): Question {
  if (!override) return question;
  return {
    ...question,
    prompt: override.prompt ?? question.prompt,
    answer: override.answer ?? question.answer,
    keyPoints: override.keyPoints ?? question.keyPoints,
  };
}

export function isQuestionHidden(questionId: string): boolean {
  return loadCustomizations().hiddenIds.includes(questionId);
}

export function hideQuestion(questionId: string): void {
  const data = loadCustomizations();
  if (!data.hiddenIds.includes(questionId)) {
    data.hiddenIds.push(questionId);
  }
  saveCustomizations(data);
}

export function restoreQuestion(questionId: string): void {
  const data = loadCustomizations();
  data.hiddenIds = data.hiddenIds.filter((id) => id !== questionId);
  saveCustomizations(data);
}

export function saveQuestionOverride(
  questionId: string,
  form: QuestionEditForm
): void {
  const data = loadCustomizations();
  const override: QuestionOverride = {
    prompt: form.prompt.trim(),
    answer: form.answer.trim(),
    keyPoints: form.keyPoints?.filter((kp) => kp.trim()).map((kp) => kp.trim()),
    updatedAt: new Date().toISOString(),
  };
  data.overrides[questionId] = override;
  saveCustomizations(data);
}

export function resetQuestionOverride(questionId: string): void {
  const data = loadCustomizations();
  delete data.overrides[questionId];
  saveCustomizations(data);
}

export function applyQuestionCustomizations(question: Question): Question {
  const { overrides } = loadCustomizations();
  return applyOverride(question, overrides[question.id]);
}

export function filterVisibleQuestions(questions: Question[]): Question[] {
  const { hiddenIds, overrides } = loadCustomizations();
  const hidden = new Set(hiddenIds);
  const result: Question[] = [];
  for (const q of questions) {
    if (hidden.has(q.id)) continue;
    result.push(applyOverride(q, overrides[q.id]));
  }
  return result;
}

export function getHiddenQuestionIds(): string[] {
  return loadCustomizations().hiddenIds;
}

export function isQuestionEdited(questionId: string): boolean {
  return questionId in loadCustomizations().overrides;
}

export function importCustomizations(data: QuestionCustomizations): void {
  saveCustomizations(data);
}

export function exportCustomizations(): QuestionCustomizations {
  return loadCustomizations();
}

export function invalidateCustomizationsCache(): void {
  cachedCustomizations = null;
}
