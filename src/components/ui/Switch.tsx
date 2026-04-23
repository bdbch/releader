import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export function Switch({
  className,
  ...props
}: SwitchPrimitive.SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full border border-border-strong bg-surface-muted p-[3px] outline-none transition-colors",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-accent",
        "focus-visible:ring-2 focus-visible:ring-focus-ring",
        className ?? "",
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full border border-border-subtle bg-surface shadow-none transition-transform",
          "data-[state=checked]:translate-x-4 data-[state=checked]:border-transparent data-[state=checked]:bg-accent-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
