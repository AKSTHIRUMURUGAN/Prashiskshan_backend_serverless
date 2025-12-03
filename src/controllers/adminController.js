import mongoose from "mongoose";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Company from "../models/Company.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Logbook from "../models/Logbook.js";
import Report from "../models/Report.js";
import CreditRequest from "../models/CreditRequest.js";
import Notification from "../models/Notification.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

const importJobs = new Map();

const ensureAdminContext = async (req) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "admin" && context.role !== "super_admin") {
    throw createHttpError(403, "Admin privileges required");
  }
  return context.doc;
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const [
      studentCount,
      mentorCount,
      companyCount,
      internshipCount,
      applicationCount,
      logbookPending,
      pendingVerifications,
      verifiedCompanies,
      rejectedCompanies,
      blockedCompanies,
      reappealCompanies,
      pendingInternships,
      verifiedInternships,
      rejectedInternships,
    ] = await Promise.all([
      Student.countDocuments(),
      Mentor.countDocuments(),
      Company.countDocuments(),
      Internship.countDocuments({ status: "admin_approved" }),
      Application.countDocuments(),
      Logbook.countDocuments({ status: { $in: ["submitted", "pending_mentor_review", "pending_company_review"] } }),
      Company.countDocuments({ status: "pending_verification" }),
      Company.countDocuments({ status: "verified" }),
      Company.countDocuments({ status: "rejected" }),
      Company.countDocuments({ status: "blocked" }),
      Company.countDocuments({ status: "reappeal" }),
      Internship.countDocuments({ status: "pending_admin_verification" }),
      Internship.countDocuments({ status: "admin_approved" }),
      Internship.countDocuments({ status: "admin_rejected" }),
    ]);

    res.json(
      apiSuccess(
        {
          totals: {
            students: studentCount,
            mentors: mentorCount,
            companies: companyCount,
            internships: internshipCount,
            applications: applicationCount,
          },
          counts: {
            pendingLogbooks: logbookPending,
            pendingVerifications,
            verifiedCompanies,
            rejectedCompanies,
            blockedCompanies,
            reappealCompanies,
            pendingInternships,
            verifiedInternships,
            rejectedInternships,
            pendingCreditApprovals: 0, // Placeholder as logic is not yet implemented
          },
        },
        "Admin dashboard",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getPendingCompanies = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { riskLevel } = req.query;
    const query = { status: "pending_verification" };
    if (riskLevel) query["aiVerification.riskLevel"] = riskLevel;
    const companies = await Company.find(query).sort({ createdAt: -1 }).lean();
    res.json(apiSuccess(companies, "Pending companies"));
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { status, riskLevel } = req.query;
    const query = {};
    if (status) query.status = status;
    if (riskLevel) query["aiVerification.riskLevel"] = riskLevel;

    const companies = await Company.find(query).sort({ createdAt: -1 }).lean();
    res.json(apiSuccess(companies, "Companies list"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyDetails = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { companyId } = req.params;
    const company = await Company.findOne({ companyId }).lean();
    if (!company) throw createHttpError(404, "Company not found");
    res.json(apiSuccess(company, "Company details"));
  } catch (error) {
    next(error);
  }
};

export const verifyCompany = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { companyId } = req.params;
    const { comments } = req.body;

    const company = await Company.findOneAndUpdate(
      { companyId },
      {
        status: "verified",
        adminReview: {
          reviewedBy: admin.adminId,
          reviewedAt: new Date(),
          comments,
          decision: "approved",
        },
      },
      { new: true },
    );

    if (!company) throw createHttpError(404, "Company not found");
    res.json(apiSuccess(company, "Company verified"));
  } catch (error) {
    next(error);
  }
};

export const rejectCompany = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { companyId } = req.params;
    const { reason, reasons = [] } = req.body;
    if (!reason && reasons.length === 0) throw createHttpError(400, "Rejection reason is required");

    const company = await Company.findOneAndUpdate(
      { companyId },
      {
        status: "rejected",
        adminReview: {
          reviewedBy: admin.adminId,
          reviewedAt: new Date(),
          comments: reason,
          decision: "rejected",
          reasons: reasons,
        },
      },
      { new: true },
    );
    if (!company) throw createHttpError(404, "Company not found");

    // Send Notification
    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      userId: company._id,
      role: "company",
      type: "company_rejected",
      title: "Company Verification Rejected",
      message: `Your company verification was rejected. Reasons: ${reasons.join(", ")}. ${reason}`,
      priority: "high",
      actionUrl: "/company/dashboard",
    });

    res.json(apiSuccess(company, "Company rejected"));
  } catch (error) {
    next(error);
  }
};

