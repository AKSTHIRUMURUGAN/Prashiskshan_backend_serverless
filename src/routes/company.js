import { Router } from "express";
import multer from "multer";
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
  reAppeal,
  submitReappeal,
  getReappealStatus,
  markCompletionComplete,
  getCompletedInternships,
} from "../controllers/companyController.js";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { 
  internshipCreation, 
  companyProfileUpdate, 
  handleValidationErrors,
  reappealSubmission,
  validateReappealAttachment,
  validateReappealEligibility,
  markCompletionCompleteValidation
} from "../middleware/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { reappealRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();
const companyAuth = [authenticate, identifyUser, authorize("company")];

const reappealUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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
router.patch("/profile", companyAuth, companyProfileUpdate, handleValidationErrors, asyncHandler(updateCompanyProfile));

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

/**
 * @swagger
 * /api/companies/re-appeal:
 *   post:
 *     summary: Re-appeal rejection
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Re-appeal submitted successfully
 *       400:
 *         description: Only rejected companies can re-appeal
 */
router.post("/re-appeal", companyAuth, asyncHandler(reAppeal));

/**
 * @swagger
 * /api/companies/reappeal:
 *   post:
 *     summary: Submit reappeal request for blocked company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: Reappeal message explaining why the company should be unblocked
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: Optional supporting document (PDF, JPG, PNG, max 10MB)
 *     responses:
 *       200:
 *         description: Reappeal submitted successfully
 *       400:
 *         description: Validation error or invalid status
 *       403:
 *         description: Cooldown period active
 *       429:
 *         description: Too many reappeal attempts
 */
router.post(
  "/reappeal", 
  companyAuth, 
  reappealRateLimiter,
  reappealUpload.single("attachment"),
  validateReappealEligibility,
  reappealSubmission,
  handleValidationErrors,
  validateReappealAttachment,
  asyncHandler(submitReappeal)
);

/**
 * @swagger
 * /api/companies/reappeal/status:
 *   get:
 *     summary: Get reappeal status for blocked company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reappeal status retrieved successfully
 */
router.get("/reappeal/status", companyAuth, asyncHandler(getReappealStatus));

/**
 * @swagger
 * /api/companies/completions/:completionId/mark-complete:
 *   put:
 *     summary: Mark internship completion as complete
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: completionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The completion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evaluationScore
 *               - evaluationComments
 *             properties:
 *               evaluationScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Company evaluation score (0-10)
 *               evaluationComments:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Company evaluation comments
 *     responses:
 *       200:
 *         description: Internship completion marked as complete
 *       400:
 *         description: Validation error or milestones not met
 *       404:
 *         description: Completion not found
 */
router.put(
  "/completions/:completionId/mark-complete",
  companyAuth,
  markCompletionCompleteValidation,
  handleValidationErrors,
  asyncHandler(markCompletionComplete)
);

/**
 * @swagger
 * /api/companies/completions/completed:
 *   get:
 *     summary: Get list of completed internships
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of completed internships
 */
router.get(
  "/completions/completed",
  companyAuth,
  asyncHandler(getCompletedInternships)
);

export default router;
