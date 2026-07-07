-- Store full share tokens so authenticated management pages can copy old links.

ALTER TABLE share_links ADD COLUMN token TEXT;
