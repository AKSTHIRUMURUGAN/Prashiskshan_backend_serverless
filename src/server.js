import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import config from "./config/index.js";
import { connectDB } from "./config/database.js";
import apiRouter from "./routes/index.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalRateLimiter } from "./middleware/rateLimiter.js";
import { logger } from "./utils/logger.js";
import { registerBullBoard } from "./queues/index.js";
import { swaggerSpec } from "./config/swagger.js";
import openapiSpec from "./docs/openapi.mjs";

const app = express();
app.set("trust proxy", 1);
//cors options
const corsOptions = {
  origin: config.app.frontendUrl,
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Prashiskshan API" });
});

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Prashiskshan API Documentation",
  customfavIcon: "/favicon.ico",
}));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/api/docs.json", (_req, res) => res.json(openapiSpec));

app.use("/api", generalRateLimiter, apiRouter);



app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await registerBullBoard(app, { basePath: "/admin/queues" });
    const port = config.app.port || 5000;
    app.listen(port, () => {
      logger.info(`Prashiskshan API listening on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message });
  process.exit(1);
});
