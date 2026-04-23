import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  TextCursorInputIcon,
  TrashIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/ContextMenu";
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
  isEditing?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onContextMenuRename?: () => void;
  onContextMenuDelete?: () => void;
  onToggle?: () => void;
  onCommitRename?: (name: string) => void | Promise<void>;
  onCancelRename?: () => void;
};

export function SidebarFolderItem({
  id,
  label,
  depth,
  isExpanded,
  isActive,
  isDropTarget,
  dropInsideZoneId,
  isEditing,
  onClick,
  onContextMenuRename,
  onContextMenuDelete,
  onToggle,
  onCommitRename,
  onCancelRename,
}: SidebarFolderItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });
  const { isOver, setNodeRef: setDropInsideNodeRef } = useDroppable({
    id: dropInsideZoneId ?? `folder-drop:${id}`,
    disabled: !dropInsideZoneId,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draftName, setDraftName] = useState(label);

  useEffect(() => {
    setDraftName(label);
  }, [label]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  function handleCommit() {
    void onCommitRename?.(draftName);
  }

  return (
    <div ref={setDropInsideNodeRef} className="w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            ref={setNodeRef}
            className={cn(
              baseRowClassName,
              isActive ? activeRowClassName : hoverRowClassName,
              isDragging ? "opacity-60" : "",
              isOver || isDropTarget
                ? "bg-surface-subtle ring-1 ring-border-strong"
                : "",
            )}
            style={{ paddingLeft: 10 + depth * 13 }}
            {...(isEditing ? {} : attributes)}
            {...(isEditing ? {} : listeners)}
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
                <ChevronDownIcon className="size-3" />
              ) : (
                <ChevronRightIcon className="size-3" />
              )}
            </span>

            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
              <span className="flex size-4 items-center justify-center text-content-subtle">
                {isExpanded ? (
                  <FolderOpenIcon className="size-4" />
                ) : (
                  <FolderIcon className="size-4" />
                )}
              </span>
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onBlur={handleCommit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleCommit();
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      setDraftName(label);
                      onCancelRename?.();
                    }
                  }}
                  className="h-5 min-w-0 flex-1 rounded-sm border border-border-strong bg-background px-1.5 text-xs text-content outline-none"
                />
              ) : (
                <span className="truncate">{label}</span>
              )}
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() => {
              window.setTimeout(() => onContextMenuRename?.(), 0);
            }}
          >
            <TextCursorInputIcon className="mr-2 size-3.5" />
            Rename folder
          </ContextMenuItem>
          <ContextMenuItem
            className="text-danger data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger"
            onSelect={() => {
              window.setTimeout(() => onContextMenuDelete?.(), 0);
            }}
          >
            <TrashIcon className="mr-2 size-3.5" />
            Delete folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

const baseRowClassName =
  "flex h-8 w-full items-center gap-1.5 rounded-sm pr-2 text-xs text-content-muted transition-colors";

const hoverRowClassName = "hover:bg-interactive-hover hover:text-content";

const activeRowClassName = "bg-surface-subtle text-content";
