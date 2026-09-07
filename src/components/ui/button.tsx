import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          size === "md" && "h-11 px-4 text-sm",
          size === "lg" && "h-14 px-6 text-base",
          variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
          variant === "secondary" &&
            "bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 active:bg-ink-100",
          variant === "ghost" && "text-ink-700 hover:bg-ink-100",
          variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
