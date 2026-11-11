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
  if (config.isProduction && config.seedDemoData) {
    throw new Error("SEED_DEMO_DATA no puede activarse en producción");
  }

  runMigrations();

  const superAdminEmail = config.superAdmin.email?.trim().toLowerCase();
  const existingAdmins = users.list().filter((user) => user.role === "super_admin");
  const configuredAdmin = superAdminEmail
    ? users.findAuthByEmail(superAdminEmail)
    : null;

  if (configuredAdmin && configuredAdmin.role !== "super_admin") {
    throw new Error("SUPER_ADMIN_EMAIL ya pertenece a un usuario que no es superadministrador");
  }

  if (!configuredAdmin && existingAdmins.length === 0) {
    if (!superAdminEmail) {
      throw new Error("Configura SUPER_ADMIN_EMAIL antes de crear el superadministrador");
    }
    if (!config.superAdmin.password || config.superAdmin.password.length < 12) {
      throw new Error("SUPER_ADMIN_PASSWORD debe tener al menos 12 caracteres");
    }

    const passwordHash = await hashPassword(config.superAdmin.password);
    const created = users.create({
      agencyId: null,
      name: config.superAdmin.name,
      email: superAdminEmail,
      passwordHash,
      role: "super_admin",
    });
    console.log(`Super administrador creado: ${created.email}`);
  } else if (configuredAdmin) {
    console.log(`Super administrador ya existe: ${configuredAdmin.email}`);
  } else {
    console.log("Ya existe un superadministrador; no se crea otra cuenta.");
  }

  if (!config.seedDemoData) {
    console.log("Datos de demostración desactivados.");
    return;
  }

  const agencyCount = getDb().prepare("SELECT COUNT(*) AS total FROM agencies").get().total;
  if (agencyCount > 0) {
    console.log("Ya existen agencias; no se crean datos de demostración.");
    return;
  }

  if (!config.demoAgencyPassword || config.demoAgencyPassword.length < 12) {
    throw new Error("DEMO_AGENCY_PASSWORD debe tener al menos 12 caracteres cuando SEED_DEMO_DATA=true");
  }

  const demoPasswordHash = await hashPassword(config.demoAgencyPassword);

  const demoAgencies = [
    { name: "Mary Autopart", code: "MARY", email: "mary@maryautopart.test" },
    { name: "Rapid Multiservice", code: "RAPID", email: "rapid@rapidmultiservice.test" },
  ];

  for (const demo of demoAgencies) {
    const agency = agencies.create({ name: demo.name, code: demo.code });
    const admin = users.create({
      agencyId: agency.id,
      name: `Responsable ${demo.name}`,
      email: demo.email,
      passwordHash: demoPasswordHash,
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
        status: demo.code === "RAPID" ? "cerrado" : "procesado",
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

  console.log("Datos de demostración listos.");
}

seed().catch((error) => {
  console.error("Error al sembrar datos:", error);
  process.exitCode = 1;
});
