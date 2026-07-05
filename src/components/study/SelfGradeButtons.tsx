"use client";

import type { SelfGrade } from "@/domain/progress";
import { SELF_GRADE_LABELS } from "@/domain/progress";
import { cn } from "@/lib/cn";

type SelfGradeButtonsProps = {
  onGrade: (grade: SelfGrade) => void;
  disabled?: boolean;
};

const GRADES: { grade: SelfGrade; emoji: string; color: string }[] = [
  { grade: "known", emoji: "😊", color: "border-[var(--known)] bg-[var(--known)]/10 text-[var(--known)]" },
  { grade: "partial", emoji: "🤔", color: "border-[var(--partial)] bg-[var(--partial)]/10 text-[var(--partial)]" },
  { grade: "unknown", emoji: "😵", color: "border-[var(--unknown)] bg-[var(--unknown)]/10 text-[var(--unknown)]" },
];

export function SelfGradeButtons({ onGrade, disabled }: SelfGradeButtonsProps) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-[var(--muted)]">
        覚えていた程度は？
      </p>
      <div className="grid grid-cols-3 gap-2">
        {GRADES.map(({ grade, emoji, color }) => (
          <button
            key={grade}
            type="button"
            disabled={disabled}
            onClick={() => onGrade(grade)}
            className={cn(
              "flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-medium transition-all active:scale-95",
              color,
              disabled && "opacity-50"
            )}
          >
            <span className="text-2xl" aria-hidden>
              {emoji}
            </span>
            <span className="text-xs leading-tight">{SELF_GRADE_LABELS[grade]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
