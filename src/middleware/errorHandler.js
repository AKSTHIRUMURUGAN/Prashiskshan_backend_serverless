import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export class AppError extends Error {
  constructor(message, status = 500, details, code) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, details, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Unauthenticated") {
    super(message, 401, null, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, null, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404, null, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details) {
    super(message, 409, details, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details) {
    super(message, 500, details, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable", details) {
    super(message, 503, details, "SERVICE_UNAVAILABLE");
    this.name = "ServiceUnavailableError";
  }
}

export class TimeoutError extends AppError {
  constructor(message = "Request timeout", details) {
    super(message, 504, details, "TIMEOUT_ERROR");
    this.name = "TimeoutError";
  }
}

// Middleware to attach request ID to all requests
export const attachRequestId = (req, res, next) => {
  req.requestId = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-ID", req.requestId);
  next();
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || (err instanceof AppError ? err.status : 500);
  const isProd = process.env.NODE_ENV === "production";
  const requestId = req.requestId || "unknown";

  // Determine error code
  let errorCode = err.code || "INTERNAL_SERVER_ERROR";
  
  // Handle specific error types
  if (err.name === "ValidationError" && !err.code) {
    errorCode = "VALIDATION_ERROR";
  } else if (err.name === "CastError") {
    errorCode = "INVALID_ID";
  } else if (err.name === "MongoServerError" && err.code === 11000) {
    errorCode = "DUPLICATE_KEY";
  } else if (err.name === "MongoNetworkError") {
    errorCode = "DATABASE_CONNECTION_ERROR";
  }

  const logPayload = {
    requestId,
    message: err.message,
    status,
    code: errorCode,
    stack: isProd ? undefined : err.stack,
    path: req.originalUrl,
    method: req.method,
    user: req.user?.role,
    userId: req.user?.userId,
    ip: req.ip,
    details: err.details,
  };

  if (status >= 500) {
    logger.error("Unhandled error", logPayload);
  } else {
    logger.info("Handled error", logPayload);
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message: err.message || "Internal Server Error",
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Add details for validation errors or in non-production
  if (err.details) {
    response.error.details = err.details;
  }

  // Add stack trace in development
  if (!isProd && status === 500 && err.stack) {
    response.error.stack = err.stack;
  }

  // Add suggestions for common errors
  if (errorCode === "VALIDATION_ERROR") {
    response.error.suggestion = "Please check the request body and ensure all required fields are provided with valid values";
  } else if (errorCode === "AUTHENTICATION_ERROR") {
    response.error.suggestion = "Please ensure you are logged in and have a valid authentication token";
  } else if (errorCode === "AUTHORIZATION_ERROR") {
    response.error.suggestion = "You do not have permission to perform this action";
  } else if (errorCode === "NOT_FOUND") {
    response.error.suggestion = "The requested resource could not be found. Please check the ID and try again";
  } else if (errorCode === "CONFLICT_ERROR") {
    response.error.suggestion = "This operation conflicts with existing data. Please check for duplicates or concurrent modifications";
  } else if (errorCode === "DATABASE_CONNECTION_ERROR") {
    response.error.suggestion = "Database connection failed. Please try again later";
    res.setHeader("Retry-After", "60");
  }

  res.status(status).json(response);
};