export const blockCompany = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { companyId } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      throw createHttpError(400, "Block reason is required");
    }

    const company = await Company.findOneAndUpdate(
      { companyId },
      {
        status: "blocked",
        blockInfo: {
          reason: reason.trim(),
          blockedBy: admin.adminId,
          blockedAt: new Date(),
        },
        adminReview: {
          reviewedBy: admin.adminId,
          reviewedAt: new Date(),
          comments: reason,
          decision: "blocked",
          reasons: ["Company blocked by admin"],
        },
      },
      { new: true, runValidators: false }
    );
    
    if (!company) throw createHttpError(404, "Company not found");

    // Send Notification
    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      userId: company._id,
      role: "company",
      type: "company_blocked",
      title: "Company Account Blocked",
      message: `Your company account has been blocked. Reason: ${reason}. You can appeal this decision from your dashboard.`,
      priority: "high",
      actionUrl: "/company/dashboard",
    });

    logger.info(`Company blocked by admin`, { companyId, adminId: admin.adminId, reason });

    res.json(apiSuccess(company, "Company blocked successfully"));
  } catch (error) {
    next(error);
  }
};

export const suspendCompany = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { companyId } = req.params;
    const { reason } = req.body;
    const company = await Company.findOneAndUpdate(
      { companyId },
      { status: "suspended", restrictions: [reason].filter(Boolean) },
      { new: true },
    );
    if (!company) throw createHttpError(404, "Company not found");
    res.json(apiSuccess(company, "Company suspended"));
  } catch (error) {
    next(error);
  }
};

export const bulkImportStudents = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { students = [] } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      throw createHttpError(400, "students array is required");
    }

    const jobId = `IMPORT-${Date.now()}`;
    importJobs.set(jobId, { status: "processing", total: students.length, processed: 0, errors: [] });

    // simulate async import
    (async () => {
      for (const record of students) {
        try {
          if (!record.email || !record.name) {
            throw new Error("Missing email or name");
          }
          await Student.updateOne(
            { email: record.email },
            {
              $setOnInsert: {
                studentId: `STD-${Date.now()}`,
                firebaseUid: `import-${Date.now()}`,
                email: record.email,
                profile: {
                  name: record.name,
                  department: record.department || "Unknown",
                  year: record.year || 1,
                  college: record.college || "Default",
                },
              },
            },
            { upsert: true },
          );
          const job = importJobs.get(jobId);
          if (job) {
            job.processed += 1;
            importJobs.set(jobId, job);
          }
        } catch (error) {
          const job = importJobs.get(jobId);
          if (job) {
            job.errors.push({ record, error: error.message });
            importJobs.set(jobId, job);
          }
        }
      }
      const job = importJobs.get(jobId);
      if (job) {
        job.status = "completed";
        job.completedAt = new Date();
        importJobs.set(jobId, job);
      }
      logger.info("Student import completed", { jobId, admin: admin.adminId });
    })();

    res.status(202).json(apiSuccess({ jobId }, "Import started"));
  } catch (error) {
    next(error);
  }
};

export const getImportJobStatus = (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!importJobs.has(jobId)) throw createHttpError(404, "Job not found");
    res.json(apiSuccess(importJobs.get(jobId), "Import job status"));
  } catch (error) {
    next(error);
  }
};

export const assignMentor = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { mentorId, studentIds = [] } = req.body;
    if (!mentorId || !studentIds.length) throw createHttpError(400, "mentorId and studentIds are required");

    const mentor = await Mentor.findOne({ mentorId });
    if (!mentor) throw createHttpError(404, "Mentor not found");

    const students = await Student.find({ studentId: { $in: studentIds } });
    mentor.assignedStudents = Array.from(new Set([...(mentor.assignedStudents || []), ...students.map((s) => s._id)]));
    mentor.workload.current = mentor.assignedStudents.length;
    await mentor.save();

    res.json(apiSuccess({ mentor }, "Mentor assigned"));
  } catch (error) {
    next(error);
  }
};

export const getPendingCreditApprovals = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { 
      page = 1, 
      limit = 20, 
      sortBy = "requestedAt", 
      sortOrder = "asc",
      status,
      mentorId, 
      department,
      dateFrom,
      dateTo,
      studentName,
      companyName
    } = req.query;
    
    const filters = {
      status: status || "pending_admin_review",
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    };
    
    // Add optional filters
    if (mentorId) filters.mentorId = mentorId;
    if (department) filters.department = department;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (studentName) filters.studentName = studentName;
    if (companyName) filters.companyName = companyName;

    const { creditService } = await import("../services/creditService.js");
    const result = await creditService.getCreditRequestsByAdmin(filters);
    
    res.json(apiSuccess(result, "Pending credit requests"));
  } catch (error) {
    next(error);
  }
};

export const getCreditRequestDetails = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { requestId } = req.params;
    
    const { creditService } = await import("../services/creditService.js");
    const creditRequest = await creditService.getCreditRequestById(requestId);
    
    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }
    
    res.json(apiSuccess(creditRequest, "Credit request details"));
  } catch (error) {
    next(error);
  }
};

