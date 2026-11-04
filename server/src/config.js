const path = require("node:path");
const fs = require("node:fs");

const rootDir = path.resolve(__dirname, "../..");
const serverDir = path.resolve(__dirname, "..");

require("dotenv").config({ path: path.join(rootDir, ".env") });

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const jwtSecret =
  process.env.JWT_SECRET ||
  (isProduction ? null : "dev-secret-cambiar-antes-de-produccion");

if (!jwtSecret) {
  throw new Error("JWT_SECRET es obligatorio cuando NODE_ENV=production");
}

function resolveFromRoot(value) {
  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

const dbPath = process.env.DB_PATH
  ? process.env.DB_PATH === ":memory:"
    ? ":memory:"
    : resolveFromRoot(process.env.DB_PATH)
  : path.join(serverDir, "data", "app.db");

if (dbPath !== ":memory:") {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const uploadDir = process.env.UPLOAD_DIR
  ? resolveFromRoot(process.env.UPLOAD_DIR)
  : path.join(serverDir, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

module.exports = {
  rootDir,
  serverDir,
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 3000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  dbPath,
  uploadDir,
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  maxPhotosPerReport: 5,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  clientDist: path.join(rootDir, "client", "dist"),
  superAdmin: {
    name: process.env.SUPER_ADMIN_NAME || "Administrador General",
    email: process.env.SUPER_ADMIN_EMAIL || "admin@plataforma.test",
    password: process.env.SUPER_ADMIN_PASSWORD || "Admin123!",
  },
};
