import { body, validationResult } from "express-validator";

export const studentRegistration = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("profile.name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
  body("profile.department").trim().notEmpty().withMessage("Department is required"),
  body("profile.year").isInt({ min: 1, max: 5 }).withMessage("Year must be between 1 and 5"),
  body("profile.skills").optional().isArray().withMessage("Skills must be an array of strings"),
  body("phone")
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone must be a valid Indian mobile number"),
];

export const internshipCreation = [
  body("title").isLength({ min: 5, max: 200 }).withMessage("Title must be 5-200 characters"),
  body("description").isLength({ min: 50, max: 5000 }).withMessage("Description must be 50-5000 characters"),
  body("department").notEmpty().withMessage("Department is required"),
  body("requiredSkills").isArray({ min: 1, max: 20 }).withMessage("requiredSkills must be an array with 1-20 items"),
  body("duration").notEmpty().withMessage("Duration is required"),
  body("stipend").optional().isFloat({ min: 0 }).withMessage("Stipend must be positive"),
  body("startDate").isISO8601().withMessage("startDate must be a valid ISO date"),
  body("applicationDeadline")
    .isISO8601()
    .withMessage("applicationDeadline must be a valid ISO date")
    .custom((value, { req }) => {
      if (!req.body.startDate) return true;
      const deadline = new Date(value);
      const start = new Date(req.body.startDate);
      if (deadline >= start) {
        throw new Error("applicationDeadline must be before startDate");
      }
      return true;
    }),
  body("slots").isInt({ min: 1, max: 100 }).withMessage("slots must be between 1 and 100"),
];

export const logbookSubmission = [
  body("weekNumber").isInt({ min: 1 }).withMessage("weekNumber must be at least 1"),
  body("hoursWorked").isInt({ min: 1, max: 60 }).withMessage("hoursWorked must be between 1 and 60"),
  body("activities").isLength({ min: 50 }).withMessage("activities must be at least 50 characters"),
  body("skillsUsed").isArray({ min: 1 }).withMessage("skillsUsed must contain at least 1 skill"),
  body("learnings").isLength({ min: 20 }).withMessage("learnings must be at least 20 characters"),
];

export const applicationSubmit = [
  body("internshipId").notEmpty().withMessage("internshipId is required"),
  body("coverLetter").isLength({ min: 100, max: 1000 }).withMessage("coverLetter must be 100-1000 characters"),
];

// Custom URL validator that's more lenient for document URLs
const isValidDocumentURL = (value) => {
  if (!value) return true; // Allow empty/undefined
  if (typeof value !== 'string') return false;
  
  // Check if it's a valid URL format
  try {
    const url = new URL(value);
    // Allow http, https, and protocol-relative URLs
    return url.protocol === 'http:' || url.protocol === 'https:' || value.startsWith('//');
  } catch {
    // If URL constructor fails, check if it's a valid-looking URL string
    return /^(https?:)?\/\/.+\..+/.test(value);
  }
};

export const companyProfileUpdate = [
  body("companyName").optional().trim().isLength({ min: 2, max: 200 }).withMessage("Company name must be 2-200 characters"),
  body("about").optional().trim().isLength({ max: 2000 }).withMessage("About must be less than 2000 characters"),
  body("phone").optional().matches(/^[6-9]\d{9}$/).withMessage("Phone must be a valid Indian mobile number"),
  body("website").optional().matches(/^https?:\/\/.+/i).withMessage("Website must be a valid URL"),
  body("documents.gstCertificate")
    .optional({ values: 'falsy' })
    .custom(isValidDocumentURL)
    .withMessage("GST Certificate must be a valid URL"),
  body("documents.registrationCertificate")
    .optional({ values: 'falsy' })
    .custom(isValidDocumentURL)
    .withMessage("Registration Certificate must be a valid URL"),
  body("documents.addressProof")
    .optional({ values: 'falsy' })
    .custom(isValidDocumentURL)
    .withMessage("Address Proof must be a valid URL"),
  body("documents.additionalDocuments").optional().isArray({ max: 5 }).withMessage("Additional documents must be an array with maximum 5 items"),
  body("documents.additionalDocuments.*.id").optional().notEmpty().withMessage("Document ID is required"),
  body("documents.additionalDocuments.*.label").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Document label must be 1-100 characters"),
  body("documents.additionalDocuments.*.url")
    .optional({ values: 'falsy' })
    .custom(isValidDocumentURL)
    .withMessage("Document URL must be valid"),
  body("documents.additionalDocuments.*.uploadedAt").optional().isISO8601().withMessage("Upload date must be a valid ISO date"),
];

