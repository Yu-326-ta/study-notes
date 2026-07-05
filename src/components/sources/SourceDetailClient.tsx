"use client";

import Link from "next/link";
import { useIsClient } from "@/hooks/useIsClient";
import type { SourceDocument } from "@/domain/source";
import { getQuestionsForSource } from "@/lib/data";
import { SourcePanel } from "@/components/study/SourcePanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function SourceDetailClient({ source }: { source: SourceDocument }) {
  const mounted = useIsClient();

  const questions = getQuestionsForSource(source.id);

  if (!mounted) return <div className="py-8">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <Link href="/sources" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← 資料一覧
      </Link>
      <SourcePanel source={source} embedded className="rounded-2xl border border-[var(--border)] p-5" />
      <div>
        <h2 className="mb-3 font-semibold">関連問題 ({questions.length})</h2>
        <Link href={`/study?set=${source.questionSet}&mode=source&sourceId=${source.id}`}>
          <Button size="lg">この資料の問題を解く</Button>
        </Link>
        <ul className="mt-4 space-y-2">
          {questions.slice(0, 10).map((q) => (
            <li key={q.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
              {q.prompt}
            </li>
          ))}
          {questions.length > 10 && (
            <li className="text-center text-xs text-[var(--muted)]">
              他 {questions.length - 10} 問
            </li>
          )}
        </ul>
      </div>
      <Badge variant={source.questionSet === "notion" ? "notion" : "related"}>
        {source.questionSet === "notion" ? "本編資料" : "周辺知識参考"}
      </Badge>
    </div>
  );
}
