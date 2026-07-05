import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "min-h-[44px] active:scale-[0.98]",
        variant === "primary" &&
          "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
        variant === "secondary" &&
          "bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--background)]",
        variant === "ghost" && "hover:bg-[var(--border)]/50",
        variant === "danger" && "bg-[var(--unknown)]/10 text-[var(--unknown)]",
        size === "sm" && "px-3 py-2 text-sm min-h-[36px]",
        size === "md" && "px-4 py-2.5 text-base",
        size === "lg" && "w-full px-6 py-3.5 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
