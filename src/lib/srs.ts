import type { SelfGrade } from "@/domain/progress";

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeNextReviewDate(
  lastGrade: SelfGrade,
  reviewCount: number,
  previousIntervalDays: number,
  fromDate: Date = new Date()
): string {
  if (lastGrade === "unknown") {
    return addDays(fromDate, 1);
  }
  if (lastGrade === "partial") {
    return addDays(fromDate, reviewCount <= 1 ? 1 : 2);
  }
  if (reviewCount <= 1) {
    return addDays(fromDate, 3);
  }
  const nextInterval = Math.min(previousIntervalDays * 2, 30);
  return addDays(fromDate, nextInterval);
}

export function previousIntervalDays(
  nextReviewDate: string,
  lastAnsweredAt: string
): number {
  const next = new Date(nextReviewDate);
  const last = new Date(lastAnsweredAt);
  const diff = Math.round(
    (next.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 1);
}

export function weakScore(
  gradeHistory: SelfGrade[],
  nextReviewDate: string,
  today: string
): number {
  const unknownCount = gradeHistory.filter((g) => g === "unknown").length;
  const partialCount = gradeHistory.filter((g) => g === "partial").length;
  const knownCount = gradeHistory.filter((g) => g === "known").length;
  const isOverdue = nextReviewDate <= today ? 5 : 0;
  return unknownCount * 3 + partialCount - knownCount * 2 + isOverdue;
}
