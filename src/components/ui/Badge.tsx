import { cn } from "@/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "notion" | "related" | "systemdesign" | "tag" | "status-new" | "status-due" | "status-mastered";
  className?: string;
};

export function Badge({ children, variant = "tag", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "notion" && "bg-[var(--primary)]/15 text-[var(--primary)]",
        variant === "related" && "bg-[var(--related)]/15 text-[var(--related)]",
        variant === "systemdesign" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        variant === "tag" && "bg-[var(--border)]/80 text-[var(--muted)]",
        variant === "status-new" && "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        variant === "status-due" && "bg-orange-500/15 text-orange-600 dark:text-orange-400",
        variant === "status-mastered" && "bg-[var(--known)]/15 text-[var(--known)]",
        className
      )}
    >
      {children}
    </span>
  );
}
