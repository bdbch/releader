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
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] border text-[13px] font-medium outline-none transition-colors",
        "disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus-ring active:translate-y-px",
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
    "border-border-strong bg-content text-accent-foreground hover:bg-black/88 active:border-black/55 active:bg-black/82",
  secondary:
    "border-border-subtle bg-surface text-content hover:border-border-strong hover:bg-surface-subtle active:bg-interactive-active",
  ghost:
    "border-transparent bg-transparent text-content-muted hover:bg-interactive-hover hover:text-content active:bg-interactive-active",
  destructive:
    "border-[#d8b7b3] bg-[#f8ecea] text-[#8f312b] hover:border-[#cda49f] hover:bg-[#f4e1de] active:bg-[#edd2cd]",
};

const buttonSizeClassName: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5",
  md: "h-8 px-3",
  icon: "size-7.5",
};
