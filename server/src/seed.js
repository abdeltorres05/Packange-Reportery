const config = require("./config");
const { getDb } = require("./db");
const { runMigrations } = require("./migrate");
const { hashPassword } = require("./auth/passwords");
const users = require("./repositories/users");
const agencies = require("./repositories/agencies");
const reports = require("./repositories/reports");

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function seed() {
  runMigrations();

  let superAdmin = users.findAuthByEmail(config.superAdmin.email);
  if (!superAdmin) {
    const passwordHash = await hashPassword(config.superAdmin.password);
    const created = users.create({
      agencyId: null,
      name: config.superAdmin.name,
      email: config.superAdmin.email,
      passwordHash,
      role: "super_admin",
    });
    superAdmin = created;
    console.log(`Super administrador creado: ${created.email}`);
  } else {
    console.log(`Super administrador ya existe: ${superAdmin.email}`);
  }

  const agencyCount = getDb().prepare("SELECT COUNT(*) AS total FROM agencies").get().total;
  if (agencyCount > 0) {
    console.log("Ya existen agencias; no se crean datos de demostración.");
    return;
  }

  const demoAgencies = [
    { name: "Mary Autopart", code: "MARY", email: "mary@maryautopart.test" },
    { name: "Rapid Multiservice", code: "RAPID", email: "rapid@rapidmultiservice.test" },
  ];

  for (const demo of demoAgencies) {
    const agency = agencies.create({ name: demo.name, code: demo.code });
    const passwordHash = await hashPassword("Agencia123!");
    const admin = users.create({
      agencyId: agency.id,
      name: `Responsable ${demo.name}`,
      email: demo.email,
      passwordHash,
      role: "agency_admin",
    });

    const demoReports = [
      {
        trackingNumber: `${demo.code}-0001`,
        senderName: "Remitente demo",
        recipientName: "Destinatario demo",
        reportDate: dateOffset(1),
        status: "pendiente",
        description: "Bulto de demostración",
      },
      {
        trackingNumber: `${demo.code}-0002`,
        senderName: "Remitente demo",
        recipientName: "Destinatario demo",
        reportDate: dateOffset(2),
        status: demo.code === "RAPID" ? "entregado" : "en_transito",
        description: "Bulto de demostración",
      },
    ];

    for (const item of demoReports) {
      const report = reports.create({
        agencyId: agency.id,
        trackingNumber: item.trackingNumber,
        senderName: item.senderName,
        senderPhone: null,
        recipientName: item.recipientName,
        recipientPhone: null,
        reportDate: item.reportDate,
        status: item.status,
        description: item.description,
        observations: null,
        createdBy: admin.id,
      });

      reports.addHistory({
        reportId: report.id,
        status: "pendiente",
        notes: "Reporte creado",
        changedBy: admin.id,
      });

      if (report.status !== "pendiente") {
        reports.addHistory({
          reportId: report.id,
          status: report.status,
          notes: "Seguimiento registrado",
          changedBy: admin.id,
        });
      }
    }

    console.log(`Agencia de demostración creada: ${demo.name} (${demo.email})`);
  }

  console.log("Datos de demostración listos. Contraseña de agencias: Agencia123!");
}

seed().catch((error) => {
  console.error("Error al sembrar datos:", error);
  process.exitCode = 1;
});
