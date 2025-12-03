import mongoose from "mongoose";
import Company from "../models/Company.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Logbook from "../models/Logbook.js";
import Student from "../models/Student.js";
import InternshipCompletion from "../models/InternshipCompletion.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";
import { logger } from "../utils/logger.js";
import { internshipService } from "../services/internshipService.js";
import { applicationService } from "../services/applicationService.js";
import { internshipAnalyticsService } from "../services/internshipAnalyticsService.js";

/**
 * Extract storage key from R2 public URL
 * @param {string} url - The full R2 public URL
 * @returns {string|null} - The storage key or null if extraction fails
 */
const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname to get the key
    return urlObj.pathname.substring(1);
  } catch (error) {
    logger.warn("Failed to extract key from URL", { url, error: error.message });
    return null;
  }
};

const ensureCompanyContext = async (req, { requireVerified = true } = {}) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "company") throw createHttpError(403, "Company access required");
  if (requireVerified && context.doc.status !== "verified") {
    throw createHttpError(403, "Company must be verified to perform this action");
  }
  return context.doc;
};

const ensureInternshipOwnership = async (companyId, internshipId) => {
  // internshipId is a custom string (e.g., INTERN-123), not an ObjectId
  const internship = await Internship.findOne({ internshipId: internshipId, companyId: companyId });
  if (!internship) throw createHttpError(404, "Internship not found");
  return internship;
};

export const getCompanyDashboard = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const [
      activeInternships,
      totalInternships,
      totalApplications,
      pendingApplications,
      studentsHired,
      pendingLogbooks
    ] = await Promise.all([
      Internship.countDocuments({ companyId: company._id, status: "approved" }),
      Internship.countDocuments({ companyId: company._id }),
      Application.countDocuments({ companyId: company._id }),
      Application.countDocuments({ companyId: company._id, status: "pending" }),
      InternshipCompletion.countDocuments({ companyId: company._id }),
      Logbook.countDocuments({ companyId: company._id, status: { $in: ["pending_company_review", "submitted"] } }),
    ]);
    res.json(
      apiSuccess(
        {
          company,
          metrics: {
            activeInternships,
            totalInternships,
            totalApplications,
            pendingApplications,
            studentsHired,
            pendingLogbooks,
          },
        },
        "Company dashboard",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getCompanyProfile = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req, { requireVerified: false });
    res.json(apiSuccess(company, "Company profile"));
  } catch (error) {
    next(error);
  }
};

export const updateCompanyProfile = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req, { requireVerified: false });
    const allowedFields = ["companyName", "about", "logoUrl", "phone", "address", "pointOfContact", "website", "documents"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Company.findByIdAndUpdate(company._id, { $set: updates }, { new: true });
    res.json(apiSuccess(updated, "Company profile updated"));
  } catch (error) {
    next(error);
  }
};

/**
 * Create internship with AI tagging
 * Requirements: 1.1, 1.2, 1.4
 * POST /api/company/internships
 */
