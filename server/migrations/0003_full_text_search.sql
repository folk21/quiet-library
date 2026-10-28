CREATE VIRTUAL TABLE posts_fts USING fts5(
    title,
    content,
    content='posts',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

INSERT INTO posts_fts(posts_fts) VALUES('rebuild');

CREATE TRIGGER posts_fts_insert AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(rowid, title, content)
    VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER posts_fts_delete AFTER DELETE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, content)
    VALUES ('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER posts_fts_update AFTER UPDATE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, content)
    VALUES ('delete', old.id, old.title, old.content);
    INSERT INTO posts_fts(rowid, title, content)
    VALUES (new.id, new.title, new.content);
END;
