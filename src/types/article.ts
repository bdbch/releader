export type ArticleRecord = {
  id: string;
  feedId: string;
  feedTitle: string;
  title: string;
  url: string | null;
  author: string | null;
  summaryText: string | null;
  summaryHtml: string | null;
  contentHtml: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  isRead: boolean;
  isStarred: boolean;
};

export type ArticleCursor = {
  publishedAt: string | null;
  id: string;
};

export type ArticlePage = {
  items: ArticleRecord[];
  nextCursor: ArticleCursor | null;
};

export type RefetchFeedResult = {
  feedId: string;
  insertedCount: number;
  updatedCount: number;
};
