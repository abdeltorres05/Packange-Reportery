const bcrypt = require("bcryptjs");
const config = require("../config");

function hashPassword(password) {
  return bcrypt.hash(password, config.bcryptRounds);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };
