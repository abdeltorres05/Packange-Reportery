require("../test-support/env");

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const users = require("../src/repositories/users");
const { prepare, auth } = require("../test-support/helpers");

let data;

test.beforeEach(async () => {
  data = await prepare();
});

test("POST /api/auth/login devuelve token y datos del usuario", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: data.adminA.email, password: data.password });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, data.adminA.email);
  assert.equal(res.body.user.agencyId, data.agencyA.id);
  assert.equal(res.body.user.passwordHash, undefined);
});

test("POST /api/auth/login rechaza contraseña incorrecta", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: data.adminA.email, password: "incorrecta" });

  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("GET /api/auth/me requiere token", async () => {
  const res = await request(app).get("/api/auth/me");
  assert.equal(res.status, 401);
});

test("GET /api/auth/me devuelve el usuario autenticado", async () => {
  const res = await request(app)
    .get("/api/auth/me")
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, data.adminA.email);
});

test("un usuario inactivo no puede iniciar sesión ni usar su token", async () => {
  users.update(data.adminA.id, { active: false });

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: data.adminA.email, password: data.password });
  assert.equal(login.status, 401);

  const me = await request(app)
    .get("/api/auth/me")
    .set(auth(data.tokens.adminA));
  assert.equal(me.status, 401);
});
