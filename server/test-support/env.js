const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET = "test-secret";
process.env.BCRYPT_ROUNDS = "4";

if (!process.env.UPLOAD_DIR) {
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "reportes-test-"));
}

module.exports = { uploadDir: process.env.UPLOAD_DIR };
