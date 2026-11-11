const fs = require("node:fs");
const path = require("node:path");
const { getDb } = require("./db");

const migrationsDir = path.join(__dirname, "../migrations");

function runMigrations(database = getDb()) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    database.prepare("SELECT name FROM schema_migrations").all().map((row) => row.name)
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const pending = files.filter((file) => !applied.has(file));

  const apply = database.transaction((file, sql) => {
    database.exec(sql);
    database.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
  });

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    if (sql.includes("-- requiresForeignKeysOff")) {
      database.pragma("foreign_keys = OFF");
      try {
        apply(file, sql);
      } finally {
        database.pragma("foreign_keys = ON");
      }

      const violations = database.pragma("foreign_key_check");
      if (violations.length > 0) {
        throw new Error(`Foreign key violations after migration ${file}`);
      }
    } else {
      apply(file, sql);
    }
  }

  return pending;
}

if (require.main === module) {
  const pending = runMigrations();
  if (pending.length === 0) {
    console.log("Sin migraciones pendientes.");
  } else {
    console.log(`Migraciones aplicadas: ${pending.join(", ")}`);
  }
}

module.exports = { runMigrations };
