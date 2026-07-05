import { cn } from "@/lib/cn";

type ProgressBarProps = {
  current: number;
  total: number;
  className?: string;
};

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
