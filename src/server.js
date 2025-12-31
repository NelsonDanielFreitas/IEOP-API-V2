const http = require("http");

const { buildApp } = require("./app");
const { env } = require("./config/env");

const app = buildApp();
const server = http.createServer(app);

server.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on port ${env.port} (${env.nodeEnv})`);
});