export const reappealSubmission = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Reappeal message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Reappeal message must be between 10 and 2000 characters")
    .matches(/\S/)
    .withMessage("Reappeal message cannot be only whitespace"),
];

export const reappealApproval = [
  body("feedback")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Feedback must be less than 1000 characters"),
];

export const reappealRejection = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Rejection reason must be between 10 and 1000 characters"),
  body("cooldownDays")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Cooldown days must be between 1 and 365"),
];

/**
 * Validate reappeal attachment file
 * Must be called after multer middleware
 */
export const validateReappealAttachment = (req, res, next) => {
  // If no file uploaded, continue
  if (!req.file) {
    return next();
  }

  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // Validate MIME type
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      details: [
        {
          field: "attachment",
          message: "Attachment must be PDF, JPG, or PNG",
        },
      ],
    });
  }

  // Validate file size
  if (req.file.size > maxFileSize) {
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      details: [
        {
          field: "attachment",
          message: "Attachment must be under 10MB",
        },
      ],
    });
  }

  return next();
};

/**
 * Validate company status for reappeal submission
 * Must be called after authentication middleware
 */
export const validateReappealEligibility = async (req, res, next) => {
  try {
    // Import here to avoid circular dependency
    const { resolveUserFromRequest } = await import("../controllers/helpers/context.js");
    const context = await resolveUserFromRequest(req);

    if (context.role !== "company") {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Company access required",
      });
    }

    const company = context.doc;

    // Check if there's already an active reappeal
    if (company.status === "reappeal") {
      return res.status(400).json({
        success: false,
        error: "Reappeal already submitted and under review",
        message: "Reappeal already submitted and under review",
      });
    }

    // Check if company is blocked
    if (company.status !== "blocked") {
      return res.status(400).json({
        success: false,
        error: "Only blocked companies can submit reappeals",
        message: "Only blocked companies can submit reappeals",
      });
    }

    // Check cooldown period
    if (company.reappeal?.cooldownEndsAt && new Date() < company.reappeal.cooldownEndsAt) {
      const cooldownDate = company.reappeal.cooldownEndsAt.toISOString();
      return res.status(403).json({
        success: false,
        error: `Cannot submit reappeal until ${cooldownDate}`,
        message: `Cannot submit reappeal until ${cooldownDate}`,
        cooldownEndsAt: cooldownDate,
      });
    }

    // Attach company to request for use in controller
    req.company = company;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const creditRequestCreation = [
  body("internshipCompletionId")
    .notEmpty()
    .withMessage("internshipCompletionId is required")
    .isMongoId()
    .withMessage("internshipCompletionId must be a valid MongoDB ObjectId"),
];

export const creditRequestResubmission = [
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be less than 1000 characters"),
];

export const mentorReviewSubmission = [
  body("decision")
    .notEmpty()
    .withMessage("Decision is required")
    .isIn(["approved", "rejected"])
    .withMessage("Decision must be 'approved' or 'rejected'"),
  body("feedback")
    .if(body("decision").equals("rejected"))
    .notEmpty()
    .withMessage("Feedback is required when rejecting a credit request")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Feedback must be between 10 and 2000 characters"),
  body("feedback")
    .if(body("decision").equals("approved"))
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Feedback must be less than 2000 characters"),
  body("qualityCriteria")
    .optional()
    .isObject()
    .withMessage("Quality criteria must be an object"),
  body("qualityCriteria.logbookComplete")
    .optional()
    .isBoolean()
    .withMessage("logbookComplete must be a boolean"),
  body("qualityCriteria.reportQuality")
    .optional()
    .isBoolean()
    .withMessage("reportQuality must be a boolean"),
  body("qualityCriteria.learningOutcomes")
    .optional()
    .isBoolean()
    .withMessage("learningOutcomes must be a boolean"),
  body("qualityCriteria.companyEvaluation")
    .optional()
    .isBoolean()
    .withMessage("companyEvaluation must be a boolean"),
];

