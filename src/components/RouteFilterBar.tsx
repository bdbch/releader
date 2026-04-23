import { cn } from "@/lib/cn";

type FilterOption = {
  label: string;
  active?: boolean;
};

type FilterGroup = {
  label: string;
  options: FilterOption[];
};

type RouteFilterBarProps = {
  groups: FilterGroup[];
};

export function RouteFilterBar({ groups }: RouteFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {groups.map((group) => (
        <div
          key={group.label}
          className="flex items-center gap-0.5 rounded-[10px] border border-border-subtle bg-surface-subtle p-0.5"
        >
          <span className="px-2 text-[10px] font-medium text-content-subtle">
            {group.label}
          </span>
          {group.options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={cn(
                buttonClassName,
                option.active ? activeButtonClassName : "",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

const buttonClassName =
  "rounded-[8px] px-2.5 py-1.25 text-[11px] font-medium text-content-muted transition-colors hover:bg-surface hover:text-content";

const activeButtonClassName =
  "border border-border-subtle bg-surface text-content shadow-[0_1px_1px_rgba(0,0,0,0.03)]";
