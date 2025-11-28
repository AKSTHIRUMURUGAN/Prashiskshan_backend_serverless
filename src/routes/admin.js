import { Router } from "express";
import {
  getAdminDashboard,
  getPendingCompanies,
  getCompanies,
  getCompanyDetails,
  verifyCompany,
  rejectCompany,
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
  approveCredits,
} from "../controllers/adminController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
 * /api/admins/credits/pending:
 *   get:
 *     summary: Get pending credit requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credits/pending", adminAuth, asyncHandler(getPendingCreditApprovals));

/**
 * @swagger
 * /api/admins/credits/{requestId}/decide:
 *   post:
 *     summary: Approve or reject credit request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/credits/:requestId/decide", adminAuth, asyncHandler(approveCredits));

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

export default router;
