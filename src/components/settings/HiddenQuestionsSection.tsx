"use client";

import Link from "next/link";
import { useIsClient } from "@/hooks/useIsClient";
import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import { getHiddenQuestions } from "@/lib/data";
import { HiddenQuestionsList } from "@/components/questions/HiddenQuestionsList";

export function HiddenQuestionsSection() {
  const mounted = useIsClient();
  const customizationRevision = useQuestionCustomizationRevision();
  void customizationRevision;

  const count = mounted ? getHiddenQuestions().length : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {count > 0 ? `${count} 問が非表示` : "非表示にした問題はありません"}
        </p>
        {count > 0 && (
          <Link
            href="/questions/hidden"
            className="shrink-0 text-sm font-medium text-[var(--primary)] min-h-[44px] inline-flex items-center"
          >
            一覧を見る
          </Link>
        )}
      </div>
      {count > 0 && <HiddenQuestionsList compact showTitle={false} />}
    </div>
  );
}
