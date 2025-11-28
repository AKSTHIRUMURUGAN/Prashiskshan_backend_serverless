import { Router } from "express";
import {
  getCompanyDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  createInternship,
  updateInternship,
  deleteInternship,
  getCompanyInternships,
  getInternshipById,
  getApplicants,
  reviewApplications,
  shortlistCandidates,
  rejectCandidates,
  getInternsProgress,
  provideLogbookFeedback,
  markInternshipComplete,
  createEvent,
  createChallenge,
  getCompanyApplications,
  getCompanyInterns,
  getCompanyInternLogbooks,
  completeInternship,
} from "../controllers/companyController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { internshipCreation, handleValidationErrors } from "../middleware/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const companyAuth = [authenticate, identifyUser, authorize("company")];

/**
 * @swagger
 * /api/companies/applications:
 *   get:
 *     summary: Get company applications
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: internshipId
 *         schema:
 *           type: string
 *         description: Filter by internship ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by application status
 */
router.get("/applications", companyAuth, asyncHandler(getCompanyApplications));

/**
 * @swagger
 * /api/companies/dashboard:
 *   get:
 *     summary: Get company dashboard
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", companyAuth, asyncHandler(getCompanyDashboard));

/**
 * @swagger
 * /api/companies/profile:
 *   get:
 *     summary: Get company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/profile", companyAuth, asyncHandler(getCompanyProfile));

/**
 * @swagger
 * /api/companies/profile:
 *   patch:
 *     summary: Update company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/profile", companyAuth, asyncHandler(updateCompanyProfile));

/**
 * @swagger
 * /api/companies/internships:
 *   post:
 *     summary: Create new internship
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/internships",
  companyAuth,
  internshipCreation,
  handleValidationErrors,
  asyncHandler(createInternship),
);

/**
 * @swagger
 * /api/companies/internships:
 *   get:
 *     summary: Get all company internships
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships", companyAuth, asyncHandler(getCompanyInternships));

/**
 * @swagger
 * /api/companies/internships/{internshipId}:
 *   get:
 *     summary: Get internship by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships/:internshipId", companyAuth, asyncHandler(getInternshipById));

/**
 * @swagger
 * /api/companies/internships/{internshipId}:
 *   patch:
 *     summary: Update internship
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/internships/:internshipId", companyAuth, asyncHandler(updateInternship));

/**
 * @swagger
 * /api/companies/internships/{internshipId}:
 *   delete:
 *     summary: Delete internship
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/internships/:internshipId", companyAuth, asyncHandler(deleteInternship));

/**
 * @swagger
 * /api/companies/internships/{internshipId}/complete:
 *   post:
 *     summary: Mark internship as complete
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/internships/:internshipId/complete", companyAuth, asyncHandler(markInternshipComplete));

/**
 * @swagger
 * /api/companies/internships/{internshipId}/applicants:
 *   get:
 *     summary: Get applicants for internship
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/internships/:internshipId/applicants", companyAuth, asyncHandler(getApplicants));

/**
 * @swagger
 * /api/companies/applications/review:
 *   post:
 *     summary: Review applications
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/applications/review", companyAuth, asyncHandler(reviewApplications));

/**
 * @swagger
 * /api/companies/applications/shortlist:
 *   post:
 *     summary: Shortlist candidates
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/applications/shortlist", companyAuth, asyncHandler(shortlistCandidates));

/**
 * @swagger
 * /api/companies/applications/reject:
 *   post:
 *     summary: Reject candidates
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/applications/reject", companyAuth, asyncHandler(rejectCandidates));

/**
 * @swagger
 * /api/companies/interns:
 *   get:
 *     summary: Get active interns
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/interns", companyAuth, asyncHandler(getCompanyInterns));

/**
 * @swagger
 * /api/companies/interns/progress:
 *   get:
 *     summary: Get intern progress
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/interns/progress", companyAuth, asyncHandler(getInternsProgress));

/**
 * @swagger
 * /api/companies/interns/{studentId}/logbooks:
 *   get:
 *     summary: Get intern logbooks
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/interns/:studentId/logbooks", companyAuth, asyncHandler(getCompanyInternLogbooks));

/**
 * @swagger
 * /api/companies/interns/{applicationId}/complete:
 *   post:
 *     summary: Mark internship as complete
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/interns/:applicationId/complete", companyAuth, asyncHandler(completeInternship));

/**
 * @swagger
 * /api/companies/logbooks/{logbookId}/feedback:
 *   post:
 *     summary: Provide logbook feedback
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/logbooks/:logbookId/feedback", companyAuth, asyncHandler(provideLogbookFeedback));

/**
 * @swagger
 * /api/companies/events:
 *   post:
 *     summary: Create event
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/events", companyAuth, asyncHandler(createEvent));

/**
 * @swagger
 * /api/companies/challenges:
 *   post:
 *     summary: Create challenge
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.post("/challenges", companyAuth, asyncHandler(createChallenge));

export default router;
