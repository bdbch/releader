import { useEffect, useMemo, useRef } from "react";
import { RefreshCwIcon, RssIcon, Trash2Icon } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { ArticleList, type ArticleListItem } from "@/components/ArticleList";
import { ContextMenuItem } from "@/components/ui/ContextMenu";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ViewSelect } from "@/components/ViewSelect";
import { useItemSelection } from "@/hooks/useItemSelection";
import { RouteLayout } from "@/routes/RouteLayout";
import { ROUTE, useRoutes } from "@/stores/routeStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { emptyFeedState, useArticleStore } from "@/stores/articleStore";
import { useUserOptions } from "@/stores/userOptionsStore";

export function FeedRoute() {
  const autoRefreshFeedIdRef = useRef<string | null>(null);
  const feedId = useRoutes((state) => String(state.routeParams.feedId ?? ""));
  const feed = useSidebarStore((state) =>
    state.feeds.find((item) => item.id === feedId),
  );
  const removeFeed = useSidebarStore((state) => state.removeFeed);
  const setCurrentRoute = useRoutes((state) => state.setCurrentRoute);
  const view = useUserOptions((state) => state.articleListView);
  const setView = useUserOptions((state) => state.setArticleListView);
  const feedView = useArticleStore((state) => state.feedViews[feedId]);
  const loadFeedArticles = useArticleStore((state) => state.loadFeedArticles);
  const refreshFeed = useArticleStore((state) => state.refreshFeed);
  const markArticlesReadState = useArticleStore((state) => state.markArticlesReadState);
  const deleteArticlesById = useArticleStore((state) => state.deleteArticlesById);
  const resolvedFeedView = feedView ?? emptyFeedState;
  const isMissingFeed = feed?.lastFetchStatus === "not_found";

  useEffect(() => {
    if (!feedId) {
      return;
    }

    void loadFeedArticles(feedId, true);
  }, [feedId, loadFeedArticles]);

  useEffect(() => {
    autoRefreshFeedIdRef.current = null;
  }, [feedId]);

  useEffect(() => {
    if (!feedId || !feed || isMissingFeed || resolvedFeedView.isRefreshing) {
      return;
    }

    if (autoRefreshFeedIdRef.current === feedId) {
      return;
    }

    if (wasFetchedWithinLastTwoMinutes(feed.lastFetchedAt)) {
      return;
    }

    autoRefreshFeedIdRef.current = feedId;
    void refreshFeed(feedId);
  }, [
    feed,
    feedId,
    isMissingFeed,
    refreshFeed,
    resolvedFeedView.isRefreshing,
  ]);

  useEffect(() => {
    if (!feedId) {
      return;
    }

    let isDisposed = false;

    const unlistenPromise = listen("feed-sync-updated", () => {
      if (!isDisposed) {
        void loadFeedArticles(feedId, true);
      }
    });

    return () => {
      isDisposed = true;
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [feedId, loadFeedArticles]);

  const articleItems: ArticleListItem[] = resolvedFeedView.items.map((item) => ({
    id: item.id,
    title: item.title,
    feed: item.feedTitle,
    summary: item.summaryText ?? item.author ?? "",
    publishedAt: formatPublishedAt(item.publishedAt),
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    unread: !item.isRead,
    starred: item.isStarred,
  }));

  const itemIds = useMemo(() => articleItems.map((item) => item.id), [articleItems]);

  const { selectedItemIds, clearSelection, handleItemClick } = useItemSelection({
    itemIds,
    scopeKey: feedId,
    enableSelectAll: true,
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement)
      ) {
        return;
      }

      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "r") {
        return;
      }

      event.preventDefault();
      if (feedId) {
        void refreshFeed(feedId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedId, refreshFeed]);

  async function handleDeleteFeed() {
    if (!feedId) {
      return;
    }

    await removeFeed(feedId);
    setCurrentRoute(ROUTE.DASHBOARD);
  }

  async function handleMarkSelectionAsReadState(isRead: boolean) {
    await markArticlesReadState(selectedItemIds, isRead);
    clearSelection();
  }

  async function handleDeleteSelection() {
    await deleteArticlesById(selectedItemIds);
    clearSelection();
  }

  function getContextActionArticleIds(articleId: string) {
    return Array.from(new Set([...selectedItemIds, articleId]));
  }

  async function handleMarkItemReadState(articleId: string, isRead: boolean) {
    await markArticlesReadState(getContextActionArticleIds(articleId), isRead);
    clearSelection();
  }

  async function handleDeleteItem(articleId: string) {
    await deleteArticlesById(getContextActionArticleIds(articleId));
    clearSelection();
  }

  return (
    <RouteLayout
      title={feed?.title ?? "Feed"}
      titleIcon={
        feed?.iconUrl ? (
          <img src={feed.iconUrl} alt="" className="size-4 rounded-sm object-contain" />
        ) : (
          <RssIcon className="size-4 text-content-subtle" />
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <IconButton
            icon={<RefreshCwIcon className="size-[15px]" />}
            label="Refresh feed"
            onClick={() => {
              if (feedId) {
                void refreshFeed(feedId);
              }
            }}
            disabled={resolvedFeedView.isRefreshing}
          />
          <ViewSelect value={view} onValueChange={setView} />
        </div>
      }
    >
      {isMissingFeed ? (
        <section className="flex items-center justify-between gap-4 border-b px-6 py-5">
          <div className="text-[13px] text-content-muted">Feed does not exist.</div>
          <Button variant="destructive" size="sm" onClick={() => void handleDeleteFeed()}>
            Delete feed
          </Button>
        </section>
      ) : resolvedFeedView.error ? (
        <section className="border-b px-6 py-5 text-[13px] text-danger">
          {resolvedFeedView.error}
        </section>
      ) : articleItems.length === 0 && !resolvedFeedView.isLoading ? (
        <section className="border-b px-6 py-5 text-[13px] text-muted-foreground">
          No articles yet. Background sync or a manual refresh will populate this feed.
        </section>
      ) : (
        <ArticleList
          items={articleItems}
          density={view.density}
          showThumbnails={view.showThumbnails}
          selectedItemIds={selectedItemIds}
          onItemClick={(event, item) => handleItemClick(event, item.id)}
          selectionActions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleMarkSelectionAsReadState(true)}
              >
                Mark as read
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleMarkSelectionAsReadState(false)}
              >
                Mark as unread
              </Button>
              <Button
                variant="destructive"
                size="sm"
                iconLeft={<Trash2Icon className="size-3.5" />}
                onClick={() => void handleDeleteSelection()}
              >
                Delete
              </Button>
            </>
          }
          onClearSelection={clearSelection}
          renderItemContextMenu={(item) => (
            <>
              <ContextMenuItem onSelect={() => void handleMarkItemReadState(item.id, true)}>
                Mark as read
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => void handleMarkItemReadState(item.id, false)}>
                Mark as unread
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => void handleDeleteItem(item.id)}>
                Delete
              </ContextMenuItem>
            </>
          )}
        />
      )}
    </RouteLayout>
  );
}

function wasFetchedWithinLastTwoMinutes(value: string | null) {
  if (!value) {
    return false;
  }

  const fetchedAt = new Date(value);
  if (Number.isNaN(fetchedAt.getTime())) {
    return false;
  }

  return Date.now() - fetchedAt.getTime() < 2 * 60 * 1000;
}

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
