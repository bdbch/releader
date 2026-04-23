import { create } from "zustand";
import { listFeedArticles, refetchFeed } from "@/lib/articleApi";
import type { ArticleCursor, ArticleRecord } from "@/types/article";

type FeedArticleState = {
  items: ArticleRecord[];
  nextCursor: ArticleCursor | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type ArticleStoreState = {
  feedViews: Record<string, FeedArticleState>;
  loadFeedArticles: (feedId: string, reset?: boolean) => Promise<void>;
  refreshFeed: (feedId: string) => Promise<void>;
};

export const emptyFeedState: FeedArticleState = {
  items: [],
  nextCursor: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

export const useArticleStore = create<ArticleStoreState>((set, get) => ({
  feedViews: {},
  loadFeedArticles: async (feedId, reset = false) => {
    const currentState = get().feedViews[feedId] ?? emptyFeedState;

    if (currentState.isLoading) {
      return;
    }

    set((state) => ({
      feedViews: {
        ...state.feedViews,
        [feedId]: {
          ...(state.feedViews[feedId] ?? emptyFeedState),
          isLoading: true,
          error: null,
          ...(reset ? { items: [], nextCursor: null } : {}),
        },
      },
    }));

    try {
      const latestState = get().feedViews[feedId] ?? emptyFeedState;
      const page = await listFeedArticles({
        feedId,
        cursor: reset ? null : latestState.nextCursor,
      });

      set((state) => {
        const previous = state.feedViews[feedId] ?? emptyFeedState;

        return {
          feedViews: {
            ...state.feedViews,
            [feedId]: {
              ...previous,
              items: reset ? page.items : [...previous.items, ...page.items],
              nextCursor: page.nextCursor,
              isLoading: false,
              error: null,
            },
          },
        };
      });
    } catch (error) {
      set((state) => ({
        feedViews: {
          ...state.feedViews,
          [feedId]: {
            ...(state.feedViews[feedId] ?? emptyFeedState),
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Failed to load articles.",
          },
        },
      }));
    }
  },
  refreshFeed: async (feedId) => {
    set((state) => ({
      feedViews: {
        ...state.feedViews,
        [feedId]: {
          ...(state.feedViews[feedId] ?? emptyFeedState),
          isRefreshing: true,
          error: null,
        },
      },
    }));

    try {
      await refetchFeed(feedId);
      await get().loadFeedArticles(feedId, true);
      set((state) => ({
        feedViews: {
          ...state.feedViews,
          [feedId]: {
            ...(state.feedViews[feedId] ?? emptyFeedState),
            isRefreshing: false,
          },
        },
      }));
    } catch (error) {
      set((state) => ({
        feedViews: {
          ...state.feedViews,
          [feedId]: {
            ...(state.feedViews[feedId] ?? emptyFeedState),
            isRefreshing: false,
            error:
              error instanceof Error ? error.message : "Failed to refresh feed.",
          },
        },
      }));
    }
  },
}));
