CREATE TABLE agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'agency_admin', 'agency_user')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (role = 'super_admin' AND agency_id IS NULL) OR
    (role <> 'super_admin' AND agency_id IS NOT NULL)
  )
);

CREATE INDEX idx_users_agency ON users (agency_id);

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  report_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'en_transito', 'entregado', 'devuelto', 'extraviado', 'cancelado')),
  description TEXT NOT NULL,
  observations TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (agency_id, tracking_number)
);

CREATE INDEX idx_reports_agency ON reports (agency_id);
CREATE INDEX idx_reports_status ON reports (agency_id, status);
CREATE INDEX idx_reports_date ON reports (agency_id, report_date);

CREATE TABLE report_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_report_photos_report ON report_photos (report_id);

CREATE TABLE report_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_report_history_report ON report_history (report_id);
