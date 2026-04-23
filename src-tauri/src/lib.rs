mod db;

use db::{
    create_folder as insert_folder,
    create_feed_draft as insert_feed_draft,
    delete_folder as remove_folder,
    reset_seeded_data as reset_app_seeded_data,
    get_sidebar_data as load_sidebar_data, init_database,
    initialize_feed_from_url as initialize_feed,
    list_articles as load_articles,
    load_sidebar_expansion_state as read_sidebar_expansion_state,
    delete_feed as remove_feed,
    rename_feed as update_feed_title,
    rename_folder as update_folder_name,
    refetch_feed as refresh_feed,
    save_sidebar_expansion_state as persist_sidebar_expansion_state,
    save_sidebar_structure as persist_sidebar_structure, start_background_feed_sync, AppState,
    FeedMoveInput, FolderMoveInput, ListArticlesInput, RefetchFeedResult, SidebarData,
    ArticlePage, CreateFeedDraftResult, CreateFolderResult, DeleteFeedResult,
    DeleteFolderResult, FeedRecord, FeedSyncState, FolderRecord, ResetSeededDataResult,
};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{Emitter, Manager};

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
fn create_folder(state: tauri::State<'_, AppState>) -> Result<CreateFolderResult, String> {
    insert_folder(&state.db_path)
}

#[tauri::command]
fn create_feed_draft(state: tauri::State<'_, AppState>) -> Result<CreateFeedDraftResult, String> {
    insert_feed_draft(&state.db_path)
}

#[tauri::command]
fn rename_folder(
    state: tauri::State<'_, AppState>,
    folder_id: String,
    name: String,
) -> Result<FolderRecord, String> {
    update_folder_name(&state.db_path, &folder_id, &name)
}

#[tauri::command]
fn rename_feed(
    state: tauri::State<'_, AppState>,
    feed_id: String,
    title: String,
) -> Result<FeedRecord, String> {
    update_feed_title(&state.db_path, &feed_id, &title)
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
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    feed_id: String,
) -> Result<RefetchFeedResult, String> {
    let result = refresh_feed(&state.db_path, state.sync_state.clone(), &feed_id).await?;
    let _ = app.emit("feed-sync-updated", serde_json::json!({ "feedId": feed_id }));
    Ok(result)
}

#[tauri::command]
async fn initialize_feed_from_url(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    feed_id: String,
    url: String,
) -> Result<FeedRecord, String> {
    let feed = initialize_feed(&state.db_path, state.sync_state.clone(), &feed_id, &url).await?;
    let _ = app.emit("feed-sync-updated", serde_json::json!({ "feedId": feed_id }));
    Ok(feed)
}

#[tauri::command]
fn delete_feed(
    state: tauri::State<'_, AppState>,
    feed_id: String,
) -> Result<DeleteFeedResult, String> {
    remove_feed(&state.db_path, &feed_id)
}

#[tauri::command]
fn delete_folder(
    state: tauri::State<'_, AppState>,
    folder_id: String,
) -> Result<DeleteFolderResult, String> {
    remove_folder(&state.db_path, &folder_id)
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
            create_folder,
            create_feed_draft,
            rename_folder,
            rename_feed,
            load_sidebar_expansion_state,
            save_sidebar_expansion_state,
            list_articles,
            refetch_feed,
            initialize_feed_from_url,
            delete_feed,
            delete_folder,
            reset_seeded_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
