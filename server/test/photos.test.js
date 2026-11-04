require("../test-support/env");

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { prepare, auth, PNG_1X1 } = require("../test-support/helpers");

let data;

test.beforeEach(async () => {
  data = await prepare();
});

function upload(reportId, token, buffer = PNG_1X1, filename = "evidencia.png") {
  return request(app)
    .post(`/api/reports/${reportId}/photos`)
    .set(auth(token))
    .attach("photos", buffer, { filename, contentType: "image/png" });
}

test("sube una foto y permite descargarla autenticado", async () => {
  const res = await upload(data.reportA.id, data.tokens.adminA);

  assert.equal(res.status, 201);
  assert.equal(res.body.photos.length, 1);
  const photo = res.body.photos[0];
  assert.equal(photo.mimeType, "image/png");
  assert.equal(photo.reportId, data.reportA.id);

  const file = await request(app)
    .get(`/api/reports/${data.reportA.id}/photos/${photo.id}/file`)
    .set(auth(data.tokens.adminA));
  assert.equal(file.status, 200);
  assert.match(file.headers["content-type"], /image\/png/);
});

test("el superadministrador puede adjuntar fotos a un reporte", async () => {
  const res = await upload(data.reportA.id, data.tokens.superAdmin);

  assert.equal(res.status, 201);
  assert.equal(res.body.photos.length, 1);
  assert.equal(res.body.photos[0].reportId, data.reportA.id);
});

test("otra agencia no puede descargar la foto", async () => {
  const res = await upload(data.reportA.id, data.tokens.adminA);
  const photo = res.body.photos[0];

  const file = await request(app)
    .get(`/api/reports/${data.reportA.id}/photos/${photo.id}/file`)
    .set(auth(data.tokens.adminB));
  assert.equal(file.status, 404);
});

test("otra agencia no puede subir fotos a un reporte ajeno", async () => {
  const res = await upload(data.reportA.id, data.tokens.adminB);
  assert.equal(res.status, 404);
});

test("rechaza archivos que no son imágenes permitidas", async () => {
  const res = await request(app)
    .post(`/api/reports/${data.reportA.id}/photos`)
    .set(auth(data.tokens.adminA))
    .attach("photos", Buffer.from("esto no es una imagen"), {
      filename: "nota.txt",
      contentType: "text/plain",
    });

  assert.equal(res.status, 400);
});

test("rechaza una subida sin archivos", async () => {
  const res = await request(app)
    .post(`/api/reports/${data.reportA.id}/photos`)
    .set(auth(data.tokens.adminA));
  assert.equal(res.status, 400);
});

test("elimina una foto", async () => {
  const res = await upload(data.reportA.id, data.tokens.adminA);
  const photo = res.body.photos[0];

  const deleted = await request(app)
    .delete(`/api/reports/${data.reportA.id}/photos/${photo.id}`)
    .set(auth(data.tokens.adminA));
  assert.equal(deleted.status, 204);

  const file = await request(app)
    .get(`/api/reports/${data.reportA.id}/photos/${photo.id}/file`)
    .set(auth(data.tokens.adminA));
  assert.equal(file.status, 404);
});

test("limita la cantidad de fotos por reporte", async () => {
  let req = request(app)
    .post(`/api/reports/${data.reportA.id}/photos`)
    .set(auth(data.tokens.adminA));

  for (let index = 0; index < 5; index += 1) {
    req = req.attach("photos", PNG_1X1, {
      filename: `foto-${index}.png`,
      contentType: "image/png",
    });
  }

  const first = await req;
  assert.equal(first.status, 201);
  assert.equal(first.body.photos.length, 5);

  const extra = await upload(
    data.reportA.id,
    data.tokens.adminA,
    PNG_1X1,
    "extra.png"
  );
  assert.equal(extra.status, 400);
});
