"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { SourceDocument } from "@/domain/source";
import { getQuestionsForSource } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  source: SourceDocument;
  sectionId?: string;
};

export function SystemDesignDocClient({ source, sectionId }: Props) {
  const sections = source.sections ?? [];
  const questions = getQuestionsForSource(source.id);

  const activeIndex = useMemo(() => {
    if (!sectionId) return 0;
    const idx = sections.findIndex((s) => s.id === sectionId);
    return idx >= 0 ? idx : 0;
  }, [sectionId, sections]);

  const activeSection = sections[activeIndex];
  const prevSection = activeIndex > 0 ? sections[activeIndex - 1] : null;
  const nextSection =
    activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;

  const sectionQuestion = questions.find((q) => q.sectionId === activeSection?.id);

  if (!activeSection) {
    return (
      <div className="py-8 text-center text-[var(--muted)]">
        この資料にはまだページがありません
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <Link
          href="/systemdesign"
          className="inline-block text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← システムデザイン一覧
        </Link>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
          <h2 className="font-semibold">{source.title}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {activeIndex + 1} / {sections.length} ページ
          </p>
        </div>
        <nav
          className="max-h-[50vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 lg:max-h-[70vh]"
          aria-label="目次"
        >
          <ul className="space-y-1">
            {sections.map((section, index) => {
              const isActive = section.id === activeSection.id;
              return (
                <li key={section.id}>
                  <Link
                    href={`/systemdesign/${source.slug}/${section.id}`}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-xs leading-snug transition-colors min-h-[44px]",
                      isActive
                        ? "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400"
                        : "text-[var(--muted)] hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]"
                    )}
                  >
                    <span className="mr-1 text-[10px] opacity-60">{index + 1}.</span>
                    {section.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link
          href={`/study?set=systemdesign&mode=source&sourceId=${source.id}`}
          className="block pt-1"
        >
          <Button variant="ghost" size="md" className="w-full text-[var(--muted)]">
            この資料の問題を解く
          </Button>
        </Link>
      </aside>

      <article className="min-w-0 space-y-4">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="systemdesign">システムデザイン</Badge>
            <Badge variant="tag">資料閲覧</Badge>
          </div>
          <h1 className="text-xl font-bold leading-snug">{activeSection.title}</h1>
        </header>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]/90">
            {formatSectionContent(activeSection.content, activeSection.title)}
          </div>
        </div>

        <nav className="flex items-center justify-between gap-3 pt-2">
          {prevSection ? (
            <Link
              href={`/systemdesign/${source.slug}/${prevSection.id}`}
              className="inline-flex min-h-[44px] flex-1 items-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--card)]"
            >
              ← 前のページ
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {nextSection ? (
            <Link
              href={`/systemdesign/${source.slug}/${nextSection.id}`}
              className="inline-flex min-h-[44px] flex-1 items-center justify-end rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--card)]"
            >
              次のページ →
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>

        {sectionQuestion && (
          <details className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--muted)]">
              関連する問題（任意）
            </summary>
            <p className="mt-3 text-sm">{sectionQuestion.prompt}</p>
            <Link
              href={`/study?set=systemdesign&single=${sectionQuestion.id}`}
              className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              この問題を解く →
            </Link>
          </details>
        )}
      </article>
    </div>
  );
}

function formatSectionContent(content: string, title: string): string {
  const body = content.startsWith(title)
    ? content.slice(title.length).trim()
    : content;
  return body.replace(/^\n+/, "");
}
