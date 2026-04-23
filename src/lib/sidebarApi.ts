import { invoke } from "@tauri-apps/api/core";
import type { FolderRecord, SidebarData } from "@/types/sidebar";
import type { FeedRecord } from "@/types/sidebar";

export async function getSidebarData() {
  return invoke<SidebarData>("get_sidebar_data");
}

export async function saveSidebarStructure({
  folders,
  feeds,
}: {
  folders: Array<{
    folderId: string;
    parentFolderId: string | null;
    sortOrder: number;
  }>;
  feeds: Array<{
    feedId: string;
    folderId: string | null;
    sortOrder: number;
  }>;
}) {
  return invoke("save_sidebar_structure", { folders, feeds });
}

export async function createFolder() {
  return invoke<{ folder: FolderRecord }>("create_folder");
}

export async function createFeedDraft() {
  return invoke<{ feed: FeedRecord }>("create_feed_draft");
}

export async function initializeFeedFromUrl(feedId: string, url: string) {
  return invoke<FeedRecord>("initialize_feed_from_url", { feedId, url });
}

export async function renameFeed(feedId: string, title: string) {
  return invoke<FeedRecord>("rename_feed", { feedId, title });
}

export async function renameFolder(folderId: string, name: string) {
  return invoke<FolderRecord>("rename_folder", { folderId, name });
}

export async function deleteFolder(folderId: string) {
  return invoke<{ folderId: string }>("delete_folder", { folderId });
}

export async function deleteFeed(feedId: string) {
  return invoke<{ feedId: string }>("delete_feed", { feedId });
}

export async function resetSeededData() {
  return invoke<{ foldersCount: number; feedsCount: number }>("reset_seeded_data");
}
