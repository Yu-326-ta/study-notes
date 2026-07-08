"use client";

import Link from "next/link";
import { getAllSources, getQuestionsForSource } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { StudyLaunchPanel } from "@/components/study/StudyLaunchPanel";

export function SystemDesignListClient() {
  const sources = getAllSources("systemdesign");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">システムデザイン資料</h1>
      <p className="text-sm text-[var(--muted)]">
        まとめ資料を章ごとに読めます。問題を解かずに閲覧するだけでも OK です。
      </p>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <h2 className="mb-3 text-sm font-semibold">問題を連続で解く</h2>
        <StudyLaunchPanel questionSet="systemdesign" compact />
      </div>

      <ul className="space-y-3">
        {sources.map((source) => {
          const qCount = getQuestionsForSource(source.id).length;
          const sectionCount = source.sections?.length ?? 0;
          return (
            <li key={source.id}>
              <Link
                href={`/systemdesign/${source.slug}`}
                className="block rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    📖
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold">{source.title}</h2>
                      <span className="shrink-0 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        読む →
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                      {source.excerpt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="systemdesign">システムデザイン</Badge>
                      <Badge variant="tag">{sectionCount} ページ</Badge>
                      <Badge variant="tag">問題 {qCount} 問</Badge>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
