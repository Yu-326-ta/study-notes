"use client";

import Link from "next/link";
import { HiddenQuestionsList } from "@/components/questions/HiddenQuestionsList";

export function HiddenQuestionsClient() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/questions"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm text-[var(--muted)]"
        >
          ← 戻る
        </Link>
        <h1 className="text-2xl font-bold">非表示の問題</h1>
      </div>

      <p className="text-sm text-[var(--muted)]">
        学習中に非表示にした問題です。復元すると再び出題・一覧に表示されます。
      </p>

      <HiddenQuestionsList showTitle={false} />
    </div>
  );
}
