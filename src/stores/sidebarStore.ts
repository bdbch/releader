import { create } from "zustand";
import {
  createFolder,
  createFeedDraft,
  deleteFolder,
  deleteFeed,
  getSidebarData,
  initializeFeedFromUrl,
  renameFeed,
  renameFolder,
  resetSeededData,
  saveSidebarStructure,
} from "@/lib/sidebarApi";
import {
  loadExpandedFolderIds,
  saveExpandedFolderIds,
} from "@/lib/sidebarExpansionStorage";
import { serializeSidebarStructure } from "@/lib/sidebarMove";
import type { FeedRecord, FolderRecord } from "@/types/sidebar";

type SidebarState = {
  folders: FolderRecord[];
  feeds: FeedRecord[];
  expandedFolderIds: Record<string, boolean>;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadSidebarData: () => Promise<void>;
  toggleFolder: (folderId: string) => void;
  toggleFolderTree: (folderId: string) => void;
  setSidebarStructure: (folders: FolderRecord[], feeds: FeedRecord[]) => void;
  persistSidebarStructure: () => Promise<void>;
  reloadSidebarData: () => Promise<void>;
  createRootFolder: () => Promise<FolderRecord>;
  createDraftFeed: () => Promise<FeedRecord>;
  initializeFeed: (feedId: string, url: string) => Promise<FeedRecord>;
  renameFeed: (feedId: string, title: string) => Promise<FeedRecord>;
  renameFolder: (folderId: string, name: string) => Promise<FolderRecord>;
  removeFolder: (folderId: string) => Promise<void>;
  removeFeed: (feedId: string) => Promise<void>;
  resetToSeededData: () => Promise<{ foldersCount: number; feedsCount: number }>;
};

export const useSidebarStore = create<SidebarState>((set, get) => ({
  folders: [],
  feeds: [],
  expandedFolderIds: {},
  isLoading: false,
  hasLoaded: false,
  error: null,
  loadSidebarData: async () => {
    if (get().isLoading || get().hasLoaded) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const sidebarData = await getSidebarData();
      const storedExpandedFolderIds = await loadExpandedFolderIds();
      const expandedFolderIds = Object.fromEntries(
        sidebarData.folders.map((folder) => [
          folder.id,
          storedExpandedFolderIds?.[folder.id] ?? false,
        ]),
      );

      set({
        folders: sidebarData.folders,
        feeds: sidebarData.feeds,
        expandedFolderIds,
        isLoading: false,
        hasLoaded: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load sidebar data.",
      });
    }
  },
  toggleFolder: (folderId) =>
    set((state) => {
      const expandedFolderIds = {
        ...state.expandedFolderIds,
        [folderId]: !state.expandedFolderIds[folderId],
      };

      void saveExpandedFolderIds(expandedFolderIds);

      return { expandedFolderIds };
    }),
  toggleFolderTree: (folderId) =>
    set((state) => {
      const descendantFolderIds = getDescendantFolderIds(state.folders, folderId);
      const nextExpandedState = !state.expandedFolderIds[folderId];
      const expandedFolderIds = {
        ...state.expandedFolderIds,
        [folderId]: nextExpandedState,
      };

      for (const descendantFolderId of descendantFolderIds) {
        expandedFolderIds[descendantFolderId] = nextExpandedState;
      }

      void saveExpandedFolderIds(expandedFolderIds);

      return { expandedFolderIds };
    }),
  setSidebarStructure: (folders, feeds) => set({ folders, feeds }),
  persistSidebarStructure: async () => {
    const { folders, feeds } = get();
    await saveSidebarStructure(serializeSidebarStructure(folders, feeds));
  },
  reloadSidebarData: async () => {
    set({ hasLoaded: false });
    await get().loadSidebarData();
  },
  createRootFolder: async () => {
    const result = await createFolder();

    set((state) => ({
      folders: [...state.folders, result.folder].sort((a, b) => a.sortOrder - b.sortOrder),
      expandedFolderIds: {
        ...state.expandedFolderIds,
        [result.folder.id]: false,
      },
    }));

    return result.folder;
  },
  createDraftFeed: async () => {
    const result = await createFeedDraft();

    set((state) => ({
      feeds: [...state.feeds, result.feed].sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    return result.feed;
  },
  initializeFeed: async (feedId, url) => {
    const feed = await initializeFeedFromUrl(feedId, url);

    set((state) => ({
      feeds: state.feeds.map((item) => (item.id === feed.id ? feed : item)),
    }));

    return feed;
  },
  renameFeed: async (feedId, title) => {
    const feed = await renameFeed(feedId, title);

    set((state) => ({
      feeds: state.feeds.map((item) => (item.id === feed.id ? feed : item)),
    }));

    return feed;
  },
  renameFolder: async (folderId, name) => {
    const folder = await renameFolder(folderId, name);

    set((state) => ({
      folders: state.folders.map((item) =>
        item.id === folder.id ? folder : item,
      ),
    }));

    return folder;
  },
  removeFolder: async (folderId) => {
    await deleteFolder(folderId);
    await get().reloadSidebarData();
  },
  removeFeed: async (feedId) => {
    await deleteFeed(feedId);
    await get().reloadSidebarData();
  },
  resetToSeededData: async () => {
    const result = await resetSeededData();
    set({
      folders: [],
      feeds: [],
      expandedFolderIds: {},
      error: null,
      hasLoaded: false,
      isLoading: false,
    });
    await get().loadSidebarData();
    return result;
  },
}));

function getDescendantFolderIds(
  folders: FolderRecord[],
  folderId: string,
): string[] {
  const childFolderIds = folders
    .filter((folder) => folder.parentFolderId === folderId)
    .map((folder) => folder.id);

  return childFolderIds.flatMap((childFolderId) => [
    childFolderId,
    ...getDescendantFolderIds(folders, childFolderId),
  ]);
}