export const submitAdminReview = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { requestId } = req.params;
    const { decision, feedback, complianceChecks } = req.body;

    // Validate decision
    if (!decision || !["approved", "rejected"].includes(decision)) {
      throw createHttpError(400, "Decision must be 'approved' or 'rejected'");
    }

    // Validate feedback requirement for rejections
    if (decision === "rejected" && (!feedback || !feedback.trim())) {
      throw createHttpError(400, "Feedback is required when rejecting a credit request");
    }

    // Get credit request to find admin MongoDB ObjectId
    const { creditService } = await import("../services/creditService.js");
    const creditRequest = await creditService.getCreditRequestById(requestId);
    
    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    // Submit admin review
    const { creditReviewService } = await import("../services/creditReviewService.js");
    const updatedRequest = await creditReviewService.submitAdminReview(
      creditRequest._id,
      admin._id,
      decision,
      feedback,
      complianceChecks || {}
    );

    // If approved, trigger credit addition and certificate generation
    if (decision === "approved") {
      try {
        // Generate certificate
        const populatedRequest = await creditService.getCreditRequestById(updatedRequest._id);
        const certificate = await creditService.generateCertificate(populatedRequest);
        
        // Process credit addition with transaction support and rollback
        const result = await creditService.processCreditAdditionWithTransaction(
          updatedRequest,
          certificate
        );
        
        // Update the request reference with the saved version
        Object.assign(updatedRequest, result.creditRequest);
        
        // Send notification to student
        const { creditNotificationService } = await import("../services/creditNotificationService.js");
        await creditNotificationService.notifyStudentCreditsAdded(updatedRequest, certificate);
        
        logger.info("Credits added and certificate generated", {
          creditRequestId: updatedRequest.creditRequestId,
          studentId: updatedRequest.studentId,
          credits: updatedRequest.calculatedCredits,
        });
      } catch (error) {
        logger.error("Error in post-approval processing", {
          error: error.message,
          stack: error.stack,
          creditRequestId: updatedRequest.creditRequestId,
        });
        // Revert the admin approval status on credit addition failure
        updatedRequest.status = "pending_admin_review";
        updatedRequest.adminReview = undefined;
        await updatedRequest.save();
        
        throw createHttpError(500, `Credit addition failed: ${error.message}. Admin approval has been reverted.`);
      }
    } else {
      // Send rejection notification to student
      const { creditNotificationService } = await import("../services/creditNotificationService.js");
      await creditNotificationService.notifyStudentAdminDecision(updatedRequest, decision);
    }

    res.json(apiSuccess(updatedRequest, `Credit request ${decision}`));
  } catch (error) {
    if (error.validationErrors) {
      return next(createHttpError(400, error.validationErrors.join(", ")));
    }
    if (error.code === "PERMISSION_DENIED") {
      return next(createHttpError(403, error.message));
    }
    next(error);
  }
};

export const resolveAdminHold = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { requestId } = req.params;
    const { resolution, notes } = req.body;

    if (!resolution || !resolution.trim()) {
      throw createHttpError(400, "Resolution description is required");
    }

    // Get credit request
    const { creditService } = await import("../services/creditService.js");
    const creditRequest = await creditService.getCreditRequestById(requestId);
    
    if (!creditRequest) {
      throw createHttpError(404, "Credit request not found");
    }

    if (creditRequest.status !== "admin_rejected") {
      throw createHttpError(400, "Credit request is not in admin rejected status");
    }

    // Add resolution to history
    creditRequest.addToHistory({
      submittedAt: new Date(),
      status: "pending_admin_review",
      reviewedBy: admin._id,
      reviewerModel: "Admin",
      reviewedAt: new Date(),
      feedback: `Administrative hold resolved: ${resolution}. ${notes || ""}`,
    });

    // Transition back to pending admin review
    creditRequest.transitionTo("pending_admin_review");
    
    // Update admin review with resolution notes
    if (creditRequest.adminReview) {
      creditRequest.adminReview.feedback = `${creditRequest.adminReview.feedback}\n\nResolution: ${resolution}`;
    }

    await creditRequest.save();

    // Send notification to student
    const { creditNotificationService } = await import("../services/creditNotificationService.js");
    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      userId: creditRequest.studentId,
      role: "student",
      type: "credit_request_resolved",
      title: "Administrative Hold Resolved",
      message: `Your credit request has been resolved and is back under review. Resolution: ${resolution}`,
      priority: "medium",
      actionUrl: `/student/credit-requests/${creditRequest.creditRequestId}`,
    });

    logger.info("Admin hold resolved", {
      creditRequestId: creditRequest.creditRequestId,
      adminId: admin.adminId,
      resolution,
    });

    res.json(apiSuccess(creditRequest, "Administrative hold resolved"));
  } catch (error) {
    next(error);
  }
};

