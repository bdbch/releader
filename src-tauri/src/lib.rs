mod db;

use db::{
    reset_seeded_data as reset_app_seeded_data,
    get_sidebar_data as load_sidebar_data, init_database,
    list_articles as load_articles,
    load_sidebar_expansion_state as read_sidebar_expansion_state,
    delete_feed as remove_feed,
    refetch_feed as refresh_feed,
    save_sidebar_expansion_state as persist_sidebar_expansion_state,
    save_sidebar_structure as persist_sidebar_structure, start_background_feed_sync, AppState,
    FeedMoveInput, FolderMoveInput, ListArticlesInput, RefetchFeedResult, SidebarData,
    ArticlePage, DeleteFeedResult, FeedSyncState, ResetSeededDataResult,
};
use std::collections::HashMap;
use std::sync::Arc;
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

#[tauri::command]
fn list_articles(
    state: tauri::State<'_, AppState>,
    input: ListArticlesInput,
) -> Result<ArticlePage, String> {
    load_articles(&state.db_path, input)
}

#[tauri::command]
async fn refetch_feed(
    state: tauri::State<'_, AppState>,
    feed_id: String,
) -> Result<RefetchFeedResult, String> {
    refresh_feed(&state.db_path, state.sync_state.clone(), &feed_id).await
}

#[tauri::command]
fn delete_feed(
    state: tauri::State<'_, AppState>,
    feed_id: String,
) -> Result<DeleteFeedResult, String> {
    remove_feed(&state.db_path, &feed_id)
}

#[tauri::command]
fn reset_seeded_data(
    state: tauri::State<'_, AppState>,
) -> Result<ResetSeededDataResult, String> {
    reset_app_seeded_data(&state.db_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = init_database(app.handle())?;
            let sync_state = Arc::new(FeedSyncState {
                inflight_feed_ids: tokio::sync::Mutex::new(std::collections::HashSet::new()),
            });

            app.manage(AppState {
                db_path,
                sync_state: sync_state.clone(),
            });

            start_background_feed_sync(app.handle().clone(), sync_state);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_sidebar_data,
            save_sidebar_structure,
            load_sidebar_expansion_state,
            save_sidebar_expansion_state,
            list_articles,
            refetch_feed,
            delete_feed,
            reset_seeded_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
