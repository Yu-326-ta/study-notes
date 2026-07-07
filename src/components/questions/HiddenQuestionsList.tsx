"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useIsClient } from "@/hooks/useIsClient";
import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import type { QuestionSet } from "@/domain/question";
import {
  NOTION_CATEGORY_LABELS,
  QUESTION_SET_LABELS,
  questionSetBadgeVariant,
} from "@/domain/question";
import { getHiddenQuestions } from "@/lib/data";
import {
  restoreAllHiddenQuestions,
  restoreQuestion,
} from "@/lib/question-customizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HiddenQuestionDetailSheet } from "@/components/questions/HiddenQuestionDetailSheet";
import { cn } from "@/lib/cn";
import type { Question } from "@/domain/question";

type HiddenQuestionsListProps = {
  compact?: boolean;
  showTitle?: boolean;
};

export function HiddenQuestionsList({
  compact = false,
  showTitle = true,
}: HiddenQuestionsListProps) {
  const mounted = useIsClient();
  const customizationRevision = useQuestionCustomizationRevision();
  const [search, setSearch] = useState("");
  const [questionSet, setQuestionSet] = useState<QuestionSet | "all">("all");
  const [selected, setSelected] = useState<Question | null>(null);

  const hidden = useMemo(() => {
    if (!mounted) return [];
    let list = getHiddenQuestions();
    if (questionSet !== "all") {
      list = list.filter((q) => q.questionSet === questionSet);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.prompt.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [mounted, questionSet, search, customizationRevision]);

  const totalHidden = useMemo(() => {
    if (!mounted) return 0;
    return getHiddenQuestions().length;
  }, [mounted, customizationRevision]);

  const handleRestoreAll = () => {
    if (totalHidden === 0) return;
    if (
      !confirm(
        `非表示の問題 ${totalHidden} 問をすべて復元しますか？\n\n再び学習・一覧に表示されます。`
      )
    ) {
      return;
    }
    restoreAllHiddenQuestions();
  };

  if (!mounted) {
    return <div className="py-4 text-sm text-[var(--muted)]">読み込み中...</div>;
  }

  if (totalHidden === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
        <p className="text-sm text-[var(--muted)]">非表示にした問題はありません</p>
        {!compact && (
          <Link
            href="/questions"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--primary)]"
          >
            問題一覧へ
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">非表示 {totalHidden} 問</p>
          <Button variant="secondary" size="sm" onClick={handleRestoreAll}>
            すべて復元
          </Button>
        </div>
      )}

      {!compact && (
        <>
          <input
            type="search"
            placeholder="非表示の問題を検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm min-h-[44px]"
          />

          <div className="flex gap-2">
            {(["all", "notion", "related", "systemdesign"] as const).map((set) => (
              <button
                key={set}
                type="button"
                onClick={() => setQuestionSet(set)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium min-h-[44px] transition-colors",
                  questionSet === set
                    ? set === "notion"
                      ? "bg-[var(--primary)] text-white"
                      : set === "related"
                        ? "bg-[var(--related)] text-white"
                        : set === "systemdesign"
                          ? "bg-emerald-600 text-white"
                          : "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--card)] border border-[var(--border)]"
                )}
              >
                {set === "all" ? "すべて" : QUESTION_SET_LABELS[set]}
              </button>
            ))}
          </div>
        </>
      )}

      {compact && totalHidden > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleRestoreAll}>
            すべて復元
          </Button>
        </div>
      )}

      <p className="text-sm text-[var(--muted)]">{hidden.length} 件表示</p>

      <ul
        className={cn(
          "space-y-2",
          compact ? "max-h-64 overflow-y-auto pr-1" : ""
        )}
      >
        {hidden.map((q) => (
          <li
            key={q.id}
            className="flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
          >
            <button
              type="button"
              onClick={() => setSelected(q)}
              className="min-w-0 flex-1 p-4 text-left transition-colors hover:bg-[var(--primary)]/5"
            >
              <p className="line-clamp-3 text-sm font-medium">{q.prompt}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant={questionSetBadgeVariant(q.questionSet)}>
                  {QUESTION_SET_LABELS[q.questionSet]}
                </Badge>
                {(q.category === "interview" || q.category === "product-deep-dive") && (
                  <Badge variant="tag">{NOTION_CATEGORY_LABELS[q.category]}</Badge>
                )}
              </div>
            </button>
            <div className="flex shrink-0 items-center border-l border-[var(--border)] px-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => restoreQuestion(q.id)}
              >
                復元
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {selected && (
        <HiddenQuestionDetailSheet
          question={selected}
          open={selected !== null}
          onClose={() => setSelected(null)}
          onRestored={() => setSelected(null)}
        />
      )}

      {hidden.length === 0 && totalHidden > 0 && (
        <p className="text-center text-sm text-[var(--muted)]">
          条件に一致する非表示の問題はありません
        </p>
      )}
    </div>
  );
}
