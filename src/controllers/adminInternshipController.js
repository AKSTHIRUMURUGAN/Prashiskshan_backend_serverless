import mongoose from "mongoose";
import Internship from "../models/Internship.js";
import Company from "../models/Company.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";
import { logger } from "../utils/logger.js";
import * as redis from "../config/redis.js";
import { logAdminAction } from "../middleware/adminAuth.js";

/**
 * Ensure the request is from an admin user
 */
const ensureAdminContext = async (req) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "admin" && context.role !== "super_admin") {
    throw createHttpError(403, "Admin privileges required");
  }
  return context.doc;
};

/**
 * GET /api/admins/internships
 * List internships with filtering and pagination
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const getInternshipsList = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    
    const {
      status,
      search,
      dateFrom,
      dateTo,
      department,
      companyId,
      workMode,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};
    
    // Default filter: exclude deleted internships unless explicitly requested
    // Admins can include deleted internships by passing includeDeleted=true
    if (req.query.includeDeleted !== "true") {
      query.isDeleted = { $ne: true };
    }
    
    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }
    
    // Search filter (title, company name, location)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    // Department filter
    if (department) {
      query.department = department;
    }
    
    // Company filter
    if (companyId) {
      const company = await Company.findOne({ companyId });
      if (company) {
        query.companyId = company._id;
      }
    }
    
    // Work mode filter
    if (workMode) {
      query.workMode = workMode;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [internships, total] = await Promise.all([
      Internship.find(query)
        .populate("companyId", "companyId companyName industry status")
        .select("internshipId title companyId location duration status postedAt createdAt workMode department stipend")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Internship.countDocuments(query),
    ]);

    // Format response
    const formattedInternships = internships.map(internship => ({
      internshipId: internship.internshipId,
      title: internship.title,
      companyName: internship.companyId?.companyName || "Unknown",
      companyId: internship.companyId?.companyId,
      location: internship.location,
      duration: internship.duration,
      status: internship.status,
      postedAt: internship.postedAt || internship.createdAt,
      workMode: internship.workMode,
      department: internship.department,
      stipend: internship.stipend,
    }));

    res.json(
      apiSuccess(
        {
          internships: formattedInternships,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
        "Internships list"
      )
    );
  } catch (error) {
    logger.error("Failed to get internships list", { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admins/internships/:id
 * Get detailed internship information
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const getInternshipDetail = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { id } = req.params;

    // Get internship details
    const internship = await Internship.findOne({ internshipId: id })
      .populate("companyId")
      .lean();

    if (!internship) {
      throw createHttpError(404, "Internship not found");
    }

    // Get application count
    const applicationCount = await Application.countDocuments({
      internshipId: internship._id,
    });

    // Format company information
    const company = {
      companyId: internship.companyId?.companyId,
      companyName: internship.companyId?.companyName,
      status: internship.companyId?.status,
      verificationStatus: internship.companyId?.status,
      riskLevel: internship.companyId?.aiVerification?.riskLevel,
    };

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
        metadata: entry.metadata,
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(
      apiSuccess(
        {
          internship,
          company,
          applicationCount,
          reviewHistory,
        },
        "Internship details"
      )
    );
  } catch (error) {
    logger.error("Failed to get internship details", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * POST /api/admins/internships/:id/approve
 * Approve an internship posting
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const approveInternshipPosting = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { id } = req.params;
    const { comments } = req.body;

    const internship = await Internship.findOne({ internshipId: id });
    if (!internship) {
      throw createHttpError(404, "Internship not found");
    }

    // Check if already approved
    if (internship.status === "admin_approved") {
      throw createHttpError(400, "Internship is already approved");
    }

    const previousStatus = internship.status;

    // Update status and admin review
    internship.status = "admin_approved";
    internship.adminReview = {
      reviewedBy: admin.adminId,
      reviewedAt: new Date(),
      decision: "approved",
      comments: comments || "",
      reasons: [],
      editHistory: internship.adminReview?.editHistory || [],
    };

    // Add to audit trail
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: admin.adminId,
      actorRole: "admin",
      action: "approved",
      fromStatus: previousStatus,
      toStatus: "admin_approved",
      reason: comments || "Approved by admin",
    });

    await internship.save();

    // Send notification to company
    const company = await Company.findById(internship.companyId);
    if (company) {
      await Notification.create({
        notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: company._id,
        role: "company",
        type: "internship_approved",
        title: "Internship Approved",
        message: `Your internship posting "${internship.title}" has been approved and is now visible to students.`,
        priority: "medium",
        actionUrl: `/company/internships/${internship.internshipId}`,
        metadata: {
          internshipId: internship.internshipId,
          reviewedBy: admin.adminId,
        },
      });
    }

    // Log admin action for audit
    logAdminAction("approve_internship", {
      internshipId: id,
      previousStatus,
      newStatus: "admin_approved",
      comments,
    }, req);

    logger.info("Internship approved", {
      internshipId: id,
      adminId: admin.adminId,
    });

    res.json(apiSuccess({ internship }, "Internship approved successfully"));
  } catch (error) {
    logger.error("Failed to approve internship", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * POST /api/admins/internships/:id/reject
 * Reject an internship posting with reasons
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export const rejectInternshipPosting = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { id } = req.params;
    const { reason, reasons = [] } = req.body;

    // Validate rejection reason
    if (!reason || !reason.trim()) {
      throw createHttpError(400, "Rejection reason is required");
    }

    const internship = await Internship.findOne({ internshipId: id });
    if (!internship) {
      throw createHttpError(404, "Internship not found");
    }

    const previousStatus = internship.status;

    // Update status and admin review
    internship.status = "admin_rejected";
    internship.adminReview = {
      reviewedBy: admin.adminId,
      reviewedAt: new Date(),
      decision: "rejected",
      comments: reason,
      reasons: reasons.length > 0 ? reasons : [reason],
      editHistory: internship.adminReview?.editHistory || [],
    };

    // Add to audit trail
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: admin.adminId,
      actorRole: "admin",
      action: "rejected",
      fromStatus: previousStatus,
      toStatus: "admin_rejected",
      reason,
    });

    await internship.save();

    // Send notification to company with rejection reason
    const company = await Company.findById(internship.companyId);
    if (company) {
      await Notification.create({
        notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: company._id,
        role: "company",
        type: "internship_rejected",
        title: "Internship Rejected",
        message: `Your internship posting "${internship.title}" has been rejected. Reason: ${reason}`,
        priority: "high",
        actionUrl: `/company/internships/${internship.internshipId}`,
        metadata: {
          internshipId: internship.internshipId,
          reviewedBy: admin.adminId,
          reason,
          reasons,
        },
      });
    }

    // Log admin action for audit
    logAdminAction("reject_internship", {
      internshipId: id,
      previousStatus,
      newStatus: "admin_rejected",
      reason,
      reasons,
    }, req);

    logger.info("Internship rejected", {
      internshipId: id,
      adminId: admin.adminId,
      reason,
    });

    res.json(apiSuccess({ internship }, "Internship rejected successfully"));
  } catch (error) {
    logger.error("Failed to reject internship", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};

/**
 * POST /api/admins/internships/bulk-approve
 * Bulk approve internships
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */
export const bulkApproveInternships = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { internshipIds } = req.body;

    if (!Array.isArray(internshipIds) || internshipIds.length === 0) {
      throw createHttpError(400, "internshipIds array is required");
    }

    // Limit bulk operations
    if (internshipIds.length > 100) {
      throw createHttpError(400, "Maximum 100 internships can be processed at once");
    }

    const successful = [];
    const failed = [];

    for (const internshipId of internshipIds) {
      try {
        const internship = await Internship.findOne({ internshipId });
        
        if (!internship) {
          failed.push({
            internshipId,
            error: "Internship not found",
          });
          continue;
        }

        if (internship.status === "admin_approved") {
          failed.push({
            internshipId,
            error: "Already approved",
          });
          continue;
        }

        const previousStatus = internship.status;

        // Update internship
        internship.status = "admin_approved";
        internship.adminReview = {
          reviewedBy: admin.adminId,
          reviewedAt: new Date(),
          decision: "approved",
          comments: "Bulk approved",
          reasons: [],
          editHistory: internship.adminReview?.editHistory || [],
        };

        internship.auditTrail.push({
          timestamp: new Date(),
          actor: admin.adminId,
          actorRole: "admin",
          action: "bulk_approved",
          fromStatus: previousStatus,
          toStatus: "admin_approved",
          reason: "Bulk approval",
        });

        await internship.save();

        // Send notification
        const company = await Company.findById(internship.companyId);
        if (company) {
          await Notification.create({
            notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: company._id,
            role: "company",
            type: "internship_approved",
            title: "Internship Approved",
            message: `Your internship posting "${internship.title}" has been approved.`,
            priority: "medium",
            actionUrl: `/company/internships/${internship.internshipId}`,
          });
        }

        successful.push(internshipId);
      } catch (error) {
        failed.push({
          internshipId,
          error: error.message,
        });
      }
    }

    // Log admin action for audit
    logAdminAction("bulk_approve_internships", {
      totalRequested: internshipIds.length,
      successful: successful.length,
      failed: failed.length,
      successfulIds: successful,
      failedIds: failed.map(f => f.internshipId),
    }, req);

    logger.info("Bulk approval completed", {
      adminId: admin.adminId,
      successful: successful.length,
      failed: failed.length,
    });

    res.json(
      apiSuccess(
        {
          successful,
          failed,
        },
        `Bulk approval completed: ${successful.length} successful, ${failed.length} failed`
      )
    );
  } catch (error) {
    logger.error("Bulk approval failed", { error: error.message });
    next(error);
  }
};

