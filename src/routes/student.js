import { Router } from "express";
import {
  getStudentDashboard,
  getStudentProfile,
  browseInternships,
  getInternshipDetails,
  getRecommendedInternships,
  applyToInternship,
  getMyApplications,
  getApplicationDetails,
  withdrawApplication,
  getRecommendedModules,
  startModule,
  completeModule,
  startInterviewPractice,
  submitInterviewAnswer,
  endInterview,
  getInterviewHistory,
  submitLogbook,
  getMyLogbooks,
  getCreditsSummary,
  generateNEPReport,
  chatbotQuery,
  getCompletedInternshipsWithCreditStatus,
} from "../controllers/studentController.js";
import {
  createCreditRequest,
  getStudentCreditRequests,
  getCreditRequestDetails,
  resubmitCreditRequest,
  getCreditRequestStatus,
  sendReviewReminder,
  getCreditHistory,
  downloadCertificate,
} from "../controllers/creditRequestController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { aiFeatureLimit } from "../middleware/rateLimiter.js";
import { 
  applicationSubmit, 
  logbookSubmission, 
  creditRequestCreation,
  creditRequestResubmission,
  handleValidationErrors,
  validateObjectIdParam,
  validatePagination,
  validateStatusFilter,
  validateDateRange,
} from "../middleware/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const studentAuth = [authenticate, identifyUser, authorize("student")];

/**
 * @swagger
 * /api/students/dashboard:
 *   get:
 *     summary: Get student dashboard with mentor info
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", studentAuth, asyncHandler(getStudentDashboard));

/**
 * @swagger
 * /api/students/profile:
 *   get:
 *     summary: Get profile with credits and history
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/profile", studentAuth, asyncHandler(getStudentProfile));

/**
 * @swagger
 * /api/students/internships:
 *   get:
 *     summary: Browse available internships with AI match scores
 *     tags: [Students]
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
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: workMode
 *         schema:
 *           type: string
 *           enum: [remote, onsite, hybrid]
 *         description: Filter by work mode
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated list of skills
 *       - in: query
 *         name: minStipend
 *         schema:
 *           type: number
 *         description: Minimum stipend
 *       - in: query
 *         name: maxStipend
 *         schema:
 *           type: number
 *         description: Maximum stipend
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: includeMatchScore
 *         schema:
 *           type: boolean
 *         description: Include AI match scores
 */
router.get("/internships", studentAuth, asyncHandler(browseInternships));

/**
 * @swagger
 * /api/students/internships/recommended:
 *   get:
 *     summary: Get recommended internships
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships/recommended", studentAuth, asyncHandler(getRecommendedInternships));

/**
 * @swagger
 * /api/students/internships/completed:
 *   get:
 *     summary: Get completed internships with credit request availability
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships/completed", studentAuth, asyncHandler(getCompletedInternshipsWithCreditStatus));

/**
 * @swagger
 * /api/students/internships/{internshipId}:
 *   get:
 *     summary: Get internship details with match analysis
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: internshipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Internship ID
 */
router.get("/internships/:internshipId", studentAuth, asyncHandler(getInternshipDetails));

/**
 * @swagger
 * /api/students/internships/{internshipId}/apply:
 *   post:
 *     summary: Apply to internship
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: internshipId
 *         required: true
 *         schema:
 *           type: string
 *         description: Internship ID
 */
router.post(
  "/internships/:internshipId/apply",
  studentAuth,
  applicationSubmit,
  handleValidationErrors,
  asyncHandler(applyToInternship),
);

/**
 * @swagger
 * /api/students/applications:
 *   get:
 *     summary: List my applications with status
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 */
router.get("/applications", studentAuth, asyncHandler(getMyApplications));

/**
 * @swagger
 * /api/students/applications/{applicationId}:
 *   get:
 *     summary: Get application details
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 */
router.get("/applications/:applicationId", studentAuth, asyncHandler(getApplicationDetails));

