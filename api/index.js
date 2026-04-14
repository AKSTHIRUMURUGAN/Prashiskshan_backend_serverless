import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoose from "mongoose";

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
  // Serve simple HTML documentation page
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prashiskshan API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
            padding: 40px;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 2.5em; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 1.1em; }
        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-bottom: 30px;
            font-weight: 600;
        }
        .section { margin-bottom: 30px; }
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .links { display: grid; gap: 12px; }
        .link-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 16px 20px;
            text-decoration: none;
            color: #333;
            transition: all 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .link-card:hover {
            border-color: #667eea;
            background: #f0f4ff;
            transform: translateX(5px);
        }
        .link-title {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 4px;
        }
        .link-desc { font-size: 0.9em; color: #666; }
        .link-arrow { font-size: 1.5em; color: #667eea; }
        .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .info-box h3 { color: #856404; margin-bottom: 8px; font-size: 1.1em; }
        .info-box p { color: #856404; font-size: 0.95em; line-height: 1.6; }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            color: #666;
            font-size: 0.9em;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #e83e8c;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Prashiskshan API</h1>
        <p class="subtitle">NEP 2020 Compliant Internship Management Platform</p>
        <span class="status">✓ API Online</span>
        
        <div class="section">
            <h2>📚 Interactive Documentation</h2>
            <div class="links">
                <a href="/api-docs" class="link-card">
                    <div>
                        <div class="link-title">Swagger UI</div>
                        <div class="link-desc">Interactive API documentation - Try endpoints live</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
                
                <a href="/swagger" class="link-card">
                    <div>
                        <div class="link-title">Swagger UI (Alternative)</div>
                        <div class="link-desc">Same as /api-docs, alternative path</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
                
                <a href="/api/docs" class="link-card">
                    <div>
                        <div class="link-title">OpenAPI Documentation</div>
                        <div class="link-desc">OpenAPI 3.0 specification viewer</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
            </div>
        </div>
        
        <div class="section">
            <h2>📄 JSON Specifications</h2>
            <div class="links">
                <a href="/swagger.json" class="link-card">
                    <div>
                        <div class="link-title">Swagger JSON</div>
                        <div class="link-desc">Raw Swagger/OpenAPI JSON spec for Postman/Insomnia</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
                
                <a href="/api/docs.json" class="link-card">
                    <div>
                        <div class="link-title">OpenAPI JSON</div>
                        <div class="link-desc">OpenAPI 3.0 JSON specification</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
            </div>
        </div>
        
        <div class="section">
            <h2>💚 Health & Status</h2>
            <div class="links">
                <a href="/health" class="link-card">
                    <div>
                        <div class="link-title">Health Check</div>
                        <div class="link-desc">API health status and uptime</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
                
                <a href="/api/health" class="link-card">
                    <div>
                        <div class="link-title">API Health</div>
                        <div class="link-desc">Detailed API health information</div>
                    </div>
                    <span class="link-arrow">→</span>
                </a>
            </div>
        </div>
        
        <div class="info-box">
            <h3>🔐 Authentication Required</h3>
            <p>
                Most API endpoints require Firebase authentication. 
                To test authenticated endpoints in Swagger UI:
                <br><br>
                1. Click the <code>Authorize</code> button<br>
                2. Enter: <code>Bearer YOUR_FIREBASE_TOKEN</code><br>
                3. Click <code>Authorize</code>
            </p>
        </div>
        
        <div class="footer">
            <p>
                <strong>Total Endpoints:</strong> 150+ | 
                <strong>Version:</strong> 1.0.0 | 
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}
            </p>
            <p style="margin-top: 10px;">
                Built with Express.js, MongoDB, Firebase & Serverless Architecture
            </p>
        </div>
    </div>
</body>
</html>
  `);
});

app.get("/api", (_req, res) => {
  res.json({ 
    success: true, 
    message: "Prashiskshan API - Serverless",
    version: "1.0.0",
    documentation: {
      swagger: "/api-docs",
      openapi: "/api/docs",
      json: "/swagger.json"
    }
  });
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

app.get("/api/health", (_req, res) => {
  res.json({ 
    success: true, 
    data: {
      uptime: process.uptime()
    },
    message: "Prashiskshan API is healthy"
  });
});

// Lazy load heavy dependencies
let apiRouter;
let swaggerSpec;
let openapiSpec;
let requestLogger;
let attachRequestId;
let errorHandler;
let generalRateLimiter;
let connectDB;
let logger;
let getSwaggerHTML;

let isInitialized = false;
let isConnected = false;

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
    const swaggerModule = await import("../src/config/swagger.js");
    const swaggerStandaloneModule = await import("./swagger-standalone.js");
    
    // Assign imports
    apiRouter = routesModule.default;
    requestLogger = loggerMiddleware.requestLogger;
    attachRequestId = errorMiddleware.attachRequestId;
    errorHandler = errorMiddleware.errorHandler;
    generalRateLimiter = rateLimiterMiddleware.generalRateLimiter;
    connectDB = dbModule.connectDB;
    logger = loggerUtil.logger;
    swaggerSpec = swaggerModule.swaggerSpec;
    getSwaggerHTML = swaggerStandaloneModule.getSwaggerHTML;
    
    // Try to import OpenAPI spec (optional)
    try {
      const openapiModule = await import("../src/docs/openapi.mjs");
      openapiSpec = openapiModule.default;
    } catch (openapiError) {
      console.warn("OpenAPI spec not available:", openapiError.message);
    }
    
    // Setup Swagger UI routes using CDN (works better in serverless)
    if (swaggerSpec && getSwaggerHTML) {
      // Swagger UI at /api-docs
      app.get("/api-docs", (_req, res) => {
        res.send(getSwaggerHTML("/swagger.json", "Prashiskshan API Documentation"));
      });
      console.log("Swagger UI configured at /api-docs");
      
      // Swagger UI at /swagger (alternative)
      app.get("/swagger", (_req, res) => {
        res.send(getSwaggerHTML("/swagger.json", "Prashiskshan API Documentation"));
      });
      console.log("Swagger UI configured at /swagger");
    }
    
    // Setup OpenAPI UI at /api/docs
    if (openapiSpec && getSwaggerHTML) {
      app.get("/api/docs", (_req, res) => {
        res.send(getSwaggerHTML("/api/docs.json", "Prashiskshan OpenAPI Documentation"));
      });
      console.log("OpenAPI UI configured at /api/docs");
    }
    
    // Serve OpenAPI JSON spec
    if (openapiSpec) {
      app.get("/api/docs.json", (_req, res) => {
        res.json(openapiSpec);
      });
      console.log("OpenAPI JSON spec available at /api/docs.json");
    }
    
    // Serve Swagger JSON spec
    if (swaggerSpec) {
      app.get("/swagger.json", (_req, res) => {
        res.json(swaggerSpec);
      });
      app.get("/api-docs.json", (_req, res) => {
        res.json(swaggerSpec);
      });
      console.log("Swagger JSON spec available at /swagger.json and /api-docs.json");
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
  if (!connectDB) return;
  
  try {
    // Check if mongoose is already connected
    if (mongoose.connection.readyState === 1) {
      // Already connected
      isConnected = true;
      return;
    }
    
    // Check if connection is connecting
    if (mongoose.connection.readyState === 2) {
      // Wait for connection to establish
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
      isConnected = true;
      return;
    }
    
    // Connection is disconnected or uninitialized, connect now
    await connectDB();
    isConnected = true;
    if (logger) logger.info("Database connected for serverless function");
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    // Don't throw - allow app to work without DB for some routes
    throw error; // But throw for API routes that need DB
  }
};

// Serverless handler
export default async (req, res) => {
  try {
    const url = req.url || req.path || "";
    const pathname = url.split('?')[0]; // Remove query parameters
    
    // Health checks and root don't need full initialization
    if (pathname === "/" || pathname === "/health" || pathname === "/api/health" || pathname === "/api") {
      return app(req, res);
    }
    
    // Initialize app on first real request (including Swagger routes)
    if (!isInitialized) {
      await initializeApp();
    }
    
    // Swagger/docs routes don't need database
    const isDocsRoute = 
      pathname === "/api-docs" || 
      pathname === "/swagger" || 
      pathname === "/api/docs" ||
      pathname === "/swagger.json" ||
      pathname === "/api-docs.json" ||
      pathname === "/api/docs.json";
    
    if (isDocsRoute) {
      return app(req, res);
    }
    
    // Connect to database for API routes only
    if (pathname.startsWith("/api/")) {
      try {
        await ensureDbConnection();
      } catch (dbError) {
        console.error("Database connection failed for API route:", dbError.message);
        return res.status(503).json({
          success: false,
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "Database connection failed. Please try again later.",
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
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
