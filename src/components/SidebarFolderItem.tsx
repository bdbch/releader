import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { showNativeContextMenu } from "@/lib/nativeContextMenu";
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
  isCreating?: boolean;
  isEditing?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onContextMenuCreateFolder?: () => void;
  onContextMenuCreateFeed?: () => void;
  onContextMenuRename?: () => void;
  onContextMenuDelete?: () => void;
  onToggle?: () => void;
  onCommitRename?: (name: string) => void | Promise<void>;
  onCancelRename?: () => void;
  onCancelCreate?: () => void | Promise<void>;
  deleteConfirmationMessage?: string | null;
  onCancelDelete?: () => void;
  onConfirmDelete?: () => void;
};

export function SidebarFolderItem({
  id,
  label,
  depth,
  isExpanded,
  isActive,
  isDropTarget,
  dropInsideZoneId,
  isCreating,
  isEditing,
  onClick,
  onContextMenuCreateFolder,
  onContextMenuCreateFeed,
  onContextMenuRename,
  onContextMenuDelete,
  onToggle,
  onCommitRename,
  onCancelRename,
  onCancelCreate,
  deleteConfirmationMessage,
  onCancelDelete,
  onConfirmDelete,
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
    if (!isCreating && !isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isCreating, isEditing]);

  function handleCommit() {
    void onCommitRename?.(draftName);
  }

  const contextMenuItems = [
    {
      id: `${id}:new-folder`,
      text: "New folder",
      onSelect: onContextMenuCreateFolder,
    },
    {
      id: `${id}:new-feed`,
      text: "New feed",
      onSelect: onContextMenuCreateFeed,
    },
    {
      id: `${id}:rename`,
      text: "Rename folder",
      onSelect: onContextMenuRename,
    },
    {
      type: "separator" as const,
    },
    {
      id: `${id}:delete`,
      text: "Delete folder",
      onSelect: onContextMenuDelete,
    },
  ];

  return (
    <div ref={setDropInsideNodeRef} className="w-full">
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
        {...(isCreating || isEditing ? {} : attributes)}
        {...(isCreating || isEditing ? {} : listeners)}
        onClick={onClick}
        onDoubleClick={onToggle}
        onContextMenu={
          isCreating || isEditing
            ? undefined
            : (event) => {
                void showNativeContextMenu(event, contextMenuItems);
              }
        }
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
          {isCreating || isEditing ? (
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
                  if (isCreating) {
                    void onCancelCreate?.();
                    return;
                  }

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

      {deleteConfirmationMessage ? (
        <div className="mt-1 ml-2 rounded-[12px] border border-border-subtle bg-surface-subtle p-2.5">
          <div className="text-[12px] font-medium text-content">
            Delete "{label}"?
          </div>
          <div className="mt-1 text-[12px] leading-5 text-content-muted">
            {deleteConfirmationMessage}
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 rounded-[9px] border-border-subtle bg-background px-2.5 text-[12px] font-medium text-content-muted shadow-none hover:bg-interactive-hover hover:text-content"
              onClick={onCancelDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 rounded-[9px] px-2.5 text-[12px] font-medium shadow-none"
              onClick={onConfirmDelete}
            >
              Delete folder
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const baseRowClassName =
  "flex h-8 w-full items-center gap-1.5 rounded-sm pr-2 text-xs text-content-muted transition-colors";

const hoverRowClassName = "hover:bg-interactive-hover hover:text-content";

const activeRowClassName = "bg-surface-subtle text-content";
