import { create } from "zustand";
import {
  deleteFeed,
  getSidebarData,
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
  removeFeed: (feedId: string) => Promise<void>;
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
  removeFeed: async (feedId) => {
    await deleteFeed(feedId);
    set({ hasLoaded: false });
    await get().loadSidebarData();
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
