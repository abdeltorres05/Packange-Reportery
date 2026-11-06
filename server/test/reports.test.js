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

function reportBody(overrides = {}) {
  return {
    trackingNumber: "MARY-100",
    senderName: "Comercial Los Andes",
    senderPhone: "555-100-2000",
    recipientName: "Carlos Méndez",
    recipientPhone: "555-300-4000",
    reportDate: "2026-03-05",
    status: "pendiente",
    description: "Caja con repuestos automotrices",
    observations: "Entregar en horario de oficina",
    ...overrides,
  };
}

test("crea un reporte y registra el historial inicial", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(reportBody());

  assert.equal(res.status, 201);
  assert.equal(res.body.report.agencyId, data.agencyA.id);
  assert.equal(res.body.report.trackingNumber, "MARY-100");
  assert.equal(res.body.report.createdBy, data.adminA.id);

  const detail = await request(app)
    .get(`/api/reports/${res.body.report.id}`)
    .set(auth(data.tokens.adminA));
  assert.equal(detail.status, 200);
  assert.equal(detail.body.history.length, 1);
  assert.equal(detail.body.history[0].status, "pendiente");
});

test("crea un reporte mínimo con HBL y descripción", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send({ trackingNumber: "HBL-100", description: "Bulto dañado" });

  assert.equal(res.status, 201);
  assert.equal(res.body.report.trackingNumber, "HBL-100");
  assert.equal(res.body.report.description, "Bulto dañado");
  assert.equal(res.body.report.senderName, "No especificado");
  assert.equal(res.body.report.recipientName, "No especificado");
  assert.match(res.body.report.reportDate, /^\d{4}-\d{2}-\d{2}$/);
});

test("el superadministrador debe indicar una agencia al crear un reporte", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.superAdmin))
    .send({
      trackingNumber: "HBL-SUPER-1",
      description: "Bulto retenido",
      agencyId: data.agencyB.id,
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.report.agencyId, data.agencyB.id);
});

test("no permite guías duplicadas dentro de la misma agencia", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(reportBody({ trackingNumber: "MARY-1" }));

  assert.equal(res.status, 409);
});

test("permite la misma guía en agencias distintas", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminB))
    .send(reportBody({ trackingNumber: "MARY-1" }));

  assert.equal(res.status, 201);
});

test("valida los campos obligatorios", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send({ trackingNumber: "" });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.ok(Array.isArray(res.body.error.details));
});

test("filtra por estado, texto y rango de fechas", async () => {
  await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(
      reportBody({
        trackingNumber: "MARY-200",
        status: "entregado",
        reportDate: "2026-04-10",
        recipientName: "Lucía Pérez",
      })
    );

  const byStatus = await request(app)
    .get("/api/reports?status=entregado")
    .set(auth(data.tokens.adminA));
  assert.equal(byStatus.body.total, 1);
  assert.equal(byStatus.body.items[0].trackingNumber, "MARY-200");

  const byText = await request(app)
    .get("/api/reports?q=Lucía")
    .set(auth(data.tokens.adminA));
  assert.equal(byText.body.total, 1);

  const byRange = await request(app)
    .get("/api/reports?from=2026-04-01&to=2026-04-30")
    .set(auth(data.tokens.adminA));
  assert.equal(byRange.body.total, 1);
});

test("las estadísticas respetan el alcance de la agencia", async () => {
  await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(reportBody({ trackingNumber: "MARY-300", status: "entregado" }));

  const res = await request(app)
    .get("/api/reports/stats")
    .set(auth(data.tokens.adminA));

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.byStatus.pendiente, 1);
  assert.equal(res.body.byStatus.entregado, 1);

  const other = await request(app)
    .get("/api/reports/stats")
    .set(auth(data.tokens.adminB));
  assert.equal(other.body.total, 1);
});

test("cambiar el estado agrega una entrada al historial", async () => {
  const res = await request(app)
    .patch(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.superAdmin))
    .send({ status: "en_transito", statusNotes: "Salida a ruta" });

  assert.equal(res.status, 200);
  assert.equal(res.body.report.status, "en_transito");

  const history = await request(app)
    .get(`/api/reports/${data.reportA.id}/history`)
    .set(auth(data.tokens.adminA));
  assert.equal(history.status, 200);
  assert.equal(history.body.items.length, 2);
  assert.equal(history.body.items[1].status, "en_transito");
  assert.equal(history.body.items[1].notes, "Salida a ruta");
});

test("solo el superadministrador puede cambiar el estado", async () => {
  const res = await request(app)
    .patch(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.adminA))
    .send({ status: "en_transito" });

  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, "FORBIDDEN");
});

test("rechaza una descripción vacía al editar", async () => {
  const res = await request(app)
    .patch(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.adminA))
    .send({ description: "   " });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("no permite duplicar la guía al editar", async () => {
  await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.adminA))
    .send(reportBody({ trackingNumber: "MARY-400" }));

  const res = await request(app)
    .patch(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.adminA))
    .send({ trackingNumber: "MARY-400" });

  assert.equal(res.status, 409);
});

test("permite editar el HBL y la descripción del reporte", async () => {
  const res = await request(app)
    .patch(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.adminA))
    .send({
      trackingNumber: "MARY-HBL-UPDATED",
      description: "Descripción actualizada",
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.report.trackingNumber, "MARY-HBL-UPDATED");
  assert.equal(res.body.report.description, "Descripción actualizada");
});

test("pagina los resultados", async () => {
  const res = await request(app)
    .get("/api/reports?limit=1&page=1")
    .set(auth(data.tokens.superAdmin));

  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.limit, 1);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.pages, 2);
});

test("un id inválido devuelve 400", async () => {
  const res = await request(app)
    .get("/api/reports/abc")
    .set(auth(data.tokens.adminA));
  assert.equal(res.status, 400);
});

test("solo un administrador de agencia puede eliminar un reporte", async () => {
  const forbidden = await request(app)
    .delete(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.agentA));
  assert.equal(forbidden.status, 403);

  const deleted = await request(app)
    .delete(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.adminA));
  assert.equal(deleted.status, 204);

  const detail = await request(app)
    .get(`/api/reports/${data.reportA.id}`)
    .set(auth(data.tokens.adminA));
  assert.equal(detail.status, 404);
});

test("un empleado de agencia puede crear reportes en su agencia", async () => {
  const res = await request(app)
    .post("/api/reports")
    .set(auth(data.tokens.agentA))
    .send(reportBody({ trackingNumber: "MARY-500" }));

  assert.equal(res.status, 201);
  assert.equal(res.body.report.agencyId, data.agencyA.id);
});
