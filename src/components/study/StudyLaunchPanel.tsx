"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { QuestionSet } from "@/domain/question";
import { QUESTION_SET_LABELS } from "@/domain/question";
import {
  buildStudyHref,
  countByMode,
  countQuestionsByTags,
  getAllQuestions,
  getStudyTags,
} from "@/lib/data";
import { loadProgress } from "@/lib/storage";
import { useIsClient } from "@/hooks/useIsClient";
import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type StudyLaunchPanelProps = {
  questionSet: QuestionSet;
  compact?: boolean;
};

export function StudyLaunchPanel({ questionSet, compact = false }: StudyLaunchPanelProps) {
  const mounted = useIsClient();
  const customizationRevision = useQuestionCustomizationRevision();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const stats = useMemo(() => {
    if (!mounted) return null;
    const questions = getAllQuestions(questionSet);
    const progress = loadProgress(questionSet);
    const tags = getStudyTags(questions);
    const tagMatchCount = countQuestionsByTags(questions, selectedTags);

    return {
      total: questions.length,
      dueToday: countByMode(questions, progress, "due-today"),
      retryMissed: countByMode(questions, progress, "retry-missed"),
      tags,
      tagMatchCount,
    };
  }, [mounted, questionSet, selectedTags, customizationRevision]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!stats) {
    return <div className="text-sm text-[var(--muted)]">読み込み中...</div>;
  }

  const setLabel = QUESTION_SET_LABELS[questionSet];

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <Link href={`/retry?set=${questionSet}`}>
        <Button
          variant="secondary"
          size={compact ? "md" : "lg"}
          className="w-full border-orange-500/30 bg-orange-500/5 text-orange-800 hover:bg-orange-500/10 dark:text-orange-300"
        >
          🤔 うろ覚え・忘れた問題（{stats.retryMissed} 問）
        </Button>
      </Link>

      <div className="flex flex-col gap-2">
        <Link
          href={buildStudyHref({
            set: questionSet,
            mode: "all",
            continuous: true,
          })}
        >
          <Button size={compact ? "md" : "lg"} className="w-full">
            全問ランダム（{stats.total} 問）
          </Button>
        </Link>
        {stats.dueToday > 0 && (
          <Link href={buildStudyHref({ set: questionSet, mode: "due-today" })}>
            <Button variant="secondary" size={compact ? "md" : "lg"} className="w-full">
              今日の復習（{stats.dueToday} 問）
            </Button>
          </Link>
        )}
      </div>

      {stats.tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--muted)]">
            タグで絞り込んで連続学習
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.tags.map(({ tag, count }) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px]",
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-emerald-500/40"
                  )}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
          <Link
            href={buildStudyHref({
              set: questionSet,
              mode: "tag",
              tags: selectedTags,
              continuous: true,
            })}
          >
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              disabled={selectedTags.length === 0 || stats.tagMatchCount === 0}
            >
              {selectedTags.length === 0
                ? "タグを選んで学習開始"
                : `選択タグで学習（${stats.tagMatchCount} 問・ランダム）`}
            </Button>
          </Link>
        </div>
      )}

      {!compact && (
        <p className="text-xs text-[var(--muted)]">
          {setLabel}の問題をランダム順で連続して解けます。タグは複数選択できます。
        </p>
      )}
    </div>
  );
}
