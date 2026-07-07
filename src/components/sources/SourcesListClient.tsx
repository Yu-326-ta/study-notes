"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NotionCategory, QuestionSet } from "@/domain/question";
import { NOTION_CATEGORY_LABELS, ACTIVE_NOTION_CATEGORIES, QUESTION_SET_LABELS } from "@/domain/question";
import { getAllSources, getQuestionsForSource } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export function SourcesListClient() {
  const [filter, setFilter] = useState<NotionCategory | "all" | "systemdesign">("all");
  const [search, setSearch] = useState("");

  const sources = useMemo(() => {
    let list = getAllSources();
    if (filter === "systemdesign") {
      list = list.filter((s) => s.questionSet === "systemdesign");
    } else if (filter !== "all") {
      list = list.filter((s) => s.notionCategory === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q) ||
          s.section?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">資料</h1>
      <p className="text-sm text-[var(--muted)]">
        Notion やシステムデザインの引用元をいつでも確認できます
      </p>

      <Link
        href="/systemdesign"
        className="flex min-h-[44px] items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-colors hover:border-emerald-500/50"
      >
        <span className="text-2xl" aria-hidden>
          📖
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            システムデザインまとめ資料
          </p>
          <p className="text-xs text-[var(--muted)]">
            章ごとに読める。問題を解かずに閲覧する入口はこちら
          </p>
        </div>
        <span className="shrink-0 text-sm text-emerald-700 dark:text-emerald-400">→</span>
      </Link>

      <input
        type="search"
        placeholder="資料を検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm min-h-[44px]"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium min-h-[32px]",
            filter === "all" ? "bg-[var(--source)] text-white" : "bg-[var(--border)]/50"
          )}
        >
          すべて
        </button>
        {(ACTIVE_NOTION_CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              filter === cat ? "bg-[var(--source)] text-white" : "bg-[var(--border)]/50"
            )}
          >
            {NOTION_CATEGORY_LABELS[cat]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilter("systemdesign")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
            filter === "systemdesign" ? "bg-emerald-600 text-white" : "bg-[var(--border)]/50"
          )}
        >
          {QUESTION_SET_LABELS.systemdesign}
        </button>
      </div>

      <ul className="space-y-3">
        {sources.map((source) => {
          const qCount = getQuestionsForSource(source.id).length;
          return (
            <li key={source.id}>
              <Link
                href={
                  source.questionSet === "systemdesign" && source.slug
                    ? `/systemdesign/${source.slug}`
                    : `/sources/${source.id}`
                }
                className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--source)]/40"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{source.title}</h2>
                    {source.section && (
                      <p className="text-sm text-[var(--muted)]">{source.section}</p>
                    )}
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                      {source.excerpt.slice(0, 120)}...
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Badge
                        variant={
                          source.questionSet === "notion"
                            ? "notion"
                            : source.questionSet === "related"
                              ? "related"
                              : "systemdesign"
                        }
                      >
                        {QUESTION_SET_LABELS[source.questionSet]}
                      </Badge>
                      <Badge variant="tag">関連問題 {qCount} 問</Badge>
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
