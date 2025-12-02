import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
  TimeoutError,
  errorHandler,
  attachRequestId,
} from "../../../src/middleware/errorHandler.js";

describe("Error Handler Middleware", () => {
  let req, res, next, statusCode, jsonResponse;

  beforeEach(() => {
    statusCode = null;
    jsonResponse = null;
    
    req = {
      requestId: "test-request-id",
      originalUrl: "/api/test",
      method: "GET",
      ip: "127.0.0.1",
      user: { role: "student", userId: "test-user" },
      headers: {},
    };
    res = {
      status: function(code) {
        statusCode = code;
        return this;
      },
      json: function(data) {
        jsonResponse = data;
        return this;
      },
      setHeader: function() {
        return this;
      },
    };
    next = function() {};
  });

  describe("Error Classes", () => {
    test("ValidationError should have correct properties", () => {
      const error = new ValidationError("Invalid input", { field: "email" });
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
      expect(error.details).toEqual({ field: "email" });
    });

    test("AuthenticationError should have correct properties", () => {
      const error = new AuthenticationError();
      expect(error.status).toBe(401);
      expect(error.code).toBe("AUTHENTICATION_ERROR");
    });

    test("AuthorizationError should have correct properties", () => {
      const error = new AuthorizationError();
      expect(error.status).toBe(403);
      expect(error.code).toBe("AUTHORIZATION_ERROR");
    });

    test("NotFoundError should have correct properties", () => {
      const error = new NotFoundError();
      expect(error.status).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    test("ConflictError should have correct properties", () => {
      const error = new ConflictError("Duplicate entry");
      expect(error.status).toBe(409);
      expect(error.code).toBe("CONFLICT_ERROR");
    });

    test("DatabaseError should have correct properties", () => {
      const error = new DatabaseError();
      expect(error.status).toBe(500);
      expect(error.code).toBe("DATABASE_ERROR");
    });

    test("ServiceUnavailableError should have correct properties", () => {
      const error = new ServiceUnavailableError();
      expect(error.status).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
    });

    test("TimeoutError should have correct properties", () => {
      const error = new TimeoutError();
      expect(error.status).toBe(504);
      expect(error.code).toBe("TIMEOUT_ERROR");
    });
  });

  describe("attachRequestId middleware", () => {
    test("should attach request ID from header", () => {
      req.headers = { "x-request-id": "custom-id" };
      attachRequestId(req, res, next);
      expect(req.requestId).toBe("custom-id");
    });

    test("should generate request ID if not provided", () => {
      req.headers = {};
      attachRequestId(req, res, next);
      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe("string");
    });
  });

  describe("errorHandler middleware", () => {
    test("should handle ValidationError with proper format", () => {
      const error = new ValidationError("Invalid email", { field: "email" });
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(400);
      expect(jsonResponse.success).toBe(false);
      expect(jsonResponse.error.code).toBe("VALIDATION_ERROR");
      expect(jsonResponse.error.message).toBe("Invalid email");
      expect(jsonResponse.error.details).toEqual({ field: "email" });
      expect(jsonResponse.error.suggestion).toBeDefined();
    });

    test("should handle AuthenticationError", () => {
      const error = new AuthenticationError("Token expired");
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(401);
      expect(jsonResponse.error.code).toBe("AUTHENTICATION_ERROR");
      expect(jsonResponse.error.message).toBe("Token expired");
      expect(jsonResponse.error.suggestion).toBeDefined();
    });

    test("should handle AuthorizationError", () => {
      const error = new AuthorizationError("Access denied");
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(403);
      expect(jsonResponse.error.code).toBe("AUTHORIZATION_ERROR");
      expect(jsonResponse.error.message).toBe("Access denied");
    });

    test("should handle NotFoundError", () => {
      const error = new NotFoundError("Resource not found");
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(404);
      expect(jsonResponse.error.code).toBe("NOT_FOUND");
      expect(jsonResponse.error.message).toBe("Resource not found");
    });

    test("should handle ConflictError", () => {
      const error = new ConflictError("Duplicate entry");
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(409);
      expect(jsonResponse.error.code).toBe("CONFLICT_ERROR");
      expect(jsonResponse.error.message).toBe("Duplicate entry");
    });

    test("should handle generic errors with 500 status", () => {
      const error = new Error("Something went wrong");
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(500);
      expect(jsonResponse.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(jsonResponse.error.message).toBe("Something went wrong");
    });

    test("should handle MongoDB CastError", () => {
      const error = new Error("Cast to ObjectId failed");
      error.name = "CastError";
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(500);
      expect(jsonResponse.error.code).toBe("INVALID_ID");
    });

    test("should handle MongoDB duplicate key error", () => {
      const error = new Error("Duplicate key");
      error.name = "MongoServerError";
      error.code = 11000;
      errorHandler(error, req, res, next);

      expect(statusCode).toBe(500);
      expect(jsonResponse.error.code).toBe("DUPLICATE_KEY");
    });

    test("should include request ID in error response", () => {
      const error = new ValidationError("Test error");
      errorHandler(error, req, res, next);

      expect(jsonResponse.error.requestId).toBe("test-request-id");
    });
  });
});
