import { useEffect } from "react";
import { RefreshCwIcon } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { ArticleList, type ArticleListItem } from "@/components/ArticleList";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ViewSelect } from "@/components/ViewSelect";
import { RouteLayout } from "@/routes/RouteLayout";
import { ROUTE, useRoutes } from "@/stores/routeStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { emptyFeedState, useArticleStore } from "@/stores/articleStore";
import { useUserOptions } from "@/stores/userOptionsStore";

export function FeedRoute() {
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
  const resolvedFeedView = feedView ?? emptyFeedState;
  const isMissingFeed = feed?.lastFetchStatus === "not_found";

  useEffect(() => {
    if (!feedId) {
      return;
    }

    void loadFeedArticles(feedId, true);
  }, [feedId, loadFeedArticles]);

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "r") {
        return;
      }

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

      event.preventDefault();
      if (feedId) {
        void refreshFeed(feedId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedId, refreshFeed]);

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

  async function handleDeleteFeed() {
    if (!feedId) {
      return;
    }

    await removeFeed(feedId);
    setCurrentRoute(ROUTE.DASHBOARD);
  }

  return (
    <RouteLayout
      title={feed?.title ?? "Feed"}
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
        />
      )}
    </RouteLayout>
  );
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
