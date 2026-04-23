import { Settings2Icon } from "lucide-react";
import { Select } from "@/components/Select";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Switch } from "@/components/ui/Switch";

export type ArticleListDensity = "dense" | "medium" | "loose";

export type ViewSettings = {
  showThumbnails: boolean;
  density: ArticleListDensity;
};

type ViewSelectProps = {
  value: ViewSettings;
  onValueChange: (value: ViewSettings) => void;
};

const densityOptions = [
  { label: "Dense", value: "dense" },
  { label: "Medium", value: "medium" },
  { label: "Loose", value: "loose" },
];

export function ViewSelect({ value, onValueChange }: ViewSelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<Settings2Icon className="size-[15px]" />}
          className="rounded-[10px]"
        >
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1.5" align="end">
        <div className="flex flex-col gap-1">
          <label className="flex items-center justify-between gap-4 rounded-[10px] px-2.5 py-2 hover:bg-interactive-hover">
            <span className="text-[12px] font-medium text-content">
              Show thumbnails
            </span>
            <Switch
              checked={value.showThumbnails}
              onCheckedChange={(checked) =>
                onValueChange({
                  ...value,
                  showThumbnails: checked,
                })
              }
            />
          </label>

          <div className="flex items-center justify-between gap-4 rounded-[10px] px-2.5 py-2 hover:bg-interactive-hover">
            <span className="text-[12px] font-medium text-content">Density</span>
            <Select
              value={value.density}
              onValueChange={(nextValue) =>
                onValueChange({
                  ...value,
                  density: nextValue as ArticleListDensity,
                })
              }
              options={densityOptions}
              ariaLabel="List density"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
