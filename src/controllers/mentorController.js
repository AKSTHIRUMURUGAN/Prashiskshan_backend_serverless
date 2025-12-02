import mongoose from "mongoose";
import Mentor from "../models/Mentor.js";
import Student from "../models/Student.js";
import Application from "../models/Application.js";
import Logbook from "../models/Logbook.js";
import CreditRequest from "../models/CreditRequest.js";
import { skillGapAnalysisService } from "../services/skillGapAnalysisService.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";
import { creditService } from "../services/creditService.js";
import { creditReviewService } from "../services/creditReviewService.js";
import { creditNotificationService } from "../services/creditNotificationService.js";

const ensureMentorContext = async (req) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "mentor") throw createHttpError(403, "Mentor access required");
  return context.doc;
};

export const getMentorDashboard = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const department = mentor.profile.department;

    const [pendingApplications, pendingLogbooks, students, skillGaps] = await Promise.all([
      Application.countDocuments({ department, status: "pending" }),
      Logbook.countDocuments({ "mentorReview.status": "pending", status: { $in: ["submitted", "pending_mentor_review"] } }),
      Student.find({ "profile.department": department }).select("studentId readinessScore credits").lean(),
      skillGapAnalysisService.analyzeDepartmentSkillGaps(department),
    ]);

    const readinessStats = {
      average: students.length ? Math.round(students.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / students.length) : 0,
      topPerformers: students.filter((s) => (s.readinessScore || 0) >= 80).length,
      needsImprovement: students.filter((s) => (s.readinessScore || 0) < 50).length,
    };

    res.json(
      apiSuccess(
        {
          mentor,
          stats: {
            pendingApplications,
            pendingLogbooks,
            assignedStudents: students.length,
          },
          readinessStats,
          skillGaps,
        },
        "Mentor dashboard",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getPendingApplications = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      department: mentor.profile.department,
      status: "pending",
    };

    const applications = await Application.find(query)
      .populate("studentId")
      .populate("internshipId")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json(apiSuccess({ applications }, "Pending applications"));
  } catch (error) {
    next(error);
  }
};

export const getApplicationDetails = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { applicationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(applicationId)) throw createHttpError(400, "Invalid applicationId");

    const application = await Application.findOne({
      _id: applicationId,
      department: mentor.profile.department,
    })
      .populate("studentId")
      .populate("internshipId")
      .populate("companyId")
      .lean();

    if (!application) throw createHttpError(404, "Application not found");
    res.json(apiSuccess(application, "Application details"));
  } catch (error) {
    next(error);
  }
};

export const approveApplication = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { applicationId } = req.params;
    const { comments, recommendedPreparation = [] } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      department: mentor.profile.department,
    });
    if (!application) throw createHttpError(404, "Application not found");
    if (application.status !== "pending") throw createHttpError(400, "Application is not pending mentor review");

    application.status = "mentor_approved";
    application.mentorApproval = {
      status: "approved",
      mentorId: mentor.mentorId,
      approvedAt: new Date(),
      comments,
      recommendedPreparation,
    };
    application.timeline.push({
      event: "mentor_approved",
      performedBy: mentor.mentorId,
      notes: comments,
      timestamp: new Date(),
    });
    await application.save();

    res.json(apiSuccess({ application }, "Application approved"));
  } catch (error) {
    next(error);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { applicationId } = req.params;
    const { comments } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      department: mentor.profile.department,
    });
    if (!application) throw createHttpError(404, "Application not found");
    if (application.status !== "pending") throw createHttpError(400, "Application is not pending mentor review");

    application.status = "mentor_rejected";
    application.mentorApproval = {
      status: "rejected",
      mentorId: mentor.mentorId,
      approvedAt: new Date(),
      comments,
    };
    application.timeline.push({
      event: "mentor_rejected",
      performedBy: mentor.mentorId,
      notes: comments,
      timestamp: new Date(),
    });
    await application.save();

    res.json(apiSuccess({ application }, "Application rejected"));
  } catch (error) {
    next(error);
  }
};

