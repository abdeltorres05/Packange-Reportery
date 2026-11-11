const { getDb } = require("../db");

const STATUSES = [
  "pendiente",
  "procesado",
  "cerrado",
];

const STATUS_TO_STORAGE = {
  pendiente: ["pendiente"],
  procesado: ["en_transito"],
  cerrado: ["entregado", "devuelto", "extraviado", "cancelado"],
};

const STORAGE_TO_STATUS = {
  pendiente: "pendiente",
  en_transito: "procesado",
  entregado: "cerrado",
  devuelto: "cerrado",
  extraviado: "cerrado",
  cancelado: "cerrado",
  procesado: "procesado",
  cerrado: "cerrado",
};

function toApiStatus(status) {
  return STORAGE_TO_STATUS[status] || status;
}

function toStorageStatus(status) {
  if (status === "procesado") return "en_transito";
  if (status === "cerrado") return "entregado";
  return status;
}

const SELECT_REPORT = `
  SELECT
    r.*,
    a.name AS agency_name,
    a.code AS agency_code,
    u.name AS created_by_name,
    (
      SELECT h.notes
      FROM report_history h
      WHERE h.report_id = r.id AND h.notes IS NOT NULL AND h.notes <> ''
      ORDER BY h.id DESC
      LIMIT 1
    ) AS last_note,
    (
      SELECT h.changed_at
      FROM report_history h
      WHERE h.report_id = r.id
      ORDER BY h.id DESC
      LIMIT 1
    ) AS last_status_at
  FROM reports r
  JOIN agencies a ON a.id = r.agency_id
  JOIN users u ON u.id = r.created_by
`;

function toReport(row) {
  if (!row) return null;

  return {
    id: row.id,
    agencyId: row.agency_id,
    agencyName: row.agency_name ?? null,
    agencyCode: row.agency_code ?? null,
    trackingNumber: row.tracking_number,
    senderName: row.sender_name,
    senderPhone: row.sender_phone ?? null,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone ?? null,
    reportDate: row.report_date,
    status: toApiStatus(row.status),
    description: row.description,
    observations: row.observations ?? null,
    lastNote: row.last_note ?? null,
    lastStatusAt: row.last_status_at ?? null,
    createdBy: row.created_by,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildFilters({ agencyId = null, status, from, to, q }) {
  const conditions = [];
  const params = [];

  if (agencyId !== null && agencyId !== undefined) {
    conditions.push("r.agency_id = ?");
    params.push(agencyId);
  }
  if (status) {
    const storageStatuses = STATUS_TO_STORAGE[status] || [status];
    conditions.push(`r.status IN (${storageStatuses.map(() => "?").join(", ")})`);
    params.push(...storageStatuses);
  }
  if (from) {
    conditions.push("date(r.report_date) >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("date(r.report_date) <= ?");
    params.push(to);
  }
  if (q) {
    conditions.push("(r.tracking_number LIKE ? OR r.sender_name LIKE ? OR r.recipient_name LIKE ? OR r.description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

function list({ agencyId = null, status, from, to, q, page = 1, limit = 20 }) {
  const { where, params } = buildFilters({ agencyId, status, from, to, q });
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const total = getDb()
    .prepare(`SELECT COUNT(*) AS total FROM reports r ${where}`)
    .get(...params).total;

  const rows = getDb()
    .prepare(
      `${SELECT_REPORT} ${where}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, safeLimit, offset);

  return {
    items: rows.map(toReport),
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(total / safeLimit),
  };
}

function findById(id) {
  return toReport(getDb().prepare(`${SELECT_REPORT} WHERE r.id = ?`).get(id));
}

function findScoped(id, agencyId) {
  if (agencyId === null || agencyId === undefined) return findById(id);
  return toReport(
    getDb()
      .prepare(`${SELECT_REPORT} WHERE r.id = ? AND r.agency_id = ?`)
      .get(id, agencyId)
  );
}

function findByTrackingNumber(agencyId, trackingNumber) {
  return toReport(
    getDb()
      .prepare(`${SELECT_REPORT} WHERE r.agency_id = ? AND r.tracking_number = ?`)
      .get(agencyId, trackingNumber)
  );
}

function findByBultoNumber(agencyId, bultoNumber) {
  return findByTrackingNumber(agencyId, bultoNumber);
}

function create(data) {
  const info = getDb()
    .prepare(
      `INSERT INTO reports (
        agency_id,
        tracking_number,
        sender_name,
        sender_phone,
        recipient_name,
        recipient_phone,
        report_date,
        status,
        description,
        observations,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.agencyId,
      data.trackingNumber,
      data.senderName,
      data.senderPhone ?? null,
      data.recipientName,
      data.recipientPhone ?? null,
      data.reportDate,
      toStorageStatus(data.status || "pendiente"),
      data.description,
      data.observations ?? null,
      data.createdBy
    );

  return findById(info.lastInsertRowid);
}

function update(id, fields) {
  const allowed = {
    trackingNumber: "tracking_number",
    senderName: "sender_name",
    senderPhone: "sender_phone",
    recipientName: "recipient_name",
    recipientPhone: "recipient_phone",
    reportDate: "report_date",
    status: "status",
    description: "description",
    observations: "observations",
  };

  const sets = [];
  const values = [];

  for (const [key, column] of Object.entries(allowed)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(key === "status" ? toStorageStatus(fields[key]) : fields[key]);
    }
  }

  if (sets.length === 0) return findById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE reports SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findById(id);
}

function remove(id) {
  return getDb().prepare("DELETE FROM reports WHERE id = ?").run(id).changes;
}

function stats({ agencyId = null, from, to }) {
  const { where, params } = buildFilters({ agencyId, from, to });
  const rows = getDb()
    .prepare(`SELECT r.status, COUNT(*) AS count FROM reports r ${where} GROUP BY r.status`)
    .all(...params);

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  let total = 0;
  for (const row of rows) {
    const status = toApiStatus(row.status);
    byStatus[status] += row.count;
    total += row.count;
  }

  return { total, byStatus, statuses: STATUSES };
}

function addHistory({ reportId, status, notes, changedBy }) {
  getDb()
    .prepare(
      `INSERT INTO report_history (report_id, status, notes, changed_by)
       VALUES (?, ?, ?, ?)`
    )
    .run(reportId, status, notes ?? null, changedBy);
}

function listHistory(reportId) {
  return getDb()
    .prepare(
      `SELECT h.*, u.name AS changed_by_name
       FROM report_history h
       JOIN users u ON u.id = h.changed_by
       WHERE h.report_id = ?
       ORDER BY h.changed_at ASC, h.id ASC`
    )
    .all(reportId)
    .map((row) => ({
      id: row.id,
      reportId: row.report_id,
      status: toApiStatus(row.status),
      notes: row.notes,
      changedBy: row.changed_by,
      changedByName: row.changed_by_name,
      changedAt: row.changed_at,
    }));
}

module.exports = {
  STATUSES,
  list,
  findById,
  findScoped,
  findByTrackingNumber,
  findByBultoNumber,
  create,
  update,
  remove,
  stats,
  addHistory,
  listHistory,
  toReport,
};
