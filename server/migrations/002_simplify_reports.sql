-- This migration intentionally keeps the report schema aligned with the original
-- application contract and avoids destructive changes that break report tracking.
-- A previous edition of this file removed report_photos and simplified the report model,
-- which caused the database layer to fail for the current API contract.

CREATE TABLE IF NOT EXISTS report_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_report_photos_report ON report_photos (report_id);
