import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// Basic middleware (always safe)
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check (no dependencies)
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Prashiskshan API - Serverless" });
});

app.get("/health", (_req, res) => {
  res.json({ 
    success: true, 
    message: "Prashiskshan API is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Lazy load heavy dependencies
let apiRouter;
let swaggerUi;
let swaggerSpec;
let openapiSpec;
let requestLogger;
let attachRequestId;
let errorHandler;
let generalRateLimiter;
let connectDB;
let registerBullBoard;
let logger;

let isInitialized = false;
let isConnected = false;
let bullBoardRegistered = false;

const initializeApp = async () => {
  if (isInitialized) return;
  
  try {
    console.log("Initializing app...");
    
    // Import modules
    const dbModule = await import("../src/config/database.js");
    const routesModule = await import("../src/routes/index.js");
    const loggerMiddleware = await import("../src/middleware/logger.js");
    const errorMiddleware = await import("../src/middleware/errorHandler.js");
    const rateLimiterMiddleware = await import("../src/middleware/rateLimiter.js");
    const loggerUtil = await import("../src/utils/logger.js");
    const queuesModule = await import("../src/queues/index.js");
    const swaggerModule = await import("../src/config/swagger.js");
    
    // Assign imports
    apiRouter = routesModule.default;
    requestLogger = loggerMiddleware.requestLogger;
    attachRequestId = errorMiddleware.attachRequestId;
    errorHandler = errorMiddleware.errorHandler;
    generalRateLimiter = rateLimiterMiddleware.generalRateLimiter;
    connectDB = dbModule.connectDB;
    registerBullBoard = queuesModule.registerBullBoard;
    logger = loggerUtil.logger;
    swaggerSpec = swaggerModule.swaggerSpec;
    
    // Try to import swagger-ui and openapi (optional)
    try {
      const swaggerUiModule = await import("swagger-ui-express");
      swaggerUi = swaggerUiModule.default;
      
      // Setup Swagger with generated spec
      if (swaggerSpec && swaggerUi) {
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
          customCss: ".swagger-ui .topbar { display: none }",
          customSiteTitle: "Prashiskshan API Documentation",
          customfavIcon: "/favicon.ico",
        }));
        console.log("Swagger UI configured");
      }
    } catch (swaggerError) {
      console.warn("Swagger UI not available:", swaggerError.message);
    }
    
    // Add middleware
    app.use(attachRequestId);
    app.use(requestLogger);
    
    // API routes
    app.use("/api", generalRateLimiter, apiRouter);
    
    // Error handler
    app.use(errorHandler);
    
    isInitialized = true;
    console.log("App initialized successfully");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    throw error;
  }
};

const ensureDbConnection = async () => {
  if (!isConnected && connectDB) {
    try {
      await connectDB();
      isConnected = true;
      if (logger) logger.info("Database connected for serverless function");
      console.log("Database connected");
    } catch (error) {
      console.error("Database connection failed:", error.message);
      // Don't throw - allow app to work without DB for health checks
    }
  }
};

const ensureBullBoard = async () => {
  if (!bullBoardRegistered && registerBullBoard && (process.env.NODE_ENV !== "production" || process.env.ENABLE_BULL_BOARD === "true")) {
    try {
      await registerBullBoard(app, { basePath: "/admin/queues" });
      bullBoardRegistered = true;
      if (logger) logger.info("Bull Board registered");
    } catch (error) {
      console.warn("Bull Board registration failed:", error.message);
    }
  }
};

// Serverless handler
export default async (req, res) => {
  try {
    // Health checks don't need full initialization
    if (req.url === "/" || req.url === "/health") {
      return app(req, res);
    }
    
    // Initialize app on first real request
    if (!isInitialized) {
      await initializeApp();
    }
    
    // Connect to database
    await ensureDbConnection();
    
    // Register Bull Board (optional)
    await ensureBullBoard();
    
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "An error occurred",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
