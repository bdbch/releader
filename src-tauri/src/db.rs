use chrono::{DateTime, Utc};
use feed_rs::model::{Entry, Feed};
use reqwest::header::{ETAG, IF_MODIFIED_SINCE, IF_NONE_MATCH, LAST_MODIFIED};
use reqwest::Client;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use uuid::Uuid;

const SIDEBAR_EXPANDED_FOLDER_IDS_KEY: &str = "sidebar.expandedFolderIds";
const FEED_SYNC_POLL_INTERVAL_SECONDS: u64 = 60;
const FEED_SYNC_INTERVAL_MINUTES: i64 = 20;
const FEED_SYNC_CONCURRENCY: usize = 4;
const ARTICLE_PAGE_SIZE_DEFAULT: i64 = 50;

pub struct AppState {
    pub db_path: PathBuf,
    pub sync_state: Arc<FeedSyncState>,
}

pub struct FeedSyncState {
    pub inflight_feed_ids: Mutex<HashSet<String>>,
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
    pub last_fetch_status: Option<String>,
    pub last_fetch_error: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SidebarData {
    pub folders: Vec<FolderRecord>,
    pub feeds: Vec<FeedRecord>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleRecord {
    pub id: String,
    pub feed_id: String,
    pub feed_title: String,
    pub title: String,
    pub url: Option<String>,
    pub author: Option<String>,
    pub summary_text: Option<String>,
    pub summary_html: Option<String>,
    pub content_html: Option<String>,
    pub thumbnail_url: Option<String>,
    pub published_at: Option<String>,
    pub fetched_at: String,
    pub is_read: bool,
    pub is_starred: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticlePage {
    pub items: Vec<ArticleRecord>,
    pub next_cursor: Option<ArticleCursor>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArticleCursor {
    pub published_at: Option<String>,
    pub id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderMoveInput {
    pub folder_id: String,
    pub parent_folder_id: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedMoveInput {
    pub feed_id: String,
    pub folder_id: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListArticlesInput {
    pub scope: String,
    pub feed_id: Option<String>,
    pub limit: Option<i64>,
    pub cursor: Option<ArticleCursor>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefetchFeedResult {
    pub feed_id: String,
    pub inserted_count: usize,
    pub updated_count: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFeedResult {
    pub feed_id: String,
}

#[derive(Debug, Clone)]
struct FeedFetchTarget {
    id: String,
    title: String,
    url: String,
    etag: Option<String>,
    last_modified: Option<String>,
}

#[derive(Debug)]
struct ParsedArticle {
    title: String,
    url: Option<String>,
    guid: Option<String>,
    external_id: String,
    author: Option<String>,
    summary_text: Option<String>,
    summary_html: Option<String>,
    content_html: Option<String>,
    thumbnail_url: Option<String>,
    published_at: Option<String>,
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
                etag TEXT NULL,
                last_modified TEXT NULL,
                last_fetch_status TEXT NULL,
                last_fetch_error TEXT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS articles (
                id TEXT PRIMARY KEY,
                feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
                guid TEXT NULL,
                external_id TEXT NOT NULL,
                url TEXT NULL,
                title TEXT NOT NULL,
                author TEXT NULL,
                summary_text TEXT NULL,
                summary_html TEXT NULL,
                content_html TEXT NULL,
                thumbnail_url TEXT NULL,
                published_at TEXT NULL,
                fetched_at TEXT NOT NULL,
                is_read INTEGER NOT NULL DEFAULT 0,
                is_starred INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(feed_id, external_id)
            );

            CREATE INDEX IF NOT EXISTS idx_articles_feed_published
                ON articles(feed_id, published_at DESC, id DESC);
            CREATE INDEX IF NOT EXISTS idx_articles_published
                ON articles(published_at DESC, id DESC);
            CREATE INDEX IF NOT EXISTS idx_articles_unread_published
                ON articles(is_read, published_at DESC, id DESC);

            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            "#,
        )
        .map_err(|error| format!("failed to initialize schema: {error}"))?;

    migrate_database(&connection)?;

    seed_sidebar_data(&connection)?;

    Ok(db_path)
}

fn migrate_database(connection: &Connection) -> Result<(), String> {
    ensure_column_exists(connection, "feeds", "etag", "TEXT NULL")?;
    ensure_column_exists(connection, "feeds", "last_modified", "TEXT NULL")?;
    ensure_column_exists(connection, "feeds", "last_fetch_status", "TEXT NULL")?;
    ensure_column_exists(connection, "feeds", "last_fetch_error", "TEXT NULL")?;

    Ok(())
}

fn ensure_column_exists(
    connection: &Connection,
    table_name: &str,
    column_name: &str,
    column_definition: &str,
) -> Result<(), String> {
    let mut statement = connection
        .prepare(&format!("PRAGMA table_info({table_name})"))
        .map_err(|error| format!("failed to inspect {table_name} schema: {error}"))?;
    let existing_columns = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| format!("failed to query {table_name} schema: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read {table_name} schema: {error}"))?;

    if existing_columns.iter().any(|column| column == column_name) {
        return Ok(());
    }

    connection
        .execute(
            &format!("ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"),
            [],
        )
        .map_err(|error| {
            format!(
                "failed to add {column_name} column to {table_name}: {error}"
            )
        })?;

    Ok(())
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
            SELECT id, title, url, site_url, folder_id, sort_order, icon_url, last_fetched_at, last_fetch_status, last_fetch_error, created_at, updated_at
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
                last_fetch_status: row.get(8)?,
                last_fetch_error: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|error| format!("failed to query feeds: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read feeds: {error}"))?;

    Ok(SidebarData { folders, feeds })
}

pub fn list_articles(
    db_path: &PathBuf,
    input: ListArticlesInput,
) -> Result<ArticlePage, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    let limit = input
        .limit
        .unwrap_or(ARTICLE_PAGE_SIZE_DEFAULT)
        .clamp(1, 100);

    let rows = match input.scope.as_str() {
        "feed" => query_feed_articles(&connection, input.feed_id.as_deref(), limit, input.cursor)?,
        _ => Vec::new(),
    };

    let next_cursor = rows.last().map(|item| ArticleCursor {
        published_at: item.published_at.clone(),
        id: item.id.clone(),
    });

    Ok(ArticlePage {
        items: rows,
        next_cursor,
    })
}

pub fn load_sidebar_expansion_state(
    db_path: &PathBuf,
) -> Result<HashMap<String, bool>, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    let raw_value: Option<String> = connection
        .query_row(
            "SELECT value FROM app_state WHERE key = ?1",
            params![SIDEBAR_EXPANDED_FOLDER_IDS_KEY],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| format!("failed to load sidebar expansion state: {error}"))?;

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
            "INSERT INTO app_state (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![SIDEBAR_EXPANDED_FOLDER_IDS_KEY, serialized],
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

pub fn delete_feed(db_path: &PathBuf, feed_id: &str) -> Result<DeleteFeedResult, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    let deleted_rows = connection
        .execute("DELETE FROM feeds WHERE id = ?1", params![feed_id])
        .map_err(|error| format!("failed to delete feed: {error}"))?;

    if deleted_rows == 0 {
        return Err(format!("feed not found: {feed_id}"));
    }

    Ok(DeleteFeedResult {
        feed_id: feed_id.to_string(),
    })
}

pub async fn refetch_feed(
    db_path: &PathBuf,
    sync_state: Arc<FeedSyncState>,
    feed_id: &str,
) -> Result<RefetchFeedResult, String> {
    let target = load_feed_fetch_target(db_path, feed_id)?
        .ok_or_else(|| format!("feed not found: {feed_id}"))?;

    fetch_and_store_feed(db_path, sync_state, target).await
}

pub fn start_background_feed_sync(app_handle: AppHandle, state: Arc<FeedSyncState>) {
    tauri::async_runtime::spawn(async move {
        let client = match Client::builder().build() {
            Ok(client) => client,
            Err(_) => return,
        };

        loop {
            let db_path = match app_handle.state::<AppState>().db_path.clone().into() {
                path => path,
            };

            let due_targets = match load_due_feed_targets(&db_path) {
                Ok(targets) => targets,
                Err(_) => {
                    sleep(Duration::from_secs(FEED_SYNC_POLL_INTERVAL_SECONDS)).await;
                    continue;
                }
            };

            for target in due_targets.into_iter().take(FEED_SYNC_CONCURRENCY) {
                let db_path = db_path.clone();
                let state = state.clone();
                let app_handle = app_handle.clone();
                let client = client.clone();

                tauri::async_runtime::spawn(async move {
                    let _ = fetch_and_store_feed_with_client(&db_path, state, target, client).await;
                    let _ = app_handle.emit("feed-sync-updated", serde_json::json!({}));
                });
            }

            sleep(Duration::from_secs(FEED_SYNC_POLL_INTERVAL_SECONDS)).await;
        }
    });
}

async fn fetch_and_store_feed(
    db_path: &PathBuf,
    sync_state: Arc<FeedSyncState>,
    target: FeedFetchTarget,
) -> Result<RefetchFeedResult, String> {
    let client = Client::builder()
        .build()
        .map_err(|error| format!("failed to build http client: {error}"))?;

    fetch_and_store_feed_with_client(db_path, sync_state, target, client).await
}

async fn fetch_and_store_feed_with_client(
    db_path: &PathBuf,
    sync_state: Arc<FeedSyncState>,
    target: FeedFetchTarget,
    client: Client,
) -> Result<RefetchFeedResult, String> {
    {
        let mut inflight_feed_ids = sync_state.inflight_feed_ids.lock().await;
        if inflight_feed_ids.contains(&target.id) {
            return Ok(RefetchFeedResult {
                feed_id: target.id,
                inserted_count: 0,
                updated_count: 0,
            });
        }

        inflight_feed_ids.insert(target.id.clone());
    }

    let result = fetch_and_store_feed_inner(db_path, &target, client).await;

    let mut inflight_feed_ids = sync_state.inflight_feed_ids.lock().await;
    inflight_feed_ids.remove(&target.id);

    result
}

async fn fetch_and_store_feed_inner(
    db_path: &PathBuf,
    target: &FeedFetchTarget,
    client: Client,
) -> Result<RefetchFeedResult, String> {
    let mut request = client.get(&target.url);

    if let Some(etag) = &target.etag {
        request = request.header(IF_NONE_MATCH, etag);
    }

    if let Some(last_modified) = &target.last_modified {
        request = request.header(IF_MODIFIED_SINCE, last_modified);
    }

    let response = request
        .send()
        .await
        .map_err(|error| format!("failed to fetch feed {}: {error}", target.title))?;

    if response.status() == reqwest::StatusCode::NOT_MODIFIED {
        mark_feed_fetch_success(
            db_path,
            &target.id,
            target.etag.clone(),
            target.last_modified.clone(),
        )?;

        return Ok(RefetchFeedResult {
            feed_id: target.id.clone(),
            inserted_count: 0,
            updated_count: 0,
        });
    }

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        mark_feed_fetch_error(
            db_path,
            &target.id,
            "not_found",
            "Feed does not exist.",
        )?;

        return Err(format!("feed not found: {}", target.title));
    }

    if !response.status().is_success() {
        let status = response.status();
        let message = format!("Feed request failed with status {status}.");
        mark_feed_fetch_error(db_path, &target.id, "error", &message)?;

        return Err(format!("failed to fetch feed {}: {status}", target.title));
    }

    let next_etag = response
        .headers()
        .get(ETAG)
        .and_then(|value| value.to_str().ok())
        .map(String::from)
        .or_else(|| target.etag.clone());
    let next_last_modified = response
        .headers()
        .get(LAST_MODIFIED)
        .and_then(|value| value.to_str().ok())
        .map(String::from)
        .or_else(|| target.last_modified.clone());

    let body = response
        .bytes()
        .await
        .map_err(|error| format!("failed to read feed response body: {error}"))?;
    let feed = feed_rs::parser::parse(&body[..])
        .map_err(|error| format!("failed to parse feed {}: {error}", target.title))?;

    let parsed_articles = parse_feed_entries(&feed);
    let (inserted_count, updated_count) = upsert_articles(db_path, &target.id, parsed_articles)?;

    mark_feed_fetch_success(db_path, &target.id, next_etag, next_last_modified)?;

    Ok(RefetchFeedResult {
        feed_id: target.id.clone(),
        inserted_count,
        updated_count,
    })
}

fn query_feed_articles(
    connection: &Connection,
    feed_id: Option<&str>,
    limit: i64,
    cursor: Option<ArticleCursor>,
) -> Result<Vec<ArticleRecord>, String> {
    let Some(feed_id) = feed_id else {
        return Ok(Vec::new());
    };

    let mut statement = if cursor.is_some() {
        connection
            .prepare(
                r#"
                SELECT
                    articles.id,
                    articles.feed_id,
                    feeds.title,
                    articles.title,
                    articles.url,
                    articles.author,
                    articles.summary_text,
                    articles.summary_html,
                    articles.content_html,
                    articles.thumbnail_url,
                    articles.published_at,
                    articles.fetched_at,
                    articles.is_read,
                    articles.is_starred
                FROM articles
                JOIN feeds ON feeds.id = articles.feed_id
                WHERE articles.feed_id = ?1
                  AND (
                    COALESCE(articles.published_at, '') < COALESCE(?2, '')
                    OR (
                      COALESCE(articles.published_at, '') = COALESCE(?2, '')
                      AND articles.id < ?3
                    )
                  )
                ORDER BY COALESCE(articles.published_at, '') DESC, articles.id DESC
                LIMIT ?4
                "#,
            )
            .map_err(|error| format!("failed to prepare feed article query: {error}"))?
    } else {
        connection
            .prepare(
                r#"
                SELECT
                    articles.id,
                    articles.feed_id,
                    feeds.title,
                    articles.title,
                    articles.url,
                    articles.author,
                    articles.summary_text,
                    articles.summary_html,
                    articles.content_html,
                    articles.thumbnail_url,
                    articles.published_at,
                    articles.fetched_at,
                    articles.is_read,
                    articles.is_starred
                FROM articles
                JOIN feeds ON feeds.id = articles.feed_id
                WHERE articles.feed_id = ?1
                ORDER BY COALESCE(articles.published_at, '') DESC, articles.id DESC
                LIMIT ?2
                "#,
            )
            .map_err(|error| format!("failed to prepare feed article query: {error}"))?
    };

    let rows = if let Some(cursor) = cursor {
        statement
            .query_map(
                params![feed_id, cursor.published_at, cursor.id, limit],
                map_article_row,
            )
            .map_err(|error| format!("failed to query feed articles: {error}"))?
    } else {
        statement
            .query_map(params![feed_id, limit], map_article_row)
            .map_err(|error| format!("failed to query feed articles: {error}"))?
    };

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read feed articles: {error}"))
}

fn map_article_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ArticleRecord> {
    Ok(ArticleRecord {
        id: row.get(0)?,
        feed_id: row.get(1)?,
        feed_title: row.get(2)?,
        title: row.get(3)?,
        url: row.get(4)?,
        author: row.get(5)?,
        summary_text: row.get(6)?,
        summary_html: row.get(7)?,
        content_html: row.get(8)?,
        thumbnail_url: row.get(9)?,
        published_at: row.get(10)?,
        fetched_at: row.get(11)?,
        is_read: row.get::<_, i64>(12)? != 0,
        is_starred: row.get::<_, i64>(13)? != 0,
    })
}

fn load_due_feed_targets(db_path: &PathBuf) -> Result<Vec<FeedFetchTarget>, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    let now = Utc::now();
    let mut statement = connection
        .prepare(
            r#"
            SELECT id, title, url, etag, last_modified, last_fetched_at
            FROM feeds
            ORDER BY COALESCE(last_fetched_at, ''), title
            "#,
        )
        .map_err(|error| format!("failed to prepare due feed query: {error}"))?;

    let feeds = statement
        .query_map([], |row| {
            Ok((
                FeedFetchTarget {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    url: row.get(2)?,
                    etag: row.get(3)?,
                    last_modified: row.get(4)?,
                },
                row.get::<_, Option<String>>(5)?,
            ))
        })
        .map_err(|error| format!("failed to query due feeds: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read due feeds: {error}"))?;

    Ok(feeds
        .into_iter()
        .filter_map(|(target, last_fetched_at)| {
            match last_fetched_at {
                Some(value) => DateTime::parse_from_rfc3339(&value)
                    .ok()
                    .map(|date| date.with_timezone(&Utc))
                    .filter(|date| *date + chrono::Duration::minutes(FEED_SYNC_INTERVAL_MINUTES) <= now)
                    .map(|_| target),
                None => Some(target),
            }
        })
        .collect())
}

fn load_feed_fetch_target(
    db_path: &PathBuf,
    feed_id: &str,
) -> Result<Option<FeedFetchTarget>, String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;

    connection
        .query_row(
            r#"
            SELECT id, title, url, etag, last_modified
            FROM feeds
            WHERE id = ?1
            "#,
            params![feed_id],
            |row| {
                Ok(FeedFetchTarget {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    url: row.get(2)?,
                    etag: row.get(3)?,
                    last_modified: row.get(4)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("failed to load feed target: {error}"))
}

fn parse_feed_entries(feed: &Feed) -> Vec<ParsedArticle> {
    feed.entries
        .iter()
        .map(parse_feed_entry)
        .collect::<Vec<_>>()
}

fn parse_feed_entry(entry: &Entry) -> ParsedArticle {
    let title = entry
        .title
        .as_ref()
        .map(|content| content.content.clone())
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "Untitled article".to_string());
    let url = entry.links.first().map(|link| link.href.clone());
    let guid = if entry.id.trim().is_empty() {
        None
    } else {
        Some(entry.id.clone())
    };
    let published_at = entry
        .published
        .or(entry.updated)
        .map(|date| date.with_timezone(&Utc).to_rfc3339());
    let summary_html = entry.summary.as_ref().map(|content| content.content.clone());
    let summary_text = summary_html
        .as_ref()
        .map(|value| strip_html(value))
        .filter(|value| !value.trim().is_empty());
    let content_html = entry
        .content
        .as_ref()
        .and_then(|content| content.body.clone())
        .filter(|value| !value.trim().is_empty())
        .or_else(|| summary_html.clone());
    let thumbnail_url = extract_thumbnail_url(
        entry,
        content_html.as_deref(),
        summary_html.as_deref(),
    );
    let author = entry.authors.first().map(|author| author.name.clone());
    let external_id = guid
        .clone()
        .or_else(|| url.clone())
        .unwrap_or_else(|| {
            format!(
                "{}:{}:{}",
                title,
                published_at.clone().unwrap_or_default(),
                Uuid::new_v4()
            )
        });

    ParsedArticle {
        title,
        url,
        guid,
        external_id,
        author,
        summary_text,
        summary_html,
        content_html,
        thumbnail_url,
        published_at,
    }
}

fn extract_thumbnail_url(
    entry: &Entry,
    content_html: Option<&str>,
    summary_html: Option<&str>,
) -> Option<String> {
    entry
        .media
        .iter()
        .flat_map(|media| media.thumbnails.iter().map(|thumbnail| thumbnail.image.uri.clone()))
        .find(|url| is_supported_thumbnail_url(url))
        .or_else(|| {
            entry
                .media
                .iter()
                .flat_map(|media| media.content.iter())
                .filter_map(|content| content.url.as_ref().map(|url| url.to_string()))
                .find(|url| is_supported_image_url(url))
        })
        .or_else(|| {
            entry
                .links
                .iter()
                .filter_map(|link| {
                    link.media_type
                        .as_deref()
                        .filter(|media_type| media_type.starts_with("image/"))
                        .map(|_| link.href.clone())
                        .or_else(|| {
                            link.rel
                                .as_deref()
                                .filter(|rel| *rel == "enclosure")
                                .filter(|_| is_supported_image_url(&link.href))
                                .map(|_| link.href.clone())
                        })
                })
                .find(|url| is_supported_thumbnail_url(url))
        })
        .or_else(|| content_html.and_then(extract_first_image_src))
        .or_else(|| summary_html.and_then(extract_first_image_src))
}

fn extract_first_image_src(html: &str) -> Option<String> {
    let image_tag_index = html.find("<img")?;
    let image_tag = &html[image_tag_index..html[image_tag_index..].find('>').map(|index| image_tag_index + index)?];

    extract_html_attribute(image_tag, "src").filter(|url| is_supported_thumbnail_url(url))
}

fn extract_html_attribute(tag: &str, attribute_name: &str) -> Option<String> {
    let search = format!("{attribute_name}=");
    let start_index = tag.find(&search)? + search.len();
    let remainder = &tag[start_index..];
    let quote = remainder.chars().next()?;

    if quote != '"' && quote != '\'' {
        return None;
    }

    let value = &remainder[1..];
    let end_index = value.find(quote)?;
    let attribute_value = value[..end_index].trim();

    if attribute_value.is_empty() {
        return None;
    }

    Some(attribute_value.to_string())
}

fn is_supported_thumbnail_url(url: &str) -> bool {
    (url.starts_with("http://") || url.starts_with("https://")) && is_supported_image_url(url)
}

fn is_supported_image_url(url: &str) -> bool {
    let lowercase_url = url.to_ascii_lowercase();

    lowercase_url.contains(".jpg")
        || lowercase_url.contains(".jpeg")
        || lowercase_url.contains(".png")
        || lowercase_url.contains(".webp")
        || lowercase_url.contains(".gif")
        || lowercase_url.contains(".avif")
        || lowercase_url.contains("image/")
}

fn upsert_articles(
    db_path: &PathBuf,
    feed_id: &str,
    articles: Vec<ParsedArticle>,
) -> Result<(usize, usize), String> {
    let mut connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("failed to start transaction: {error}"))?;

    let now = Utc::now().to_rfc3339();
    let mut inserted_count = 0;
    let mut updated_count = 0;

    for article in articles {
        let existing_article_id: Option<String> = transaction
            .query_row(
                "SELECT id FROM articles WHERE feed_id = ?1 AND external_id = ?2",
                params![feed_id, article.external_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|error| format!("failed to query existing article: {error}"))?;

        if let Some(article_id) = existing_article_id {
            transaction
                .execute(
                    r#"
                    UPDATE articles
                    SET guid = ?1,
                        url = ?2,
                        title = ?3,
                        author = ?4,
                        summary_text = ?5,
                        summary_html = ?6,
                        content_html = ?7,
                        thumbnail_url = ?8,
                        published_at = ?9,
                        fetched_at = ?10,
                        updated_at = ?11
                    WHERE id = ?12
                    "#,
                    params![
                        article.guid,
                        article.url,
                        article.title,
                        article.author,
                        article.summary_text,
                        article.summary_html,
                        article.content_html,
                        article.thumbnail_url,
                        article.published_at,
                        now,
                        now,
                        article_id,
                    ],
                )
                .map_err(|error| format!("failed to update article: {error}"))?;
            updated_count += 1;
        } else {
            transaction
                .execute(
                    r#"
                    INSERT INTO articles (
                        id,
                        feed_id,
                        guid,
                        external_id,
                        url,
                        title,
                        author,
                        summary_text,
                        summary_html,
                        content_html,
                        thumbnail_url,
                        published_at,
                        fetched_at,
                        is_read,
                        is_starred,
                        created_at,
                        updated_at
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 0, 0, ?14, ?15)
                    "#,
                    params![
                        Uuid::new_v4().to_string(),
                        feed_id,
                        article.guid,
                        article.external_id,
                        article.url,
                        article.title,
                        article.author,
                        article.summary_text,
                        article.summary_html,
                        article.content_html,
                        article.thumbnail_url,
                        article.published_at,
                        now,
                        now,
                        now,
                    ],
                )
                .map_err(|error| format!("failed to insert article: {error}"))?;
            inserted_count += 1;
        }
    }

    transaction
        .commit()
        .map_err(|error| format!("failed to commit article upserts: {error}"))?;

    Ok((inserted_count, updated_count))
}

fn mark_feed_fetch_success(
    db_path: &PathBuf,
    feed_id: &str,
    etag: Option<String>,
    last_modified: Option<String>,
) -> Result<(), String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;
    let now = Utc::now().to_rfc3339();

    connection
        .execute(
            r#"
            UPDATE feeds
            SET last_fetched_at = ?1,
                etag = ?2,
                last_modified = ?3,
                last_fetch_status = 'success',
                last_fetch_error = NULL,
                updated_at = ?1
            WHERE id = ?4
            "#,
            params![now, etag, last_modified, feed_id],
        )
        .map_err(|error| format!("failed to update feed fetch metadata: {error}"))?;

    Ok(())
}

fn mark_feed_fetch_error(
    db_path: &PathBuf,
    feed_id: &str,
    status: &str,
    error_message: &str,
) -> Result<(), String> {
    let connection = Connection::open(db_path)
        .map_err(|error| format!("failed to open database: {error}"))?;
    let now = Utc::now().to_rfc3339();

    connection
        .execute(
            r#"
            UPDATE feeds
            SET last_fetch_status = ?1,
                last_fetch_error = ?2,
                updated_at = ?3
            WHERE id = ?4
            "#,
            params![status, error_message, now, feed_id],
        )
        .map_err(|error| format!("failed to update feed fetch error metadata: {error}"))?;

    Ok(())
}

fn strip_html(value: &str) -> String {
    let mut result = String::with_capacity(value.len());
    let mut inside_tag = false;

    for character in value.chars() {
        match character {
            '<' => inside_tag = true,
            '>' => inside_tag = false,
            _ if !inside_tag => result.push(character),
            _ => {}
        }
    }

    result.split_whitespace().collect::<Vec<_>>().join(" ")
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

    let now = Utc::now().to_rfc3339();

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
                "INSERT INTO feeds (id, title, url, site_url, folder_id, sort_order, icon_url, last_fetched_at, etag, last_modified, last_fetch_status, last_fetch_error, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                params![id, title, url, site_url, folder_id, sort_order, Option::<String>::None, Option::<String>::None, Option::<String>::None, Option::<String>::None, Option::<String>::None, Option::<String>::None, now, now],
            )
            .map_err(|error| format!("failed to seed feed {title}: {error}"))?;
    }

    Ok(())
}
