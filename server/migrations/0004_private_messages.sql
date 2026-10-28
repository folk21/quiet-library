CREATE TABLE message_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    accept_simple INTEGER NOT NULL DEFAULT 1 CHECK(accept_simple IN (0, 1)),
    accept_thought INTEGER NOT NULL DEFAULT 1 CHECK(accept_thought IN (0, 1)),
    accept_letter INTEGER NOT NULL DEFAULT 1 CHECK(accept_letter IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK(kind IN ('simple', 'thought', 'letter')),
    subject TEXT NOT NULL DEFAULT '' CHECK(length(subject) <= 140),
    content TEXT NOT NULL CHECK(length(trim(content)) BETWEEN 200 AND 30000),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    read_at TEXT,
    CHECK(kind != 'thought' OR length(trim(content)) >= 500),
    CHECK(kind != 'letter' OR length(trim(content)) >= 1800)
);

CREATE INDEX idx_private_messages_inbox ON private_messages(recipient_id, id DESC);
CREATE INDEX idx_private_messages_sent ON private_messages(sender_id, id DESC);
