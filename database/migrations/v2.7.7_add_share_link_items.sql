CREATE TABLE IF NOT EXISTS share_link_items (
    id TEXT PRIMARY KEY,
    share_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('file', 'directory')),
    item_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at_ms INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (share_id) REFERENCES share_links(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_share_link_items_unique ON share_link_items(share_id, item_type, item_path);
CREATE INDEX IF NOT EXISTS idx_share_link_items_share_order ON share_link_items(share_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_share_link_items_path ON share_link_items(item_type, item_path);
