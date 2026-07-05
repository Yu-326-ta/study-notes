"use client";

import { useIsClient } from "@/hooks/useIsClient";
import { computeStats, categoryLabel, getLast7DaysHeatmap } from "@/lib/stats";
import { getStreak, loadProgress } from "@/lib/storage";
import { cn } from "@/lib/cn";

export function StatsClient() {
  const mounted = useIsClient();

  if (!mounted) return <div className="py-8">読み込み中...</div>;

  const streak = getStreak();
  const notionStats = computeStats("notion", loadProgress("notion"), streak);
  const relatedStats = computeStats("related", loadProgress("related"), streak);
  const heatmap = getLast7DaysHeatmap({
    ...notionStats.heatmap,
    ...relatedStats.heatmap,
  });
  const maxHeat = Math.max(...heatmap.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">統計</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="連続学習" value={`${streak} 日`} emoji="🔥" />
        <StatCard
          label="本編定着率"
          value={`${notionStats.knownRate}%`}
          emoji="📘"
        />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-4 font-semibold">週間ヒートマップ</h2>
        <div className="flex justify-between gap-1">
          {heatmap.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-full max-w-[36px] rounded-md transition-colors",
                  d.count === 0 && "bg-[var(--border)]/40",
                  d.count > 0 && "bg-[var(--primary)]"
                )}
                style={{
                  opacity: d.count > 0 ? 0.4 + (d.count / maxHeat) * 0.6 : 1,
                }}
                title={`${d.date}: ${d.count} 問`}
              />
              <span className="text-[10px] text-[var(--muted)]">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <StatsBlock title="本編問題集" stats={notionStats} />
      <StatsBlock title="周辺知識問題集" stats={relatedStats} />
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)]">
        {emoji} {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatsBlock({
  title,
  stats,
}: {
  title: string;
  stats: ReturnType<typeof computeStats>;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[var(--muted)]">総問題数</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">学習済み</p>
          <p className="text-xl font-bold">{stats.studied}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">今日の復習</p>
          <p className="text-xl font-bold">{stats.dueToday}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">定着</p>
          <p className="text-xl font-bold">{stats.mastered}</p>
        </div>
      </div>

      {stats.weakTags.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">よく忘れるタグ TOP 5</p>
          <ul className="space-y-1">
            {stats.weakTags.map(({ tag, score }) => (
              <li key={tag} className="flex justify-between text-sm">
                <span>{tag}</span>
                <span className="text-[var(--unknown)]">{score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(stats.byCategory).length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-[var(--muted)]">カテゴリ別</p>
          {Object.entries(stats.byCategory).map(([cat, data]) => (
            <div key={cat}>
              <div className="flex justify-between text-xs">
                <span>{categoryLabel(cat)}</span>
                <span>{data.knownRate}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${data.knownRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
