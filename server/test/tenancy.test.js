require("../test-support/env");

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { prepare, auth } = require("../test-support/helpers");

let data;

test.beforeEach(async () => {
  data = await prepare();
});

function newReportBody(overrides = {}) {
  return {
    trackingNumber: "NUEVA-1",
    senderName: "Remitente",
    recipientName: "Destinatario",
    reportDate: "2026-02-01",
    status: "pendiente",
    description: "Descripción del bulto",
    ...overrides,
  };
}

test("el administrador del sistema lista los reportes de todas las agencias", async () => {
  const res = await request(app)
    .get("/api/reports")
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 2);
  assert.deepEqual(
    new Set(res.body.items.map((item) => item.agencyId)),
    new Set([data.agencyA.id, data.agencyB.id])
  );
});

test("un representante no puede leer un reporte de otra agencia", async () => {
  const res = await request(app)
    .get(`/api/reports/${data.reportB.id}`)
    .set(auth(data.tokens.agentA));

  assert.equal(res.status, 404);
});

test("el administrador del sistema puede editar un reporte de otra agencia", async () => {
  const res = await request(app)
    .patch(`/api/reports/${data.reportB.id}`)
    .set(auth(data.tokens.adminA))
    .send({ description: "Intento de modificación" });

  assert.equal(res.status, 200);
  assert.equal(res.body.report.description, "Intento de modificación");
});

test("el administrador del sistema no puede eliminar reportes", async () => {
  const res = await request(app)
    .delete(`/api/reports/${data.reportB.id}`)
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 403);
});

test("el representante crea reportes solo en su agencia aunque envíe otro agencyId", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.agentA))
    .send(newReportBody({ agencyId: data.agencyB.id, trackingNumber: "MARY-2" }));

  assert.equal(res.status, 201);
  assert.equal(res.body.report.agencyId, data.agencyA.id);
  assert.equal(res.body.report.status, "pendiente");

  const listB = await request(app)
    .get("/api/reports")
    .set(auth(data.tokens.agentA));
  assert.equal(listB.body.total, 2);
  assert.ok(listB.body.items.every((item) => item.agencyId === data.agencyA.id));
  assert.ok(listB.body.items.some((item) => item.trackingNumber === "MARY-2"));
});

test("el administrador del sistema puede crear reportes para cualquier agencia", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(newReportBody({ agencyId: data.agencyB.id, trackingNumber: "RAPID-2" }));

  assert.equal(res.status, 201);
  assert.equal(res.body.report.agencyId, data.agencyB.id);
});

test("el super administrador ve los reportes de todas las agencias", async () => {
  const all = await request(app)
    .get("/api/reports")
    .set(auth(data.tokens.superAdmin));
  assert.equal(all.status, 200);
  assert.equal(all.body.total, 2);

  const filtered = await request(app)
    .get(`/api/reports?agencyId=${data.agencyB.id}`)
    .set(auth(data.tokens.superAdmin));
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.total, 1);
  assert.equal(filtered.body.items[0].agencyName, "Rapid Multiservice");
});

test("un empleado de agencia no puede acceder a agencias ni a usuarios", async () => {
  const agenciesRes = await request(app)
    .get("/api/agencies")
    .set(auth(data.tokens.agentA));
  assert.equal(agenciesRes.status, 403);

  const usersRes = await request(app)
    .get("/api/users")
    .set(auth(data.tokens.agentA));
  assert.equal(usersRes.status, 403);
});

test("el administrador del sistema puede crear usuarios en otras agencias", async () => {
  const res = await request(app)
    .post("/api/users")
    .set(auth(data.tokens.adminA))
    .send({
      name: "Representante Rapid",
      email: "representante@rapid.test",
      password: "Password123!",
      role: "agency_user",
      agencyId: data.agencyB.id,
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.agencyId, data.agencyB.id);
});

test("el administrador del sistema puede crear otro administrador sin agencia", async () => {
  const res = await request(app)
    .post("/api/users")
    .set(auth(data.tokens.adminA))
    .send({
      name: "Administrador Global",
      email: "admin-global@test.example",
      password: "Password123!",
      role: "agency_admin",
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, "agency_admin");
  assert.equal(res.body.user.agencyId, null);
});

test("un administrador de agencia no puede crear super administradores", async () => {
  const res = await request(app)
    .post("/api/users")
    .set(auth(data.tokens.adminA))
    .send({
      name: "Superadmin no autorizado",
      email: "superadmin-no-autorizado@example.test",
      password: "Password123!",
      role: "super_admin",
    });

  assert.equal(res.status, 403);
});

test("el super administrador puede listar agencias y usuarios de todas las agencias", async () => {
  const agenciesRes = await request(app)
    .get("/api/agencies")
    .set(auth(data.tokens.superAdmin));
  assert.equal(agenciesRes.status, 200);
  assert.equal(agenciesRes.body.items.length, 2);

  const usersRes = await request(app)
    .get("/api/users")
    .set(auth(data.tokens.superAdmin));
  assert.equal(usersRes.status, 200);
  assert.equal(usersRes.body.items.length, 4);
});

test("el administrador del sistema puede ejecutar acciones del módulo de agencias", async () => {
  const create = await request(app)
    .post("/api/agencies")
    .set(auth(data.tokens.adminA))
    .send({ name: "Nueva Agencia", code: "NUEVA" });
  assert.equal(create.status, 201);

  const update = await request(app)
    .patch(`/api/agencies/${create.body.agency.id}`)
    .set(auth(data.tokens.adminA))
    .send({ name: "Agencia Actualizada", active: false });
  assert.equal(update.status, 200);
  assert.equal(update.body.agency.name, "Agencia Actualizada");
  assert.equal(update.body.agency.active, false);

  const list = await request(app)
    .get("/api/agencies?all=1")
    .set(auth(data.tokens.adminA));
  assert.equal(list.status, 200);
  assert.ok(list.body.items.some((agency) => agency.id === create.body.agency.id));
});
