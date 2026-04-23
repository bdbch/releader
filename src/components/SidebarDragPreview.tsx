import { FolderIcon, RssIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type SidebarDragPreviewProps = {
  type: "folder" | "feed";
  label: string;
  iconUrl?: string | null;
};

export function SidebarDragPreview({
  type,
  label,
  iconUrl,
}: SidebarDragPreviewProps) {
  return (
    <div
      className={cn(
        "flex h-8 min-w-44 max-w-72 items-center gap-1.5 rounded-[8px] border border-border-strong/80",
        "bg-background/95 pr-2 text-left text-xs text-content shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur-sm",
      )}
      style={{ paddingLeft: 10 }}
    >
      <span className="-ml-0.5 flex h-4 w-3 shrink-0" aria-hidden="true" />
      <span className="flex size-4 items-center justify-center text-content-subtle">
        {type === "feed" ? (
          iconUrl ? (
            <img
              src={iconUrl}
              alt=""
              className="size-3 rounded-sm object-contain"
            />
          ) : (
            <RssIcon className="size-3" />
          )
        ) : (
          <FolderIcon className="size-4" />
        )}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}
