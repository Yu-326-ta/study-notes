"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { QuestionSet, RetryGradeFilter } from "@/domain/question";
import {
  QUESTION_SET_LABELS,
  RETRY_GRADE_FILTER_LABELS,
  retryModeFromGradeFilter,
} from "@/domain/question";
import {
  buildStudyHref,
  countRetryQuestions,
  resolveQuestionSets,
} from "@/lib/data";
import { useIsClient } from "@/hooks/useIsClient";
import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const SET_OPTIONS: { value: QuestionSet | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "notion", label: QUESTION_SET_LABELS.notion },
  { value: "related", label: QUESTION_SET_LABELS.related },
  { value: "systemdesign", label: QUESTION_SET_LABELS.systemdesign },
];

const GRADE_OPTIONS: RetryGradeFilter[] = ["all", "partial", "unknown"];

function parseInitialSet(value: string | null): QuestionSet | "all" {
  if (value === "notion" || value === "related" || value === "systemdesign") {
    return value;
  }
  return "all";
}

function parseInitialGrade(value: string | null): RetryGradeFilter {
  if (value === "partial" || value === "unknown") return value;
  return "all";
}

export function RetryStudyClient() {
  const mounted = useIsClient();
  const customizationRevision = useQuestionCustomizationRevision();
  const searchParams = useSearchParams();
  const [selectedSet, setSelectedSet] = useState<QuestionSet | "all">(() =>
    parseInitialSet(searchParams.get("set"))
  );
  const [gradeFilter, setGradeFilter] = useState<RetryGradeFilter>(() =>
    parseInitialGrade(searchParams.get("grade"))
  );

  const stats = useMemo(() => {
    if (!mounted) return null;

    const retryMode = retryModeFromGradeFilter(gradeFilter);
    const sets = resolveQuestionSets(selectedSet);
    const count = countRetryQuestions(sets, retryMode);

    const bySet = SET_OPTIONS.filter((o) => o.value !== "all").map((option) => ({
      set: option.value as QuestionSet,
      label: option.label,
      count: countRetryQuestions([option.value as QuestionSet], retryMode),
    }));

    return { count, bySet, retryMode };
  }, [mounted, selectedSet, gradeFilter, customizationRevision]);

  if (!stats) {
    return <div className="py-8 text-center text-[var(--muted)]">読み込み中...</div>;
  }

  const studyHref = buildStudyHref({
    set: selectedSet,
    mode: stats.retryMode,
    continuous: true,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">苦手な問題を再挑戦</h1>
        <p className="text-sm text-[var(--muted)]">
          過去に「うろ覚え」「忘れた」と評価した問題だけを、いつでもランダム順で連続学習できます。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">評価で絞り込む</h2>
        <div className="flex flex-wrap gap-2">
          {GRADE_OPTIONS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setGradeFilter(filter)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium min-h-[44px] transition-colors",
                gradeFilter === filter
                  ? "bg-orange-500 text-white"
                  : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
              )}
            >
              {RETRY_GRADE_FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">問題集</h2>
        <div className="grid grid-cols-2 gap-2">
          {SET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedSet(option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors min-h-[44px]",
                selectedSet === option.value
                  ? "border-orange-500/50 bg-orange-500/10 font-semibold text-orange-700 dark:text-orange-400"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 text-center">
        <p className="text-sm text-[var(--muted)]">対象</p>
        <p className="mt-1 text-4xl font-bold text-orange-600 dark:text-orange-400">
          {stats.count}
          <span className="ml-1 text-lg font-medium">問</span>
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {RETRY_GRADE_FILTER_LABELS[gradeFilter]} ·{" "}
          {SET_OPTIONS.find((o) => o.value === selectedSet)?.label}
        </p>
        <Link href={studyHref} className="mt-4 block">
          <Button size="lg" className="w-full" disabled={stats.count === 0}>
            ランダム順で再挑戦を始める
          </Button>
        </Link>
      </div>

      {selectedSet === "all" && stats.count > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--muted)]">問題集ごとの内訳</h2>
          <ul className="space-y-2">
            {stats.bySet
              .filter((item) => item.count > 0)
              .map((item) => (
                <li key={item.set}>
                  <Link
                    href={buildStudyHref({
                      set: item.set,
                      mode: stats.retryMode,
                      continuous: true,
                    })}
                    className="flex min-h-[44px] items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm hover:border-orange-500/30"
                  >
                    <span>{item.label}</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {item.count} 問 →
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      {stats.count === 0 && (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
          該当する問題がありません。学習後に「うろ覚え」または「忘れた」と評価した問題がここに表示されます。
        </p>
      )}
    </div>
  );
}
