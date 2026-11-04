const { getDb } = require("../db");

const SELECT_USER = `
  SELECT u.*, a.name AS agency_name, a.code AS agency_code
  FROM users u
  LEFT JOIN agencies a ON a.id = u.agency_id
`;

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    agencyId: row.agency_id,
    agencyName: row.agency_name ?? null,
    agencyCode: row.agency_code ?? null,
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

function toAuthUser(row) {
  if (!row) return null;
  return {
    ...toUser(row),
    passwordHash: row.password_hash,
  };
}

function findById(id) {
  return toUser(
    getDb().prepare(`${SELECT_USER} WHERE u.id = ?`).get(id)
  );
}

function findAuthByEmail(email) {
  return toAuthUser(
    getDb().prepare(`${SELECT_USER} WHERE u.email = ?`).get(email)
  );
}

function findAuthById(id) {
  return toAuthUser(
    getDb().prepare(`${SELECT_USER} WHERE u.id = ?`).get(id)
  );
}

function list({ agencyId = null } = {}) {
  const rows =
    agencyId === null
      ? getDb().prepare(`${SELECT_USER} ORDER BY a.name COLLATE NOCASE, u.name COLLATE NOCASE`).all()
      : getDb()
          .prepare(`${SELECT_USER} WHERE u.agency_id = ? ORDER BY u.name COLLATE NOCASE`)
          .all(agencyId);
  return rows.map(toUser);
}

function create({ agencyId, name, email, passwordHash, role }) {
  const info = getDb()
    .prepare(
      `INSERT INTO users (agency_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(agencyId, name, email, passwordHash, role);
  return findById(info.lastInsertRowid);
}

function update(id, fields) {
  const allowed = {
    name: "name",
    email: "email",
    passwordHash: "password_hash",
    role: "role",
    active: "active",
    agencyId: "agency_id",
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
  getDb().prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

function countByAgency(agencyId) {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS total FROM users WHERE agency_id = ?")
    .get(agencyId);
  return row.total;
}

module.exports = {
  findById,
  findAuthByEmail,
  findAuthById,
  list,
  create,
  update,
  countByAgency,
  toUser,
};
