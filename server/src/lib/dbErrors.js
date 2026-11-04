function isUniqueViolation(error) {
  return Boolean(
    error &&
      (error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
        error.code === "SQLITE_CONSTRAINT_PRIMARYKEY")
  );
}

module.exports = { isUniqueViolation };
