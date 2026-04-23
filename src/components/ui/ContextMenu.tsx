import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "@/lib/cn";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export function ContextMenuContent({
  className,
  ...props
}: ContextMenuPrimitive.ContextMenuContentProps) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          "z-50 min-w-36 overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay p-1 shadow-lg",
          className ?? "",
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({
  className,
  ...props
}: ContextMenuPrimitive.ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center rounded-lg px-2.5 py-1.5 text-xs text-content outline-none transition-colors",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-interactive-hover",
        className ?? "",
      )}
      {...props}
    />
  );
}
