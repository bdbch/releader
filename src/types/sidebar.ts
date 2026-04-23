export type FolderRecord = {
  id: string;
  name: string;
  parentFolderId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FeedRecord = {
  id: string;
  title: string;
  url: string;
  siteUrl: string | null;
  folderId: string | null;
  sortOrder: number;
  iconUrl: string | null;
  lastFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SidebarData = {
  folders: FolderRecord[];
  feeds: FeedRecord[];
};

export type SidebarNode = SidebarFolderNode | SidebarFeedNode;

export type SidebarFolderNode = {
  type: "folder";
  id: string;
  name: string;
  children: SidebarNode[];
};

export type SidebarFeedNode = {
  type: "feed";
  id: string;
  title: string;
};
