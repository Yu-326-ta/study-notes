"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", shortLabel: "ホーム", icon: "🏠" },
  { href: "/questions", label: "問題", shortLabel: "問題", icon: "📋" },
  {
    href: "/systemdesign",
    label: "システムデザイン",
    shortLabel: "まとめ",
    icon: "🏗️",
  },
  { href: "/sources", label: "資料", shortLabel: "資料", icon: "📎" },
  { href: "/stats", label: "統計", shortLabel: "統計", icon: "📊" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/study")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="メインナビゲーション"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                  active
                    ? "text-[var(--primary)] font-semibold"
                    : "text-[var(--muted)]"
                )}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/study")) return null;

  return (
    <nav
      className="hidden lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-[var(--border)] lg:bg-[var(--card)] lg:p-4"
      aria-label="サイドナビゲーション"
    >
      <div className="mb-6 px-2">
        <span className="text-lg font-bold">📚 Study Quiz</span>
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors min-h-[44px]",
                  active
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                    : "text-[var(--muted)] hover:bg-[var(--border)]/50"
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors min-h-[44px]",
              pathname === "/settings"
                ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                : "text-[var(--muted)] hover:bg-[var(--border)]/50"
            )}
          >
            <span aria-hidden>⚙️</span>
            設定
          </Link>
        </li>
      </ul>
    </nav>
  );
}