export const generateSystemReport = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { reportType } = req.body;
    const report = await Report.create({
      reportId: `SYS-${Date.now()}`,
      type: reportType || "admin",
      status: "processing",
      generatedAt: null,
    });
    logger.info("Admin report queued", { reportId: report.reportId });
    res.status(202).json(apiSuccess({ reportId: report.reportId }, "Report generation started"));
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const placements = await Application.aggregate([
      { $match: { status: "accepted" } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(apiSuccess({ placements }, "Admin analytics"));
  } catch (error) {
    next(error);
  }
};

export const getCollegeAnalytics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { college } = req.query;
    const query = college ? { "profile.college": college } : {};
    const students = await Student.find(query).select("profile readinessScore credits").lean();
    res.json(apiSuccess({ students }, "College analytics"));
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const health = {
      mongo: mongoose.connection.readyState === 1 ? "up" : "down",
      redis: "up",
      uptime: process.uptime(),
      version: "v1",
    };
    res.json(apiSuccess(health, "System health"));
  } catch (error) {
    next(error);
  }
};

export const getAIUsageStats = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    // Placeholder analytics until aiUsageLogs collection is implemented
    res.json(
      apiSuccess(
        {
          usage: {
            interview: 0,
            summaries: 0,
            recommendations: 0,
          },
          costEstimateUSD: 0,
          modelDefaults: {
            flash: config.gemini.flashModel,
            pro: config.gemini.proModel,
          },
        },
        "AI usage stats",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const approveInternship = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { internshipId } = req.params;

    // internshipId is the custom string ID (e.g. INTERN-123)
    const internship = await Internship.findOne({ internshipId });
    if (!internship) throw createHttpError(404, "Internship not found");

    const previousStatus = internship.status;
    
    // After admin approval, internship is approved and waits for mentor verification
    internship.status = "admin_approved";
    internship.adminReview = {
      reviewedBy: admin.adminId,
      reviewedAt: new Date(),
      decision: "approved",
    };
    
    // Add to audit trail
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: admin.adminId,
      actorRole: "admin",
      action: "approve_internship",
      fromStatus: previousStatus,
      toStatus: "admin_approved",
      reason: "Internship approved by admin, awaiting mentor verification",
    });
    
    await internship.save();

    res.json(apiSuccess(internship, "Internship approved successfully"));
  } catch (error) {
    next(error);
  }
};

export const rejectInternship = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { internshipId } = req.params;
    const { reason } = req.body;

    if (!reason) throw createHttpError(400, "Rejection reason is required");

    const internship = await Internship.findOne({ internshipId });
    if (!internship) throw createHttpError(404, "Internship not found");

    const previousStatus = internship.status;
    internship.status = "admin_rejected";
    internship.adminReview = {
      reviewedBy: admin.adminId,
      reviewedAt: new Date(),
      decision: "rejected",
      comments: reason,
    };
    
    // Add to audit trail
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: admin.adminId,
      actorRole: "admin",
      action: "reject_internship",
      fromStatus: previousStatus,
      toStatus: "admin_rejected",
      reason: reason,
    });
    
    await internship.save();

    res.json(apiSuccess(internship, "Internship rejected"));
  } catch (error) {
    next(error);
  }
};

export const getInternships = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Internship.countDocuments(query);

    // Get paginated internships
    const internships = await Internship.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("companyId", "companyName industry") // Populate company details
      .lean();

    // Flatten company data for easier frontend consumption
    const formattedInternships = internships.map(internship => ({
      ...internship,
      companyName: internship.companyId?.companyName || 'Unknown Company',
      companyIndustry: internship.companyId?.industry,
    }));

    // Calculate pagination metadata
    const pagination = {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    };

    res.json(apiSuccess({ internships: formattedInternships, pagination }, "Internships list"));
  } catch (error) {
    next(error);
  }
};

export const getReappeals = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { search, dateFrom, dateTo } = req.query;
    
    const query = { status: "reappeal" };
    
    // Add search filter for company name
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add date range filter for reappeal submission
    if (dateFrom || dateTo) {
      query["reappeal.submittedAt"] = {};
      if (dateFrom) {
        query["reappeal.submittedAt"].$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query["reappeal.submittedAt"].$lte = new Date(dateTo);
      }
    }
    
    const companies = await Company.find(query)
      .select("companyId companyName blockInfo reappeal")
      .sort({ "reappeal.submittedAt": -1 })
      .lean();
    
    const reappeals = companies.map(company => ({
      companyId: company.companyId,
      companyName: company.companyName,
      blockReason: company.blockInfo?.reason || "No reason provided",
      blockedAt: company.blockInfo?.blockedAt,
      reappealMessage: company.reappeal?.message,
      reappealAttachment: company.reappeal?.attachment,
      submittedAt: company.reappeal?.submittedAt,
    }));
    
    res.json(apiSuccess({ reappeals, total: reappeals.length }, "Reappeal requests"));
  } catch (error) {
    next(error);
  }
};