export const adminReviewSubmission = [
  body("decision")
    .notEmpty()
    .withMessage("Decision is required")
    .isIn(["approved", "rejected"])
    .withMessage("Decision must be 'approved' or 'rejected'"),
  body("feedback")
    .if(body("decision").equals("rejected"))
    .notEmpty()
    .withMessage("Feedback is required when rejecting a credit request")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Feedback must be between 10 and 2000 characters"),
  body("feedback")
    .if(body("decision").equals("approved"))
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Feedback must be less than 2000 characters"),
  body("complianceChecks")
    .optional()
    .isObject()
    .withMessage("Compliance checks must be an object"),
  body("complianceChecks.nepCompliant")
    .optional()
    .isBoolean()
    .withMessage("nepCompliant must be a boolean"),
  body("complianceChecks.documentationComplete")
    .optional()
    .isBoolean()
    .withMessage("documentationComplete must be a boolean"),
  body("complianceChecks.feesCleared")
    .optional()
    .isBoolean()
    .withMessage("feesCleared must be a boolean"),
  body("complianceChecks.departmentApproved")
    .optional()
    .isBoolean()
    .withMessage("departmentApproved must be a boolean"),
];

export const adminHoldResolution = [
  body("resolution")
    .notEmpty()
    .withMessage("Resolution description is required")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Resolution must be between 10 and 1000 characters"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be less than 1000 characters"),
];

export const markCompletionCompleteValidation = [
  body("evaluationScore")
    .notEmpty()
    .withMessage("evaluationScore is required")
    .isFloat({ min: 0, max: 10 })
    .withMessage("evaluationScore must be a number between 0 and 10"),
  body("evaluationComments")
    .trim()
    .notEmpty()
    .withMessage("evaluationComments is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("evaluationComments must be between 10 and 1000 characters"),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((err) => ({
    field: err.param,
    message: err.msg,
  }));

  // Use the first error message as the main error for better test compatibility
  const firstError = formatted[0]?.message || "Validation failed";

  return res.status(400).json({
    success: false,
    error: firstError,
    message: firstError,
    details: formatted,
  });
};


/**
 * Validate MongoDB ObjectId in route parameters
 */
export const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `${paramName} parameter is required`,
          field: paramName,
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: `${paramName} must be a valid MongoDB ObjectId`,
          field: paramName,
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }

    next();
  };
};

/**
 * Validate pagination query parameters
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "page must be a positive integer",
          field: "page",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "limit must be between 1 and 100",
          field: "limit",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

/**
 * Validate credit request status filter
 */
export const validateStatusFilter = (req, res, next) => {
  const { status } = req.query;

  if (status !== undefined) {
    const validStatuses = [
      "pending_student_action",
      "pending_mentor_review",
      "mentor_approved",
      "mentor_rejected",
      "pending_admin_review",
      "admin_approved",
      "admin_rejected",
      "credits_added",
      "completed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `status must be one of: ${validStatuses.join(", ")}`,
          field: "status",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
  }

  next();
};

/**
 * Validate date range query parameters
 */
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate !== undefined) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "startDate must be a valid ISO date string",
          field: "startDate",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
    req.query.startDate = start;
  }

  if (endDate !== undefined) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "endDate must be a valid ISO date string",
          field: "endDate",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
    req.query.endDate = end;
  }

  if (startDate && endDate && req.query.startDate > req.query.endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "startDate must be before endDate",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }

  next();
};

/**
 * Validate sort query parameter
 */
export const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    const { sortBy, sortOrder } = req.query;

    if (sortBy !== undefined) {
      if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `sortBy must be one of: ${allowedFields.join(", ")}`,
            field: "sortBy",
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
          },
        });
      }
    }

    if (sortOrder !== undefined) {
      if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "sortOrder must be 'asc' or 'desc'",
            field: "sortOrder",
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
          },
        });
      }
      req.query.sortOrder = sortOrder.toLowerCase();
    }

    next();
  };
};

