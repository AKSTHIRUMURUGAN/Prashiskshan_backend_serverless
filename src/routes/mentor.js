import { Router } from "express";
import {
  getMentorDashboard,
  getPendingApplications,
  getApplicationDetails,
  approveApplication,
  rejectApplication,
  getPendingLogbooks,
  getLogbookDetails,
  approveLogbook,
  requestLogbookRevision,
  getSkillGapAnalysis,
  getDepartmentPerformance,
  createIntervention,
  getInterventions,
  getStudentProgress,
  getMyStudents,
  getPendingCreditRequests,
  approveCreditRequest,
} from "../controllers/mentorController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const mentorAuth = [authenticate, identifyUser, authorize("mentor")];

/**
 * @swagger
 * /api/mentors/dashboard:
 *   get:
 *     summary: Get mentor dashboard
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", mentorAuth, asyncHandler(getMentorDashboard));

/**
 * @swagger
 * /api/mentors/applications/pending:
 *   get:
 *     summary: Get pending applications
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/applications/pending", mentorAuth, asyncHandler(getPendingApplications));

/**
 * @swagger
 * /api/mentors/applications/{applicationId}:
 *   get:
 *     summary: Get application details
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/applications/:applicationId", mentorAuth, asyncHandler(getApplicationDetails));

/**
 * @swagger
 * /api/mentors/applications/{applicationId}/approve:
 *   post:
 *     summary: Approve application
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/applications/:applicationId/approve", mentorAuth, asyncHandler(approveApplication));

/**
 * @swagger
 * /api/mentors/applications/{applicationId}/reject:
 *   post:
 *     summary: Reject application
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/applications/:applicationId/reject", mentorAuth, asyncHandler(rejectApplication));

/**
 * @swagger
 * /api/mentors/logbooks/pending:
 *   get:
 *     summary: Get pending logbooks
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/logbooks/pending", mentorAuth, asyncHandler(getPendingLogbooks));

/**
 * @swagger
 * /api/mentors/logbooks/{logbookId}:
 *   get:
 *     summary: Get logbook details
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/logbooks/:logbookId", mentorAuth, asyncHandler(getLogbookDetails));

/**
 * @swagger
 * /api/mentors/logbooks/{logbookId}/approve:
 *   post:
 *     summary: Approve logbook
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/logbooks/:logbookId/approve", mentorAuth, asyncHandler(approveLogbook));

/**
 * @swagger
 * /api/mentors/logbooks/{logbookId}/revision:
 *   post:
 *     summary: Request logbook revision
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/logbooks/:logbookId/revision", mentorAuth, asyncHandler(requestLogbookRevision));

/**
 * @swagger
 * /api/mentors/skill-gaps:
 *   get:
 *     summary: Get skill gap analysis
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/skill-gaps", mentorAuth, asyncHandler(getSkillGapAnalysis));

/**
 * @swagger
 * /api/mentors/department/performance:
 *   get:
 *     summary: Get department performance
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/department/performance", mentorAuth, asyncHandler(getDepartmentPerformance));

/**
 * @swagger
 * /api/mentors/interventions:
 *   post:
 *     summary: Create intervention
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/interventions", mentorAuth, asyncHandler(createIntervention));

/**
 * @swagger
 * /api/mentors/interventions:
 *   get:
 *     summary: Get all interventions
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/interventions", mentorAuth, asyncHandler(getInterventions));

/**
 * @swagger
 * /api/mentors/students/{studentId}/progress:
 *   get:
 *     summary: Get student progress
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/students/:studentId/progress", mentorAuth, asyncHandler(getStudentProgress));

/**
 * @swagger
 * /api/mentors/students:
 *   get:
 *     summary: Get assigned students
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/students", mentorAuth, asyncHandler(getMyStudents));

/**
 * @swagger
 * /api/mentors/credits/pending:
 *   get:
 *     summary: Get pending credit requests
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credits/pending", mentorAuth, asyncHandler(getPendingCreditRequests));

/**
 * @swagger
 * /api/mentors/credits/{requestId}/decide:
 *   post:
 *     summary: Approve (escalate) or reject credit request
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/credits/:requestId/decide", mentorAuth, asyncHandler(approveCreditRequest));

export default router;
