const { getDb } = require("../db");

function toAgency(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

function list({ includeInactive = false } = {}) {
  const where = includeInactive ? "" : "WHERE active = 1";
  return getDb()
    .prepare(`SELECT * FROM agencies ${where} ORDER BY name COLLATE NOCASE`)
    .all()
    .map(toAgency);
}

function findById(id) {
  return toAgency(getDb().prepare("SELECT * FROM agencies WHERE id = ?").get(id));
}

function findByCode(code) {
  return toAgency(getDb().prepare("SELECT * FROM agencies WHERE code = ?").get(code));
}

function create({ name, code }) {
  const info = getDb()
    .prepare("INSERT INTO agencies (name, code) VALUES (?, ?)")
    .run(name, code);
  return findById(info.lastInsertRowid);
}

function update(id, fields) {
  const allowed = {
    name: "name",
    code: "code",
    active: "active",
  };
  const sets = [];
  const values = [];

  for (const [key, column] of Object.entries(allowed)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(typeof fields[key] === "boolean" ? Number(fields[key]) : fields[key]);
    }
  }

  if (sets.length === 0) return findById(id);

  values.push(id);
  getDb().prepare(`UPDATE agencies SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

module.exports = { list, findById, findByCode, create, update, toAgency };
