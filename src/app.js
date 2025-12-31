const express = require("express");
const swaggerUi = require("swagger-ui-express");

const healthRoutes = require("./routes/health.routes");
const productsRoutes = require("./routes/products.routes");
const clientsRoutes = require("./routes/client.routes");
const { env } = require("./config/env");
const { getOpenApiSpec } = require("./config/swagger");
const { notFoundHandler } = require("./middleware/notFoundHandler");
const { errorHandler } = require("./middleware/errorHandler");

function buildApp() {
  const app = express();

  app.use(express.json());

  if (env.swaggerEnabled) {
    const openApiSpec = getOpenApiSpec();
    app.get("/openapi.json", (req, res) => res.status(200).json(openApiSpec));
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  app.use("/health", healthRoutes);
  app.use("/products", productsRoutes);
  app.use("/clients", clientsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };
