const dotenv = require("dotenv");

dotenv.config();

function readEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value;
}

function readBoolEnv(name, fallback) {
  const raw = readEnv(name, undefined);
  if (raw === undefined) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(String(raw).toLowerCase());
}

const env = {
  nodeEnv: readEnv("NODE_ENV", "development"),
  port: Number(readEnv("PORT", "3000")),
  corsOrigin: readEnv("CORS_ORIGIN", undefined),
  vendusApiKey: readEnv("VENDUS_API_KEY", ""),
  vendusRegisterId: readEnv("VENDUS_REGISTER_ID", ""),
  swaggerEnabled: readBoolEnv("SWAGGER_ENABLED", true),
  swaggerServerUrl: readEnv("SWAGGER_SERVER_URL", undefined),
};

module.exports = { env };
