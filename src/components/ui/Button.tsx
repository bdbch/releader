import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "md",
    iconLeft,
    iconRight,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium outline-none transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus-ring",
        buttonVariantClassName[variant],
        buttonSizeClassName[size],
        className ?? "",
      )}
      {...props}
    >
      {iconLeft ? <span className="shrink-0">{iconLeft}</span> : null}
      {children}
      {iconRight ? <span className="shrink-0">{iconRight}</span> : null}
    </button>
  );
});

const buttonVariantClassName: Record<ButtonVariant, string> = {
  default:
    "border-transparent bg-accent text-accent-foreground shadow-sm hover:opacity-95",
  secondary:
    "border-border-subtle bg-surface-raised text-content hover:bg-interactive-hover",
  ghost: "border-transparent bg-transparent text-content-muted hover:bg-interactive-hover hover:text-content",
  destructive:
    "border-transparent bg-danger text-danger-foreground shadow-sm hover:opacity-95",
};

const buttonSizeClassName: Record<ButtonSize, string> = {
  sm: "h-7.5 px-2.5",
  md: "h-8.5 px-3",
  icon: "size-8",
};
