"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/domain/question";
import type { QuestionEditForm } from "@/domain/question-customization";
import {
  resetQuestionOverride,
  saveQuestionOverride,
} from "@/lib/question-customizations";
import { Button } from "@/components/ui/Button";

type QuestionEditSheetProps = {
  question: Question;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function QuestionEditSheet({
  question,
  open,
  onClose,
  onSaved,
}: QuestionEditSheetProps) {
  const [form, setForm] = useState<QuestionEditForm>({
    prompt: question.prompt,
    answer: question.answer,
    keyPoints: question.keyPoints ?? [],
  });

  useEffect(() => {
    if (open) {
      setForm({
        prompt: question.prompt,
        answer: question.answer,
        keyPoints: question.keyPoints ?? [],
      });
    }
  }, [open, question]);

  if (!open) return null;

  const keyPointsText = (form.keyPoints ?? []).join("\n");

  const handleSave = () => {
    if (!form.prompt.trim() || !form.answer.trim()) {
      alert("問題文と模範回答は必須です。");
      return;
    }
    saveQuestionOverride(question.id, {
      prompt: form.prompt,
      answer: form.answer,
      keyPoints: keyPointsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    onSaved?.();
    onClose();
  };

  const handleReset = () => {
    if (!confirm("編集内容を破棄し、元の問題に戻しますか？")) return;
    resetQuestionOverride(question.id);
    onSaved?.();
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
        aria-label="問題を編集"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">問題を編集</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg text-[var(--muted)]"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">問題文</span>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">模範回答</span>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">要点（1行1項目）</span>
            <textarea
              value={keyPointsText}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  keyPoints: e.target.value.split("\n"),
                }))
              }
              rows={4}
              placeholder="要点1&#10;要点2"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={handleSave}>
            保存
          </Button>
          <Button variant="secondary" size="md" onClick={handleReset}>
            元に戻す
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </>
  );
}
