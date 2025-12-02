import {
  validateObjectIdParam,
  validatePagination,
  validateStatusFilter,
  validateDateRange,
  validateSort,
} from "../../../src/middleware/validation.js";

describe("Validation Middleware", () => {
  let req, res, next, statusCode, jsonResponse, nextCalled;

  beforeEach(() => {
    statusCode = null;
    jsonResponse = null;
    nextCalled = false;
    
    req = {
      params: {},
      query: {},
      requestId: "test-request-id",
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
    };
    next = function() {
      nextCalled = true;
    };
  });

  describe("validateObjectIdParam", () => {
    test("should pass for valid MongoDB ObjectId", () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const middleware = validateObjectIdParam("id");
      middleware(req, res, next);
      expect(nextCalled).toBe(true);
      expect(statusCode).toBeNull();
    });

    test("should reject invalid ObjectId", () => {
      req.params.id = "invalid-id";
      const middleware = validateObjectIdParam("id");
      middleware(req, res, next);
      expect(statusCode).toBe(400);
      expect(jsonResponse.error.code).toBe("INVALID_ID");
      expect(nextCalled).toBe(false);
    });

    test("should reject missing parameter", () => {
      const middleware = validateObjectIdParam("id");
      middleware(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });
  });

  describe("validatePagination", () => {
    test("should pass for valid pagination parameters", () => {
      req.query.page = "2";
      req.query.limit = "20";
      validatePagination(req, res, next);
      expect(req.query.page).toBe(2);
      expect(req.query.limit).toBe(20);
      expect(nextCalled).toBe(true);
    });

    test("should reject negative page number", () => {
      req.query.page = "-1";
      validatePagination(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should reject zero page number", () => {
      req.query.page = "0";
      validatePagination(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should reject limit over 100", () => {
      req.query.limit = "101";
      validatePagination(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should reject non-numeric page", () => {
      req.query.page = "abc";
      validatePagination(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should pass when pagination params are not provided", () => {
      validatePagination(req, res, next);
      expect(nextCalled).toBe(true);
    });
  });

  describe("validateStatusFilter", () => {
    test("should pass for valid status", () => {
      req.query.status = "pending_mentor_review";
      validateStatusFilter(req, res, next);
      expect(nextCalled).toBe(true);
    });

    test("should reject invalid status", () => {
      req.query.status = "invalid_status";
      validateStatusFilter(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should pass when status is not provided", () => {
      validateStatusFilter(req, res, next);
      expect(nextCalled).toBe(true);
    });
  });

  describe("validateDateRange", () => {
    test("should pass for valid date range", () => {
      req.query.startDate = "2024-01-01";
      req.query.endDate = "2024-12-31";
      validateDateRange(req, res, next);
      expect(req.query.startDate).toBeInstanceOf(Date);
      expect(req.query.endDate).toBeInstanceOf(Date);
      expect(nextCalled).toBe(true);
    });

    test("should reject invalid startDate", () => {
      req.query.startDate = "invalid-date";
      validateDateRange(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should reject invalid endDate", () => {
      req.query.endDate = "invalid-date";
      validateDateRange(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should reject when startDate is after endDate", () => {
      req.query.startDate = "2024-12-31";
      req.query.endDate = "2024-01-01";
      validateDateRange(req, res, next);
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    test("should pass when dates are not provided", () => {
      validateDateRange(req, res, next);
      expect(nextCalled).toBe(true);
    });
  });

  describe("validateSort", () => {
    test("should pass for valid sort field", () => {
      req.query.sortBy = "createdAt";
      req.query.sortOrder = "asc";
      const middleware = validateSort(["createdAt", "status"]);
      middleware(req, res, next);
      expect(req.query.sortOrder).toBe("asc");
      expect(next).toHaveBeenCalled();
    });

    test("should reject invalid sort field", () => {
      req.query.sortBy = "invalidField";
      const middleware = validateSort(["createdAt", "status"]);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject invalid sort order", () => {
      req.query.sortOrder = "invalid";
      const middleware = validateSort([]);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test("should normalize sort order to lowercase", () => {
      req.query.sortOrder = "DESC";
      const middleware = validateSort([]);
      middleware(req, res, next);
      expect(req.query.sortOrder).toBe("desc");
      expect(next).toHaveBeenCalled();
    });

    test("should pass when sort params are not provided", () => {
      const middleware = validateSort([]);
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
