import { Combobox } from "@/components/Combobox";
import { Select } from "@/components/Select";

type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  label: string;
  value: string;
  options: FilterOption[];
  kind?: "select" | "combobox";
};

type RouteFilterBarProps = {
  groups: FilterGroup[];
};

export function RouteFilterBar({ groups }: RouteFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {groups.map((group) => (
        <div key={group.label} className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-content-subtle">
            {group.label}
          </span>
          {group.kind === "combobox" ? (
            <Combobox
              value={group.value}
              onValueChange={() => undefined}
              options={group.options}
              ariaLabel={group.label}
              placeholder="Search feeds"
              triggerClassName="h-8 min-w-36 rounded-[10px] bg-surface-raised text-[12px]"
            />
          ) : (
            <Select
              value={group.value}
              onValueChange={() => undefined}
              options={group.options}
              ariaLabel={group.label}
              triggerClassName="h-8 min-w-28 rounded-[10px] bg-surface-raised text-[12px]"
            />
          )}
        </div>
      ))}
    </div>
  );
}
