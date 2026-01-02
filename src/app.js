const express = require("express");
const swaggerUi = require("swagger-ui-express");

const healthRoutes = require("./routes/health.routes");
const productsRoutes = require("./routes/products.routes");
const clientsRoutes = require("./routes/client.routes");
const documentsRoutes = require("./routes/documents.routes");
const { env } = require("./config/env");
const { getOpenApiSpec } = require("./config/swagger");
const { notFoundHandler } = require("./middleware/notFoundHandler");
const { errorHandler } = require("./middleware/errorHandler");

function buildApp() {
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  });

  app.use(express.json());

  if (env.swaggerEnabled) {
    const openApiSpec = getOpenApiSpec();
    app.get("/openapi.json", (req, res) => res.status(200).json(openApiSpec));
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  app.use("/health", healthRoutes);
  app.use("/products", productsRoutes);
  app.use("/clients", clientsRoutes);
  app.use("/documents", documentsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };
