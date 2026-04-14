import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import config from "../src/config/index.js";
import { connectDB } from "../src/config/database.js";
import apiRouter from "../src/routes/index.js";
import { requestLogger } from "../src/middleware/logger.js";
import { errorHandler, attachRequestId } from "../src/middleware/errorHandler.js";
import { generalRateLimiter } from "../src/middleware/rateLimiter.js";
import { logger } from "../src/utils/logger.js";
import { registerBullBoard } from "../src/queues/index.js";
import { swaggerSpec } from "../src/config/swagger.js";
import openapiSpec from "../src/docs/openapi.mjs";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// CORS options
const corsOptions = {
  origin: config.app.frontendUrl || "*",
  credentials: true,
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(attachRequestId);
app.use(requestLogger);

// Health check
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Prashiskshan API" });
});

app.get("/health", (_req, res) => {
  res.json({ 
    success: true, 
    message: "Prashiskshan API is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Prashiskshan API Documentation",
  customfavIcon: "/favicon.ico",
}));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/api/docs.json", (_req, res) => res.json(openapiSpec));

// API routes
app.use("/api", generalRateLimiter, apiRouter);

// Error handler
app.use(errorHandler);

// Database connection (cached for serverless)
let isConnected = false;

const ensureDbConnection = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    logger.info("Database connected for serverless function");
  }
};

// Register Bull Board (only in non-production or when explicitly enabled)
let bullBoardRegistered = false;
const ensureBullBoard = async () => {
  if (!bullBoardRegistered && (process.env.NODE_ENV !== "production" || process.env.ENABLE_BULL_BOARD === "true")) {
    try {
      await registerBullBoard(app, { basePath: "/admin/queues" });
      bullBoardRegistered = true;
      logger.info("Bull Board registered");
    } catch (error) {
      logger.warn("Bull Board registration failed", { error: error.message });
    }
  }
};

// Serverless handler
export default async (req, res) => {
  try {
    await ensureDbConnection();
    await ensureBullBoard();
    return app(req, res);
  } catch (error) {
    logger.error("Serverless function error", { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
