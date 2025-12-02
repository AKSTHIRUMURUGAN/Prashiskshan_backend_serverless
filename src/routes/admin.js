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
  getImportJobStatus,
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
} from "../controllers/adminController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
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
} from "../middleware/validation.js";

const router = Router();
const adminAuth = [authenticate, identifyUser, authorize("admin")];

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
 * /api/admins/students/import:
 *   post:
 *     summary: Bulk import students
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/students/import", adminAuth, asyncHandler(bulkImportStudents));

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
 *     summary: Approve internship
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/internships/:internshipId/approve", adminAuth, asyncHandler(approveInternship));

/**
 * @swagger
 * /api/admins/internships/{internshipId}/reject:
 *   post:
 *     summary: Reject internship
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

export default router;
