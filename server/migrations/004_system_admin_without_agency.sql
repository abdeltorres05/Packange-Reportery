-- requiresForeignKeysOff
CREATE TABLE users_replacement (
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
    (role = 'agency_admin') OR
    (role = 'agency_user' AND agency_id IS NOT NULL)
  )
);

INSERT INTO users_replacement (
  id, agency_id, name, email, password_hash, role, active, created_at
)
SELECT id, agency_id, name, email, password_hash, role, active, created_at
FROM users;

DROP INDEX idx_users_agency;
DROP TABLE users;
ALTER TABLE users_replacement RENAME TO users;
CREATE INDEX idx_users_agency ON users (agency_id);
