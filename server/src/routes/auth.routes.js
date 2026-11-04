const { Router } = require("express");

const { loginSchema } = require("../validation/schemas");
const { validate } = require("../lib/validate");
const { unauthorized } = require("../lib/errors");
const { verifyPassword } = require("../auth/passwords");
const { signToken } = require("../auth/tokens");
const { requireAuth } = require("../auth/middleware");
const users = require("../repositories/users");

const router = Router();

router.post("/login", async (req, res) => {
  const data = validate(loginSchema, req.body);
  const user = users.findAuthByEmail(data.email);

  const passwordOk = user && (await verifyPassword(data.password, user.passwordHash));
  if (!user || !user.active || !passwordOk) {
    throw unauthorized("Correo o contraseña incorrectos");
  }

  const token = signToken(user);
  res.json({ token, user: users.findById(user.id) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
