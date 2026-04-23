import { invoke } from "@tauri-apps/api/core";

export async function loadExpandedFolderIds() {
  try {
    return await invoke<Record<string, boolean>>("load_sidebar_expansion_state");
  } catch {
    return null;
  }
}

export async function saveExpandedFolderIds(
  expandedFolderIds: Record<string, boolean>,
) {
  try {
    await invoke("save_sidebar_expansion_state", { expandedFolderIds });
  } catch {
    return;
  }
}