export const approveReappeal = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { companyId } = req.params;
    const { feedback } = req.body;
    
    const company = await Company.findOne({ companyId });
    if (!company) throw createHttpError(404, "Company not found");
    
    if (company.status !== "reappeal") {
      throw createHttpError(400, "Company is not in reappeal status");
    }
    
    // Record in history
    const historyEntry = {
      message: company.reappeal.message,
      attachment: company.reappeal.attachment,
      submittedAt: company.reappeal.submittedAt,
      reviewedAt: new Date(),
      decision: "approved",
      reviewedBy: admin.adminId,
      feedback: feedback || "Reappeal approved",
    };
    
    if (!company.reappeal.history) {
      company.reappeal.history = [];
    }
    company.reappeal.history.push(historyEntry);
    
    // Update reappeal fields
    company.reappeal.reviewedBy = admin.adminId;
    company.reappeal.reviewedAt = new Date();
    company.reappeal.reviewFeedback = feedback || "Reappeal approved";
    
    // Clear cooldown and rejection reason
    company.reappeal.cooldownEndsAt = undefined;
    company.reappeal.rejectionReason = undefined;
    
    // Change status to verified
    company.status = "verified";
    
    // Clear block info since company is now verified
    company.blockInfo = undefined;
    
    await company.save({ validateBeforeSave: false });
    
    // Send approval notification to company (Requirements: 6.2)
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: company._id,
      role: "company",
      type: "reappeal_approved",
      title: "Reappeal Approved",
      message: `Great news! Your reappeal has been approved. ${feedback || "You can now access all platform features."} Next steps: Log in to your dashboard to continue using the platform.`,
      priority: "high",
      actionUrl: "/company/dashboard",
      metadata: {
        companyId: company.companyId,
        reviewedBy: admin.adminId,
        reviewedAt: company.reappeal.reviewedAt,
        feedback,
      },
    });
    
    logger.info("Reappeal approved", { companyId, adminId: admin.adminId });
    
    res.json(apiSuccess({ companyId, newStatus: "verified" }, "Reappeal approved successfully"));
  } catch (error) {
    next(error);
  }
};

export const rejectReappeal = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { companyId } = req.params;
    const { reason, cooldownDays = 30 } = req.body;
    
    if (!reason || !reason.trim()) {
      throw createHttpError(400, "Rejection reason is required");
    }
    
    const company = await Company.findOne({ companyId });
    if (!company) throw createHttpError(404, "Company not found");
    
    if (company.status !== "reappeal") {
      throw createHttpError(400, "Company is not in reappeal status");
    }
    
    // Calculate cooldown end date
    const cooldownEndsAt = new Date();
    cooldownEndsAt.setDate(cooldownEndsAt.getDate() + cooldownDays);
    
    // Record in history
    const historyEntry = {
      message: company.reappeal.message,
      attachment: company.reappeal.attachment,
      submittedAt: company.reappeal.submittedAt,
      reviewedAt: new Date(),
      decision: "rejected",
      reviewedBy: admin.adminId,
      feedback: reason,
    };
    
    if (!company.reappeal.history) {
      company.reappeal.history = [];
    }
    company.reappeal.history.push(historyEntry);
    
    // Update reappeal fields
    company.reappeal.reviewedBy = admin.adminId;
    company.reappeal.reviewedAt = new Date();
    company.reappeal.rejectionReason = reason;
    company.reappeal.cooldownEndsAt = cooldownEndsAt;
    company.reappeal.reviewFeedback = reason;
    
    // Change status back to blocked
    company.status = "blocked";
    
    await company.save({ validateBeforeSave: false });
    
    // Send rejection notification to company (Requirements: 6.3)
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: company._id,
      role: "company",
      type: "reappeal_rejected",
      title: "Reappeal Rejected",
      message: `Your reappeal has been rejected. Reason: ${reason}. You can submit a new reappeal after ${cooldownEndsAt.toLocaleDateString()}. Cooldown period: ${cooldownDays} days.`,
      priority: "high",
      actionUrl: "/company/blocked",
      metadata: {
        companyId: company.companyId,
        reviewedBy: admin.adminId,
        reviewedAt: company.reappeal.reviewedAt,
        reason,
        cooldownEndsAt,
        cooldownDays,
      },
    });
    
    logger.info("Reappeal rejected", { companyId, adminId: admin.adminId, cooldownDays });
    
    res.json(apiSuccess({ companyId, status: "blocked", cooldownEndsAt }, "Reappeal rejected"));
  } catch (error) {
    next(error);
  }
};

// Credit Transfer Analytics Endpoints

export const getCreditAnalytics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { dateFrom, dateTo, department, status } = req.query;
    
    const { creditAnalyticsService } = await import("../services/creditAnalyticsService.js");
    const metrics = await creditAnalyticsService.getSystemMetrics({
      dateFrom,
      dateTo,
      department,
      status,
    });
    
    res.json(apiSuccess(metrics, "Credit transfer analytics"));
  } catch (error) {
    next(error);
  }
};

export const exportCreditReport = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { format = "csv", dateFrom, dateTo, status, department } = req.query;
    
    const { creditAnalyticsService } = await import("../services/creditAnalyticsService.js");
    const report = await creditAnalyticsService.exportCreditReport({
      format,
      dateFrom,
      dateTo,
      status,
      department,
    });
    
    // Set appropriate headers for file download
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
      res.send(report.data);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
      res.json(report.data);
    }
  } catch (error) {
    next(error);
  }
};

