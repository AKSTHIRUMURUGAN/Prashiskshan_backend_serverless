import { Router } from "express";
import {
  getStudentDashboard,
  browseInternships,
  getRecommendedInternships,
  applyToInternship,
  getMyApplications,
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
} from "../controllers/studentController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { aiFeatureLimit } from "../middleware/rateLimiter.js";
import { applicationSubmit, logbookSubmission, handleValidationErrors } from "../middleware/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const studentAuth = [authenticate, identifyUser, authorize("student")];

/**
 * @swagger
 * /api/students/dashboard:
 *   get:
 *     summary: Get student dashboard
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", studentAuth, asyncHandler(getStudentDashboard));

/**
 * @swagger
 * /api/students/internships:
 *   get:
 *     summary: Browse available internships
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
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
 * /api/students/applications:
 *   post:
 *     summary: Apply to internship
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/applications",
  studentAuth,
  applicationSubmit,
  handleValidationErrors,
  asyncHandler(applyToInternship),
);

/**
 * @swagger
 * /api/students/applications:
 *   get:
 *     summary: Get my applications
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get("/applications", studentAuth, asyncHandler(getMyApplications));

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

export default router;
