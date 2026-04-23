import { FolderPlusIcon, RssIcon, TextCursorInputIcon, TrashIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/ContextMenu";
import { cn } from "@/lib/cn";
import { useSortable } from "@dnd-kit/sortable";

type SidebarFeedItemProps = {
  id: string;
  label: string;
  iconUrl?: string | null;
  depth: number;
  isActive?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isCreating?: boolean;
  isEditing?: boolean;
  onSubmitUrl?: (value: string) => void | Promise<void>;
  onCancelCreate?: () => void | Promise<void>;
  onCommitRename?: (value: string) => void | Promise<void>;
  onCancelRename?: () => void | Promise<void>;
  onContextMenuRename?: () => void;
  onContextMenuMoveIntoNewFolder?: () => void;
  onContextMenuDelete?: () => void;
};

export function SidebarFeedItem({
  id,
  label,
  iconUrl,
  depth,
  isActive,
  onClick,
  onDoubleClick,
  isCreating,
  isEditing,
  onSubmitUrl,
  onCancelCreate,
  onCommitRename,
  onCancelRename,
  onContextMenuRename,
  onContextMenuMoveIntoNewFolder,
  onContextMenuDelete,
}: SidebarFeedItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!isCreating && !isEditing) {
      setInputValue("");
      setHasSubmitted(false);
      return;
    }

    setInputValue(isEditing ? label : "");
    setHasSubmitted(false);

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isCreating, isEditing, label]);

  async function handleSubmit() {
    if (hasSubmitted) {
      return;
    }

    setHasSubmitted(true);
    if (isCreating) {
      await onSubmitUrl?.(inputValue);
      return;
    }

    if (isEditing) {
      await onCommitRename?.(inputValue);
    }
  }

  const resolvedIconUrl = iconUrl ?? null;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          ref={setNodeRef}
          className={cn(
            baseRowClassName,
            isActive ? activeRowClassName : hoverRowClassName,
            isDragging ? "opacity-60" : "",
          )}
          style={{ paddingLeft: 10 + depth * 13 }}
          {...(isCreating || isEditing ? {} : attributes)}
          {...(isCreating || isEditing ? {} : listeners)}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          <span className="-ml-0.5 flex h-4 w-3 shrink-0" aria-hidden="true" />
          <span className="flex size-4 items-center justify-center text-content-subtle">
            {resolvedIconUrl ? (
              <img
                src={resolvedIconUrl}
                alt=""
                className="size-3 rounded-sm object-contain"
              />
            ) : (
              <RssIcon className="size-3" />
            )}
          </span>
          {isCreating || isEditing ? (
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onBlur={() => void handleSubmit()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setInputValue(isEditing ? label : "");
                  if (isCreating) {
                    void onCancelCreate?.();
                    return;
                  }

                  if (isEditing) {
                    void onCancelRename?.();
                  }
                }
              }}
              placeholder={isCreating ? "Paste feed URL" : "Feed title"}
              className="h-5 min-w-0 flex-1 rounded-sm border border-border-strong bg-background px-1.5 text-xs text-content outline-none placeholder:text-content-subtle"
            />
          ) : (
            <span className="truncate">{label}</span>
          )}
        </button>
      </ContextMenuTrigger>
      {!isCreating && !isEditing ? (
        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() => {
              window.setTimeout(() => onContextMenuRename?.(), 0);
            }}
          >
            <TextCursorInputIcon className="mr-2 size-3.5" />
            Rename feed
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              window.setTimeout(() => onContextMenuMoveIntoNewFolder?.(), 0);
            }}
          >
            <FolderPlusIcon className="mr-2 size-3.5" />
            Move into new folder
          </ContextMenuItem>
          <ContextMenuItem
            className="text-danger data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger"
            onSelect={() => {
              window.setTimeout(() => onContextMenuDelete?.(), 0);
            }}
          >
            <TrashIcon className="mr-2 size-3.5" />
            Delete feed
          </ContextMenuItem>
        </ContextMenuContent>
      ) : null}
    </ContextMenu>
  );
}

const baseRowClassName =
  "flex h-8 w-full items-center gap-1.5 rounded-sm pr-2 text-xs text-content-muted text-left transition-colors";

const hoverRowClassName = "hover:bg-interactive-hover hover:text-content";

const activeRowClassName = "bg-surface-subtle text-content";
