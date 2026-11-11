ALTER TABLE report_photos
ADD COLUMN history_id INTEGER REFERENCES report_history(id) ON DELETE SET NULL;

CREATE INDEX idx_report_photos_history ON report_photos (history_id);