export const createInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    
    // Use internship service to create internship with validation and AI tagging
    const internship = await internshipService.createInternship(
      company._id,
      req.body,
      {
        postedBy: company.companyId,
        enableAITagging: true,
      }
    );

    res.status(201).json(apiSuccess(internship, "Internship created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Update internship with status reset logic
 * Requirements: 1.5
 * PUT /api/company/internships/:id
 */
export const updateInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    
    // Verify ownership
    await ensureInternshipOwnership(company._id, internshipId);

    // Use internship service to update with status reset logic
    const internship = await internshipService.updateInternship(
      internshipId,
      req.body,
      {
        actor: company.companyId,
        actorRole: "company",
        enableAITagging: true,
      }
    );

    res.json(apiSuccess(internship, "Internship updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel internship
 * Requirements: 1.1
 * DELETE /api/company/internships/:id
 */
export const deleteInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    
    // Verify ownership
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    
    // Update status to cancelled
    internship.status = "cancelled";
    internship.closedAt = new Date();
    
    // Add audit trail entry
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: company.companyId,
      actorRole: "company",
      action: "cancel_internship",
      fromStatus: internship.status,
      toStatus: "cancelled",
      reason: "Internship cancelled by company",
    });
    
    await internship.save();
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * List company internships with filters
 * Requirements: 1.1, 1.4
 * GET /api/company/internships
 */
export const getCompanyInternships = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    
    // Build filters from query parameters
    const filters = {
      companyId: company._id,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      search: req.query.search,
      startDateFrom: req.query.startDateFrom,
      startDateTo: req.query.startDateTo,
    };
    
    // Get internships by status if provided, otherwise get all
    let result;
    if (req.query.status) {
      result = await internshipService.getInternshipsByStatus(req.query.status, filters);
    } else {
      // Get all internships for this company
      const query = { companyId: company._id };
      
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      if (filters.startDateFrom) {
        query.startDate = { ...query.startDate, $gte: new Date(filters.startDateFrom) };
      }
      
      if (filters.startDateTo) {
        query.startDate = { ...query.startDate, $lte: new Date(filters.startDateTo) };
      }
      
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;
      
      const sortField = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };
      
      const [internships, total] = await Promise.all([
        Internship.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Internship.countDocuments(query),
      ]);
      
      result = {
        internships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }
    
    res.json(apiSuccess(result, "Company internships retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get internship details
 * Requirements: 1.1
 * GET /api/company/internships/:id
 */
export const getInternshipById = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    
    // Verify ownership and get internship
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    
    // Populate company details
    await internship.populate("companyId", "companyName industry logo");
    
    res.json(apiSuccess(internship, "Internship details retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * List applicants with filters
 * Requirements: 5.2, 5.3
 * GET /api/company/internships/:id/applicants
 */
export const getApplicants = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    
    // Verify ownership
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    
    // Build filters from query parameters
    const filters = {
      status: req.query.status,
      companyFeedbackStatus: req.query.companyFeedbackStatus,
      search: req.query.search,
      appliedFrom: req.query.appliedFrom,
      appliedTo: req.query.appliedTo,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    
    // Use application service to get applications with filters
    const result = await applicationService.getApplicationsByInternship(
      internship._id.toString(),
      filters
    );
    
    res.json(apiSuccess(result, "Internship applicants retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

export const reviewApplications = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { updates = [] } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) throw createHttpError(400, "updates array required");

    const results = [];
    for (const update of updates) {
      const application = await Application.findOne({
        _id: update.applicationId,
        companyId: company._id,
      });
      if (!application) continue;
      application.companyFeedback = {
        status: update.status || "reviewing",
        reviewedAt: new Date(),
        feedback: update.feedback,
        rejectionReason: update.rejectionReason,
        nextSteps: update.nextSteps,
        scheduledInterviewDate: update.scheduledInterviewDate,
      };
      application.status = update.status || application.status;
      application.timeline.push({
        event: "company_review_updated",
        performedBy: company.companyId,
        notes: update.feedback,
        timestamp: new Date(),
      });
      await application.save();
      results.push(application);
    }

    res.json(apiSuccess(results, "Applications reviewed"));
  } catch (error) {
    next(error);
  }
};

export const shortlistCandidates = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationIds = [] } = req.body;
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) throw createHttpError(400, "applicationIds required");

    const applications = await Application.updateMany(
      { _id: { $in: applicationIds }, companyId: company._id },
      {
        $set: {
          status: "shortlisted",
          "companyFeedback.status": "shortlisted",
          "companyFeedback.reviewedAt": new Date(),
        },
      },
    );
    res.json(apiSuccess({ modified: applications.modifiedCount }, "Candidates shortlisted"));
  } catch (error) {
    next(error);
  }
};

export const rejectCandidates = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationIds = [], reason } = req.body;
    const update = await Application.updateMany(
      { _id: { $in: applicationIds }, companyId: company._id },
      {
        $set: {
          status: "rejected",
          "companyFeedback.status": "rejected",
          "companyFeedback.rejectionReason": reason,
          "companyFeedback.reviewedAt": new Date(),
        },
      },
    );
    res.json(apiSuccess({ modified: update.modifiedCount }, "Candidates rejected"));
  } catch (error) {
    next(error);
  }
};