export const getPendingLogbooks = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const logbooks = await Logbook.find({
      status: { $in: ["submitted", "pending_mentor_review"] },
      "mentorReview.status": { $in: ["pending", "needs_revision"] },
    })
      .populate("studentId")
      .populate("internshipId")
      .sort({ weekNumber: 1 })
      .lean();

    res.json(apiSuccess(logbooks, "Pending logbooks"));
  } catch (error) {
    next(error);
  }
};

export const getLogbookDetails = async (req, res, next) => {
  try {
    await ensureMentorContext(req);
    const { logbookId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(logbookId)) throw createHttpError(400, "Invalid logbookId");

    const logbook = await Logbook.findById(logbookId).populate("studentId").populate("internshipId").lean();
    if (!logbook) throw createHttpError(404, "Logbook not found");

    res.json(apiSuccess(logbook, "Logbook details"));
  } catch (error) {
    next(error);
  }
};

export const approveLogbook = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { logbookId } = req.params;
    const { comments, creditsApproved = 0 } = req.body;

    const logbook = await Logbook.findById(logbookId);
    if (!logbook) throw createHttpError(404, "Logbook not found");

    logbook.mentorReview = {
      status: "approved",
      reviewedBy: mentor.mentorId,
      reviewedAt: new Date(),
      comments,
      creditsApproved,
    };
    logbook.status = "pending_company_review";
    await logbook.save();

    await Student.findByIdAndUpdate(logbook.studentId, {
      $inc: {
        "credits.pending": creditsApproved,
      },
    });

    res.json(apiSuccess({ logbook }, "Logbook approved"));
  } catch (error) {
    next(error);
  }
};

export const requestLogbookRevision = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { logbookId } = req.params;
    const { comments, suggestions } = req.body;

    const logbook = await Logbook.findById(logbookId);
    if (!logbook) throw createHttpError(404, "Logbook not found");

    logbook.mentorReview = {
      status: "needs_revision",
      reviewedBy: mentor.mentorId,
      reviewedAt: new Date(),
      comments,
      suggestions,
    };
    logbook.status = "needs_revision";
    await logbook.save();

    res.json(apiSuccess({ logbook }, "Revision requested"));
  } catch (error) {
    next(error);
  }
};

export const getSkillGapAnalysis = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const analysis = await skillGapAnalysisService.analyzeDepartmentSkillGaps(mentor.profile.department);
    res.json(apiSuccess(analysis, "Skill gap analysis"));
  } catch (error) {
    next(error);
  }
};

export const getDepartmentPerformance = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const department = mentor.profile.department;

    const [students, applications] = await Promise.all([
      Student.find({ "profile.department": department }).select("readinessScore credits").lean(),
      Application.find({ department }).select("status").lean(),
    ]);

    const placementRate =
      applications.length === 0
        ? 0
        : Math.round((applications.filter((app) => app.status === "accepted").length / applications.length) * 100);

    res.json(
      apiSuccess(
        {
          department,
          students: students.length,
          averageReadiness:
            students.length === 0 ? 0 : Math.round(students.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / students.length),
          placementRate,
        },
        "Department performance",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const createIntervention = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { title, description, targetStudents = [], modules = [] } = req.body;
    if (!title) throw createHttpError(400, "title is required");

    const intervention = {
      interventionId: `INTV-${Date.now()}`,
      title,
      description,
      targetStudents,
      modules,
      status: "planned",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mentor.interventions.push(intervention);
    await mentor.save();

    res.status(201).json(apiSuccess(intervention, "Intervention created"));
  } catch (error) {
    next(error);
  }
};

export const getInterventions = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const status = req.query.status;
    let interventions = mentor.interventions || [];
    if (status) {
      interventions = interventions.filter((item) => item.status === status);
    }
    res.json(apiSuccess(interventions, "Mentor interventions"));
  } catch (error) {
    next(error);
  }
};