export const getBottleneckAnalysis = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { creditAnalyticsService } = await import("../services/creditAnalyticsService.js");
    const analysis = await creditAnalyticsService.getBottleneckAnalysis();
    
    res.json(apiSuccess(analysis, "Bottleneck analysis"));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/credit-requests/reminders/stats
 * Get reminder statistics for overdue credit requests
 */
export const getReminderStats = async (req, res, next) => {
  try {
    await ensureAdminContext(req);

    const { creditReminderService } = await import("../services/creditReminderService.js");
    const stats = await creditReminderService.getReminderStats();

    res.json(
      apiSuccess(
        stats,
        "Reminder statistics retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/credit-requests/reminders/send
 * Manually trigger sending reminders for overdue credit requests
 */
export const sendOverdueReminders = async (req, res, next) => {
  try {
    await ensureAdminContext(req);

    const { maxReminders = 3, dryRun = false } = req.body;

    const { creditReminderService } = await import("../services/creditReminderService.js");
    const result = await creditReminderService.sendOverdueReminders({
      maxReminders,
      dryRun,
    });

    res.json(
      apiSuccess(
        result,
        dryRun ? "Dry run completed" : "Reminders sent successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/credit-requests/reminders/schedule
 * Schedule automatic reminder job
 */
export const scheduleReminderJob = async (req, res, next) => {
  try {
    await ensureAdminContext(req);

    const { maxReminders = 3, cronPattern = "0 9 * * *" } = req.body;

    const { creditReminderService } = await import("../services/creditReminderService.js");
    const result = await creditReminderService.scheduleReminderJob({
      maxReminders,
      repeat: { pattern: cronPattern },
    });

    res.json(
      apiSuccess(
        result,
        "Reminder job scheduled successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/credit-requests/overdue
 * Get all overdue credit requests
 */
export const getOverdueCreditRequests = async (req, res, next) => {
  try {
    await ensureAdminContext(req);

    const { creditReminderService } = await import("../services/creditReminderService.js");
    const overdueRequests = await creditReminderService.getOverdueRequests();

    // Add additional details for admin view
    const requestsWithDetails = overdueRequests.map((req) => {
      const daysSinceLastUpdate = Math.floor(
        (Date.now() - req.lastUpdatedAt) / (1000 * 60 * 60 * 24)
      );

      return {
        creditRequestId: req.creditRequestId,
        studentId: req.studentId?.studentId,
        studentName: req.studentId?.profile?.fullName || req.studentId?.email,
        internshipTitle: req.internshipId?.title,
        status: req.status,
        lastUpdatedAt: req.lastUpdatedAt,
        daysSinceLastUpdate,
        remindersSent: req.metadata.remindersSent,
        isOverdue: req.isOverdue(),
      };
    });

    res.json(
      apiSuccess(
        {
          total: requestsWithDetails.length,
          requests: requestsWithDetails,
        },
        "Overdue credit requests retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Internship Verification Workflow Endpoints (Task 10.1)
// Requirements: 2.2, 2.3
// ============================================================================

/**
 * GET /api/admin/internships/pending
 * List pending internships for admin verification
 * Requirements: 2.2
 */
export const getPendingInternshipVerifications = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { 
      page = 1, 
      limit = 20, 
      department, 
      companyId,
      sortBy = "postedAt",
      sortOrder = "desc"
    } = req.query;

    const filters = {
      status: "pending_admin_verification",
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    };

    if (department) filters.department = department;
    if (companyId) filters.companyId = companyId;

    const { internshipService } = await import("../services/internshipService.js");
    const result = await internshipService.getInternshipsByStatus(
      "pending_admin_verification",
      filters
    );

    res.json(apiSuccess(result, "Pending internship verifications"));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/internships/:id/approve
 * Approve an internship posting
 * Requirements: 2.2
 */
export const approveInternshipVerification = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { id } = req.params; // This is the internshipId (custom string ID)
    const { comments } = req.body;

    const { approvalWorkflowService } = await import("../services/approvalWorkflowService.js");
    
    // Use admin MongoDB ObjectId for the service
    const updatedInternship = await approvalWorkflowService.adminApprove(
      id,
      admin._id,
      comments || ""
    );

    logger.info("Admin approved internship via verification endpoint", {
      internshipId: id,
      adminId: admin.adminId,
    });

    res.json(apiSuccess(updatedInternship, "Internship approved successfully"));
  } catch (error) {
    logger.error("Admin approval failed", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * POST /api/admin/internships/:id/reject
 * Reject an internship posting with reasons
 * Requirements: 2.3
 */
export const rejectInternshipVerification = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { id } = req.params; // This is the internshipId (custom string ID)
    const { reasons } = req.body;

    // Validate reasons
    if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
      throw createHttpError(400, "At least one rejection reason is required");
    }

    const { approvalWorkflowService } = await import("../services/approvalWorkflowService.js");
    
    // Use admin MongoDB ObjectId for the service
    const updatedInternship = await approvalWorkflowService.adminReject(
      id,
      admin._id,
      reasons
    );

    logger.info("Admin rejected internship via verification endpoint", {
      internshipId: id,
      adminId: admin.adminId,
      reasons,
    });

    res.json(apiSuccess(updatedInternship, "Internship rejected successfully"));
  } catch (error) {
    logger.error("Admin rejection failed", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * GET /api/admin/internships/:id
 * Get internship details with company history for admin review
 * Requirements: 2.2
 */
export const getInternshipDetailsForAdmin = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { id } = req.params; // This is the internshipId (custom string ID)

    // Get internship details
    const internship = await Internship.findOne({ internshipId: id })
      .populate("companyId", "companyId companyName industry status adminReview")
      .lean();

    if (!internship) {
      throw createHttpError(404, "Internship not found");
    }

    // Get company history - other internships posted by this company
    const companyHistory = await Internship.find({
      companyId: internship.companyId._id,
      internshipId: { $ne: id }, // Exclude current internship
    })
      .select("internshipId title status postedAt adminReview mentorApproval")
      .sort({ postedAt: -1 })
      .limit(10)
      .lean();

    // Get company's verification history
    const company = await Company.findById(internship.companyId._id)
      .select("companyId companyName status adminReview verificationHistory")
      .lean();

    // Format review history from audit trail
    // Sort by timestamp descending (newest first) - Requirement 8.4
    const reviewHistory = (internship.auditTrail || [])
      .map(entry => ({
        timestamp: entry.timestamp,
        actor: entry.actor,
        actorRole: entry.actorRole,
        action: entry.action,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason,
        comments: entry.comments,
        metadata: entry.metadata,
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Combine data for admin review
    const detailedView = {
      internship,
      company: {
        companyId: company?.companyId,
        companyName: company?.companyName,
        status: company?.status,
        adminReview: company?.adminReview,
        verificationHistory: company?.verificationHistory || [],
      },
      companyHistory: {
        totalInternships: companyHistory.length,
        recentInternships: companyHistory,
        approvedCount: companyHistory.filter(i => i.status === "admin_approved" || i.status === "open_for_applications").length,
        rejectedCount: companyHistory.filter(i => i.status === "admin_rejected").length,
      },
      reviewHistory,
    };

    res.json(apiSuccess(detailedView, "Internship details for admin review"));
  } catch (error) {
    logger.error("Failed to get internship details for admin", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};

// ============================================================================
// Internship Analytics Endpoints (Task 10.2)
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
// ============================================================================

/**
 * GET /api/admin/analytics
 * Get system-wide analytics
 * Requirements: 10.1
 */
export const getSystemAnalytics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { dateFrom, dateTo } = req.query;

    const { internshipAnalyticsService } = await import("../services/internshipAnalyticsService.js");
    const analytics = await internshipAnalyticsService.getAdminAnalytics({
      dateFrom,
      dateTo,
    });

    res.json(apiSuccess(analytics, "System-wide analytics"));
  } catch (error) {
    logger.error("Failed to get system analytics", {
      error: error.message,
    });
    next(error);
  }
};

/**
 * GET /api/admin/analytics/companies
 * Get company performance metrics
 * Requirements: 10.2
 */
export const getCompanyPerformanceMetrics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { dateFrom, dateTo, limit = 20, sortBy = "averageRating" } = req.query;

    const { internshipAnalyticsService } = await import("../services/internshipAnalyticsService.js");
    
    // Get admin analytics which includes company metrics
    const analytics = await internshipAnalyticsService.getAdminAnalytics({
      dateFrom,
      dateTo,
    });

    // Extract and sort company metrics
    let companyMetrics = analytics.companies.topPerformers || [];
    
    // Sort based on requested field
    if (sortBy === "internshipsPosted") {
      companyMetrics.sort((a, b) => b.internshipsPosted - a.internshipsPosted);
    } else if (sortBy === "applicationsReceived") {
      companyMetrics.sort((a, b) => b.applicationsReceived - a.applicationsReceived);
    } else if (sortBy === "completionRate") {
      companyMetrics.sort((a, b) => b.completionRate - a.completionRate);
    } else {
      // Default: averageRating
      companyMetrics.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Limit results
    companyMetrics = companyMetrics.slice(0, parseInt(limit));

    res.json(apiSuccess({
      total: analytics.companies.total,
      metrics: companyMetrics,
      period: { dateFrom, dateTo },
    }, "Company performance metrics"));
  } catch (error) {
    logger.error("Failed to get company performance metrics", {
      error: error.message,
    });
    next(error);
  }
};

/**
 * GET /api/admin/analytics/departments
 * Get department performance metrics
 * Requirements: 10.3
 */
export const getDepartmentPerformanceMetrics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { dateFrom, dateTo, department } = req.query;

    const { internshipAnalyticsService } = await import("../services/internshipAnalyticsService.js");
    
    if (department) {
      // Get specific department analytics
      const analytics = await internshipAnalyticsService.getDepartmentAnalytics(
        department,
        { dateFrom, dateTo }
      );
      
      res.json(apiSuccess(analytics, `${department} department analytics`));
    } else {
      // Get all departments from admin analytics
      const analytics = await internshipAnalyticsService.getAdminAnalytics({
        dateFrom,
        dateTo,
      });

      res.json(apiSuccess({
        departments: analytics.departments,
        period: { dateFrom, dateTo },
      }, "Department performance metrics"));
    }
  } catch (error) {
    logger.error("Failed to get department performance metrics", {
      error: error.message,
    });
    next(error);
  }
};

/**
 * GET /api/admin/analytics/mentors
 * Get mentor performance metrics
 * Requirements: 10.4
 */
export const getMentorPerformanceMetrics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { dateFrom, dateTo, department, limit = 20, sortBy = "approvalRate" } = req.query;

    const { internshipAnalyticsService } = await import("../services/internshipAnalyticsService.js");
    
    // Get admin analytics which includes mentor metrics
    const analytics = await internshipAnalyticsService.getAdminAnalytics({
      dateFrom,
      dateTo,
    });

    // Extract mentor metrics
    let mentorMetrics = analytics.mentors.topPerformers || [];
    
    // Filter by department if specified
    if (department) {
      mentorMetrics = mentorMetrics.filter(m => m.department === department);
    }

    // Sort based on requested field
    if (sortBy === "approvalsProcessed") {
      mentorMetrics.sort((a, b) => b.approvalsProcessed - a.approvalsProcessed);
    } else if (sortBy === "averageResponseTime") {
      mentorMetrics.sort((a, b) => a.averageResponseTime - b.averageResponseTime); // Lower is better
    } else if (sortBy === "studentsSupervised") {
      mentorMetrics.sort((a, b) => b.studentsSupervised - a.studentsSupervised);
    } else {
      // Default: approvalRate
      mentorMetrics.sort((a, b) => b.approvalRate - a.approvalRate);
    }

    // Limit results
    mentorMetrics = mentorMetrics.slice(0, parseInt(limit));

    res.json(apiSuccess({
      total: analytics.mentors.total,
      metrics: mentorMetrics,
      period: { dateFrom, dateTo },
    }, "Mentor performance metrics"));
  } catch (error) {
    logger.error("Failed to get mentor performance metrics", {
      error: error.message,
    });
    next(error);
  }
};

/**
 * GET /api/admin/analytics/students
 * Get student performance metrics
 * Requirements: 10.5
 */
export const getStudentPerformanceMetrics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const { 
      department, 
      minReadinessScore, 
      minCredits,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query = {};
    if (department) query["profile.department"] = department;
    if (minReadinessScore) query.readinessScore = { $gte: parseFloat(minReadinessScore) };
    if (minCredits) query["credits.earned"] = { $gte: parseFloat(minCredits) };

    // Get students with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(query)
      .select("studentId profile readinessScore credits")
      .sort({ readinessScore: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalStudents = await Student.countDocuments(query);

    // Get applications for these students
    const studentIds = students.map(s => s._id);
    const applications = await Application.find({
      studentId: { $in: studentIds },
    }).lean();

    // Calculate metrics per student
    const studentMetrics = students.map(student => {
      const studentApps = applications.filter(
        a => a.studentId.toString() === student._id.toString()
      );

      return {
        studentId: student.studentId,
        name: student.profile?.fullName || student.profile?.name,
        department: student.profile?.department,
        readinessScore: student.readinessScore || 0,
        creditsEarned: student.credits?.earned || 0,
        creditsRequired: student.credits?.required || 0,
        totalApplications: studentApps.length,
        acceptedApplications: studentApps.filter(a => a.status === "accepted").length,
        completionRate: studentApps.filter(a => a.status === "accepted").length > 0
          ? (studentApps.filter(a => a.status === "completed").length / studentApps.filter(a => a.status === "accepted").length) * 100
          : 0,
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalStudents,
      averageReadinessScore: students.length > 0
        ? students.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / students.length
        : 0,
      averageCreditsEarned: students.length > 0
        ? students.reduce((sum, s) => sum + (s.credits?.earned || 0), 0) / students.length
        : 0,
      totalApplications: applications.length,
      overallCompletionRate: applications.filter(a => a.status === "accepted").length > 0
        ? (applications.filter(a => a.status === "completed").length / applications.filter(a => a.status === "accepted").length) * 100
        : 0,
    };

    res.json(apiSuccess({
      students: studentMetrics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalStudents,
        pages: Math.ceil(totalStudents / parseInt(limit)),
      },
      overallStats,
    }, "Student performance metrics"));
  } catch (error) {
    logger.error("Failed to get student performance metrics", {
      error: error.message,
    });
    next(error);
  }
};