/**
 * Approve application
 * Requirements: 5.2
 * POST /api/company/applications/approve
 */
export const approveApplication = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationId, feedback, nextSteps } = req.body;
    
    if (!applicationId) {
      throw createHttpError(400, "applicationId is required");
    }
    
    // Use application service to approve with slot decrement
    const application = await applicationService.companyApprove(
      applicationId,
      company._id,
      {
        feedback,
        nextSteps,
        reviewedBy: company.companyId,
      }
    );
    
    res.json(apiSuccess(application, "Application approved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Reject application
 * Requirements: 5.3
 * POST /api/company/applications/reject
 */
export const rejectApplication = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationId, reason, feedback } = req.body;
    
    if (!applicationId) {
      throw createHttpError(400, "applicationId is required");
    }
    
    // Use application service to reject
    const application = await applicationService.companyReject(
      applicationId,
      company._id,
      {
        reason,
        feedback,
        reviewedBy: company.companyId,
      }
    );
    
    res.json(apiSuccess(application, "Application rejected successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get application details
 * Requirements: 5.2, 5.3
 * GET /api/company/applications/:id
 */
export const getApplicationDetails = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationId } = req.params;
    
    // Get application and verify ownership
    const application = await Application.findOne({ applicationId })
      .populate("studentId", "studentId profile department readinessScore")
      .populate("internshipId", "internshipId title department")
      .lean();
    
    if (!application) {
      throw createHttpError(404, "Application not found");
    }
    
    // Verify company ownership
    if (application.companyId.toString() !== company._id.toString()) {
      throw createHttpError(403, "Unauthorized: This application does not belong to your company");
    }
    
    res.json(apiSuccess(application, "Application details retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

export const getInternsProgress = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const internships = await Internship.find({ companyId: company._id, status: "approved" }).select("_id title").lean();
    const internshipIds = internships.map((i) => i._id);
    const logbooks = await Logbook.find({ internshipId: { $in: internshipIds }, status: "approved" })
      .populate("studentId")
      .sort({ weekNumber: 1 })
      .lean();
    res.json(apiSuccess({ internships, logbooks }, "Intern progress"));
  } catch (error) {
    next(error);
  }
};

export const provideLogbookFeedback = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { logbookId } = req.params;
    const feedback = req.body;
    const logbook = await Logbook.findOneAndUpdate(
      { _id: logbookId, companyId: company._id },
      {
        $set: {
          companyFeedback: {
            ...feedback,
            providedAt: new Date(),
          },
          status: "completed",
        },
      },
      { new: true },
    );
    if (!logbook) throw createHttpError(404, "Logbook not found");
    res.json(apiSuccess(logbook, "Feedback submitted"));
  } catch (error) {
    next(error);
  }
};

export const markInternshipComplete = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    internship.status = "closed";
    internship.closedAt = new Date();
    await internship.save();
    res.json(apiSuccess(internship, "Internship marked complete"));
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { title, description, date, targetDepartments = [] } = req.body;
    if (!title) throw createHttpError(400, "title required");
    const event = {
      eventId: `EVT-${Date.now()}`,
      title,
      description,
      date,
      targetDepartments,
      createdAt: new Date(),
    };
    company.events.push(event);
    await company.save();
    res.status(201).json(apiSuccess(event, "Event created"));
  } catch (error) {
    next(error);
  }
};

