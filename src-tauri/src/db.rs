use rusqlite::{params, Connection};
use serde::Serialize;
use std::collections::HashMap;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

pub struct AppState {
    pub db_path: PathBuf,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderRecord {
    pub id: String,
    pub name: String,
    pub parent_folder_id: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedRecord {
    pub id: String,
    pub title: String,
    pub url: String,
    pub site_url: Option<String>,
    pub folder_id: Option<String>,
    pub sort_order: i64,
    pub icon_url: Option<String>,
    pub last_fetched_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SidebarData {
    pub folders: Vec<FolderRecord>,
    pub feeds: Vec<FeedRecord>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderMoveInput {
    pub folder_id: String,
    pub parent_folder_id: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedMoveInput {
    pub feed_id: String,
    pub folder_id: Option<String>,
    pub sort_order: i64,
}

pub fn init_database(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data directory: {error}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|error| format!("failed to create app data directory: {error}"))?;

    let db_path = app_data_dir.join("releader.sqlite");
    let connection = Connection::open(&db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    connection
        .execute_batch(
            r#"
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_folder_id TEXT NULL REFERENCES folders(id) ON DELETE CASCADE,
                sort_order INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS feeds (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                site_url TEXT NULL,
                folder_id TEXT NULL REFERENCES folders(id) ON DELETE SET NULL,
                sort_order INTEGER NOT NULL,
                icon_url TEXT NULL,
                last_fetched_at TEXT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            "#,
        )
        .map_err(|error| format!("failed to initialize schema: {error}"))?;

    seed_sidebar_data(&connection)?;

    Ok(db_path)
}

pub fn get_sidebar_data(db_path: &PathBuf) -> Result<SidebarData, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    let mut folder_statement = connection
        .prepare(
            r#"
            SELECT id, name, parent_folder_id, sort_order, created_at, updated_at
            FROM folders
            ORDER BY COALESCE(parent_folder_id, ''), sort_order, name
            "#,
        )
        .map_err(|error| format!("failed to prepare folder query: {error}"))?;

    let folders = folder_statement
        .query_map([], |row| {
            Ok(FolderRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_folder_id: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|error| format!("failed to query folders: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read folders: {error}"))?;

    let mut feed_statement = connection
        .prepare(
            r#"
            SELECT id, title, url, site_url, folder_id, sort_order, icon_url, last_fetched_at, created_at, updated_at
            FROM feeds
            ORDER BY COALESCE(folder_id, ''), sort_order, title
            "#,
        )
        .map_err(|error| format!("failed to prepare feed query: {error}"))?;

    let feeds = feed_statement
        .query_map([], |row| {
            Ok(FeedRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                url: row.get(2)?,
                site_url: row.get(3)?,
                folder_id: row.get(4)?,
                sort_order: row.get(5)?,
                icon_url: row.get(6)?,
                last_fetched_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|error| format!("failed to query feeds: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read feeds: {error}"))?;

    Ok(SidebarData { folders, feeds })
}

pub fn load_sidebar_expansion_state(
    db_path: &PathBuf,
) -> Result<HashMap<String, bool>, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    let raw_value: Option<String> = connection
        .query_row(
            "SELECT value FROM app_state WHERE key = 'sidebar.expandedFolderIds'",
            [],
            |row| row.get(0),
        )
        .ok();

    match raw_value {
        Some(value) => serde_json::from_str::<HashMap<String, bool>>(&value)
            .map_err(|error| format!("failed to parse sidebar expansion state: {error}")),
        None => Ok(HashMap::new()),
    }
}

pub fn save_sidebar_expansion_state(
    db_path: &PathBuf,
    expanded_folder_ids: HashMap<String, bool>,
) -> Result<(), String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;
    let serialized = serde_json::to_string(&expanded_folder_ids)
        .map_err(|error| format!("failed to serialize sidebar expansion state: {error}"))?;

    connection
        .execute(
            "INSERT INTO app_state (key, value) VALUES ('sidebar.expandedFolderIds', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![serialized],
        )
        .map_err(|error| format!("failed to save sidebar expansion state: {error}"))?;

    Ok(())
}

pub fn save_sidebar_structure(
    db_path: &PathBuf,
    folders: Vec<FolderMoveInput>,
    feeds: Vec<FeedMoveInput>,
) -> Result<(), String> {
    let mut connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("failed to start transaction: {error}"))?;

    for folder in folders {
        transaction
            .execute(
                "UPDATE folders SET parent_folder_id = ?1, sort_order = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![folder.parent_folder_id, folder.sort_order, folder.folder_id],
            )
            .map_err(|error| format!("failed to update folder structure: {error}"))?;
    }

    for feed in feeds {
        transaction
            .execute(
                "UPDATE feeds SET folder_id = ?1, sort_order = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
                params![feed.folder_id, feed.sort_order, feed.feed_id],
            )
            .map_err(|error| format!("failed to update feed structure: {error}"))?;
    }

    transaction
        .commit()
        .map_err(|error| format!("failed to commit sidebar structure: {error}"))?;

    Ok(())
}

fn seed_sidebar_data(connection: &Connection) -> Result<(), String> {
    let folder_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM folders", [], |row| row.get(0))
        .map_err(|error| format!("failed to count folders: {error}"))?;
    let feed_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM feeds", [], |row| row.get(0))
        .map_err(|error| format!("failed to count feeds: {error}"))?;

    if folder_count > 0 || feed_count > 0 {
        return Ok(());
    }

    let now = "2026-04-23T00:00:00Z";

    connection
        .execute(
            "INSERT INTO folders (id, name, parent_folder_id, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params!["folder-tech", "Tech", Option::<String>::None, 0, now, now],
        )
        .map_err(|error| format!("failed to seed folder Tech: {error}"))?;
    connection
        .execute(
            "INSERT INTO folders (id, name, parent_folder_id, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params!["folder-design", "Design", Option::<String>::None, 1, now, now],
        )
        .map_err(|error| format!("failed to seed folder Design: {error}"))?;
    connection
        .execute(
            "INSERT INTO folders (id, name, parent_folder_id, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params!["folder-devtools", "Dev Tools", Some("folder-tech"), 0, now, now],
        )
        .map_err(|error| format!("failed to seed folder Dev Tools: {error}"))?;

    let feeds = [
        (
            "feed-ars",
            "Ars Technica",
            "https://feeds.arstechnica.com/arstechnica/index",
            Some("https://arstechnica.com"),
            Some("folder-tech"),
            0,
        ),
        (
            "feed-tauri",
            "Tauri Blog",
            "https://tauri.app/blog/rss.xml",
            Some("https://tauri.app"),
            Some("folder-devtools"),
            0,
        ),
        (
            "feed-verge",
            "The Verge",
            "https://www.theverge.com/rss/index.xml",
            Some("https://www.theverge.com"),
            Option::<&str>::None,
            0,
        ),
        (
            "feed-figma",
            "Figma",
            "https://www.figma.com/blog/feed.xml",
            Some("https://www.figma.com/blog"),
            Some("folder-design"),
            0,
        ),
    ];

    for (id, title, url, site_url, folder_id, sort_order) in feeds {
        connection
            .execute(
                "INSERT INTO feeds (id, title, url, site_url, folder_id, sort_order, icon_url, last_fetched_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![id, title, url, site_url, folder_id, sort_order, Option::<String>::None, Option::<String>::None, now, now],
            )
            .map_err(|error| format!("failed to seed feed {title}: {error}"))?;
    }

    Ok(())
}
