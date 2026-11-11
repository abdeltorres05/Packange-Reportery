const { Router } = require("express");

const agencies = require("../repositories/agencies");
const { agencyCreateSchema, agencyUpdateSchema } = require("../validation/schemas");
const { validate } = require("../lib/validate");
const { requireAuth, requireRole } = require("../auth/middleware");
const { parseId } = require("../lib/params");
const { conflict, notFound } = require("../lib/errors");
const { isUniqueViolation } = require("../lib/dbErrors");

const router = Router();

router.use(requireAuth, requireRole("super_admin", "agency_admin"));

router.get("/", (req, res) => {
  const includeInactive = req.query.all === "1";
  res.json({ items: agencies.list({ includeInactive }) });
});

router.post("/", (req, res) => {
  const data = validate(agencyCreateSchema, req.body);
  try {
    const agency = agencies.create(data);
    res.status(201).json({ agency });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("Ya existe una agencia con ese nombre o código");
    }
    throw error;
  }
});

router.patch("/:id", (req, res) => {
  const id = parseId(req.params.id, "Agencia inválida");
  const agency = agencies.findById(id);
  if (!agency) throw notFound("Agencia no encontrada");

  const data = validate(agencyUpdateSchema, req.body);
  try {
    res.json({ agency: agencies.update(id, data) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("Ya existe una agencia con ese nombre o código");
    }
    throw error;
  }
});

module.exports = router;
