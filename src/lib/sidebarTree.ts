import type {
  FeedRecord,
  FolderRecord,
  SidebarFeedNode,
  SidebarFolderNode,
  SidebarNode,
} from "@/types/sidebar";

export function buildSidebarTree(folders: FolderRecord[], feeds: FeedRecord[]) {
  const foldersByParent = new Map<string | null, FolderRecord[]>();
  const feedsByFolder = new Map<string | null, FeedRecord[]>();

  for (const folder of folders) {
    const key = folder.parentFolderId;
    const siblings = foldersByParent.get(key) ?? [];
    siblings.push(folder);
    foldersByParent.set(key, siblings);
  }

  for (const feed of feeds) {
    const key = feed.folderId;
    const siblings = feedsByFolder.get(key) ?? [];
    siblings.push(feed);
    feedsByFolder.set(key, siblings);
  }

  return buildNodes(null, foldersByParent, feedsByFolder);
}

function buildNodes(
  parentFolderId: string | null,
  foldersByParent: Map<string | null, FolderRecord[]>,
  feedsByFolder: Map<string | null, FeedRecord[]>,
): SidebarNode[] {
  const folderNodes = (foldersByParent.get(parentFolderId) ?? [])
    .sort(compareBySortOrderAndLabel)
    .map<SidebarFolderNode>((folder) => ({
      type: "folder",
      id: folder.id,
      name: folder.name,
      children: buildNodes(folder.id, foldersByParent, feedsByFolder),
    }));

  const feedNodes = (feedsByFolder.get(parentFolderId) ?? [])
    .sort(compareBySortOrderAndLabel)
    .map<SidebarFeedNode>((feed) => ({
      type: "feed",
      id: feed.id,
      title: feed.title,
    }));

  return [...folderNodes, ...feedNodes];
}

function compareBySortOrderAndLabel(
  left: { sortOrder: number; name?: string; title?: string },
  right: { sortOrder: number; name?: string; title?: string },
) {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return (left.name ?? left.title ?? "").localeCompare(
    right.name ?? right.title ?? "",
  );
}
