const fs = require("node:fs");
const path = require("node:path");
const { Router } = require("express");

const config = require("../config");
const reports = require("../repositories/reports");
const agencies = require("../repositories/agencies");
const photos = require("../repositories/photos");
const {
  reportCreateSchema,
  reportUpdateSchema,
  reportListQuerySchema,
  statsQuerySchema,
} = require("../validation/schemas");
const { validate } = require("../lib/validate");
const {
  requireAuth,
  requireRole,
  resolveAgencyScope,
} = require("../auth/middleware");
const { parseId } = require("../lib/params");
const { conflict, forbidden, notFound } = require("../lib/errors");

const router = Router();

router.use(requireAuth);

router.get("/stats", (req, res) => {
  const query = validate(statsQuerySchema, req.query);
  const agencyId = resolveAgencyScope(req, query.agencyId);
  res.json(reports.stats({ agencyId, from: query.from, to: query.to }));
});

router.get("/", (req, res) => {
  const query = validate(reportListQuerySchema, req.query);
  const agencyId = resolveAgencyScope(req, query.agencyId);
  res.json(
    reports.list({
      agencyId,
      status: query.status,
      from: query.from,
      to: query.to,
      q: query.q,
      page: query.page,
      limit: query.limit,
    })
  );
});

router.post("/", requireRole("agency_admin", "agency_user", "super_admin"), (req, res) => {
  const data = validate(reportCreateSchema, req.body);
  const canChooseAgency = ["super_admin", "agency_admin"].includes(req.user.role);
  const agencyId = req.user.role === "super_admin"
    ? data.agencyId
    : req.user.role === "agency_admin"
      ? data.agencyId ?? req.user.agencyId
      : req.user.agencyId;

  if (!agencyId) {
    throw notFound("Agencia no disponible");
  }
  if (canChooseAgency && !agencies.findById(agencyId)) {
    throw notFound("Agencia no encontrada");
  }

  if (reports.findByTrackingNumber(agencyId, data.trackingNumber)) {
    throw conflict("Ya existe un reporte con esa guía en tu agencia");
  }

  const report = reports.create({
    agencyId,
    trackingNumber: data.trackingNumber,
    senderName: data.senderName,
    senderPhone: data.senderPhone,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    reportDate: data.reportDate,
    status: req.user.role === "agency_user" ? "pendiente" : data.status,
    description: data.description,
    observations: data.observations,
    createdBy: req.user.id,
  });

  const historyId = reports.addHistory({
    reportId: report.id,
    status: report.status,
    notes: "Reporte creado",
    changedBy: req.user.id,
  });

  res.status(201).json({ report, historyId });
});

router.get("/:id", (req, res) => {
  const id = parseId(req.params.id, "Reporte inválido");
  const agencyId = resolveAgencyScope(req, undefined);
  const report = reports.findScoped(id, agencyId);
  if (!report) throw notFound("Reporte no encontrado");

  const history = reports.listHistory(id).map((entry) => ({
    ...entry,
    photos: photos.findByHistoryId(entry.id),
  }));
  res.json({
    report,
    photos: photos.listByReport(id),
    history,
  });
});

router.patch("/:id", requireRole("agency_admin", "agency_user", "super_admin"), (req, res) => {
  const id = parseId(req.params.id, "Reporte inválido");
  const agencyId = resolveAgencyScope(req, undefined);
  const report = reports.findScoped(id, agencyId);
  if (!report) throw notFound("Reporte no encontrado");

  const data = validate(reportUpdateSchema, req.body);
  if (
    data.status !== undefined &&
    !["agency_admin", "super_admin"].includes(req.user.role)
  ) {
    throw forbidden("Solo los administradores pueden cambiar el estado");
  }
  const { statusNotes, notes, ...fields } = data;

  if (fields.trackingNumber && fields.trackingNumber !== report.trackingNumber) {
    const existing = reports.findByTrackingNumber(report.agencyId, fields.trackingNumber);
    if (existing && existing.id !== id) {
      throw conflict("Ya existe un reporte con esa guía en tu agencia");
    }
  }

  const statusChanged = fields.status && fields.status !== report.status;
  const updated = reports.update(id, fields);

  let historyId = null;
  if (statusChanged || statusNotes || notes) {
    historyId = reports.addHistory({
      reportId: id,
      status: fields.status || report.status,
      notes: statusNotes ?? notes ?? null,
      changedBy: req.user.id,
    });
    if (updated) {
      return res.json({ report: reports.findById(id), historyId });
    }
  }

  res.json({ report: updated, historyId });
});

router.get("/:id/history", (req, res) => {
  const id = parseId(req.params.id, "Reporte inválido");
  const agencyId = resolveAgencyScope(req, undefined);
  const report = reports.findScoped(id, agencyId);
  if (!report) throw notFound("Reporte no encontrado");
  const items = reports.listHistory(id).map((entry) => ({
    ...entry,
    photos: photos.findByHistoryId(entry.id),
  }));
  res.json({ items });
});

router.delete("/:id", requireRole("super_admin"), (req, res) => {
  const id = parseId(req.params.id, "Reporte inválido");
  const agencyId = resolveAgencyScope(req, undefined);
  const report = reports.findScoped(id, agencyId);
  if (!report) throw notFound("Reporte no encontrado");

  for (const photo of photos.listRawByReport(id)) {
    const absolute = path.resolve(config.uploadDir, photo.file_path);
    if (absolute.startsWith(path.resolve(config.uploadDir))) {
      try {
        fs.unlinkSync(absolute);
      } catch {
        /* archivo ya eliminado */
      }
    }
  }

  reports.remove(id);
  res.status(204).end();
});

module.exports = router;
