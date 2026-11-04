const { AppError } = require("./errors");

function apiNotFound(req, res) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Ruta no encontrada" },
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err && err.name === "MulterError") {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "La imagen supera el tamaño máximo permitido"
        : "No se pudo procesar la carga de imágenes";
    return res.status(status).json({
      error: { code: err.code, message },
    });
  }

  if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "JSON inválido en la solicitud" },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" },
  });
}

module.exports = { apiNotFound, errorHandler };
