const { Router } = require("express");

const users = require("../repositories/users");
const agencies = require("../repositories/agencies");
const { userCreateSchema, userUpdateSchema } = require("../validation/schemas");
const { validate } = require("../lib/validate");
const { hashPassword } = require("../auth/passwords");
const { requireAuth, requireRole } = require("../auth/middleware");
const { parseId } = require("../lib/params");
const { conflict, forbidden, notFound } = require("../lib/errors");
const { isUniqueViolation } = require("../lib/dbErrors");

const router = Router();

router.use(requireAuth, requireRole("super_admin", "agency_admin"));

router.get("/", (req, res) => {
  let agencyId = req.user.agencyId;
  if (req.user.role === "super_admin") {
    agencyId = req.query.agencyId ? parseId(req.query.agencyId, "Agencia inválida") : null;
  }
  res.json({ items: users.list({ agencyId }) });
});

router.post("/", async (req, res) => {
  const data = validate(userCreateSchema, req.body);

  let agencyId = data.agencyId ?? null;

  if (req.user.role === "super_admin") {
    if (["super_admin", "agency_admin"].includes(data.role)) {
      agencyId = null;
    } else {
      if (!agencyId) throw notFound("Debes indicar la agencia del usuario");
      if (!agencies.findById(agencyId)) throw notFound("Agencia no encontrada");
    }
  } else {
    if (data.role === "super_admin") throw forbidden("No puedes crear super administradores");
    if (data.role === "agency_admin") {
      agencyId = null;
    } else {
      agencyId = data.agencyId ?? req.user.agencyId;
      if (!agencyId || !agencies.findById(agencyId)) {
        throw notFound("Agencia no encontrada");
      }
    }
  }

  if (users.findAuthByEmail(data.email)) {
    throw conflict("El correo ya está registrado");
  }

  const passwordHash = await hashPassword(data.password);

  try {
    const user = users.create({
      agencyId,
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });
    res.status(201).json({ user });
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict("El correo ya está registrado");
    throw error;
  }
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id, "Usuario inválido");
  const target = users.findById(id);
  if (!target) throw notFound("Usuario no encontrado");

  if (req.user.role !== "super_admin") {
    if (target.role === "super_admin" || target.agencyId !== req.user.agencyId) {
      throw notFound("Usuario no encontrado");
    }
  }

  const data = validate(userUpdateSchema, req.body);
  const fields = {};

  if (data.name !== undefined) fields.name = data.name;
  if (data.active !== undefined) fields.active = data.active;
  if (data.email !== undefined) {
    const existing = users.findAuthByEmail(data.email);
    if (existing && existing.id !== id) throw conflict("El correo ya está registrado");
    fields.email = data.email;
  }
  if (data.password !== undefined) {
    fields.passwordHash = await hashPassword(data.password);
  }

  if (data.role !== undefined) {
    if (req.user.role !== "super_admin" && data.role === "super_admin") {
      throw forbidden("No puedes asignar el rol de super administrador");
    }
    fields.role = data.role;
  }

  const effectiveRole = fields.role ?? target.role;

  if (req.user.role === "super_admin") {
    if (data.agencyId !== undefined) {
      fields.agencyId = data.agencyId;
    }
    if (["super_admin", "agency_admin"].includes(effectiveRole)) {
      fields.agencyId = null;
    } else {
      const finalAgencyId = fields.agencyId ?? target.agencyId;
      if (!finalAgencyId) throw notFound("Debes indicar la agencia del usuario");
      if (!agencies.findById(finalAgencyId)) throw notFound("Agencia no encontrada");
    }
  }

  try {
    res.json({ user: users.update(id, fields) });
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict("El correo ya está registrado");
    throw error;
  }
});

module.exports = router;
