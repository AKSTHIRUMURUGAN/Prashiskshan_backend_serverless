import { Router } from "express";
import {
  getAdminDashboard,
  getPendingCompanies,
  getCompanies,
  getCompanyDetails,
  verifyCompany,
  rejectCompany,
  blockCompany,
  suspendCompany,
  bulkImportStudents,
  bulkImportMentors,
  getImportJobStatus,
  downloadImportCredentials,
  downloadImportTemplate,
  assignMentor,
  generateSystemReport,
  getAdminAnalytics,
  getCollegeAnalytics,
  getSystemHealth,
  getAIUsageStats,
  approveInternship,
  rejectInternship,
  getInternships,
  getPendingCreditApprovals,
  getCreditRequestDetails,
  submitAdminReview,
  resolveAdminHold,
  getCreditAnalytics,
  exportCreditReport,
  getBottleneckAnalysis,
  getReappeals,
  approveReappeal,
  rejectReappeal,
  getReminderStats,
  sendOverdueReminders,
  scheduleReminderJob,
  getOverdueCreditRequests,
  // Internship Verification Workflow endpoints (Task 10.1, 10.2)
  getPendingInternshipVerifications,
  approveInternshipVerification,
  rejectInternshipVerification,
  getInternshipDetailsForAdmin,
  getSystemAnalytics,
  getCompanyPerformanceMetrics,
  getDepartmentPerformanceMetrics,
  getMentorPerformanceMetrics,
  getStudentPerformanceMetrics,
  closeExpiredInternships,
  generateAnalyticsSnapshot,
} from "../controllers/adminController.js";
import {
  getInternshipsList,
  getInternshipDetail,
  approveInternshipPosting,
  rejectInternshipPosting,
  bulkApproveInternships,
  bulkRejectInternships,
  getInternshipAnalytics,
  editInternshipDetails,
} from "../controllers/adminInternshipController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { requireAdminRole } from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { 
  reappealApproval, 
  reappealRejection, 
  adminReviewSubmission,
  adminHoldResolution,
  handleValidationErrors,
  validateObjectIdParam,
  validatePagination,
  validateStatusFilter,
  validateDateRange,
  validateSort,
  sanitizeSearchQuery,
  validateBulkOperationSize,
  validateInternshipApproval,
  validateInternshipRejection,
  validateBulkRejection,
  validateInternshipEdit,
  validateInternshipStatusFilter,
  validateWorkModeFilter,
} from "../middleware/validation.js";
import { 
  adminBulkOperationRateLimiter,
  adminAnalyticsRateLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();
// Enhanced admin authentication with audit logging
const adminAuth = [authenticate, identifyUser, authorize("admin"), requireAdminRole];

/**
 * @swagger
 * /api/admins/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", adminAuth, asyncHandler(getAdminDashboard));

/**
 * @swagger
 * /api/admins/companies/pending:
 *   get:
 *     summary: Get pending companies
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/companies/pending", adminAuth, asyncHandler(getPendingCompanies));

/**
 * @swagger
 * /api/admins/companies:
 *   get:
 *     summary: Get companies (filter by status)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/companies", adminAuth, asyncHandler(getCompanies));

/**
 * @swagger
 * /api/admins/companies/{companyId}:
 *   get:
 *     summary: Get company details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/companies/:companyId", adminAuth, asyncHandler(getCompanyDetails));

/**
 * @swagger
 * /api/admins/companies/{companyId}/verify:
 *   post:
 *     summary: Verify company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/companies/:companyId/verify", adminAuth, asyncHandler(verifyCompany));

/**
 * @swagger
 * /api/admins/companies/{companyId}/reject:
 *   post:
 *     summary: Reject company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/companies/:companyId/reject", adminAuth, asyncHandler(rejectCompany));

/**
 * @swagger
 * /api/admins/companies/:companyId/block:
 *   post:
 *     summary: Block a company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/companies/:companyId/block", adminAuth, asyncHandler(blockCompany));

/**
 * @swagger
 * /api/admins/companies/{companyId}/suspend:
 *   post:
 *     summary: Suspend company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/companies/:companyId/suspend", adminAuth, asyncHandler(suspendCompany));

/**
 * @swagger
 * /api/admins/students/import/template:
 *   get:
 *     summary: Download CSV template for student import
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/students/import/template", adminAuth, asyncHandler(downloadImportTemplate));

/**
 * @swagger
 * /api/admins/students/import:
 *   post:
 *     summary: Bulk import students (accepts CSV/Excel file or JSON)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/students/import", adminAuth, async (req, res, next) => {
  // Import multer middleware dynamically
  const { uploadStudentFile } = await import("../middleware/fileUpload.js");
  
  // Apply multer middleware
  uploadStudentFile(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Continue to the actual handler
    asyncHandler(bulkImportStudents)(req, res, next);
  });
});

/**
 * @swagger
 * /api/admins/students/import/{jobId}:
 *   get:
 *     summary: Get import job status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/students/import/:jobId", adminAuth, asyncHandler(getImportJobStatus));

/**
 * @swagger
 * /api/admins/students/import/{jobId}/credentials:
 *   get:
 *     summary: Download credentials for imported students
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/students/import/:jobId/credentials", adminAuth, asyncHandler(downloadImportCredentials));

/**
 * @swagger
 * /api/admins/mentors/import/template:
 *   get:
 *     summary: Download CSV template for mentor import
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/mentors/import/template", adminAuth, asyncHandler(downloadImportTemplate));

/**
 * @swagger
 * /api/admins/mentors/import:
 *   post:
 *     summary: Bulk import mentors (accepts CSV/Excel file or JSON)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/mentors/import", adminAuth, async (req, res, next) => {
  // Import multer middleware dynamically
  const { uploadMentorFile } = await import("../middleware/fileUpload.js");
  
  // Apply multer middleware
  uploadMentorFile(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Continue to the actual handler
    asyncHandler(bulkImportMentors)(req, res, next);
  });
});

/**
 * @swagger
 * /api/admins/mentors/import/{jobId}:
 *   get:
 *     summary: Get mentor import job status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/mentors/import/:jobId", adminAuth, asyncHandler(getImportJobStatus));

/**
 * @swagger
 * /api/admins/mentors/import/{jobId}/credentials:
 *   get:
 *     summary: Download credentials for imported mentors
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/mentors/import/:jobId/credentials", adminAuth, asyncHandler(downloadImportCredentials));

/**
 * @swagger
 * /api/admins/mentors/assign:
 *   post:
 *     summary: Assign mentor to students
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/mentors/assign", adminAuth, asyncHandler(assignMentor));

/**
 * @swagger
 * /api/admins/credit-requests/pending:
 *   get:
 *     summary: Get pending credit requests for admin approval
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/credit-requests/pending", 
  adminAuth, 
  validatePagination,
  validateStatusFilter,
  validateSort(["requestedAt", "status", "mentorId", "studentId"]),
  asyncHandler(getPendingCreditApprovals)
);

/**
 * @swagger
 * /api/admins/credit-requests/{requestId}:
 *   get:
 *     summary: Get credit request details for admin review
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/credit-requests/:requestId", 
  adminAuth, 
  validateObjectIdParam("requestId"),
  asyncHandler(getCreditRequestDetails)
);

/**
 * @swagger
 * /api/admins/credit-requests/{requestId}/review:
 *   post:
 *     summary: Submit admin review (approve/reject)
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/credit-requests/:requestId/review", 
  adminAuth, 
  validateObjectIdParam("requestId"),
  adminReviewSubmission,
  handleValidationErrors,
  asyncHandler(submitAdminReview)
);

/**
 * @swagger
 * /api/admins/credit-requests/{requestId}/resolve:
 *   post:
 *     summary: Resolve administrative hold on credit request
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/credit-requests/:requestId/resolve", 
  adminAuth,
  validateObjectIdParam("requestId"),
  adminHoldResolution,
  handleValidationErrors,
  asyncHandler(resolveAdminHold)
);

/**
 * @swagger
 * /api/admins/credit-requests/analytics:
 *   get:
 *     summary: Get system-wide credit transfer analytics
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/credit-requests/analytics", 
  adminAuth, 
  validateDateRange,
  asyncHandler(getCreditAnalytics)
);

/**
 * @swagger
 * /api/admins/credit-requests/export:
 *   get:
 *     summary: Export credit transfer report (CSV/JSON)
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/credit-requests/export", 
  adminAuth, 
  validateDateRange,
  asyncHandler(exportCreditReport)
);

/**
 * @swagger
 * /api/admins/credit-requests/bottlenecks:
 *   get:
 *     summary: Get approval pipeline bottleneck analysis
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credit-requests/bottlenecks", adminAuth, asyncHandler(getBottleneckAnalysis));

/**
 * @swagger
 * /api/admins/credit-requests/overdue:
 *   get:
 *     summary: Get all overdue credit requests
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credit-requests/overdue", adminAuth, asyncHandler(getOverdueCreditRequests));

/**
 * @swagger
 * /api/admins/credit-requests/reminders/stats:
 *   get:
 *     summary: Get reminder statistics for overdue credit requests
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credit-requests/reminders/stats", adminAuth, asyncHandler(getReminderStats));

/**
 * @swagger
 * /api/admins/credit-requests/reminders/send:
 *   post:
 *     summary: Manually trigger sending reminders for overdue credit requests
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.post("/credit-requests/reminders/send", adminAuth, asyncHandler(sendOverdueReminders));

/**
 * @swagger
 * /api/admins/credit-requests/reminders/schedule:
 *   post:
 *     summary: Schedule automatic reminder job
 *     tags: [Admin - Credit Transfer]
 *     security:
 *       - bearerAuth: []
 */
router.post("/credit-requests/reminders/schedule", adminAuth, asyncHandler(scheduleReminderJob));

/**
 * @swagger
 * /api/admins/reports/system:
 *   post:
 *     summary: Generate system report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/reports/system", adminAuth, asyncHandler(generateSystemReport));

/**
 * @swagger
 * /api/admins/analytics/system:
 *   get:
 *     summary: Get system-wide analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/analytics/system", adminAuth, asyncHandler(getAdminAnalytics));

/**
 * @swagger
 * /api/admins/analytics/college:
 *   get:
 *     summary: Get college analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/analytics/college", adminAuth, asyncHandler(getCollegeAnalytics));

/**
 * @swagger
 * /api/admins/system/health:
 *   get:
 *     summary: Get system health
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/system/health", adminAuth, asyncHandler(getSystemHealth));

/**
 * @swagger
 * /api/admins/ai/usage:
 *   get:
 *     summary: Get AI usage statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/ai/usage", adminAuth, asyncHandler(getAIUsageStats));

/**
 * @swagger
 * /api/admins/internships/{internshipId}/approve:
 *   post:
 *     summary: Approve internship (legacy endpoint)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/internships/:internshipId/approve", adminAuth, asyncHandler(approveInternship));

/**
 * @swagger
 * /api/admins/internships/{internshipId}/reject:
 *   post:
 *     summary: Reject internship (legacy endpoint)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/internships/:internshipId/reject", adminAuth, asyncHandler(rejectInternship));

/**
 * @swagger
 * /api/admins/internships:
 *   get:
 *     summary: Get internships (filter by status)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships", adminAuth, asyncHandler(getInternships));

// ============================================================================
// Internship Verification Workflow Routes (Task 10.1, 10.2)
// Requirements: 2.2, 2.3, 10.1, 10.2, 10.3, 10.4, 10.5
// ============================================================================

// ============================================================================
// Admin Internship Management Routes (Task 2.1)
// Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 4.1, 7.1, 8.1
// NOTE: These specific routes MUST come before parameterized routes like /internships/:id
// ============================================================================

/**
 * @swagger
 * /api/admins/internships/list:
 *   get:
 *     summary: List internships with filtering and pagination
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/internships/list",
  adminAuth,
  validatePagination,
  sanitizeSearchQuery,
  validateInternshipStatusFilter,
  validateWorkModeFilter,
  validateDateRange,
  asyncHandler(getInternshipsList)
);

/**
 * @swagger
 * /api/admins/internships/bulk-approve:
 *   post:
 *     summary: Bulk approve internships
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/internships/bulk-approve",
  adminAuth,
  adminBulkOperationRateLimiter,
  validateBulkOperationSize,
  asyncHandler(bulkApproveInternships)
);

/**
 * @swagger
 * /api/admins/internships/bulk-reject:
 *   post:
 *     summary: Bulk reject internships
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/internships/bulk-reject",
  adminAuth,
  adminBulkOperationRateLimiter,
  validateBulkOperationSize,
  validateBulkRejection,
  handleValidationErrors,
  asyncHandler(bulkRejectInternships)
);

/**
 * @swagger
 * /api/admins/internships/analytics:
 *   get:
 *     summary: Get internship analytics
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/internships/analytics",
  adminAuth,
  adminAnalyticsRateLimiter,
  validateDateRange,
  asyncHandler(getInternshipAnalytics)
);

/**
 * @swagger
 * /api/admins/internships/pending:
 *   get:
 *     summary: List pending internship verifications
 *     tags: [Admin - Internship Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 */
router.get(
  "/internships/pending",
  adminAuth,
  validatePagination,
  asyncHandler(getPendingInternshipVerifications)
);

/**
 * @swagger
 * /api/admins/internships/{id}/approve:
 *   post:
 *     summary: Approve internship posting
 *     tags: [Admin - Internship Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Internship ID
 */
router.post(
  "/internships/:id/approve",
  adminAuth,
  asyncHandler(approveInternshipVerification)
);

/**
 * @swagger
 * /api/admins/internships/{id}/reject:
 *   post:
 *     summary: Reject internship posting with reasons
 *     tags: [Admin - Internship Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Internship ID
 */
router.post(
  "/internships/:id/reject",
  adminAuth,
  asyncHandler(rejectInternshipVerification)
);

/**
 * @swagger
 * /api/admins/internships/{id}:
 *   get:
 *     summary: Get internship details with company history
 *     tags: [Admin - Internship Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Internship ID
 */
router.get(
  "/internships/:id",
  adminAuth,
  asyncHandler(getInternshipDetailsForAdmin)
);

/**
 * @swagger
 * /api/admins/analytics:
 *   get:
 *     summary: Get system-wide analytics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 */
router.get(
  "/analytics",
  adminAuth,
  validateDateRange,
  asyncHandler(getSystemAnalytics)
);

/**
 * @swagger
 * /api/admins/analytics/companies:
 *   get:
 *     summary: Get company performance metrics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [averageRating, internshipsPosted, applicationsReceived, completionRate]
 */
router.get(
  "/analytics/companies",
  adminAuth,
  validateDateRange,
  asyncHandler(getCompanyPerformanceMetrics)
);

/**
 * @swagger
 * /api/admins/analytics/departments:
 *   get:
 *     summary: Get department performance metrics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Specific department to analyze
 */
router.get(
  "/analytics/departments",
  adminAuth,
  validateDateRange,
  asyncHandler(getDepartmentPerformanceMetrics)
);

/**
 * @swagger
 * /api/admins/analytics/mentors:
 *   get:
 *     summary: Get mentor performance metrics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [approvalRate, approvalsProcessed, averageResponseTime, studentsSupervised]
 */
router.get(
  "/analytics/mentors",
  adminAuth,
  validateDateRange,
  asyncHandler(getMentorPerformanceMetrics)
);

/**
 * @swagger
 * /api/admins/analytics/students:
 *   get:
 *     summary: Get student performance metrics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: minReadinessScore
 *         schema:
 *           type: number
 *       - in: query
 *         name: minCredits
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
router.get(
  "/analytics/students",
  adminAuth,
  validatePagination,
  asyncHandler(getStudentPerformanceMetrics)
);

/**
 * @swagger
 * /api/admins/reappeals:
 *   get:
 *     summary: Get all reappeal requests with filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/reappeals", adminAuth, asyncHandler(getReappeals));

/**
 * @swagger
 * /api/admins/reappeals/{companyId}/approve:
 *   post:
 *     summary: Approve a reappeal request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/reappeals/:companyId/approve", 
  adminAuth, 
  reappealApproval, 
  handleValidationErrors, 
  asyncHandler(approveReappeal)
);

/**
 * @swagger
 * /api/admins/reappeals/{companyId}/reject:
 *   post:
 *     summary: Reject a reappeal request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/reappeals/:companyId/reject", 
  adminAuth, 
  reappealRejection, 
  handleValidationErrors, 
  asyncHandler(rejectReappeal)
);

// ============================================================================
// Admin Internship Management Routes - Parameterized Routes
// Requirements: 2.1, 3.1, 4.1, 7.1
// NOTE: These parameterized routes come AFTER specific routes
// ============================================================================

/**
 * @swagger
 * /api/admins/internships/:id/details:
 *   get:
 *     summary: Get detailed internship information
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/internships/:id/details",
  adminAuth,
  asyncHandler(getInternshipDetail)
);

/**
 * @swagger
 * /api/admins/internships/:id/approve-posting:
 *   post:
 *     summary: Approve an internship posting
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/internships/:id/approve-posting",
  adminAuth,
  validateInternshipApproval,
  handleValidationErrors,
  asyncHandler(approveInternshipPosting)
);

/**
 * @swagger
 * /api/admins/internships/:id/reject-posting:
 *   post:
 *     summary: Reject an internship posting
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/internships/:id/reject-posting",
  adminAuth,
  validateInternshipRejection,
  handleValidationErrors,
  asyncHandler(rejectInternshipPosting)
);

/**
 * @swagger
 * /api/admins/internships/:id/edit:
 *   patch:
 *     summary: Edit internship details (legacy route)
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/internships/:id/edit",
  adminAuth,
  validateInternshipEdit,
  handleValidationErrors,
  asyncHandler(editInternshipDetails)
);

/**
 * @swagger
 * /api/admins/internships/:id:
 *   patch:
 *     summary: Update internship details
 *     tags: [Admin - Internship Management]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/internships/:id",
  adminAuth,
  validateInternshipEdit,
  handleValidationErrors,
  asyncHandler(editInternshipDetails)
);

export default router;

// ============================================================================
// MAINTENANCE TASKS
// ============================================================================

/**
 * @swagger
 * /api/admins/maintenance/close-expired-internships:
 *   post:
 *     summary: Close expired internships
 *     description: Manually trigger closing of internships past their deadline (Admin only)
 *     tags: [Admin - Maintenance]
 *     security:
 *       - bearerAuth: []
 */
router.post("/maintenance/close-expired-internships", adminAuth, asyncHandler(closeExpiredInternships));

/**
 * @swagger
 * /api/admins/maintenance/generate-analytics-snapshot:
 *   post:
 *     summary: Generate analytics snapshot
 *     description: Manually trigger analytics snapshot generation (Admin only)
 *     tags: [Admin - Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *                 default: daily
 */
router.post("/maintenance/generate-analytics-snapshot", adminAuth, asyncHandler(generateAnalyticsSnapshot));
