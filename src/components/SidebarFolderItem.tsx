import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

type SidebarFolderItemProps = {
  id: string;
  label: string;
  depth: number;
  isExpanded: boolean;
  isActive?: boolean;
  isDropTarget?: boolean;
  dropInsideZoneId?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggle?: () => void;
};

export function SidebarFolderItem({
  id,
  label,
  depth,
  isExpanded,
  isActive,
  isDropTarget,
  dropInsideZoneId,
  onClick,
  onToggle,
}: SidebarFolderItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });
  const { isOver, setNodeRef: setDropInsideNodeRef } = useDroppable({
    id: dropInsideZoneId ?? `folder-drop:${id}`,
    disabled: !dropInsideZoneId,
  });

  return (
    <div ref={setDropInsideNodeRef} className="w-full">
      <button
        type="button"
        ref={setNodeRef}
        className={cn(
        baseRowClassName,
        isActive ? activeRowClassName : hoverRowClassName,
        isDragging ? "opacity-60" : "",
        isOver || isDropTarget ? "bg-surface-subtle ring-1 ring-border-strong" : "",
      )}
        style={{ paddingLeft: 10 + depth * 13 }}
        {...attributes}
        {...listeners}
        onClick={onClick}
        onDoubleClick={onToggle}
      >
        <span
          role="button"
          tabIndex={-1}
          className="-ml-0.5 flex h-4 w-3 shrink-0 items-center justify-center text-content-subtle"
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.();
          }}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-[13px]" />
          ) : (
            <ChevronRightIcon className="size-[13px]" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <span className="flex size-4 items-center justify-center text-content-subtle">
            {isExpanded ? (
              <FolderOpenIcon className="size-[14px]" />
            ) : (
              <FolderIcon className="size-[14px]" />
            )}
          </span>
          <span className="truncate">{label}</span>
        </span>
      </button>
    </div>
  );
}

const baseRowClassName =
  "flex h-8 w-full items-center gap-1.5 rounded-[8px] pr-2 text-[13px] font-medium text-content-muted transition-colors";

const hoverRowClassName = "hover:bg-interactive-hover hover:text-content";

const activeRowClassName = "bg-surface-subtle text-content";