/**
 * POST /api/admins/internships/bulk-reject
 * Bulk reject internships
 * Requirements: 5.1, 5.3, 5.4, 5.5
 */
export const bulkRejectInternships = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { internshipIds, reason } = req.body;

    if (!Array.isArray(internshipIds) || internshipIds.length === 0) {
      throw createHttpError(400, "internshipIds array is required");
    }

    if (!reason || !reason.trim()) {
      throw createHttpError(400, "Rejection reason is required for bulk rejection");
    }

    // Limit bulk operations
    if (internshipIds.length > 100) {
      throw createHttpError(400, "Maximum 100 internships can be processed at once");
    }

    const successful = [];
    const failed = [];

    for (const internshipId of internshipIds) {
      try {
        const internship = await Internship.findOne({ internshipId });
        
        if (!internship) {
          failed.push({
            internshipId,
            error: "Internship not found",
          });
          continue;
        }

        const previousStatus = internship.status;

        // Update internship
        internship.status = "admin_rejected";
        internship.adminReview = {
          reviewedBy: admin.adminId,
          reviewedAt: new Date(),
          decision: "rejected",
          comments: reason,
          reasons: [reason],
          editHistory: internship.adminReview?.editHistory || [],
        };

        internship.auditTrail.push({
          timestamp: new Date(),
          actor: admin.adminId,
          actorRole: "admin",
          action: "bulk_rejected",
          fromStatus: previousStatus,
          toStatus: "admin_rejected",
          reason,
        });

        await internship.save();

        // Send notification
        const company = await Company.findById(internship.companyId);
        if (company) {
          await Notification.create({
            notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: company._id,
            role: "company",
            type: "internship_rejected",
            title: "Internship Rejected",
            message: `Your internship posting "${internship.title}" has been rejected. Reason: ${reason}`,
            priority: "high",
            actionUrl: `/company/internships/${internship.internshipId}`,
          });
        }

        successful.push(internshipId);
      } catch (error) {
        failed.push({
          internshipId,
          error: error.message,
        });
      }
    }

    // Log admin action for audit
    logAdminAction("bulk_reject_internships", {
      totalRequested: internshipIds.length,
      successful: successful.length,
      failed: failed.length,
      reason,
      successfulIds: successful,
      failedIds: failed.map(f => f.internshipId),
    }, req);

    logger.info("Bulk rejection completed", {
      adminId: admin.adminId,
      successful: successful.length,
      failed: failed.length,
    });

    res.json(
      apiSuccess(
        {
          successful,
          failed,
        },
        `Bulk rejection completed: ${successful.length} successful, ${failed.length} failed`
      )
    );
  } catch (error) {
    logger.error("Bulk rejection failed", { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admins/internships/analytics
 * Get internship analytics
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const getInternshipAnalytics = async (req, res, next) => {
  try {
    await ensureAdminContext(req);
    const { dateFrom, dateTo } = req.query;

    // Create cache key based on query parameters
    const cacheKey = `analytics:internships:${dateFrom || 'all'}:${dateTo || 'all'}`;
    
    // Try to get from cache
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        logger.info("Returning cached analytics data", { cacheKey });
        return res.json(apiSuccess(JSON.parse(cachedData), "Internship analytics (cached)"));
      }
    } catch (cacheError) {
      logger.warn("Cache retrieval failed, proceeding with database query", { error: cacheError.message });
    }

    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Get counts by status
    const [totalInternships, byStatus, topCompanies, byDepartment] = await Promise.all([
      Internship.countDocuments(dateFilter),
      Internship.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Internship.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$companyId",
            postingCount: { $sum: 1 },
          },
        },
        { $sort: { postingCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "companies",
            localField: "_id",
            foreignField: "_id",
            as: "company",
          },
        },
        { $unwind: "$company" },
        {
          $project: {
            companyId: "$company.companyId",
            companyName: "$company.companyName",
            postingCount: 1,
          },
        },
      ]),
      Internship.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Format status counts
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    byStatus.forEach(item => {
      if (item._id === "pending_admin_verification") {
        statusCounts.pending = item.count;
      } else if (item._id === "admin_approved" || item._id === "open_for_applications") {
        statusCounts.approved += item.count;
      } else if (item._id === "admin_rejected") {
        statusCounts.rejected = item.count;
      }
    });

    // Calculate approval rate
    const totalReviewed = statusCounts.approved + statusCounts.rejected;
    const approvalRate = totalReviewed > 0 
      ? (statusCounts.approved / totalReviewed) * 100 
      : 0;

    // Calculate average review time
    const reviewedInternships = await Internship.find({
      ...dateFilter,
      "adminReview.reviewedAt": { $exists: true },
      isDeleted: { $ne: true },
    })
      .select("createdAt adminReview.reviewedAt")
      .lean();

    let averageReviewTime = 0;
    if (reviewedInternships.length > 0) {
      const totalReviewTime = reviewedInternships.reduce((sum, internship) => {
        const reviewTime = internship.adminReview.reviewedAt - internship.createdAt;
        return sum + reviewTime;
      }, 0);
      averageReviewTime = totalReviewTime / reviewedInternships.length / (1000 * 60 * 60); // Convert to hours
    }

    const analyticsData = {
      totalInternships,
      byStatus: statusCounts,
      approvalRate: Math.round(approvalRate * 100) / 100,
      averageReviewTime: Math.round(averageReviewTime * 100) / 100,
      topCompanies,
      byDepartment,
    };

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(analyticsData), 300);
      logger.info("Analytics data cached", { cacheKey, ttl: 300 });
    } catch (cacheError) {
      logger.warn("Failed to cache analytics data", { error: cacheError.message });
    }

    res.json(apiSuccess(analyticsData, "Internship analytics"));
  } catch (error) {
    logger.error("Failed to get internship analytics", { error: error.message });
    next(error);
  }
};

