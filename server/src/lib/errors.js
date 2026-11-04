class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (message = "Solicitud inválida", details) =>
  new AppError(400, "VALIDATION_ERROR", message, details);

const unauthorized = (message = "No autenticado") =>
  new AppError(401, "UNAUTHORIZED", message);

const forbidden = (message = "No tienes permiso para esta acción") =>
  new AppError(403, "FORBIDDEN", message);

const notFound = (message = "Recurso no encontrado") =>
  new AppError(404, "NOT_FOUND", message);

const conflict = (message = "El recurso ya existe") =>
  new AppError(409, "CONFLICT", message);

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
