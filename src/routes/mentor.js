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
  getMentorPendingCreditRequests,
  getMentorCreditRequestDetails,
  submitMentorCreditReview,
  getMentorCreditReviewHistory,
  getMentorCreditAnalytics,
  getPendingInternships,
  getMentorInternships,
  getInternshipDetails,
  approveInternship,
  rejectInternship,
  getAssignedStudents,
  getStudentDetails,
  getStudentApplications,
  getMentorAnalytics,
  getDepartmentAnalytics,
} from "../controllers/mentorController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { 
  mentorReviewSubmission, 
  handleValidationErrors,
  validateObjectIdParam,
  validatePagination,
  validateStatusFilter,
  validateDateRange,
  validateSort,
} from "../middleware/validation.js";

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

// Internship Approval Endpoints (Requirements: 3.1, 3.2, 3.3)

/**
 * @swagger
 * /api/mentor/internships/pending:
 *   get:
 *     summary: List pending internships for mentor approval
 *     tags: [Mentors, Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: postedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 */
router.get("/internships/pending", mentorAuth, asyncHandler(getPendingInternships));

/**
 * @swagger
 * /api/mentor/internships:
 *   get:
 *     summary: Get all internships with filtering
 *     tags: [Mentors, Internships]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships", mentorAuth, asyncHandler(getMentorInternships));

/**
 * @swagger
 * /api/mentor/internships/{internshipId}:
 *   get:
 *     summary: Get internship details for review
 *     tags: [Mentors, Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: internshipId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/internships/:internshipId", mentorAuth, asyncHandler(getInternshipDetails));

/**
 * @swagger
 * /api/mentor/internships/{internshipId}/approve:
 *   post:
 *     summary: Approve internship for department
 *     tags: [Mentors, Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: internshipId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Optional approval comments
 */
router.post("/internships/:internshipId/approve", mentorAuth, asyncHandler(approveInternship));

/**
 * @swagger
 * /api/mentor/internships/{internshipId}/reject:
 *   post:
 *     summary: Reject internship with reasons
 *     tags: [Mentors, Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: internshipId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reasons
 *             properties:
 *               reasons:
 *                 type: string
 *                 description: Rejection reasons
 */
router.post("/internships/:internshipId/reject", mentorAuth, asyncHandler(rejectInternship));

// Student Management Endpoints (Requirements: 8.2, 8.4, 8.5)

/**
 * @swagger
 * /api/mentor/students:
 *   get:
 *     summary: List assigned students with filters
 *     tags: [Mentors, Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: profile.name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: internshipStatus
 *         schema:
 *           type: string
 *           enum: [active, applied, none]
 *       - in: query
 *         name: performanceLevel
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *       - in: query
 *         name: creditCompletion
 *         schema:
 *           type: string
 *           enum: [completed, in_progress, not_started]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get("/students/list", mentorAuth, asyncHandler(getAssignedStudents));

/**
 * @swagger
 * /api/mentor/students/{studentId}:
 *   get:
 *     summary: Get student details with internship history
 *     tags: [Mentors, Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/students/:studentId/details", mentorAuth, asyncHandler(getStudentDetails));

/**
 * @swagger
 * /api/mentor/students/{studentId}/applications:
 *   get:
 *     summary: Get student applications
 *     tags: [Mentors, Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get("/students/:studentId/applications", mentorAuth, asyncHandler(getStudentApplications));

// Analytics Endpoints (Requirements: 8.1, 8.3)

/**
 * @swagger
 * /api/mentor/analytics:
 *   get:
 *     summary: Get mentor-specific analytics
 *     tags: [Mentors, Analytics]
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
 */
router.get("/analytics", mentorAuth, asyncHandler(getMentorAnalytics));

/**
 * @swagger
 * /api/mentor/analytics/department:
 *   get:
 *     summary: Get department analytics
 *     tags: [Mentors, Analytics]
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
 */
router.get("/analytics/department", mentorAuth, asyncHandler(getDepartmentAnalytics));

/**
 * @swagger
 * /api/mentors/credits/pending:
 *   get:
 *     summary: Get pending credit requests (legacy)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.get("/credits/pending", mentorAuth, asyncHandler(getPendingCreditRequests));

/**
 * @swagger
 * /api/mentors/credits/{requestId}/decide:
 *   post:
 *     summary: Approve (escalate) or reject credit request (legacy)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 */
router.post("/credits/:requestId/decide", mentorAuth, asyncHandler(approveCreditRequest));

// New Credit Request Review Endpoints

/**
 * @swagger
 * /api/mentors/{mentorId}/credit-requests/pending:
 *   get:
 *     summary: Get pending credit requests for mentor review
 *     tags: [Mentors, Credit Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: requestedAt
 *         description: Sort field
 */
router.get(
  "/:mentorId/credit-requests/pending",
  mentorAuth,
  validateObjectIdParam("mentorId"),
  validatePagination,
  validateSort(["requestedAt", "status", "studentId"]),
  asyncHandler(getMentorPendingCreditRequests)
);

/**
 * @swagger
 * /api/mentors/{mentorId}/credit-requests/{requestId}:
 *   get:
 *     summary: Get credit request details for review
 *     tags: [Mentors, Credit Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor ID
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Credit Request ID
 */
router.get(
  "/:mentorId/credit-requests/:requestId",
  mentorAuth,
  validateObjectIdParam("mentorId"),
  validateObjectIdParam("requestId"),
  asyncHandler(getMentorCreditRequestDetails)
);

/**
 * @swagger
 * /api/mentors/{mentorId}/credit-requests/{requestId}/review:
 *   post:
 *     summary: Submit mentor review (approve/reject)
 *     tags: [Mentors, Credit Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor ID
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Credit Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected]
 *               feedback:
 *                 type: string
 *                 description: Required when rejecting
 *               qualityCriteria:
 *                 type: object
 *                 properties:
 *                   logbookComplete:
 *                     type: boolean
 *                   reportQuality:
 *                     type: boolean
 *                   learningOutcomes:
 *                     type: boolean
 *                   companyEvaluation:
 *                     type: boolean
 */
router.post(
  "/:mentorId/credit-requests/:requestId/review",
  mentorAuth,
  validateObjectIdParam("mentorId"),
  validateObjectIdParam("requestId"),
  mentorReviewSubmission,
  handleValidationErrors,
  asyncHandler(submitMentorCreditReview)
);

/**
 * @swagger
 * /api/mentors/{mentorId}/credit-requests/history:
 *   get:
 *     summary: Get mentor's review history
 *     tags: [Mentors, Credit Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter (startDate,endDate)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 */
router.get(
  "/:mentorId/credit-requests/history",
  mentorAuth,
  validateObjectIdParam("mentorId"),
  validatePagination,
  validateStatusFilter,
  validateDateRange,
  asyncHandler(getMentorCreditReviewHistory)
);

/**
 * @swagger
 * /api/mentors/{mentorId}/credit-requests/analytics:
 *   get:
 *     summary: Get mentor review analytics
 *     tags: [Mentors, Credit Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor ID
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter (startDate,endDate)
 */
router.get(
  "/:mentorId/credit-requests/analytics",
  mentorAuth,
  validateObjectIdParam("mentorId"),
  validateDateRange,
  asyncHandler(getMentorCreditAnalytics)
);

export default router;