/**
 * PATCH /api/admins/internships/:id
 * Edit internship details
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export const editInternshipDetails = async (req, res, next) => {
  try {
    const admin = await ensureAdminContext(req);
    const { id } = req.params;
    const updates = req.body;

    const internship = await Internship.findOne({ internshipId: id });
    if (!internship) {
      throw createHttpError(404, "Internship not found");
    }

    // Define editable fields
    const editableFields = [
      "title",
      "description",
      "requiredSkills",
      "optionalSkills",
      "location",
      "duration",
      "stipend",
      "workMode",
      "responsibilities",
      "learningOpportunities",
    ];

    // Helper function to check if two values are equal (handles arrays)
    const isEqual = (val1, val2) => {
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        return val1.every((item, index) => item === val2[index]);
      }
      return val1 === val2;
    };

    // Track changes
    const changes = {};
    editableFields.forEach(field => {
      if (updates[field] !== undefined && !isEqual(updates[field], internship[field])) {
        changes[field] = {
          old: internship[field],
          new: updates[field],
        };
        internship[field] = updates[field];
      }
    });

    if (Object.keys(changes).length === 0) {
      throw createHttpError(400, "No valid changes provided");
    }

    // Add to edit history
    if (!internship.adminReview) {
      internship.adminReview = {
        editHistory: [],
      };
    }
    if (!internship.adminReview.editHistory) {
      internship.adminReview.editHistory = [];
    }

    internship.adminReview.editHistory.push({
      editedAt: new Date(),
      editedBy: admin.adminId,
      changes,
      reason: updates.editReason || "Admin edit",
    });

    // Add to audit trail
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: admin.adminId,
      actorRole: "admin",
      action: "edited",
      fromStatus: internship.status,
      toStatus: internship.status,
      reason: updates.editReason || "Admin edit",
      metadata: { changes },
    });

    await internship.save();

    // Send notification to company
    const company = await Company.findById(internship.companyId);
    if (company) {
      const changedFields = Object.keys(changes).join(", ");
      await Notification.create({
        notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: company._id,
        role: "company",
        type: "internship_edited",
        title: "Internship Updated",
        message: `Your internship posting "${internship.title}" has been updated by an administrator. Modified fields: ${changedFields}`,
        priority: "medium",
        actionUrl: `/company/internships/${internship.internshipId}`,
        metadata: {
          internshipId: internship.internshipId,
          editedBy: admin.adminId,
          changes,
        },
      });
    }

    // Log admin action for audit
    logAdminAction("edit_internship", {
      internshipId: id,
      changedFields: Object.keys(changes),
      changes,
      editReason: updates.editReason,
    }, req);

    logger.info("Internship edited", {
      internshipId: id,
      adminId: admin.adminId,
      changes: Object.keys(changes),
    });

    res.json(apiSuccess({ internship }, "Internship updated successfully"));
  } catch (error) {
    logger.error("Failed to edit internship", {
      internshipId: req.params.id,
      error: error.message,
    });
    next(error);
  }
};
