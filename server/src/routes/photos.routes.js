const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Router } = require("express");
const multer = require("multer");

const config = require("../config");
const reports = require("../repositories/reports");
const photos = require("../repositories/photos");
const { requireAuth, requireRole, resolveAgencyScope } = require("../auth/middleware");
const { parseId } = require("../lib/params");
const { badRequest, notFound } = require("../lib/errors");
const { detectImageType } = require("../lib/images");

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadBytes,
    files: config.maxPhotosPerReport,
  },
});

router.use(requireAuth);

router.post(
  "/:id/photos",
  requireRole("agency_admin", "agency_user", "super_admin"),
  upload.array("photos", config.maxPhotosPerReport),
  (req, res) => {
    const id = parseId(req.params.id, "Reporte inválido");
    const report = reports.findScoped(id, resolveAgencyScope(req, undefined));
    if (!report) throw notFound("Reporte no encontrado");

    let historyId = null;
    const requestedHistoryId = req.body?.historyId;
    if (requestedHistoryId !== undefined) {
      historyId = parseId(requestedHistoryId, "Historial inválido");
      if (!reports.findHistoryScoped(id, historyId)) {
        throw notFound("Entrada del historial no encontrada");
      }
    }

    const files = req.files ?? [];
    if (files.length === 0) throw badRequest("Debes adjuntar al menos una imagen");

    const existing = photos.countByReport(id);
    if (existing + files.length > config.maxPhotosPerReport) {
      throw badRequest(
        `Cada reporte permite un máximo de ${config.maxPhotosPerReport} fotos`
      );
    }

    const prepared = files.map((file) => {
      const type = detectImageType(file.buffer);
      if (!type) {
        throw badRequest("Formato no permitido. Usa imágenes JPEG, PNG o WebP");
      }
      return { file, type };
    });

    const directory = path.join(config.uploadDir, String(report.agencyId), String(id));
    fs.mkdirSync(directory, { recursive: true });

    const created = [];
    for (const { file, type } of prepared) {
      const filename = `${crypto.randomUUID()}.${type.ext}`;
      const relativePath = `${report.agencyId}/${id}/${filename}`;
      fs.writeFileSync(path.join(directory, filename), file.buffer);

      created.push(
        photos.create({
          reportId: id,
          historyId,
          filePath: relativePath,
          originalName: path.basename(file.originalname || `foto.${type.ext}`),
          mimeType: type.mime,
          size: file.size,
        })
      );
    }

    res.status(201).json({ photos: created });
  }
);

router.get("/:id/photos/:photoId/file", (req, res) => {
  const id = parseId(req.params.id, "Reporte inválido");
  const photoId = parseId(req.params.photoId, "Foto inválida");
  const agencyId = resolveAgencyScope(req, undefined);

  const report = reports.findScoped(id, agencyId);
  if (!report) throw notFound("Reporte no encontrado");

  const photo = photos.findRawById(photoId);
  if (!photo || photo.report_id !== id) throw notFound("Foto no encontrada");

  const absolute = path.resolve(config.uploadDir, photo.file_path);
  if (!absolute.startsWith(path.resolve(config.uploadDir))) {
    throw notFound("Foto no encontrada");
  }
  if (!fs.existsSync(absolute)) throw notFound("Foto no encontrada");

  const safeName = path
    .basename(photo.original_name || "foto")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120);

  res.setHeader("Content-Type", photo.mime_type);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
  res.sendFile(absolute);
});

router.delete(
  "/:id/photos/:photoId",
  requireRole("agency_admin", "agency_user", "super_admin"),
  (req, res) => {
    const id = parseId(req.params.id, "Reporte inválido");
    const photoId = parseId(req.params.photoId, "Foto inválida");

    const report = reports.findScoped(id, resolveAgencyScope(req, undefined));
    if (!report) throw notFound("Reporte no encontrado");

    const photo = photos.findRawById(photoId);
    if (!photo || photo.report_id !== id) throw notFound("Foto no encontrada");

    const absolute = path.resolve(config.uploadDir, photo.file_path);
    if (absolute.startsWith(path.resolve(config.uploadDir))) {
      try {
        fs.unlinkSync(absolute);
      } catch {
        /* archivo ya eliminado */
      }
    }

    photos.remove(photoId);
    res.status(204).end();
  }
);

module.exports = router;
