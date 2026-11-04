const { badRequest } = require("./errors");

function parseId(value, message = "Identificador inválido") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(message);
  return id;
}

module.exports = { parseId };
