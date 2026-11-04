const { AppError } = require("./errors");

function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new AppError(400, "VALIDATION_ERROR", "Datos inválidos", details);
  }
  return result.data;
}

module.exports = { validate };
