const { verifyToken } = require("./tokens");
const users = require("../repositories/users");
const { badRequest, unauthorized, forbidden } = require("../lib/errors");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(unauthorized("Debes iniciar sesión"));
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(unauthorized("Sesión inválida o expirada"));
  }

  const user = users.findById(payload.sub);
  if (!user || !user.active) {
    return next(unauthorized("Usuario inactivo o inexistente"));
  }

  req.user = user;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden());
    }
    return next();
  };
}

function resolveAgencyScope(req, requestedAgencyId) {
  if (req.user.role !== "super_admin") {
    return req.user.agencyId;
  }

  if (
    requestedAgencyId === undefined ||
    requestedAgencyId === null ||
    requestedAgencyId === ""
  ) {
    return null;
  }

  const id = Number(requestedAgencyId);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("agencyId inválido");
  }
  return id;
}

module.exports = { requireAuth, requireRole, resolveAgencyScope };
