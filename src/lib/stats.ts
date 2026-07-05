import type { NotionCategory, QuestionSet } from "@/domain/question";
import type { SelfGrade, StudyProgress } from "@/domain/progress";
import { getAllQuestions } from "./data";
import { todayString } from "./srs";

export type StatsSummary = {
  total: number;
  studied: number;
  mastered: number;
  dueToday: number;
  knownRate: number;
  streak: number;
  byCategory: Record<string, { total: number; knownRate: number }>;
  weakTags: { tag: string; score: number }[];
  heatmap: Record<string, number>;
};

function isKnownGrade(grade: SelfGrade): boolean {
  return grade === "known";
}

export function computeStats(
  questionSet: QuestionSet,
  progress: StudyProgress,
  streak: number
): StatsSummary {
  const questions = getAllQuestions(questionSet);
  const today = todayString();
  let studied = 0;
  let mastered = 0;
  let dueToday = 0;
  let knownCount = 0;
  let totalGraded = 0;
  const byCategory: Record<string, { total: number; known: number; graded: number }> = {};
  const tagScores = new Map<string, number>();
  const heatmap: Record<string, number> = {};

  for (const q of questions) {
    const cat = q.category ?? "other";
    if (!byCategory[cat]) byCategory[cat] = { total: 0, known: 0, graded: 0 };
    byCategory[cat].total++;

    const p = progress.questions[q.id];
    if (!p) {
      dueToday++;
      continue;
    }
    studied++;
    if (p.nextReviewDate <= today) dueToday++;
    const recent = p.gradeHistory.slice(-3);
    if (recent.length >= 3 && recent.every(isKnownGrade)) mastered++;

    for (const g of p.gradeHistory) {
      totalGraded++;
      if (isKnownGrade(g)) knownCount++;
    }
    if (isKnownGrade(p.lastGrade)) {
      byCategory[cat].known++;
    }
    byCategory[cat].graded++;

    const day = p.lastAnsweredAt.slice(0, 10);
    heatmap[day] = (heatmap[day] ?? 0) + 1;

    if (p.lastGrade === "unknown" || p.lastGrade === "partial") {
      for (const tag of q.tags) {
        tagScores.set(tag, (tagScores.get(tag) ?? 0) + 1);
      }
    }
  }

  const byCategoryResult: Record<string, { total: number; knownRate: number }> = {};
  for (const [cat, data] of Object.entries(byCategory)) {
    byCategoryResult[cat] = {
      total: data.total,
      knownRate: data.graded > 0 ? Math.round((data.known / data.graded) * 100) : 0,
    };
  }

  const weakTags = [...tagScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, score]) => ({ tag, score }));

  return {
    total: questions.length,
    studied,
    mastered,
    dueToday,
    knownRate: totalGraded > 0 ? Math.round((knownCount / totalGraded) * 100) : 0,
    streak,
    byCategory: byCategoryResult,
    weakTags,
    heatmap,
  };
}

export function getLast7DaysHeatmap(heatmap: Record<string, number>): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: heatmap[key] ?? 0 });
  }
  return result;
}

export function categoryLabel(cat: string): string {
  const labels: Record<NotionCategory | "other", string> = {
    interview: "質問集",
    "product-deep-dive": "プロダクト深掘り",
    other: "その他",
  };
  return labels[cat as NotionCategory | "other"] ?? cat;
}
