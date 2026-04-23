import { cn } from "../lib/cn";

export function SidebarButton({
  label,
  iconLeft,
  iconRight,
  onClick,
  isActive,
}: {
  label: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-center justify-start gap-1.5 text-xs text-muted-foreground py-1.5 px-2 rounded cursor-pointer w-full text-left",
        !isActive
          ? "hover:bg-muted text-muted-foreground"
          : "bg-muted text-foreground",
      )}
      onClick={onClick}
    >
      {iconLeft && iconLeft}
      {label}
      {iconRight && iconRight}
    </button>
  );
}
