const app = require("./app");
const config = require("./config");
const { runMigrations } = require("./migrate");

runMigrations();

app.listen(config.port, () => {
  console.log(`API de reportería en http://localhost:${config.port}`);
  if (config.nodeEnv === "development") {
    console.log(`Frontend de desarrollo: ${config.clientOrigin}`);
  }
});
