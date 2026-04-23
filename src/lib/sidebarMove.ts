import type { FeedRecord, FolderRecord, SidebarNode } from "@/types/sidebar";

type MovePosition = {
  parentFolderId: string | null;
  index: number;
};

export function moveSidebarNode({
  folders,
  feeds,
  tree,
  activeId,
  targetContextId,
  targetIndex,
}: {
  folders: FolderRecord[];
  feeds: FeedRecord[];
  tree: SidebarNode[];
  activeId: string;
  targetContextId: string | null;
  targetIndex: number;
}) {
  const activeFolder = folders.find((folder) => folder.id === activeId);
  const activeFeed = feeds.find((feed) => feed.id === activeId);

  if (!activeFolder && !activeFeed) {
    return { folders, feeds };
  }

  const contextNodes = getContextNodes(tree, targetContextId);

  if (!contextNodes) {
    return { folders, feeds };
  }

  if (activeFolder) {
    if (targetContextId === activeFolder.id) {
      return { folders, feeds };
    }

    if (
      targetContextId &&
      isDescendantFolder(tree, activeFolder.id, targetContextId)
    ) {
      return { folders, feeds };
    }

    const folderIndex = countNodesBeforeIndex(contextNodes, targetIndex, "folder");

    return {
      folders: reorderFolders(folders, activeFolder.id, {
        parentFolderId: targetContextId,
        index: folderIndex,
      }),
      feeds,
    };
  }

  const feedIndex = countNodesBeforeIndex(contextNodes, targetIndex, "feed");

  return {
    folders,
    feeds: reorderFeeds(feeds, activeId, {
      parentFolderId: targetContextId,
      index: feedIndex,
    }),
  };
}

export function serializeSidebarStructure(
  folders: FolderRecord[],
  feeds: FeedRecord[],
) {
  return {
    folders: folders.map((folder) => ({
      folderId: folder.id,
      parentFolderId: folder.parentFolderId,
      sortOrder: folder.sortOrder,
    })),
    feeds: feeds.map((feed) => ({
      feedId: feed.id,
      folderId: feed.folderId,
      sortOrder: feed.sortOrder,
    })),
  };
}

function reorderFolders(
  folders: FolderRecord[],
  folderId: string,
  position: MovePosition,
) {
  const movingFolder = folders.find((folder) => folder.id === folderId);

  if (!movingFolder) {
    return folders;
  }

  const targetSiblings = folders
    .filter(
      (folder) =>
        folder.parentFolderId === position.parentFolderId && folder.id !== folderId,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);

  targetSiblings.splice(position.index, 0, {
    ...movingFolder,
    parentFolderId: position.parentFolderId,
  });

  const targetOrderById = new Map(
    targetSiblings.map((folder, index) => [folder.id, index]),
  );

  const sourceSiblings = folders
    .filter(
      (folder) =>
        folder.parentFolderId === movingFolder.parentFolderId && folder.id !== folderId,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const sourceOrderById = new Map(
    sourceSiblings.map((folder, index) => [folder.id, index]),
  );

  return folders.map((folder) => {
    if (folder.id === folderId) {
      return {
        ...folder,
        parentFolderId: position.parentFolderId,
        sortOrder: position.index,
      };
    }

    if (
      folder.parentFolderId === position.parentFolderId &&
      targetOrderById.has(folder.id)
    ) {
      return {
        ...folder,
        sortOrder: targetOrderById.get(folder.id) ?? folder.sortOrder,
      };
    }

    if (
      folder.parentFolderId === movingFolder.parentFolderId &&
      sourceOrderById.has(folder.id) &&
      movingFolder.parentFolderId !== position.parentFolderId
    ) {
      return {
        ...folder,
        sortOrder: sourceOrderById.get(folder.id) ?? folder.sortOrder,
      };
    }

    return folder;
  });
}

function reorderFeeds(feeds: FeedRecord[], feedId: string, position: MovePosition) {
  const movingFeed = feeds.find((feed) => feed.id === feedId);

  if (!movingFeed) {
    return feeds;
  }

  const targetSiblings = feeds
    .filter(
      (feed) => feed.folderId === position.parentFolderId && feed.id !== feedId,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);

  targetSiblings.splice(position.index, 0, {
    ...movingFeed,
    folderId: position.parentFolderId,
  });

  const targetOrderById = new Map(
    targetSiblings.map((feed, index) => [feed.id, index]),
  );

  const sourceSiblings = feeds
    .filter(
      (feed) => feed.folderId === movingFeed.folderId && feed.id !== feedId,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const sourceOrderById = new Map(
    sourceSiblings.map((feed, index) => [feed.id, index]),
  );

  return feeds.map((feed) => {
    if (feed.id === feedId) {
      return {
        ...feed,
        folderId: position.parentFolderId,
        sortOrder: position.index,
      };
    }

    if (
      feed.folderId === position.parentFolderId &&
      targetOrderById.has(feed.id)
    ) {
      return {
        ...feed,
        sortOrder: targetOrderById.get(feed.id) ?? feed.sortOrder,
      };
    }

    if (
      feed.folderId === movingFeed.folderId &&
      sourceOrderById.has(feed.id) &&
      movingFeed.folderId !== position.parentFolderId
    ) {
      return {
        ...feed,
        sortOrder: sourceOrderById.get(feed.id) ?? feed.sortOrder,
      };
    }

    return feed;
  });
}

function countNodesBeforeIndex(
  nodes: SidebarNode[],
  index: number,
  type: SidebarNode["type"],
) {
  return nodes.slice(0, index).filter((node) => node.type === type).length;
}

function getContextNodes(nodes: SidebarNode[], contextFolderId: string | null): SidebarNode[] | null {
  if (contextFolderId === null) {
    return nodes;
  }

  const folderNode = findNode(nodes, contextFolderId);
  if (!folderNode || folderNode.type !== "folder") {
    return null;
  }

  return folderNode.children;
}

function isDescendantFolder(
  nodes: SidebarNode[],
  folderId: string,
  candidateParentId: string,
) {
  const folder = findNode(nodes, folderId);

  if (!folder || folder.type !== "folder") {
    return false;
  }

  return containsFolder(folder.children, candidateParentId);
}

function containsFolder(nodes: SidebarNode[], folderId: string): boolean {
  for (const node of nodes) {
    if (node.type === "folder") {
      if (node.id === folderId || containsFolder(node.children, folderId)) {
        return true;
      }
    }
  }

  return false;
}

function findNode(nodes: SidebarNode[], nodeId: string): SidebarNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    if (node.type === "folder") {
      const childMatch = findNode(node.children, nodeId);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return null;
}
