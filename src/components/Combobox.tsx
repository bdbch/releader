import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

type ComboboxOption = {
  label: string;
  value: string;
};

type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  ariaLabel: string;
  placeholder?: string;
  triggerClassName?: string;
};

export function Combobox({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder = "Search",
  triggerClassName,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const selectedIndex = filteredOptions.findIndex((option) => option.value === value);

    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
      return;
    }

    setActiveIndex(0);
  }, [filteredOptions, value]);

  function selectOption(nextValue: string) {
    onValueChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  function moveActiveIndex(nextIndex: number) {
    if (filteredOptions.length === 0) {
      return;
    }

    const clampedIndex = (nextIndex + filteredOptions.length) % filteredOptions.length;
    setActiveIndex(clampedIndex);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex h-8 min-w-32 items-center justify-between gap-2 rounded-[10px] border border-border-subtle bg-surface-raised px-3 text-[12px] text-content outline-none transition-colors",
            "hover:bg-interactive-hover focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus-ring",
            triggerClassName ?? "",
          )}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <ChevronDownIcon className="size-[15px] shrink-0 text-content-muted" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-1.5" align="start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 rounded-[10px] border border-border-subtle bg-surface px-2.5 py-2">
            <SearchIcon className="size-[14px] text-content-subtle" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveActiveIndex(activeIndex + 1);
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActiveIndex(activeIndex - 1);
                  return;
                }

                if (event.key === "Enter") {
                  const activeOption = filteredOptions[activeIndex];

                  if (!activeOption) {
                    return;
                  }

                  event.preventDefault();
                  selectOption(activeOption.value);
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-[12px] text-content outline-none placeholder:text-content-subtle"
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2.5 py-2 text-[12px] text-content-subtle">
                No results
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[12px] text-content transition-colors",
                      isActive
                        ? "bg-interactive-hover text-content"
                        : "hover:bg-interactive-hover",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option.value)}
                  >
                    <span className="flex size-4 items-center justify-center text-content-muted">
                      {isSelected ? <CheckIcon className="size-[14px]" /> : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