export const getStudentProgress = async (req, res, next) => {
  try {
    await ensureMentorContext(req);
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId }).lean();
    if (!student) throw createHttpError(404, "Student not found");

    const [applications, logbooks] = await Promise.all([
      Application.find({ studentId: student._id }).lean(),
      Logbook.find({ studentId: student._id }).lean(),
    ]);

    res.json(
      apiSuccess(
        {
          student,
          applications,
          logbooks,
        },
        "Student progress",
      ),
    );
  } catch (error) {
    next(error);
  }
};


export const getMyStudents = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const students = await Student.find({ "profile.department": mentor.profile.department })
      .select("studentId profile.name profile.email profile.college readinessScore credits")
      .lean();
    res.json(apiSuccess(students, "Assigned students"));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mentors/:mentorId/credit-requests/pending
 * Get pending credit requests for mentor review with filtering and sorting
 */
export const getMentorPendingCreditRequests = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { mentorId } = req.params;

    // Verify the mentor is accessing their own requests
    if (mentor._id.toString() !== mentorId && mentor.mentorId !== mentorId) {
      throw createHttpError(403, "You can only access your own credit requests");
    }

    // Get filters from query params
    const { page, limit, sortBy, sortOrder, status, dateFrom, dateTo, studentName } = req.query;
    const filters = {
      status: status || "pending_mentor_review",
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || "requestedAt",
      sortOrder: sortOrder || "asc",
    };

    // Add optional filters
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (studentName) filters.studentName = studentName;

    // Get credit requests using service
    const result = await creditService.getCreditRequestsByMentor(mentor._id, filters);

    res.json(
      apiSuccess(
        {
          creditRequests: result.creditRequests,
          pagination: result.pagination,
        },
        "Pending credit requests retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mentors/:mentorId/credit-requests/:requestId
 * Get credit request details for review
 */
export const getMentorCreditRequestDetails = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { mentorId, requestId } = req.params;

    // Verify the mentor is accessing their own requests
    if (mentor._id.toString() !== mentorId && mentor.mentorId !== mentorId) {
      throw createHttpError(403, "You can only access your own credit requests");
    }

    // Get credit request with full details
    const creditRequest = await creditService.getCreditRequestById(requestId);

    // Verify this mentor is assigned to this request
    if (creditRequest.mentorId.toString() !== mentor._id.toString()) {
      throw createHttpError(403, "You are not assigned to this credit request");
    }

    res.json(apiSuccess(creditRequest, "Credit request details retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mentors/:mentorId/credit-requests/:requestId/review
 * Submit mentor review (approve/reject)
 */
export const submitMentorCreditReview = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { mentorId, requestId } = req.params;
    const { decision, feedback, qualityCriteria, criteriaFeedback } = req.body;

    // Verify the mentor is accessing their own requests
    if (mentor._id.toString() !== mentorId && mentor.mentorId !== mentorId) {
      throw createHttpError(403, "You can only review your own assigned credit requests");
    }

    // Submit review using service
    const updatedRequest = await creditReviewService.submitMentorReview(
      requestId,
      mentor._id,
      decision,
      feedback,
      qualityCriteria,
      criteriaFeedback
    );

    // Send notifications
    try {
      if (decision === "approved") {
        await creditNotificationService.notifyAdminMentorApproval(updatedRequest);
        await creditNotificationService.notifyStudentMentorDecision(updatedRequest, "approved");
      } else {
        await creditNotificationService.notifyStudentMentorDecision(updatedRequest, "rejected");
      }
    } catch (notificationError) {
      // Log but don't fail the request if notifications fail
      console.error("Failed to send notifications:", notificationError);
    }

    res.json(
      apiSuccess(
        updatedRequest,
        `Credit request ${decision === "approved" ? "approved" : "rejected"} successfully`
      )
    );
  } catch (error) {
    // Handle validation errors
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: error.message,
        details: error.validationErrors.map((err) => ({
          field: "review",
          message: err,
        })),
      });
    }

    // Handle permission errors
    if (error.code === "PERMISSION_DENIED") {
      return res.status(403).json({
        success: false,
        error: "Permission denied",
        message: error.message,
      });
    }

    next(error);
  }
};

