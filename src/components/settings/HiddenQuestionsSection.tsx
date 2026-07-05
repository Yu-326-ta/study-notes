"use client";

import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import { getHiddenQuestions } from "@/lib/data";
import { restoreQuestion } from "@/lib/question-customizations";
import { Button } from "@/components/ui/Button";

export function HiddenQuestionsSection() {
  const revision = useQuestionCustomizationRevision();
  void revision;

  const hidden = getHiddenQuestions();

  if (hidden.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">非表示にした問題はありません。</p>
    );
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {hidden.map((q) => (
        <li
          key={q.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] p-3"
        >
          <p className="line-clamp-2 flex-1 text-sm">{q.prompt}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => restoreQuestion(q.id)}
          >
            復元
          </Button>
        </li>
      ))}
    </ul>
  );
}
