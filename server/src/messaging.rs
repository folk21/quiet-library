use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

use crate::{ApiError, ApiResult, AppState, authenticated_user};

#[derive(Serialize, Deserialize, Clone, Copy)]
pub(crate) struct MessagePreferences {
    simple: bool,
    thought: bool,
    letter: bool,
}

impl Default for MessagePreferences {
    fn default() -> Self {
        Self {
            simple: true,
            thought: true,
            letter: true,
        }
    }
}

impl MessagePreferences {
    fn accepts(self, kind: &str) -> bool {
        match kind {
            "simple" => self.simple,
            "thought" => self.thought,
            "letter" => self.letter,
            _ => false,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RecipientMessageOptions {
    page_number: i64,
    display_name: String,
    is_demo: bool,
    accepted_types: MessagePreferences,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SendMessageInput {
    recipient_page_number: i64,
    kind: String,
    #[serde(default)]
    subject: String,
    content: String,
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MessageSummary {
    id: i64,
    sender_page_number: i64,
    sender_name: String,
    recipient_page_number: i64,
    recipient_name: String,
    kind: String,
    subject: String,
    preview: String,
    created_at: String,
    read_at: Option<String>,
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MessageDetails {
    id: i64,
    sender_page_number: i64,
    sender_name: String,
    recipient_page_number: i64,
    recipient_name: String,
    kind: String,
    subject: String,
    content: String,
    created_at: String,
    read_at: Option<String>,
}

async fn preferences_for(pool: &SqlitePool, user_id: i64) -> ApiResult<MessagePreferences> {
    let row: Option<(i64, i64, i64)> = sqlx::query_as(
        "SELECT accept_simple, accept_thought, accept_letter FROM message_preferences WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(
        row.map_or_else(MessagePreferences::default, |(simple, thought, letter)| {
            MessagePreferences {
                simple: simple != 0,
                thought: thought != 0,
                letter: letter != 0,
            }
        }),
    )
}

pub(crate) async fn my_preferences(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> ApiResult<Json<MessagePreferences>> {
    let user = authenticated_user(&headers, &state).await?;
    Ok(Json(preferences_for(&state.pool, user.id).await?))
}

pub(crate) async fn update_preferences(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(input): Json<MessagePreferences>,
) -> ApiResult<Json<MessagePreferences>> {
    let user = authenticated_user(&headers, &state).await?;
    sqlx::query(
        "INSERT INTO message_preferences (user_id, accept_simple, accept_thought, accept_letter)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
             accept_simple = excluded.accept_simple,
             accept_thought = excluded.accept_thought,
             accept_letter = excluded.accept_letter,
             updated_at = excluded.updated_at",
    )
    .bind(user.id)
    .bind(input.simple)
    .bind(input.thought)
    .bind(input.letter)
    .execute(&state.pool)
    .await?;
    Ok(Json(input))
}

pub(crate) async fn recipient_options(
    State(state): State<Arc<AppState>>,
    Path(number): Path<i64>,
) -> ApiResult<Json<RecipientMessageOptions>> {
    let row: Option<(i64, String, i64)> =
        sqlx::query_as("SELECT id, display_name, is_demo FROM users WHERE id = ?")
            .bind(number)
            .fetch_optional(&state.pool)
            .await?;
    let (page_number, display_name, is_demo) = row.ok_or_else(ApiError::not_found)?;
    Ok(Json(RecipientMessageOptions {
        page_number,
        display_name,
        is_demo: is_demo != 0,
        accepted_types: preferences_for(&state.pool, page_number).await?,
    }))
}

fn validate_message(input: &SendMessageInput) -> ApiResult<()> {
    let minimum = match input.kind.as_str() {
        "simple" => 200,
        "thought" => 500,
        "letter" => 1800,
        _ => return Err(ApiError::bad("Выберите допустимый тип сообщения.")),
    };
    let length = input.content.trim().chars().count();
    if length < minimum || length > 30_000 {
        return Err(ApiError::bad(&format!(
            "Для этого типа требуется от {minimum} до 30 000 символов."
        )));
    }
    if input.subject.chars().count() > 140 {
        return Err(ApiError::bad(
            "Тема сообщения не должна превышать 140 символов.",
        ));
    }
    Ok(())
}

async fn load_details(pool: &SqlitePool, id: i64, viewer_id: i64) -> ApiResult<MessageDetails> {
    sqlx::query_as::<_, MessageDetails>(
        "SELECT m.id, s.id AS sender_page_number, s.display_name AS sender_name,
                r.id AS recipient_page_number, r.display_name AS recipient_name,
                m.kind, m.subject, m.content, m.created_at, m.read_at
         FROM private_messages m
         JOIN users s ON s.id = m.sender_id
         JOIN users r ON r.id = m.recipient_id
         WHERE m.id = ? AND (m.sender_id = ? OR m.recipient_id = ?)",
    )
    .bind(id)
    .bind(viewer_id)
    .bind(viewer_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(ApiError::not_found)
}

pub(crate) async fn send(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(input): Json<SendMessageInput>,
) -> ApiResult<Json<MessageDetails>> {
    let sender = authenticated_user(&headers, &state).await?;
    validate_message(&input)?;
    let recipient: Option<i64> = sqlx::query_scalar("SELECT id FROM users WHERE id = ?")
        .bind(input.recipient_page_number)
        .fetch_optional(&state.pool)
        .await?;
    let recipient_id = recipient.ok_or_else(ApiError::not_found)?;

    if sender.id != recipient_id
        && !preferences_for(&state.pool, recipient_id)
            .await?
            .accepts(&input.kind)
    {
        return Err(ApiError::conflict(
            "Автор не принимает сообщения этого типа.",
        ));
    }

    let result = sqlx::query(
        "INSERT INTO private_messages (sender_id, recipient_id, kind, subject, content)
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(sender.id)
    .bind(recipient_id)
    .bind(input.kind)
    .bind(input.subject.trim())
    .bind(input.content.trim())
    .execute(&state.pool)
    .await?;
    Ok(Json(
        load_details(&state.pool, result.last_insert_rowid(), sender.id).await?,
    ))
}

async fn mailbox(pool: &SqlitePool, user_id: i64, inbox: bool) -> ApiResult<Vec<MessageSummary>> {
    let field = if inbox {
        "m.recipient_id"
    } else {
        "m.sender_id"
    };
    let query = format!(
        "SELECT m.id, s.id AS sender_page_number, s.display_name AS sender_name,
                r.id AS recipient_page_number, r.display_name AS recipient_name,
                m.kind, m.subject, substr(m.content, 1, 180) AS preview,
                m.created_at, m.read_at
         FROM private_messages m
         JOIN users s ON s.id = m.sender_id
         JOIN users r ON r.id = m.recipient_id
         WHERE {field} = ? ORDER BY m.id DESC LIMIT 50"
    );
    Ok(sqlx::query_as::<_, MessageSummary>(&query)
        .bind(user_id)
        .fetch_all(pool)
        .await?)
}

pub(crate) async fn inbox(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> ApiResult<Json<Vec<MessageSummary>>> {
    let user = authenticated_user(&headers, &state).await?;
    Ok(Json(mailbox(&state.pool, user.id, true).await?))
}

pub(crate) async fn sent(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> ApiResult<Json<Vec<MessageSummary>>> {
    let user = authenticated_user(&headers, &state).await?;
    Ok(Json(mailbox(&state.pool, user.id, false).await?))
}

pub(crate) async fn detail(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<Json<MessageDetails>> {
    let user = authenticated_user(&headers, &state).await?;
    Ok(Json(load_details(&state.pool, id, user.id).await?))
}

pub(crate) async fn mark_read(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<StatusCode> {
    let user = authenticated_user(&headers, &state).await?;
    let outcome = sqlx::query(
        "UPDATE private_messages SET read_at = COALESCE(read_at, ?)
         WHERE id = ? AND recipient_id = ?",
    )
    .bind(Utc::now().to_rfc3339())
    .bind(id)
    .bind(user.id)
    .execute(&state.pool)
    .await?;
    if outcome.rows_affected() == 0 {
        return Err(ApiError::not_found());
    }
    Ok(StatusCode::NO_CONTENT)
}
