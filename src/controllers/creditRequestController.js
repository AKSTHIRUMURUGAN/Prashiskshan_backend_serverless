import mongoose from "mongoose";
import CreditRequest from "../models/CreditRequest.js";
import InternshipCompletion from "../models/InternshipCompletion.js";
import Student from "../models/Student.js";
import { creditService } from "../services/creditService.js";
import { creditNotificationService } from "../services/creditNotificationService.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";
import { logger } from "../utils/logger.js";

const ensureStudentContext = async (req) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "student") {
    throw createHttpError(403, "Only students can access this resource");
  }
  return context.doc;
};

const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * POST /api/students/:studentId/credit-requests
 * Create a new credit request for a completed internship
 */
export const createCreditRequest = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId } = req.params;
    const { internshipCompletionId } = req.body;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot create credit request for another student");
    }

    if (!internshipCompletionId) {
      throw createHttpError(400, "internshipCompletionId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(internshipCompletionId)) {
      throw createHttpError(400, "Invalid internshipCompletionId");
    }

    // Create credit request using service
    const creditRequest = await creditService.createCreditRequest(
      student._id,
      internshipCompletionId
    );

    // Send notifications
    await creditNotificationService.notifyStudentRequestCreated(creditRequest);
    await creditNotificationService.notifyMentorNewRequest(creditRequest);

    res.status(201).json(
      apiSuccess(
        { creditRequest },
        "Credit request created successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:studentId/credit-requests
 * Get all credit requests for a student with filtering and sorting
 */
export const getStudentCreditRequests = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId } = req.params;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot view credit requests for another student");
    }

    const { page, limit } = buildPagination(req);
    const { status, dateFrom, dateTo, sortBy, sortOrder } = req.query;

    const filters = {
      page,
      limit,
    };

    // Add optional filters
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.sortOrder = sortOrder;

    const result = await creditService.getCreditRequestsByStudent(student._id, filters);

    res.json(
      apiSuccess(
        {
          items: result.creditRequests,
          pagination: result.pagination,
        },
        "Credit requests retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:studentId/credit-requests/:requestId
 * Get detailed information about a specific credit request
 */
export const getCreditRequestDetails = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId, requestId } = req.params;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot view credit requests for another student");
    }

    const creditRequest = await creditService.getCreditRequestById(requestId);

    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    // Verify the credit request belongs to this student
    if (creditRequest.studentId.toString() !== student._id.toString()) {
      throw createHttpError(403, "Cannot view credit request for another student");
    }

    // Calculate progress indicator and timeline
    const progress = creditService.calculateProgressIndicator(creditRequest);
    const timeline = creditService.calculateExpectedTimeline(creditRequest);

    res.json(
      apiSuccess(
        { 
          creditRequest,
          progress,
          timeline
        },
        "Credit request details retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:studentId/credit-requests/:requestId/resubmit
 * Resubmit a rejected credit request
 */
export const resubmitCreditRequest = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId, requestId } = req.params;
    const { notes } = req.body;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot resubmit credit request for another student");
    }

    const creditRequest = await CreditRequest.findOne({ creditRequestId: requestId });

    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    // Verify the credit request belongs to this student
    if (creditRequest.studentId.toString() !== student._id.toString()) {
      throw createHttpError(403, "Cannot resubmit credit request for another student");
    }

    // Verify the request is in a rejected state
    if (creditRequest.status !== "mentor_rejected" && creditRequest.status !== "pending_student_action") {
      throw createHttpError(400, "Only rejected credit requests can be resubmitted");
    }

    // Add to submission history
    creditRequest.submissionHistory.push({
      submittedAt: new Date(),
      status: creditRequest.status,
      reviewedBy: creditRequest.mentorReview?.reviewedBy,
      reviewedAt: creditRequest.mentorReview?.reviewedAt,
      feedback: creditRequest.mentorReview?.feedback,
    });

    // Update status to resubmitted
    creditRequest.status = "pending_mentor_review";
    creditRequest.lastUpdatedAt = new Date();

    // Add metadata about resubmission
    if (notes) {
      creditRequest.metadata.resubmissionNotes = notes;
    }

    await creditRequest.save();

    // Notify mentor about resubmission
    await creditNotificationService.notifyMentorNewRequest(creditRequest);

    res.json(
      apiSuccess(
        { creditRequest },
        "Credit request resubmitted successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:studentId/credit-requests/:requestId/status
 * Get real-time status of a credit request
 */
export const getCreditRequestStatus = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId, requestId } = req.params;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot view credit request status for another student");
    }

    const creditRequest = await CreditRequest.findOne({ creditRequestId: requestId })
      .select("creditRequestId status requestedAt lastUpdatedAt mentorReview.reviewedAt adminReview.reviewedAt completedAt")
      .lean();

    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    // Verify the credit request belongs to this student
    if (creditRequest.studentId.toString() !== student._id.toString()) {
      throw createHttpError(403, "Cannot view credit request status for another student");
    }

    // Calculate progress indicator and timeline using service functions
    const progress = creditService.calculateProgressIndicator(creditRequest);
    const timeline = creditService.calculateExpectedTimeline(creditRequest);

    res.json(
      apiSuccess(
        {
          creditRequestId: creditRequest.creditRequestId,
          status: creditRequest.status,
          progress,
          timeline,
          lastUpdated: creditRequest.lastUpdatedAt,
        },
        "Credit request status retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/:studentId/credit-requests/:requestId/reminder
 * Send a reminder notification to the current reviewer
 */
export const sendReviewReminder = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId, requestId } = req.params;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot send reminder for another student's credit request");
    }

    const creditRequest = await CreditRequest.findOne({ creditRequestId: requestId });

    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    // Verify the credit request belongs to this student
    if (creditRequest.studentId.toString() !== student._id.toString()) {
      throw createHttpError(403, "Cannot send reminder for another student's credit request");
    }

    // Determine who to send reminder to based on status
    let recipientRole;
    if (creditRequest.status === "pending_mentor_review") {
      recipientRole = "mentor";
    } else if (creditRequest.status === "pending_admin_review") {
      recipientRole = "admin";
    } else {
      throw createHttpError(400, "Credit request is not pending review");
    }

    // Check if too many reminders have been sent
    const maxReminders = 3;
    if (creditRequest.metadata.remindersSent >= maxReminders) {
      throw createHttpError(429, `Maximum of ${maxReminders} reminders allowed`);
    }

    // Send reminder
    await creditNotificationService.sendReviewReminder(creditRequest, recipientRole);

    // Update reminder count
    creditRequest.metadata.remindersSent += 1;
    await creditRequest.save();

    res.json(
      apiSuccess(
        { remindersSent: creditRequest.metadata.remindersSent },
        "Reminder sent successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:studentId/credits/history
 * Get credit history for a student
 */
export const getCreditHistory = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId } = req.params;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot view credit history for another student");
    }

    // Get completed credit requests
    const completedRequests = await CreditRequest.find({
      studentId: student._id,
      status: "completed",
    })
      .populate("internshipId", "title company duration")
      .sort({ completedAt: -1 })
      .lean();

    const history = completedRequests.map((request) => ({
      creditRequestId: request.creditRequestId,
      internship: request.internshipId,
      creditsAdded: request.calculatedCredits,
      addedAt: request.completedAt,
      certificateUrl: request.certificate?.certificateUrl,
      certificateId: request.certificate?.certificateId,
    }));

    res.json(
      apiSuccess(
        {
          totalCredits: student.credits?.earned || 0,
          history,
        },
        "Credit history retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:studentId/credits/certificate/:requestId
 * Download credit transfer certificate
 */
export const downloadCertificate = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { studentId, requestId } = req.params;

    // Verify student ID matches authenticated user (compare MongoDB _id)
    if (student._id.toString() !== studentId) {
      throw createHttpError(403, "Cannot download certificate for another student");
    }

    const creditRequest = await CreditRequest.findOne({ creditRequestId: requestId });

    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    // Verify the credit request belongs to this student
    if (creditRequest.studentId.toString() !== student._id.toString()) {
      throw createHttpError(403, "Cannot download certificate for another student");
    }

    // Verify certificate exists
    if (!creditRequest.certificate?.certificateUrl) {
      throw createHttpError(404, "Certificate not yet generated");
    }

    // Return certificate URL for download
    res.json(
      apiSuccess(
        {
          certificateUrl: creditRequest.certificate.certificateUrl,
          certificateId: creditRequest.certificate.certificateId,
          generatedAt: creditRequest.certificate.generatedAt,
        },
        "Certificate retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
