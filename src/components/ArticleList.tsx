import { cn } from "@/lib/cn";
import type { ArticleListDensity } from "@/components/ViewSelect";

type ArticleListItem = {
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
};

export function ArticleList({
  items,
  density = "medium",
  showThumbnails = true,
}: ArticleListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_120px_88px] gap-3 border-b px-6 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span>Item</span>
        <span>Feed</span>
        <span className="text-right">Published</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_120px_88px] gap-3 border-b px-6 transition-colors hover:bg-interactive-hover",
              rowClassName[density],
            )}
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
                  <h2 className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </h2>
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
            <div className="truncate pt-0.5 text-sm text-muted-foreground">
              {item.feed}
            </div>
            <div className="pt-0.5 text-right text-sm text-muted-foreground">
              {item.publishedAt}
            </div>
          </article>
        ))}
      </div>
    </div>
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
