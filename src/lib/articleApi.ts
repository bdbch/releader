import { invoke } from "@tauri-apps/api/core";
import type {
  ArticleCursor,
  ArticlePage,
  DeleteArticlesResult,
  RefetchFeedResult,
  UpdateArticlesReadStateResult,
} from "@/types/article";

export async function listFeedArticles({
  feedId,
  cursor,
  limit,
}: {
  feedId: string;
  cursor?: ArticleCursor | null;
  limit?: number;
}) {
  return invoke<ArticlePage>("list_articles", {
    input: {
      scope: "feed",
      feedId,
      cursor: cursor ?? null,
      limit: limit ?? 50,
    },
  });
}

export async function refetchFeed(feedId: string) {
  return invoke<RefetchFeedResult>("refetch_feed", { feedId });
}

export async function updateArticlesReadState(articleIds: string[], isRead: boolean) {
  return invoke<UpdateArticlesReadStateResult>("update_articles_read_state", {
    articleIds,
    isRead,
  });
}

export async function deleteArticles(articleIds: string[]) {
  return invoke<DeleteArticlesResult>("delete_articles", { articleIds });
}