export const createChallenge = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { title, description, rewards, deadline } = req.body;
    if (!title) throw createHttpError(400, "title required");
    const challenge = {
      challengeId: `CHL-${Date.now()}`,
      title,
      description,
      rewards,
      deadline,
      createdAt: new Date(),
    };
    company.challenges.push(challenge);
    await company.save();
    res.status(201).json(apiSuccess(challenge, "Challenge created"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyApplications = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId, status } = req.query;
    const query = { companyId: company._id };

    if (internshipId) {
      if (mongoose.Types.ObjectId.isValid(internshipId)) {
        query.internshipId = internshipId;
      } else {
        const internship = await Internship.findOne({ internshipId: internshipId, companyId: company._id });
        if (internship) {
          query.internshipId = internship._id;
        } else {
          return res.json(apiSuccess([], "Company applications"));
        }
      }
    }

    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate("studentId", "profile.name profile.department profile.college profile.resume profile.skills profile.year")
      .populate("internshipId", "title internshipId")
      .sort({ appliedAt: -1 })
      .lean();

    res.json(apiSuccess(applications, "Company applications"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyInterns = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const status = req.query.status || 'accepted';

    // 1. Get all applications with specified status
    const applications = await Application.find({
      companyId: company._id,
      status: status
    })
      .populate('studentId', 'profile.name profile.email')
      .populate('internshipId', 'title')
      .lean();

    // 2. For each intern, fetch logbook stats
    const internsWithStats = await Promise.all(applications.map(async (app) => {
      const logbooks = await Logbook.find({
        studentId: app.studentId._id,
        internshipId: app.internshipId._id
      }).lean();

      const totalLogbooks = logbooks.length;
      const submittedLogbooks = logbooks.filter(l => l.status === 'submitted' || l.status === 'approved').length;
      const pendingLogbooks = logbooks.filter(l => l.status === 'submitted').length; // Pending company review

      const approvedLogbooks = logbooks.filter(l => l.status === 'approved');
      const totalHours = approvedLogbooks.reduce((sum, l) => sum + (l.hours || 0), 0);

      // Calculate average rating from approved logbooks
      const ratedLogbooks = approvedLogbooks.filter(l => l.companyRating);
      const averageRating = ratedLogbooks.length > 0
        ? ratedLogbooks.reduce((sum, l) => sum + l.companyRating, 0) / ratedLogbooks.length
        : 0;

      return {
        _id: app.studentId._id, // Use student ID as key or application ID
        applicationId: app._id,
        studentName: app.studentId.profile.name,
        internshipTitle: app.internshipId.title,
        internshipId: app.internshipId._id,
        status: app.status, // 'accepted'
        startDate: app.updatedAt, // Approximate start date (when accepted)
        logbooksSubmitted: submittedLogbooks,
        pendingLogbooks: pendingLogbooks,
        totalHours: totalHours,
        averageRating: averageRating,
        creditsEarned: 0 // Placeholder, logic for credits might be complex or in another model
      };
    }));

    res.json(apiSuccess(internsWithStats, "Active interns fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyInternLogbooks = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw createHttpError(400, "Invalid studentId");
    }

    const logbooks = await Logbook.find({
      studentId,
      companyId: company._id,
    })
      .populate("internshipId", "title internshipId")
      .sort({ weekNumber: 1 })
      .lean();

    res.json(apiSuccess(logbooks, "Intern logbooks"));
  } catch (error) {
    next(error);
  }
};

export const completeInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationId } = req.params;
    const { feedback, overallScore } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      companyId: company._id,
      status: 'accepted'
    });

    if (!application) {
      throw createHttpError(404, "Active internship application not found");
    }

    // Calculate totals from logbooks
    const logbooks = await Logbook.find({
      studentId: application.studentId,
      internshipId: application.internshipId,
      status: 'approved'
    });

    const totalHours = logbooks.reduce((sum, l) => sum + (l.hours || 0), 0);
    // Simple credit calculation: 1 credit per 10 hours (example logic)
    const creditsEarned = Math.floor(totalHours / 10);

    // Create completion record
    const completion = await InternshipCompletion.create({
      completionId: `COMP-${Date.now()}`,
      studentId: application.studentId,
      internshipId: application.internshipId,
      companyId: company._id,
      totalHours,
      creditsEarned,
      completionDate: new Date(),
      evaluation: {
        companyScore: overallScore,
        overallComments: feedback,
      },
      status: 'pending' // Pending admin/system verification if needed
    });

    // Update application status
    application.status = 'completed';
    await application.save();

    res.json(apiSuccess(completion, "Internship marked as completed"));
  } catch (error) {
    next(error);
  }
};
/**
 * Get company analytics with date range
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * GET /api/company/analytics
 */