/**
 * @swagger
 * /api/students/applications/{applicationId}:
 *   delete:
 *     summary: Withdraw application
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/applications/:applicationId", studentAuth, asyncHandler(withdrawApplication));

/**
 * @swagger
 * /api/students/modules/recommended:
 *   get:
 *     summary: Get recommended modules
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/modules/recommended", studentAuth, asyncHandler(getRecommendedModules));

/**
 * @swagger
 * /api/students/modules/start:
 *   post:
 *     summary: Start a learning module
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/modules/start", studentAuth, asyncHandler(startModule));

/**
 * @swagger
 * /api/students/modules/complete:
 *   post:
 *     summary: Complete a learning module
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/modules/complete", studentAuth, asyncHandler(completeModule));

/**
 * @swagger
 * /api/students/interviews/start:
 *   post:
 *     summary: Start interview practice
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/interviews/start", studentAuth, aiFeatureLimit("interview"), asyncHandler(startInterviewPractice));

/**
 * @swagger
 * /api/students/interviews/answer:
 *   post:
 *     summary: Submit interview answer
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/interviews/answer", studentAuth, aiFeatureLimit("interview"), asyncHandler(submitInterviewAnswer));

/**
 * @swagger
 * /api/students/interviews/end:
 *   post:
 *     summary: End interview session
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/interviews/end", studentAuth, asyncHandler(endInterview));

/**
 * @swagger
 * /api/students/interviews/history:
 *   get:
 *     summary: Get interview history
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/interviews/history", studentAuth, asyncHandler(getInterviewHistory));

/**
 * @swagger
 * /api/students/logbooks:
 *   post:
 *     summary: Submit logbook
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/logbooks",
  studentAuth,
  logbookSubmission,
  handleValidationErrors,
  asyncHandler(submitLogbook),
);

/**
 * @swagger
 * /api/students/logbooks:
 *   get:
 *     summary: Get my logbooks
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/logbooks", studentAuth, asyncHandler(getMyLogbooks));

/**
 * @swagger
 * /api/students/credits:
 *   get:
 *     summary: Get credits summary
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credits", studentAuth, asyncHandler(getCreditsSummary));

/**
 * @swagger
 * /api/students/reports/nep:
 *   post:
 *     summary: Generate NEP report
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/reports/nep", studentAuth, asyncHandler(generateNEPReport));

/**
 * @swagger
 * /api/students/chatbot:
 *   post:
 *     summary: Chatbot query
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post("/chatbot", studentAuth, aiFeatureLimit("chatbot"), asyncHandler(chatbotQuery));

/**
 * @swagger
 * /api/students/:studentId/credit-requests:
 *   post:
 *     summary: Create a new credit request
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:studentId/credit-requests",
  studentAuth,
  validateObjectIdParam("studentId"),
  creditRequestCreation,
  handleValidationErrors,
  asyncHandler(createCreditRequest)
);

/**
 * @swagger
 * /api/students/:studentId/credit-requests:
 *   get:
 *     summary: Get all credit requests for a student
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:studentId/credit-requests",
  studentAuth,
  validateObjectIdParam("studentId"),
  validatePagination,
  validateStatusFilter,
  validateDateRange,
  asyncHandler(getStudentCreditRequests)
);

/**
 * @swagger
 * /api/students/:studentId/credit-requests/:requestId:
 *   get:
 *     summary: Get credit request details
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:studentId/credit-requests/:requestId",
  studentAuth,
  validateObjectIdParam("studentId"),
  validateObjectIdParam("requestId"),
  asyncHandler(getCreditRequestDetails)
);

/**
 * @swagger
 * /api/students/:studentId/credit-requests/:requestId/resubmit:
 *   put:
 *     summary: Resubmit a rejected credit request
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:studentId/credit-requests/:requestId/resubmit",
  studentAuth,
  validateObjectIdParam("studentId"),
  validateObjectIdParam("requestId"),
  creditRequestResubmission,
  handleValidationErrors,
  asyncHandler(resubmitCreditRequest)
);

/**
 * @swagger
 * /api/students/:studentId/credit-requests/:requestId/status:
 *   get:
 *     summary: Get real-time status of a credit request
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:studentId/credit-requests/:requestId/status",
  studentAuth,
  asyncHandler(getCreditRequestStatus)
);

/**
 * @swagger
 * /api/students/:studentId/credit-requests/:requestId/reminder:
 *   post:
 *     summary: Send a reminder to the current reviewer
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:studentId/credit-requests/:requestId/reminder",
  studentAuth,
  asyncHandler(sendReviewReminder)
);

/**
 * @swagger
 * /api/students/:studentId/credits/history:
 *   get:
 *     summary: Get credit history for a student
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:studentId/credits/history",
  studentAuth,
  asyncHandler(getCreditHistory)
);

/**
 * @swagger
 * /api/students/:studentId/credits/certificate/:requestId:
 *   get:
 *     summary: Download credit transfer certificate
 *     tags: [Students, Credit Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:studentId/credits/certificate/:requestId",
  studentAuth,
  asyncHandler(downloadCertificate)
);

export default router;
