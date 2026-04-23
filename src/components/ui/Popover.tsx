import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  sideOffset = 8,
  align = "start",
  ...props
}: PopoverPrimitive.PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 w-72 rounded-[14px] border border-border-subtle/80 bg-surface-overlay p-2 outline-none",
            className ?? "",
          )}
          {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