export const getCompanyAnalytics = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    
    // Build options from query parameters
    const options = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    
    // Use analytics service to get company analytics
    const analytics = await internshipAnalyticsService.getCompanyAnalytics(
      company._id,
      options
    );
    
    res.json(apiSuccess(analytics, "Company analytics retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Export analytics report
 * Requirements: 9.5
 * GET /api/company/analytics/export
 */
export const exportCompanyAnalytics = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    
    // Get format from query (default to CSV)
    const format = req.query.format || "csv";
    
    if (!["csv", "pdf"].includes(format)) {
      throw createHttpError(400, "Invalid format. Must be 'csv' or 'pdf'");
    }
    
    // Build options from query parameters
    const options = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    
    // Use analytics service to export analytics
    const result = await internshipAnalyticsService.exportAnalytics(
      "company",
      company._id,
      format,
      options
    );
    
    // Set appropriate headers based on format
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      res.send(result.data);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get internship-specific metrics
 * Requirements: 9.1, 9.2
 * GET /api/company/internships/:id/metrics
 */
export const getInternshipMetrics = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    
    // Verify ownership
    await ensureInternshipOwnership(company._id, internshipId);
    
    // Use application service to get metrics
    const metrics = await applicationService.getApplicationMetrics(internshipId);
    
    res.json(apiSuccess(metrics, "Internship metrics retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

export const reAppeal = async (req, res, next) => {
  try {
    const context = await resolveUserFromRequest(req);
    if (context.role !== "company") {
      throw createHttpError(403, "Company access required");
    }

    const company = context.doc;

    if (company.status !== "rejected" && company.status !== "blocked") {
      throw createHttpError(400, "Only rejected or blocked companies can re-appeal");
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      company._id,
      {
        status: "pending_verification",
        "adminReview.decision": "pending",
      },
      { new: true, runValidators: false }
    );

    res.json(apiSuccess(updatedCompany, "Re-appeal submitted successfully"));
  } catch (error) {
    next(error);
  }
};

export const submitReappeal = async (req, res, next) => {
  try {
    const context = await resolveUserFromRequest(req);
    if (context.role !== "company") {
      throw createHttpError(403, "Company access required");
    }

    const company = context.doc;

    // Check if there's already an active reappeal
    if (company.status === "reappeal") {
      throw createHttpError(400, "Reappeal already submitted and under review");
    }

    // Check if company is blocked
    if (company.status !== "blocked") {
      throw createHttpError(400, "Only blocked companies can submit reappeals");
    }

    // Check cooldown period
    if (company.reappeal?.cooldownEndsAt && new Date() < company.reappeal.cooldownEndsAt) {
      const cooldownDate = company.reappeal.cooldownEndsAt.toISOString();
      throw createHttpError(403, `Cannot submit reappeal until ${cooldownDate}`);
    }

    // Validate message
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      throw createHttpError(400, "Reappeal message is required");
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) {
      throw createHttpError(400, "Reappeal message must be between 10 and 2000 characters");
    }

    // Handle file upload if present
    let attachmentUrl = null;
    if (req.file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw createHttpError(400, "Attachment must be PDF, JPG, or PNG");
      }

      if (req.file.size > 10 * 1024 * 1024) {
        throw createHttpError(400, "Attachment must be under 10MB");
      }

      // Upload to R2
      const { storageService } = await import("../services/storageService.js");
      const uploadResult = await storageService.uploadFile(req.file.buffer, {
        filename: `${company.companyId}-${Date.now()}-${req.file.originalname}`,
        contentType: req.file.mimetype,
        provider: "r2",
      });
      attachmentUrl = uploadResult.url;
    }

    // Preserve block information if not already set
    const blockInfo = company.blockInfo || {
      reason: company.adminReview?.comments || "No reason provided",
      blockedBy: company.adminReview?.reviewedBy || "system",
      blockedAt: company.adminReview?.reviewedAt || new Date(),
    };

    // Archive current reappeal to history if exists
    const history = company.reappeal?.history || [];
    if (company.reappeal?.message) {
      history.push({
        message: company.reappeal.message,
        attachment: company.reappeal.attachment,
        submittedAt: company.reappeal.submittedAt,
        reviewedAt: company.reappeal.reviewedAt,
        decision: company.reappeal.reviewedAt ? "rejected" : null,
        reviewedBy: company.reappeal.reviewedBy,
        feedback: company.reappeal.reviewFeedback || company.reappeal.rejectionReason,
      });

      // Clean up old attachment from storage (non-blocking)
      if (company.reappeal.attachment) {
        const { storageService } = await import("../services/storageService.js");
        const oldAttachmentKey = extractKeyFromUrl(company.reappeal.attachment);
        if (oldAttachmentKey) {
          storageService.deleteFile(oldAttachmentKey, "r2").catch((error) => {
            logger.warn("Failed to delete old reappeal attachment", { 
              key: oldAttachmentKey, 
              error: error.message 
            });
          });
        }
      }
    }

    // Update company with reappeal data
    const updatedCompany = await Company.findByIdAndUpdate(
      company._id,
      {
        status: "reappeal",
        blockInfo,
        reappeal: {
          message: trimmedMessage,
          attachment: attachmentUrl,
          submittedAt: new Date(),
          reviewedBy: null,
          reviewedAt: null,
          reviewFeedback: null,
          rejectionReason: null,
          cooldownEndsAt: null,
          history,
        },
      },
      { new: true, runValidators: true }
    );

    // Send confirmation notification to company (Requirements: 6.1)
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: updatedCompany._id,
      role: "company",
      type: "reappeal_submitted",
      title: "Reappeal Submitted Successfully",
      message: `Your reappeal request has been submitted and is now under review. We will notify you once an admin reviews your request. Submitted on: ${updatedCompany.reappeal.submittedAt.toLocaleDateString()}`,
      priority: "medium",
      actionUrl: "/company/blocked",
      metadata: {
        companyId: updatedCompany.companyId,
        submittedAt: updatedCompany.reappeal.submittedAt,
      },
    });

    // Notify all admins about new reappeal submission (Requirements: 6.4)
    const Admin = (await import("../models/Admin.js")).default;
    const admins = await Admin.find({}).lean();
    for (const admin of admins) {
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: admin._id,
        role: "admin",
        type: "new_reappeal_alert",
        title: "New Reappeal Request",
        message: `${updatedCompany.companyName} has submitted a reappeal request. Please review and take action.`,
        priority: "high",
        actionUrl: "/admin/reappeals",
        metadata: {
          companyId: updatedCompany.companyId,
          companyName: updatedCompany.companyName,
          submittedAt: updatedCompany.reappeal.submittedAt,
        },
      }).catch((error) => {
        logger.warn("Failed to send admin reappeal alert", {
          adminId: admin.adminId,
          error: error.message,
        });
      });
    }

    res.json(
      apiSuccess(
        {
          status: updatedCompany.status,
          submittedAt: updatedCompany.reappeal.submittedAt,
        },
        "Reappeal submitted successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getReappealStatus = async (req, res, next) => {
  try {
    const context = await resolveUserFromRequest(req);
    if (context.role !== "company") {
      throw createHttpError(403, "Company access required");
    }

    const company = context.doc;

    const canReappeal =
      company.status === "blocked" &&
      (!company.reappeal?.cooldownEndsAt || new Date() >= company.reappeal.cooldownEndsAt);

    res.json(
      apiSuccess(
        {
          status: company.status,
          blockReason: company.blockInfo?.reason,
          blockedAt: company.blockInfo?.blockedAt,
          blockedBy: company.blockInfo?.blockedBy,
          adminReview: company.adminReview,
          reappealMessage: company.reappeal?.message,
          reappealAttachment: company.reappeal?.attachment,
          reappealSubmittedAt: company.reappeal?.submittedAt,
          canReappeal,
          cooldownEndsAt: company.reappeal?.cooldownEndsAt,
        },
        "Reappeal status retrieved"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark internship completion as complete
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const markCompletionComplete = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { completionId } = req.params;
    const { evaluationScore, evaluationComments } = req.body;

    // Validate required fields
    if (evaluationScore === undefined || !evaluationComments) {
      throw createHttpError(400, "evaluationScore and evaluationComments are required");
    }

    // Validate evaluation score range
    if (typeof evaluationScore !== 'number' || evaluationScore < 0 || evaluationScore > 10) {
      throw createHttpError(400, "evaluationScore must be a number between 0 and 10");
    }

    // Find the completion record
    const completion = await InternshipCompletion.findOne({
      completionId: completionId,
      companyId: company._id
    });

    if (!completion) {
      throw createHttpError(404, "Internship completion not found");
    }

    // Check if already marked complete
    if (completion.companyCompletion?.markedCompleteAt) {
      throw createHttpError(400, "Internship completion already marked as complete");
    }

    // Validate that all required milestones are met (Requirements: 1.4)
    // Check if logbooks are approved
    const logbooks = await Logbook.find({
      studentId: completion.studentId,
      internshipId: completion.internshipId,
      status: 'approved'
    });

    if (logbooks.length === 0) {
      throw createHttpError(400, "Cannot mark complete: No approved logbooks found. All required milestones must be met.");
    }

    // Update completion with company completion details (Requirements: 1.1, 1.3)
    completion.companyCompletion = {
      markedCompleteBy: company.companyId,
      markedCompleteAt: new Date(),
      evaluationScore,
      evaluationComments
    };
    completion.status = 'completed';

    await completion.save();

    // Notify student that internship is marked complete (Requirements: 1.2)
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: completion.studentId,
      role: "student",
      type: "internship_completed",
      title: "Internship Marked Complete",
      message: `Your internship has been marked as complete by ${company.companyName}. You can now request credit transfer.`,
      priority: "high",
      actionUrl: `/student/internships/${completion.internshipId}`,
      metadata: {
        completionId: completion.completionId,
        companyId: company.companyId,
        companyName: company.companyName,
        evaluationScore
      }
    }).catch((error) => {
      logger.warn("Failed to send completion notification to student", {
        studentId: completion.studentId,
        error: error.message
      });
    });

    res.json(apiSuccess(completion, "Internship completion marked as complete"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of completed internships
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const getCompletedInternships = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find all completed internships for this company
    const query = {
      companyId: company._id,
      'companyCompletion.markedCompleteAt': { $exists: true }
    };

    const [completions, total] = await Promise.all([
      InternshipCompletion.find(query)
        .populate('studentId', 'profile.name profile.email profile.department')
        .populate('internshipId', 'title internshipId')
        .sort({ 'companyCompletion.markedCompleteAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InternshipCompletion.countDocuments(query)
    ]);

    res.json(
      apiSuccess(
        {
          completions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        "Completed internships retrieved"
      )
    );
  } catch (error) {
    next(error);
  }
};
