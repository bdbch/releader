import { invoke } from "@tauri-apps/api/core";
import type { SidebarData } from "@/types/sidebar";

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

export async function deleteFeed(feedId: string) {
  return invoke<{ feedId: string }>("delete_feed", { feedId });
}
