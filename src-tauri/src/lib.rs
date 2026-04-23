mod db;

use db::{
    get_sidebar_data as load_sidebar_data, init_database,
    load_sidebar_expansion_state as read_sidebar_expansion_state,
    save_sidebar_expansion_state as persist_sidebar_expansion_state,
    save_sidebar_structure as persist_sidebar_structure, AppState, FeedMoveInput, FolderMoveInput,
    SidebarData,
};
use std::collections::HashMap;
use tauri::Manager;

#[tauri::command]
fn get_sidebar_data(state: tauri::State<'_, AppState>) -> Result<SidebarData, String> {
    load_sidebar_data(&state.db_path)
}

#[tauri::command]
fn save_sidebar_structure(
    state: tauri::State<'_, AppState>,
    folders: Vec<FolderMoveInput>,
    feeds: Vec<FeedMoveInput>,
) -> Result<(), String> {
    persist_sidebar_structure(&state.db_path, folders, feeds)
}

#[tauri::command]
fn load_sidebar_expansion_state(
    state: tauri::State<'_, AppState>,
) -> Result<HashMap<String, bool>, String> {
    read_sidebar_expansion_state(&state.db_path)
}

#[tauri::command]
fn save_sidebar_expansion_state(
    state: tauri::State<'_, AppState>,
    expanded_folder_ids: HashMap<String, bool>,
) -> Result<(), String> {
    persist_sidebar_expansion_state(&state.db_path, expanded_folder_ids)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = init_database(app.handle())?;
            app.manage(AppState { db_path });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_sidebar_data,
            save_sidebar_structure,
            load_sidebar_expansion_state,
            save_sidebar_expansion_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
