"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { NOTION_CATEGORY_LABELS, ACTIVE_NOTION_CATEGORIES } from "@/domain/question";
import {
  countByMode,
  countRetryQuestions,
  getAllQuestions,
  getWeakTagsFromNotionProgress,
  selectQuestions,
} from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { getStreak, loadProgress, loadSettings } from "@/lib/storage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StudyLaunchPanel } from "@/components/study/StudyLaunchPanel";

const CATEGORIES = ACTIVE_NOTION_CATEGORIES;

export function HomeClient() {
  const mounted = useIsClient();

  const stats = useMemo(() => {
    if (!mounted) return null;

    const notionProgress = loadProgress("notion");
    const relatedProgress = loadProgress("related");
    const systemDesignProgress = loadProgress("systemdesign");
    const settings = loadSettings();
    const streak = getStreak();
    const notionQuestions = getAllQuestions("notion");
    const relatedQuestions = getAllQuestions("related");
    const systemDesignQuestions = getAllQuestions("systemdesign");

    const dueNotion = countByMode(notionQuestions, notionProgress, "due-today");
    const newNotion = countByMode(notionQuestions, notionProgress, "new");
    const dueRelated = countByMode(relatedQuestions, relatedProgress, "due-today");
    const newRelated = countByMode(relatedQuestions, relatedProgress, "new");
    const dueSystemDesign = countByMode(
      systemDesignQuestions,
      systemDesignProgress,
      "due-today"
    );
    const newSystemDesign = countByMode(systemDesignQuestions, systemDesignProgress, "new");
    const weakTags = getWeakTagsFromNotionProgress(notionProgress, 3);
    const tagLinkedRelated = selectQuestions(
      relatedQuestions,
      relatedProgress,
      "tag-linked",
      { weakTags, limit: 99, interleave: false }
    ).length;
    const retryMissedTotal = countRetryQuestions(
      ["notion", "related", "systemdesign"],
      "retry-missed"
    );

    return {
      settings,
      streak,
      notionQuestions,
      notionProgress,
      dueNotion,
      newNotion,
      dueRelated,
      newRelated,
      dueSystemDesign,
      newSystemDesign,
      systemDesignQuestions,
      weakTags,
      tagLinkedRelated,
      weakCount: countByMode(notionQuestions, notionProgress, "weak"),
      retryMissedTotal,
      notionStats: computeStats("notion", notionProgress, streak),
    };
  }, [mounted]);

  if (!mounted || !stats) {
    return <div className="animate-pulse space-y-4 py-8">読み込み中...</div>;
  }

  const {
    settings,
    streak,
    notionQuestions,
    dueNotion,
    newNotion,
    dueRelated,
    newRelated,
    dueSystemDesign,
    newSystemDesign,
    systemDesignQuestions,
    weakTags,
    tagLinkedRelated,
    weakCount,
    retryMissedTotal,
    notionStats,
  } = stats;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Quiz</h1>
          <p className="text-sm text-[var(--muted)]">記憶定着のための問題集</p>
        </div>
        <Link
          href="/settings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-xl"
          aria-label="設定"
        >
          ⚙️
        </Link>
      </header>

      {streak > 0 && (
        <div className="rounded-xl bg-orange-500/10 px-4 py-3 text-center text-sm font-medium text-orange-600 dark:text-orange-400">
          🔥 {streak} 日連続学習中
        </div>
      )}

      <Link
        href="/retry"
        className="block rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 p-5 transition-colors hover:border-orange-500/60 hover:bg-orange-500/15"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            🤔
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-orange-800 dark:text-orange-300">
              うろ覚え・忘れた問題を再挑戦
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {retryMissedTotal > 0
                ? `${retryMissedTotal} 問 · いつでも絞り込んで連続学習できます`
                : "評価後にここからいつでも再挑戦できます"}
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-orange-700 dark:text-orange-400">
            →
          </span>
        </div>
      </Link>

      <Link
        href="/systemdesign"
        className="block rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/15"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            📖
          </span>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
              システムデザイン資料を読む
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              章ごとのまとめを、問題を解かずに閲覧できます
            </p>
          </div>
        </div>
      </Link>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">本編問題集（優先）</h2>
        <div className="rounded-2xl border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5">
          <p className="text-sm text-[var(--muted)]">今日の復習</p>
          <p className="mt-1 text-3xl font-bold text-[var(--primary)]">{dueNotion} 問</p>
          <Link href="/study?set=notion&mode=due-today" className="mt-4 block">
            <Button size="lg">復習を始める</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/study?set=notion&mode=new">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30">
              <p className="text-xs text-[var(--muted)]">未学習</p>
              <p className="text-xl font-bold">{newNotion}</p>
            </div>
          </Link>
          <Link href="/study?set=notion&mode=weak">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30">
              <p className="text-xs text-[var(--muted)]">苦手</p>
              <p className="text-xl font-bold">{weakCount}</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count = notionQuestions.filter((q) => q.category === cat).length;
            if (count === 0) return null;
            return (
              <Link key={cat} href={`/study?set=notion&mode=category&category=${cat}`}>
                <Badge variant="notion">
                  {NOTION_CATEGORY_LABELS[cat]} {count}
                </Badge>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">周辺知識問題集</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted)]">
            復習 {dueRelated} 問 / 未学習 {newRelated} 問
          </p>
          {weakTags.length > 0 && tagLinkedRelated > 0 && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              本編の苦手タグ（{weakTags.join("、")}）に関連する問題 {tagLinkedRelated} 問
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/study?set=related&mode=due-today">
              <Button variant="secondary" size="lg">
                周辺知識を学ぶ
              </Button>
            </Link>
            {tagLinkedRelated > 0 && (
              <Link href={`/study?set=related&mode=tag-linked&tags=${weakTags.join(",")}`}>
                <Button variant="ghost" size="md">
                  苦手タグ連動 ({tagLinkedRelated} 問)
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">システムデザイン</h2>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-sm text-[var(--muted)]">
            復習 {dueSystemDesign} 問 / 未学習 {newSystemDesign} 問（全{" "}
            {systemDesignQuestions.length} 問）
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <StudyLaunchPanel questionSet="systemdesign" compact />
            <Link href="/systemdesign">
              <Button variant="ghost" size="md">
                資料だけ読む
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {settings.mixedMode && (
        <section>
          <Link href="/study?set=mixed&mode=due-today">
            <Button variant="secondary" size="lg">
              混合モードで学習
            </Button>
          </Link>
        </section>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/systemdesign"
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          📖 システムデザイン資料
        </Link>
        <Link
          href="/sources"
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--source)]/30 bg-[var(--source)]/5 py-3 text-sm font-medium text-[var(--source)]"
        >
          📎 引用元一覧
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
        <p className="text-[var(--muted)]">本編の定着率</p>
        <p className="text-2xl font-bold">{notionStats.knownRate}%</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {notionStats.studied}/{notionStats.total} 問学習済み
        </p>
      </div>
    </div>
  );
}
