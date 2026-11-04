const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");

const config = require("./config");
const { apiNotFound, errorHandler } = require("./lib/errorHandler");
const authRoutes = require("./routes/auth.routes");
const agenciesRoutes = require("./routes/agencies.routes");
const usersRoutes = require("./routes/users.routes");
const reportsRoutes = require("./routes/reports.routes");
const photosRoutes = require("./routes/photos.routes");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "1mb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.nodeEnv === "test" ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    },
  },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/agencies", agenciesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/reports", photosRoutes);

app.use("/api", apiNotFound);

if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || !req.accepts("html")) return next();
    return res.sendFile(path.join(config.clientDist, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Ruta no encontrada" },
  });
});

app.use(errorHandler);

module.exports = app;
