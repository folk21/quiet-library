use std::{net::SocketAddr, sync::Arc};

use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::SaltString};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::{HeaderMap, Method, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post, put},
};
use chrono::{Duration, Utc};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{
    FromRow, SqlitePool,
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{info, warn};
use uuid::Uuid;

mod seed;

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
}

#[derive(Serialize)]
struct ErrorBody {
    message: String,
}

struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn bad(message: &str) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.to_owned(),
        }
    }
    fn unauthorized() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: "Войдите, чтобы продолжить.".to_owned(),
        }
    }
    fn not_found() -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: "Страница или запись не найдена.".to_owned(),
        }
    }
    fn conflict(message: &str) -> Self {
        Self {
            status: StatusCode::CONFLICT,
            message: message.to_owned(),
        }
    }
    fn internal() -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: "Внутренняя ошибка сервера.".to_owned(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorBody {
                message: self.message,
            }),
        )
            .into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(value: sqlx::Error) -> Self {
        warn!(error = %value, "database operation failed");
        Self::internal()
    }
}

type ApiResult<T> = Result<T, ApiError>;

#[derive(FromRow)]
struct UserRow {
    id: i64,
    display_name: String,
    bio: String,
    is_demo: i64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PublicUser {
    id: i64,
    page_number: i64,
    display_name: String,
    bio: String,
    is_demo: bool,
}

impl From<UserRow> for PublicUser {
    fn from(row: UserRow) -> Self {
        Self {
            id: row.id,
            page_number: row.id,
            display_name: row.display_name,
            bio: row.bio,
            is_demo: row.is_demo != 0,
        }
    }
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct PostRecord {
    id: i64,
    title: String,
    content: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize)]
struct PageResponse {
    user: PublicUser,
    posts: Vec<PostRecord>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BookmarkRecord {
    page_number: i64,
    display_name: String,
    bio: String,
    note: String,
    saved_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CatalogStats {
    pages: i64,
    posts: i64,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    user: PublicUser,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegisterInput {
    display_name: String,
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginInput {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct PostInput {
    title: String,
    content: String,
}

#[derive(Deserialize)]
struct BookmarkInput {
    note: String,
}

async fn get_user_by_id(pool: &SqlitePool, id: i64) -> ApiResult<PublicUser> {
    sqlx::query_as::<_, UserRow>("SELECT id, display_name, bio, is_demo FROM users WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .map(PublicUser::from)
        .ok_or_else(ApiError::not_found)
}

fn hash_token(token: &str) -> String {
    format!("{:x}", Sha256::digest(token.as_bytes()))
}

async fn create_session(pool: &SqlitePool, user_id: i64) -> ApiResult<String> {
    let token = format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple());
    let expiry = (Utc::now() + Duration::days(30)).to_rfc3339();
    sqlx::query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(hash_token(&token))
        .bind(user_id)
        .bind(expiry)
        .execute(pool)
        .await?;
    Ok(token)
}

async fn authenticated_user(headers: &HeaderMap, state: &AppState) -> ApiResult<PublicUser> {
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .filter(|value| !value.is_empty())
        .ok_or_else(ApiError::unauthorized)?;
    let row = sqlx::query_as::<_, UserRow>(
        "SELECT u.id, u.display_name, u.bio, u.is_demo FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_demo = 0",
    ).bind(hash_token(token)).bind(Utc::now().to_rfc3339()).fetch_optional(&state.pool).await?;
    row.map(PublicUser::from).ok_or_else(ApiError::unauthorized)
}

fn validate_post(input: &PostInput) -> ApiResult<()> {
    if input.title.trim().is_empty()
        || input.title.chars().count() > 140
        || input.content.trim().is_empty()
        || input.content.chars().count() > 30_000
    {
        return Err(ApiError::bad(
            "Заголовок должен быть не длиннее 140 символов, а текст — не длиннее 30 000.",
        ));
    }
    Ok(())
}

async fn register(
    State(state): State<Arc<AppState>>,
    Json(input): Json<RegisterInput>,
) -> ApiResult<Json<AuthResponse>> {
    let name = input.display_name.trim().to_owned();
    let email = input.email.trim().to_lowercase();
    if name.chars().count() < 2
        || name.chars().count() > 80
        || !email.contains('@')
        || email.len() > 255
        || input.password.len() < 8
        || input.password.len() > 128
    {
        return Err(ApiError::bad(
            "Проверьте имя, email и пароль (8–128 символов).",
        ));
    }
    let password = input.password;
    let hash = tokio::task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .map(|result| result.to_string())
    })
    .await
    .map_err(|_| ApiError::internal())?
    .map_err(|_| ApiError::internal())?;
    let outcome = sqlx::query(
        "INSERT INTO users (display_name, email, password_hash, bio) VALUES (?, ?, ?, ?)",
    )
    .bind(name)
    .bind(email)
    .bind(hash)
    .bind("Публикации и заметки автора.")
    .execute(&state.pool)
    .await;
    let result = match outcome {
        Ok(result) => result,
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() => {
            return Err(ApiError::conflict("Этот email уже зарегистрирован."));
        }
        Err(e) => return Err(e.into()),
    };
    let user = get_user_by_id(&state.pool, result.last_insert_rowid()).await?;
    let token = create_session(&state.pool, user.id).await?;
    Ok(Json(AuthResponse { token, user }))
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(input): Json<LoginInput>,
) -> ApiResult<Json<AuthResponse>> {
    let row: Option<(i64, String)> =
        sqlx::query_as("SELECT id, password_hash FROM users WHERE email = ? AND is_demo = 0")
            .bind(input.email.trim().to_lowercase())
            .fetch_optional(&state.pool)
            .await?;
    let Some((id, hash)) = row else {
        return Err(ApiError::unauthorized());
    };
    let valid = tokio::task::spawn_blocking(move || {
        PasswordHash::new(&hash)
            .ok()
            .and_then(|parsed| {
                Argon2::default()
                    .verify_password(input.password.as_bytes(), &parsed)
                    .ok()
            })
            .is_some()
    })
    .await
    .map_err(|_| ApiError::internal())?;
    if !valid {
        return Err(ApiError::unauthorized());
    }
    let user = get_user_by_id(&state.pool, id).await?;
    let token = create_session(&state.pool, id).await?;
    Ok(Json(AuthResponse { token, user }))
}

async fn me(State(state): State<Arc<AppState>>, headers: HeaderMap) -> ApiResult<Json<PublicUser>> {
    Ok(Json(authenticated_user(&headers, &state).await?))
}

async fn logout(State(state): State<Arc<AppState>>, headers: HeaderMap) -> ApiResult<StatusCode> {
    let _ = authenticated_user(&headers, &state).await?;
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .ok_or_else(ApiError::unauthorized)?;
    sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
        .bind(hash_token(token))
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn stats(State(state): State<Arc<AppState>>) -> ApiResult<Json<CatalogStats>> {
    let pages: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&state.pool)
        .await?;
    let posts: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM posts")
        .fetch_one(&state.pool)
        .await?;
    Ok(Json(CatalogStats {
        pages: pages.0,
        posts: posts.0,
    }))
}

async fn load_page(pool: &SqlitePool, id: i64) -> ApiResult<PageResponse> {
    let user = get_user_by_id(pool, id).await?;
    let posts = sqlx::query_as::<_, PostRecord>(
        "SELECT id, title, content, created_at, updated_at FROM posts WHERE author_id = ? ORDER BY created_at DESC, id DESC",
    ).bind(id).fetch_all(pool).await?;
    Ok(PageResponse { user, posts })
}

async fn page(
    State(state): State<Arc<AppState>>,
    Path(number): Path<i64>,
) -> ApiResult<Json<PageResponse>> {
    if number <= 0 {
        return Err(ApiError::not_found());
    }
    Ok(Json(load_page(&state.pool, number).await?))
}

async fn random_page(State(state): State<Arc<AppState>>) -> ApiResult<Json<PageResponse>> {
    let row: Option<(i64,)> = sqlx::query_as("SELECT DISTINCT u.id FROM users u JOIN posts p ON p.author_id = u.id ORDER BY RANDOM() LIMIT 1")
        .fetch_optional(&state.pool).await?;
    let (id,) = row.ok_or_else(ApiError::not_found)?;
    Ok(Json(load_page(&state.pool, id).await?))
}

async fn load_post(pool: &SqlitePool, id: i64) -> ApiResult<PostRecord> {
    sqlx::query_as::<_, PostRecord>(
        "SELECT id, title, content, created_at, updated_at FROM posts WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(ApiError::not_found)
}

async fn create_post(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(input): Json<PostInput>,
) -> ApiResult<Json<PostRecord>> {
    validate_post(&input)?;
    let user = authenticated_user(&headers, &state).await?;
    let result = sqlx::query("INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)")
        .bind(user.id)
        .bind(input.title.trim())
        .bind(input.content.trim())
        .execute(&state.pool)
        .await?;
    Ok(Json(
        load_post(&state.pool, result.last_insert_rowid()).await?,
    ))
}

async fn update_post(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(input): Json<PostInput>,
) -> ApiResult<Json<PostRecord>> {
    validate_post(&input)?;
    let user = authenticated_user(&headers, &state).await?;
    let result = sqlx::query(
        "UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ? AND author_id = ?",
    )
    .bind(input.title.trim())
    .bind(input.content.trim())
    .bind(Utc::now().to_rfc3339())
    .bind(id)
    .bind(user.id)
    .execute(&state.pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(ApiError::not_found());
    }
    Ok(Json(load_post(&state.pool, id).await?))
}

async fn delete_post(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> ApiResult<StatusCode> {
    let user = authenticated_user(&headers, &state).await?;
    let result = sqlx::query("DELETE FROM posts WHERE id = ? AND author_id = ?")
        .bind(id)
        .bind(user.id)
        .execute(&state.pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(ApiError::not_found());
    }
    Ok(StatusCode::NO_CONTENT)
}

async fn notebook(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> ApiResult<Json<Vec<BookmarkRecord>>> {
    let user = authenticated_user(&headers, &state).await?;
    let rows: Vec<(i64, String, String, String, String)> = sqlx::query_as(
        "SELECT e.page_number, u.display_name, u.bio, e.note, e.saved_at FROM notebook_entries e JOIN users u ON u.id = e.page_number WHERE e.user_id = ? ORDER BY e.saved_at DESC, e.page_number DESC",
    ).bind(user.id).fetch_all(&state.pool).await?;
    Ok(Json(
        rows.into_iter()
            .map(
                |(page_number, display_name, bio, note, saved_at)| BookmarkRecord {
                    page_number,
                    display_name,
                    bio,
                    note,
                    saved_at,
                },
            )
            .collect(),
    ))
}

async fn save_bookmark(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(page_number): Path<i64>,
    Json(input): Json<BookmarkInput>,
) -> ApiResult<Json<BookmarkRecord>> {
    let user = authenticated_user(&headers, &state).await?;
    if input.note.chars().count() > 1000 {
        return Err(ApiError::bad(
            "Личная заметка не должна превышать 1000 символов.",
        ));
    }
    let target = get_user_by_id(&state.pool, page_number).await?;
    sqlx::query("INSERT INTO notebook_entries (user_id, page_number, note) VALUES (?, ?, ?) ON CONFLICT (user_id, page_number) DO UPDATE SET note = excluded.note")
        .bind(user.id).bind(page_number).bind(&input.note).execute(&state.pool).await?;
    let saved_at: (String,) = sqlx::query_as(
        "SELECT saved_at FROM notebook_entries WHERE user_id = ? AND page_number = ?",
    )
    .bind(user.id)
    .bind(page_number)
    .fetch_one(&state.pool)
    .await?;
    Ok(Json(BookmarkRecord {
        page_number,
        display_name: target.display_name,
        bio: target.bio,
        note: input.note,
        saved_at: saved_at.0,
    }))
}

async fn remove_bookmark(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(page_number): Path<i64>,
) -> ApiResult<StatusCode> {
    let user = authenticated_user(&headers, &state).await?;
    sqlx::query("DELETE FROM notebook_entries WHERE user_id = ? AND page_number = ?")
        .bind(user.id)
        .bind(page_number)
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn health() -> &'static str {
    "ok"
}

fn app(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/logout", post(logout))
        .route("/api/me", get(me))
        .route("/api/catalog/stats", get(stats))
        .route("/api/pages/random", get(random_page))
        .route("/api/pages/{number}", get(page))
        .route("/api/posts", post(create_post))
        .route("/api/posts/{id}", put(update_post).delete(delete_post))
        .route("/api/notebook", get(notebook))
        .route(
            "/api/notebook/{page_number}",
            put(save_bookmark).delete(remove_bookmark),
        )
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "quiet_library_api=info,tower_http=info".into()),
        )
        .init();
    let db_path = std::env::var("DATABASE_PATH").unwrap_or_else(|_| "./quiet_library.db".into());
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    if std::env::var("DEMO_SEED").unwrap_or_else(|_| "true".to_owned()) == "true" {
        seed::seed_demo(&pool).await?;
    }
    let address: SocketAddr = std::env::var("API_BIND")
        .unwrap_or_else(|_| "127.0.0.1:3001".to_owned())
        .parse()?;
    let listener = tokio::net::TcpListener::bind(address).await?;
    info!(%address, "quiet library API ready");
    axum::serve(listener, app(Arc::new(AppState { pool }))).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::{Body, to_bytes},
        http::Request,
    };
    use serde_json::{Value, json};
    use tower::ServiceExt;

    async fn test_app() -> Router {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        app(Arc::new(AppState { pool }))
    }

    async fn call(
        app: &Router,
        method: Method,
        path: &str,
        token: Option<&str>,
        body: Option<Value>,
    ) -> (StatusCode, Value) {
        let mut request = Request::builder().method(method).uri(path);
        if let Some(token) = token {
            request = request.header(header::AUTHORIZATION, format!("Bearer {token}"));
        }
        let input = match body {
            Some(value) => {
                request = request.header(header::CONTENT_TYPE, "application/json");
                value.to_string()
            }
            None => String::new(),
        };
        let response = app
            .clone()
            .oneshot(request.body(Body::from(input)).unwrap())
            .await
            .unwrap();
        let status = response.status();
        let bytes = to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
        let value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
        (status, value)
    }

    async fn signup(app: &Router, name: &str, email: &str) -> Value {
        let (status, value) = call(
            app,
            Method::POST,
            "/api/auth/register",
            None,
            Some(json!({"displayName":name,"email":email,"password":"very-safe-demo-password"})),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        value
    }

    #[tokio::test]
    async fn seed_adds_ten_demo_authors_and_forty_posts_only_once() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();

        sqlx::query("INSERT INTO users (id, display_name, email, password_hash, bio) VALUES (1888, 'Existing User', 'real@example.test', 'hash', '')")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO users (id, display_name, email, password_hash, bio, is_demo) VALUES (56, 'Ева Белая', 'demo-56@invalid.local', '!disabled-demo-account', '', 1)")
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO posts (author_id, title, content) VALUES (56, 'О вещах, которые остаются', 'Legacy fixture')")
            .execute(&pool)
            .await
            .unwrap();

        seed::seed_demo(&pool).await.unwrap();
        seed::seed_demo(&pool).await.unwrap();

        let authors: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE is_demo = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        let posts: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM posts p JOIN users u ON p.author_id = u.id WHERE u.is_demo = 1",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        let long_posts: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM posts WHERE length(content) BETWEEN 20000 AND 30000",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        let legacy: String = sqlx::query_scalar(
            "SELECT content FROM posts WHERE author_id = 56 AND title = 'О вещах, которые остаются'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        let real: String = sqlx::query_scalar("SELECT display_name FROM users WHERE id = 1888")
            .fetch_one(&pool)
            .await
            .unwrap();
        let min_posts_per_author: i64 = sqlx::query_scalar(
            "SELECT MIN(post_count) FROM (SELECT COUNT(*) AS post_count FROM posts p JOIN users u ON p.author_id = u.id WHERE u.is_demo = 1 GROUP BY p.author_id)",
        )
        .fetch_one(&pool)
        .await
        .unwrap();

        assert_eq!(authors, 10);
        assert_eq!(posts, 40);
        assert_eq!(long_posts, 2);
        assert_eq!(legacy, "Legacy fixture");
        assert_eq!(real, "Existing User");
        assert_eq!(min_posts_per_author, 4);
    }

    #[tokio::test]
    async fn registration_assigns_permanent_unique_page_numbers() {
        let app = test_app().await;
        let alice = signup(&app, "Alice", "alice@example.test").await;
        let bob = signup(&app, "Bob", "bob@example.test").await;
        let a = alice["user"]["pageNumber"].as_i64().unwrap();
        let b = bob["user"]["pageNumber"].as_i64().unwrap();
        assert!(a > 0 && b > a);
        let (status, page) = call(&app, Method::GET, &format!("/api/pages/{a}"), None, None).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(page["user"]["displayName"], "Alice");
        let (status, _) = call(&app, Method::POST, "/api/auth/register", None,
            Some(json!({"displayName":"Someone", "email":"alice@example.test", "password":"another-password"}))).await;
        assert_eq!(status, StatusCode::CONFLICT);
    }

    #[tokio::test]
    async fn notebook_is_private_and_authors_only_edit_own_posts() {
        let app = test_app().await;
        let alice = signup(&app, "Alice", "alice@example.test").await;
        let bob = signup(&app, "Bob", "bob@example.test").await;
        let alice_token = alice["token"].as_str().unwrap();
        let bob_token = bob["token"].as_str().unwrap();
        let bob_page = bob["user"]["pageNumber"].as_i64().unwrap();

        let (status, post) = call(&app, Method::POST, "/api/posts", Some(alice_token),
            Some(json!({"title":"A private thought", "content":"This text can be changed only by its author."}))).await;
        assert_eq!(status, StatusCode::OK);
        let post_id = post["id"].as_i64().unwrap();
        let (status, random) = call(&app, Method::GET, "/api/pages/random", None, None).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(random["posts"].as_array().unwrap().len(), 1);
        let (status, _) = call(
            &app,
            Method::PUT,
            &format!("/api/posts/{post_id}"),
            Some(bob_token),
            Some(json!({"title":"Takeover", "content":"An unauthorized update."})),
        )
        .await;
        assert_eq!(status, StatusCode::NOT_FOUND);

        let (status, _) = call(
            &app,
            Method::PUT,
            &format!("/api/notebook/{bob_page}"),
            Some(alice_token),
            Some(json!({"note":"Only Alice can read this note."})),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        let (status, bob_notes) =
            call(&app, Method::GET, "/api/notebook", Some(bob_token), None).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(bob_notes.as_array().unwrap().len(), 0);
        let (status, alice_notes) =
            call(&app, Method::GET, "/api/notebook", Some(alice_token), None).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(alice_notes[0]["note"], "Only Alice can read this note.");
        let (status, _) = call(&app, Method::GET, "/api/notebook", None, None).await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
        let (status, _) = call(
            &app,
            Method::POST,
            "/api/auth/logout",
            Some(alice_token),
            None,
        )
        .await;
        assert_eq!(status, StatusCode::NO_CONTENT);
        let (status, _) = call(&app, Method::GET, "/api/notebook", Some(alice_token), None).await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
    }
}
