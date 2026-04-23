import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "../lib/cn";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
};

export function Select({
  value,
  onValueChange,
  options,
  ariaLabel,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-8.5 min-w-28 items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-[13px] text-content outline-none transition-colors",
          "hover:bg-interactive-hover focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus-ring",
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon className="text-content-muted">
          <ChevronDownIcon className="size-[15px]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay p-1"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-default items-center rounded-lg py-1.5 pl-8 pr-8 text-[13px] text-content outline-none",
                  "data-[highlighted]:bg-interactive-hover data-[highlighted]:text-content",
                )}
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2.5 text-content-muted">
                  <CheckIcon className="size-[15px]" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
