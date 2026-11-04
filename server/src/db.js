const Database = require("better-sqlite3");
const path = require("node:path");
const config = require("./config");

let db;

function getDb() {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

module.exports = { getDb };
