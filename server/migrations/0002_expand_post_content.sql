CREATE TABLE posts_expanded (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 140),
    content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 30000),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO posts_expanded (id, author_id, title, content, created_at, updated_at)
SELECT id, author_id, title, content, created_at, updated_at FROM posts;

DROP TABLE posts;
ALTER TABLE posts_expanded RENAME TO posts;
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS demo_seed_posts (
    seed_key TEXT PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE
);
