const { getDb } = require("../db");

function toPhoto(row) {
  if (!row) return null;
  return {
    id: row.id,
    reportId: row.report_id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
    historyId: row.history_id ?? null,
  };
}

function listByReport(reportId) {
  return getDb()
    .prepare("SELECT * FROM report_photos WHERE report_id = ? ORDER BY id ASC")
    .all(reportId)
    .map(toPhoto);
}

function listRawByReport(reportId) {
  return getDb()
    .prepare("SELECT * FROM report_photos WHERE report_id = ?")
    .all(reportId);
}

function findById(id) {
  return toPhoto(getDb().prepare("SELECT * FROM report_photos WHERE id = ?").get(id));
}

function findRawById(id) {
  return getDb().prepare("SELECT * FROM report_photos WHERE id = ?").get(id);
}

function countByReport(reportId) {
  return getDb()
    .prepare("SELECT COUNT(*) AS total FROM report_photos WHERE report_id = ?")
    .get(reportId).total;
}

function findByHistoryId(historyId) {
  return getDb()
    .prepare("SELECT * FROM report_photos WHERE history_id = ? ORDER BY id ASC")
    .all(historyId)
    .map(toPhoto);
}

function create({ reportId, historyId, filePath, originalName, mimeType, size }) {
  const info = getDb()
    .prepare(
      `INSERT INTO report_photos (report_id, history_id, file_path, original_name, mime_type, size)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(reportId, historyId ?? null, filePath, originalName, mimeType, size);
  return findById(info.lastInsertRowid);
}

function remove(id) {
  return getDb().prepare("DELETE FROM report_photos WHERE id = ?").run(id).changes;
}

module.exports = {
  listByReport,
  findByHistoryId,
  listRawByReport,
  findById,
  findRawById,
  countByReport,
  create,
  remove,
  toPhoto,
};
