"use client";

import type { Question } from "@/domain/question";
import {
  NOTION_CATEGORY_LABELS,
  QUESTION_SET_LABELS,
} from "@/domain/question";
import { getSourceForQuestion } from "@/lib/data";
import { restoreQuestion } from "@/lib/question-customizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type HiddenQuestionDetailSheetProps = {
  question: Question;
  open: boolean;
  onClose: () => void;
  onRestored?: () => void;
};

export function HiddenQuestionDetailSheet({
  question,
  open,
  onClose,
  onRestored,
}: HiddenQuestionDetailSheetProps) {
  if (!open) return null;

  const source = getSourceForQuestion(question);

  const handleRestore = () => {
    restoreQuestion(question.id);
    onRestored?.();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl lg:inset-x-auto lg:left-1/2 lg:top-1/2 lg:max-w-lg lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl"
        role="dialog"
        aria-label="非表示の問題の詳細"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">問題の詳細</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--border)]/50"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant={question.questionSet === "notion" ? "notion" : "related"}>
            {QUESTION_SET_LABELS[question.questionSet]}
          </Badge>
          {question.category && (
            <Badge variant="tag">{NOTION_CATEGORY_LABELS[question.category]}</Badge>
          )}
        </div>

        <section className="mb-5 space-y-2">
          <p className="text-sm font-medium text-[var(--muted)]">問題</p>
          <p className="text-base font-semibold leading-relaxed">{question.prompt}</p>
        </section>

        <section className="mb-5 space-y-2">
          <p className="text-sm font-medium text-[var(--muted)]">模範回答</p>
          <p className="whitespace-pre-wrap text-base leading-relaxed">
            {question.answer}
          </p>
        </section>

        {question.keyPoints && question.keyPoints.length > 0 && (
          <section className="mb-5">
            <p className="mb-2 text-sm font-medium text-[var(--muted)]">要点</p>
            <ul className="space-y-2">
              {question.keyPoints.map((kp) => (
                <li key={kp} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-[var(--muted)]">□</span>
                  {kp}
                </li>
              ))}
            </ul>
          </section>
        )}

        {source && (
          <p className="mb-5 text-xs text-[var(--muted)]">
            資料: {source.title}
            {source.section ? ` / ${source.section}` : ""}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={handleRestore}>
            復元する
          </Button>
          <Button variant="secondary" size="lg" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </>
  );
}
