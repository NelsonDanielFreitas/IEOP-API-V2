const { env } = require("./env");
const { buildOpenApiSpec } = require("../docs/openapi");

function getOpenApiSpec() {
  const serverUrl = env.swaggerServerUrl || `http://localhost:${env.port}`;

  return buildOpenApiSpec({ serverUrl });
}

module.exports = { getOpenApiSpec };
