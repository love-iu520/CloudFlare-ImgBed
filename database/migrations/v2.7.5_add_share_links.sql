-- Add expiring share links.

CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('file', 'directory')),
    target_path TEXT NOT NULL,
    expires_at INTEGER,
    revoked_at INTEGER,
    created_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 0,
    last_viewed_at INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_share_links_target ON share_links(target_type, target_path);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_links_revoked_at ON share_links(revoked_at);
CREATE INDEX IF NOT EXISTS idx_share_links_created_at_ms ON share_links(created_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS update_share_links_updated_at
    AFTER UPDATE ON share_links
    BEGIN
        UPDATE share_links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
