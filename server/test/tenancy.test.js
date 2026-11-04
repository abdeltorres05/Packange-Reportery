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

test("una agencia solo lista sus propios reportes", async () => {
  const res = await request(app)
    .get("/api/reports")
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.items[0].trackingNumber, "MARY-1");
  assert.ok(res.body.items.every((item) => item.agencyId === data.agencyA.id));
});

test("una agencia no puede leer un reporte de otra agencia", async () => {
  const res = await request(app)
    .get(`/api/reports/${data.reportB.id}`)
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 404);
});

test("una agencia no puede editar un reporte de otra agencia", async () => {
  const res = await request(app)
    .patch(`/api/reports/${data.reportB.id}`)
    .set(auth(data.tokens.adminA))
    .send({ description: "Intento de modificación" });

  assert.equal(res.status, 404);
});

test("una agencia no puede eliminar un reporte de otra agencia", async () => {
  const res = await request(app)
    .delete(`/api/reports/${data.reportB.id}`)
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 404);
});

test("al crear un reporte se ignora el agencyId enviado en el body", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(newReportBody({ agencyId: data.agencyB.id, trackingNumber: "MARY-2" }));

  assert.equal(res.status, 201);
  assert.equal(res.body.report.agencyId, data.agencyA.id);

  const listB = await request(app)
    .get("/api/reports")
    .set(auth(data.tokens.adminB));
  assert.equal(listB.body.total, 1);
  assert.equal(listB.body.items[0].trackingNumber, "RAPID-1");
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

test("un administrador de agencia no puede crear usuarios en otra agencia", async () => {
  const res = await request(app)
    .post("/api/users")
    .set(auth(data.tokens.adminA))
    .send({
      name: "Intruso",
      email: "intruso@rapid.test",
      password: "Password123!",
      role: "agency_user",
      agencyId: data.agencyB.id,
    });

  assert.equal(res.status, 404);
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