/**
 * GET /api/mentors/:mentorId/credit-requests/history
 * Get mentor's review history with filtering and sorting
 */
export const getMentorCreditReviewHistory = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { mentorId } = req.params;

    // Verify the mentor is accessing their own history
    if (mentor._id.toString() !== mentorId && mentor.mentorId !== mentorId) {
      throw createHttpError(403, "You can only access your own review history");
    }

    // Get filters from query params
    const { status, dateRange, dateFrom, dateTo, studentName, page, limit, sortBy, sortOrder } = req.query;
    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || "mentorReview.reviewedAt",
      sortOrder: sortOrder || "desc",
    };

    // If status is provided, use it; otherwise get all reviewed requests
    if (status) {
      filters.status = status;
    }

    // Get all credit requests where this mentor has reviewed
    const query = {
      mentorId: mentor._id,
      status: { $in: ["mentor_approved", "mentor_rejected", "pending_admin_review", "admin_approved", "admin_rejected", "credits_added", "completed"] },
    };

    // Add date range filter if provided (support both formats)
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(",");
      if (startDate && endDate) {
        query["mentorReview.reviewedAt"] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
    } else if (dateFrom || dateTo) {
      query["mentorReview.reviewedAt"] = {};
      if (dateFrom) {
        query["mentorReview.reviewedAt"].$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query["mentorReview.reviewedAt"].$lte = new Date(dateTo);
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    // Build sort options
    const sortOptions = {};
    sortOptions[filters.sortBy] = filters.sortOrder === "asc" ? 1 : -1;

    let creditRequestsQuery = CreditRequest.find(query)
      .populate("studentId", "studentId email profile")
      .populate("internshipId", "title companyId duration")
      .sort(sortOptions)
      .skip(skip)
      .limit(filters.limit);

    const [creditRequests, total] = await Promise.all([
      creditRequestsQuery,
      CreditRequest.countDocuments(query),
    ]);

    // Filter by student name if provided (post-query filtering)
    let filteredRequests = creditRequests;
    if (studentName) {
      const searchTerm = studentName.toLowerCase();
      filteredRequests = creditRequests.filter(req => {
        const student = req.studentId;
        if (!student) return false;
        
        const fullName = student.profile?.name?.toLowerCase() || "";
        const email = student.email?.toLowerCase() || "";
        const studentId = student.studentId?.toLowerCase() || "";
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               studentId.includes(searchTerm);
      });
    }

    res.json(
      apiSuccess(
        {
          creditRequests: filteredRequests,
          pagination: {
            total: studentName ? filteredRequests.length : total,
            page: filters.page,
            limit: filters.limit,
            pages: Math.ceil((studentName ? filteredRequests.length : total) / filters.limit),
          },
        },
        "Review history retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mentors/:mentorId/credit-requests/analytics
 * Get mentor review analytics
 */
export const getMentorCreditAnalytics = async (req, res, next) => {
  try {
    const mentor = await ensureMentorContext(req);
    const { mentorId } = req.params;

    // Verify the mentor is accessing their own analytics
    if (mentor._id.toString() !== mentorId && mentor.mentorId !== mentorId) {
      throw createHttpError(403, "You can only access your own analytics");
    }

    // Get date range from query params
    const { dateRange } = req.query;
    const options = {};

    if (dateRange) {
      const [startDate, endDate] = dateRange.split(",");
      if (startDate) options.dateFrom = startDate;
      if (endDate) options.dateTo = endDate;
    }

    // Use the analytics service to get metrics
    const { creditAnalyticsService } = await import("../services/creditAnalyticsService.js");
    const metrics = await creditAnalyticsService.getMentorMetrics(mentor._id, options);

    res.json(apiSuccess(metrics, "Analytics retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// Backward compatibility aliases
export const getPendingCreditRequests = getMentorPendingCreditRequests;
export const approveCreditRequest = submitMentorCreditReview;
