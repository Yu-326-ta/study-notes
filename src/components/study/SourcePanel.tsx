"use client";

import Link from "next/link";
import type { SourceDocument } from "@/domain/source";
import { cn } from "@/lib/cn";

type SourcePanelProps = {
  source: SourceDocument;
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
};

export function SourcePanel({
  source,
  onClose,
  className,
  embedded = false,
}: SourcePanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        !embedded &&
          "rounded-t-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl lg:rounded-2xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--source)]">📎 資料</p>
          <h3 className="mt-1 text-lg font-semibold">{source.title}</h3>
          {source.section && (
            <p className="text-sm text-[var(--muted)]">{source.section}</p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg text-[var(--muted)] hover:bg-[var(--border)]/50"
            aria-label="閉じる"
          >
            ✕
          </button>
        )}
      </div>
      <blockquote className="max-h-[40vh] overflow-y-auto border-l-4 border-[var(--source)] pl-4 text-sm italic text-[var(--foreground)]/90 whitespace-pre-wrap lg:max-h-none">
        {source.excerpt}
      </blockquote>
      {source.url.startsWith("/") ? (
        <Link
          href={source.url}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--source)]/30 bg-[var(--source)]/10 px-4 py-2 text-sm font-medium text-[var(--source)] transition-colors hover:bg-[var(--source)]/20"
        >
          資料を開く →
        </Link>
      ) : (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--source)]/30 bg-[var(--source)]/10 px-4 py-2 text-sm font-medium text-[var(--source)] transition-colors hover:bg-[var(--source)]/20"
        >
          外部で開く ↗
        </a>
      )}
    </div>
  );
}

type SourceSheetProps = {
  source: SourceDocument | null;
  open: boolean;
  onClose: () => void;
};

export function SourceSheet({ source, open, onClose }: SourceSheetProps) {
  if (!open || !source) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto lg:hidden"
        role="dialog"
        aria-label="資料"
      >
        <SourcePanel source={source} onClose={onClose} />
      </div>
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:w-96 lg:border-l lg:border-[var(--border)] lg:bg-[var(--card)] lg:p-6 lg:shadow-lg">
        <SourcePanel source={source} onClose={onClose} embedded />
      </div>
    </>
  );
}
