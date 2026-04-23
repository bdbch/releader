import { RssIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSortable } from "@dnd-kit/sortable";

type SidebarFeedItemProps = {
  id: string;
  label: string;
  depth: number;
  isActive?: boolean;
  onClick?: () => void;
};

export function SidebarFeedItem({
  id,
  label,
  depth,
  isActive,
  onClick,
}: SidebarFeedItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={cn(
        baseRowClassName,
        isActive ? activeRowClassName : hoverRowClassName,
        isDragging ? "opacity-60" : "",
      )}
      style={{ paddingLeft: 10 + depth * 13 }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <span className="-ml-0.5 flex h-4 w-3 shrink-0" aria-hidden="true" />
      <span className="flex size-4 items-center justify-center text-content-subtle">
        <RssIcon className="size-3" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

const baseRowClassName =
  "flex h-8 w-full items-center gap-1.5 rounded-sm pr-2 text-xs text-content-muted text-left transition-colors";

const hoverRowClassName = "hover:bg-interactive-hover hover:text-content";

const activeRowClassName = "bg-surface-subtle text-content";