/**
 * Sanitize search query to prevent injection attacks
 * Removes special regex characters and limits length
 */
export const sanitizeSearchQuery = (req, res, next) => {
  if (req.query.search) {
    // Remove special regex characters that could be used for injection
    let search = req.query.search.toString();
    
    // Limit search query length
    if (search.length > 200) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Search query must be less than 200 characters",
          field: "search",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
    
    // Escape special regex characters
    search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Trim whitespace
    search = search.trim();
    
    // Update the query with sanitized value
    req.query.search = search;
  }
  
  next();
};

/**
 * Validate bulk operation size
 * Limits the number of items that can be processed in a single bulk operation
 */
export const validateBulkOperationSize = (req, res, next) => {
  const { internshipIds } = req.body;
  
  if (!Array.isArray(internshipIds)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "internshipIds must be an array",
        field: "internshipIds",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }
  
  if (internshipIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "internshipIds array cannot be empty",
        field: "internshipIds",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }
  
  if (internshipIds.length > 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Maximum 100 internships can be processed at once",
        field: "internshipIds",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }
  
  // Validate each ID is a string
  const invalidIds = internshipIds.filter(id => typeof id !== 'string' || !id.trim());
  if (invalidIds.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "All internship IDs must be non-empty strings",
        field: "internshipIds",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }
  
  next();
};

/**
 * Validate internship approval request
 */
export const validateInternshipApproval = [
  body("comments")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comments must be less than 1000 characters"),
];

/**
 * Validate internship rejection request
 */
export const validateInternshipRejection = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Rejection reason must be between 10 and 2000 characters")
    .matches(/\S/)
    .withMessage("Rejection reason cannot be only whitespace"),
  body("reasons")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Reasons must be an array with maximum 10 items"),
  body("reasons.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Each reason must be between 1 and 200 characters"),
];

/**
 * Validate bulk rejection request
 */
export const validateBulkRejection = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required for bulk rejection")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Rejection reason must be between 10 and 2000 characters")
    .matches(/\S/)
    .withMessage("Rejection reason cannot be only whitespace"),
];

/**
 * Validate internship edit request
 */
export const validateInternshipEdit = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage("Description must be between 50 and 5000 characters"),
  body("requiredSkills")
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage("Required skills must be an array with 1-20 items"),
  body("requiredSkills.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each skill must be between 1 and 100 characters"),
  body("optionalSkills")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Optional skills must be an array with maximum 20 items"),
  body("optionalSkills.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each skill must be between 1 and 100 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Location must be between 2 and 200 characters"),
  body("duration")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Duration must be between 1 and 100 characters"),
  body("stipend")
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Stipend must be between 0 and 1,000,000"),
  body("workMode")
    .optional()
    .isIn(["remote", "onsite", "hybrid"])
    .withMessage("Work mode must be remote, onsite, or hybrid"),
  body("responsibilities")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Responsibilities must be an array with maximum 20 items"),
  body("responsibilities.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Each responsibility must be between 1 and 500 characters"),
  body("learningOpportunities")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Learning opportunities must be an array with maximum 20 items"),
  body("learningOpportunities.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Each learning opportunity must be between 1 and 500 characters"),
  body("editReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Edit reason must be less than 500 characters"),
];

/**
 * Validate internship status filter
 */
export const validateInternshipStatusFilter = (req, res, next) => {
  const { status } = req.query;

  if (status !== undefined && status !== "all") {
    const validStatuses = [
      "pending_admin_verification",
      "admin_approved",
      "admin_rejected",
      "open_for_applications",
      "closed",
      "completed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `status must be one of: ${validStatuses.join(", ")}, or "all"`,
          field: "status",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
  }

  next();
};

/**
 * Validate work mode filter
 */
export const validateWorkModeFilter = (req, res, next) => {
  const { workMode } = req.query;

  if (workMode !== undefined) {
    const validModes = ["remote", "onsite", "hybrid"];

    if (!validModes.includes(workMode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `workMode must be one of: ${validModes.join(", ")}`,
          field: "workMode",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      });
    }
  }

  next();
};

/**
 * Catch-all validation error handler for unexpected errors
 */
export const catchValidationErrors = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.errors,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      },
    });
  }
  next(err);
};
