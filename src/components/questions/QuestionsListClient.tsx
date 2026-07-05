"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useIsClient } from "@/hooks/useIsClient";
import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import type { NotionCategory, QuestionSet } from "@/domain/question";
import {
  NOTION_CATEGORY_LABELS,
  ACTIVE_NOTION_CATEGORIES,
  QUESTION_SET_LABELS,
} from "@/domain/question";
import {
  getAllQuestions,
  getHiddenQuestions,
  getQuestionStatus,
  getSourceForQuestion,
} from "@/lib/data";
import { loadProgress } from "@/lib/storage";
import { isQuestionEdited } from "@/lib/question-customizations";
import { QuestionActions } from "@/components/questions/QuestionActions";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export function QuestionsListClient() {
  const mounted = useIsClient();
  const customizationRevision = useQuestionCustomizationRevision();
  const [questionSet, setQuestionSet] = useState<QuestionSet>("notion");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NotionCategory | "all">("all");

  const { questions, progress } = useMemo(() => {
    if (!mounted) {
      return { questions: [], progress: null };
    }
    let list = getAllQuestions(questionSet);
    if (category !== "all") list = list.filter((q) => q.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.prompt.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return {
      questions: list,
      progress: loadProgress(questionSet),
    };
  }, [mounted, questionSet, category, search, customizationRevision]);

  const hiddenCount = useMemo(() => {
    if (!mounted) return 0;
    return getHiddenQuestions().length;
  }, [mounted, customizationRevision]);

  if (!mounted || !progress) {
    return <div className="py-8">読み込み中...</div>;
  }

  const statusBadge = (id: string) => {
    const status = getQuestionStatus(id, progress);
    if (status === "new") return <Badge variant="status-new">未学習</Badge>;
    if (status === "due") return <Badge variant="status-due">復習</Badge>;
    if (status === "mastered") return <Badge variant="status-mastered">定着</Badge>;
    return <Badge variant="tag">学習中</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">問題一覧</h1>
        {hiddenCount > 0 && (
          <Link
            href="/questions/hidden"
            className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium min-h-[44px] inline-flex items-center"
          >
            非表示 {hiddenCount}
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        {(["notion", "related"] as QuestionSet[]).map((set) => (
          <button
            key={set}
            type="button"
            onClick={() => setQuestionSet(set)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-medium min-h-[44px] transition-colors",
              questionSet === set
                ? set === "notion"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--related)] text-white"
                : "bg-[var(--card)] border border-[var(--border)]"
            )}
          >
            {QUESTION_SET_LABELS[set]}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm min-h-[44px]"
      />

      {questionSet === "notion" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              category === "all" ? "bg-[var(--primary)] text-white" : "bg-[var(--border)]/50"
            )}
          >
            すべて
          </button>
          {ACTIVE_NOTION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                category === cat ? "bg-[var(--primary)] text-white" : "bg-[var(--border)]/50"
              )}
            >
              {NOTION_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-[var(--muted)]">{questions.length} 問</p>

      <ul className="space-y-2">
        {questions.slice(0, 100).map((q) => {
          const source = getSourceForQuestion(q);
          return (
            <li
              key={q.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/study?set=${q.questionSet}&mode=source&sourceId=${q.sourceId}&single=${q.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="line-clamp-2 text-sm font-medium">{q.prompt}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {statusBadge(q.id)}
                    {isQuestionEdited(q.id) && (
                      <Badge variant="tag">編集済</Badge>
                    )}
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-0">
                  {source && (
                    <Link
                      href={`/sources/${source.id}`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--source)] hover:bg-[var(--source)]/10"
                      aria-label="資料を見る"
                    >
                      📎
                    </Link>
                  )}
                  <QuestionActions question={q} layout="row" />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {questions.length > 100 && (
        <p className="text-center text-sm text-[var(--muted)]">
          先頭 100 件を表示（検索で絞り込んでください）
        </p>
      )}
    </div>
  );
}
