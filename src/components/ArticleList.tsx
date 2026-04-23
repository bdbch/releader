import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ArticleListDensity } from "@/components/ViewSelect";
import { Button } from "@/components/ui/Button";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/ContextMenu";

export type ArticleListItem = {
  id: string;
  title: string;
  feed: string;
  summary: string;
  publishedAt: string;
  thumbnailUrl?: string;
  unread?: boolean;
  starred?: boolean;
};

type ArticleListProps = {
  items: ArticleListItem[];
  density?: ArticleListDensity;
  showThumbnails?: boolean;
  selectedItemIds?: string[];
  onItemClick?: (event: MouseEvent<HTMLElement>, item: ArticleListItem) => void;
  selectionActions?: ReactNode;
  onClearSelection?: () => void;
  renderItemContextMenu?: (item: ArticleListItem) => ReactNode;
};

export function ArticleList({
  items,
  density = "medium",
  showThumbnails = true,
  selectedItemIds = [],
  onItemClick,
  selectionActions,
  onClearSelection,
  renderItemContextMenu,
}: ArticleListProps) {
  const selectedItemIdSet = new Set(selectedItemIds);
  const hasMultiSelection = selectedItemIds.length > 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {hasMultiSelection ? (
        <div className="flex items-center justify-between gap-3 border-b bg-surface-subtle px-6 py-1">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-foreground">
              {selectedItemIds.length} selected
            </span>
            {selectionActions ? (
              <div className="flex items-center gap-2">{selectionActions}</div>
            ) : null}
          </div>
          {onClearSelection ? (
            <Button variant="secondary" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        {items.map((item) => (
          <ArticleListRow
            key={item.id}
            item={item}
            density={density}
            showThumbnails={showThumbnails}
            isSelected={selectedItemIdSet.has(item.id)}
            onItemClick={onItemClick}
            contextMenuContent={renderItemContextMenu?.(item)}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleListRow({
  item,
  density,
  showThumbnails,
  isSelected,
  onItemClick,
  contextMenuContent,
}: {
  item: ArticleListItem;
  density: ArticleListDensity;
  showThumbnails: boolean;
  isSelected: boolean;
  onItemClick?: (event: MouseEvent<HTMLElement>, item: ArticleListItem) => void;
  contextMenuContent?: ReactNode;
}) {
  const row = (
    <article
      aria-selected={isSelected}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_120px_88px] gap-3 border-b px-6 transition-colors",
        rowClassName[density],
        onItemClick ? "cursor-default hover:bg-interactive-hover" : "",
        isSelected ? "bg-interactive-active hover:bg-interactive-hover" : "",
      )}
      onClick={onItemClick ? (event) => onItemClick(event, item) : undefined}
    >
      <div className="flex min-w-0 items-start gap-3">
        {showThumbnails ? (
          <ArticleThumbnail
            thumbnailUrl={item.thumbnailUrl}
            density={density}
            title={item.title}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {item.unread ? (
              <span className="size-2 shrink-0 rounded-full bg-foreground" />
            ) : (
              <span className="size-2 shrink-0 rounded-full bg-transparent" />
            )}
            <h2 className="truncate text-sm font-medium text-foreground">{item.title}</h2>
            {item.starred ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Saved
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-1 text-sm leading-5 text-muted-foreground",
              summaryClampClassName[density],
            )}
          >
            {item.summary}
          </p>
        </div>
      </div>
      <div className="truncate pt-0.5 text-sm text-muted-foreground">{item.feed}</div>
      <div className="pt-0.5 text-right text-sm text-muted-foreground">{item.publishedAt}</div>
    </article>
  );

  if (!contextMenuContent) {
    return row;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent>{contextMenuContent}</ContextMenuContent>
    </ContextMenu>
  );
}

function ArticleThumbnail({
  thumbnailUrl,
  density,
  title,
}: {
  thumbnailUrl?: string;
  density: ArticleListDensity;
  title: string;
}) {
  const className = cn(
    "overflow-hidden border border-border-subtle bg-surface-muted",
    thumbnailClassName[density],
  );

  if (thumbnailUrl) {
    return (
      <div className={className}>
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={className} aria-label={`${title} thumbnail placeholder`}>
      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-muted via-surface-muted to-border-subtle">
        <div className="h-3.5 w-5 rounded-sm bg-surface/80" />
      </div>
    </div>
  );
}

const rowClassName: Record<ArticleListDensity, string> = {
  dense: "py-2.5",
  medium: "py-3.5",
  loose: "py-4.5",
};

const summaryClampClassName: Record<ArticleListDensity, string> = {
  dense: "line-clamp-1",
  medium: "line-clamp-2",
  loose: "line-clamp-3",
};

const thumbnailClassName: Record<ArticleListDensity, string> = {
  dense: "size-10 rounded-md",
  medium: "size-11 rounded-md",
  loose: "size-14 rounded-lg",
};
