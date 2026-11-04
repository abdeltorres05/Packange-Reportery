const { getDb } = require("../src/db");
const { runMigrations } = require("../src/migrate");
const { hashPassword } = require("../src/auth/passwords");
const { signToken } = require("../src/auth/tokens");
const agencies = require("../src/repositories/agencies");
const users = require("../src/repositories/users");
const reports = require("../src/repositories/reports");

const PASSWORD = "Password123!";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

let migrated = false;

function clearDatabase() {
  const db = getDb();
  db.exec(`
    DELETE FROM report_history;
    DELETE FROM report_photos;
    DELETE FROM reports;
    DELETE FROM users;
    DELETE FROM agencies;
  `);
}

async function prepare() {
  const db = getDb();
  if (!migrated) {
    runMigrations(db);
    migrated = true;
  }
  clearDatabase();

  const passwordHash = await hashPassword(PASSWORD);

  const agencyA = agencies.create({ name: "Mary Autopart", code: "MARY" });
  const agencyB = agencies.create({ name: "Rapid Multiservice", code: "RAPID" });

  const adminA = users.create({
    agencyId: agencyA.id,
    name: "Admin Mary",
    email: "admin@mary.test",
    passwordHash,
    role: "agency_admin",
  });
  const adminB = users.create({
    agencyId: agencyB.id,
    name: "Admin Rapid",
    email: "admin@rapid.test",
    passwordHash,
    role: "agency_admin",
  });
  const agentA = users.create({
    agencyId: agencyA.id,
    name: "Empleado Mary",
    email: "empleado@mary.test",
    passwordHash,
    role: "agency_user",
  });
  const superAdmin = users.create({
    agencyId: null,
    name: "Super Admin",
    email: "super@plataforma.test",
    passwordHash,
    role: "super_admin",
  });

  const reportA = reports.create({
    agencyId: agencyA.id,
    trackingNumber: "MARY-1",
    senderName: "Remitente Mary",
    senderPhone: "555-0001",
    recipientName: "Destinatario Mary",
    recipientPhone: "555-0002",
    reportDate: "2026-01-10",
    status: "pendiente",
    description: "Reporte de prueba de Mary Autopart",
    observations: null,
    createdBy: adminA.id,
  });

  const reportB = reports.create({
    agencyId: agencyB.id,
    trackingNumber: "RAPID-1",
    senderName: "Remitente Rapid",
    senderPhone: "555-0003",
    recipientName: "Destinatario Rapid",
    recipientPhone: "555-0004",
    reportDate: "2026-01-11",
    status: "pendiente",
    description: "Reporte de prueba de Rapid Multiservice",
    observations: null,
    createdBy: adminB.id,
  });

  for (const [report, user] of [
    [reportA, adminA],
    [reportB, adminB],
  ]) {
    reports.addHistory({
      reportId: report.id,
      status: report.status,
      notes: "Reporte creado",
      changedBy: user.id,
    });
  }

  return {
    password: PASSWORD,
    agencyA,
    agencyB,
    adminA,
    adminB,
    agentA,
    superAdmin,
    reportA,
    reportB,
    tokens: {
      adminA: signToken(adminA),
      adminB: signToken(adminB),
      agentA: signToken(agentA),
      superAdmin: signToken(superAdmin),
    },
  };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { prepare, auth, PNG_1X1, PASSWORD };
