"use client";

import { useState } from "react";
import type { Question } from "@/domain/question";
import { hideQuestion, isQuestionEdited } from "@/lib/question-customizations";
import { QuestionEditSheet } from "./QuestionEditSheet";
import { cn } from "@/lib/cn";

type QuestionActionsProps = {
  question: Question;
  onHidden?: () => void;
  onEdited?: () => void;
  layout?: "row" | "menu";
  className?: string;
};

export function QuestionActions({
  question,
  onHidden,
  onEdited,
  layout = "row",
  className,
}: QuestionActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const edited = isQuestionEdited(question.id);

  const handleHide = () => {
    if (
      !confirm(
        "この問題を非表示にしますか？\n\n出題されなくなります。設定画面から復元できます。"
      )
    ) {
      return;
    }
    hideQuestion(question.id);
    onHidden?.();
    setMenuOpen(false);
  };

  if (layout === "menu") {
    return (
      <>
        <div className={cn("relative", className)}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="min-h-[44px] min-w-[44px] rounded-xl text-[var(--muted)] hover:bg-[var(--border)]/50"
            aria-label="問題メニュー"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full min-h-[44px] items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-[var(--border)]/30"
                >
                  ✏️ 編集{edited ? "済" : ""}
                </button>
                <button
                  type="button"
                  onClick={handleHide}
                  className="flex w-full min-h-[44px] items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--unknown)] hover:bg-[var(--unknown)]/10"
                >
                  🗑️ 非表示
                </button>
              </div>
            </>
          )}
        </div>
        <QuestionEditSheet
          question={question}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={onEdited}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("flex gap-1", className)}>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm hover:bg-[var(--border)]/50"
          aria-label="問題を編集"
          title="編集"
        >
          ✏️{edited ? "*" : ""}
        </button>
        <button
          type="button"
          onClick={handleHide}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm text-[var(--unknown)] hover:bg-[var(--unknown)]/10"
          aria-label="問題を非表示"
          title="非表示"
        >
          🗑️
        </button>
      </div>
      <QuestionEditSheet
        question={question}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={onEdited}
      />
    </>
  );
}
