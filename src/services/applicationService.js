import Application from "../models/Application.js";
import Internship from "../models/Internship.js";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import { internshipService } from "./internshipService.js";
import { notificationService } from "./notificationService.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

/**
 * ApplicationService - Manages student application lifecycle
 * Handles creation, filtering, company review decisions, and metrics
 */
class ApplicationService {
  /**
   * Generate unique application ID
   */
  _generateApplicationId() {
    return `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Validate application data
   */
  _validateApplicationData(applicationData) {
    if (!applicationData.coverLetter || applicationData.coverLetter.trim().length === 0) {
      throw new Error("Cover letter is required");
    }

    if (applicationData.coverLetter.length < 50) {
      throw new Error("Cover letter must be at least 50 characters");
    }

    if (applicationData.coverLetter.length > 5000) {
      throw new Error("Cover letter must not exceed 5000 characters");
    }
  }

  /**
   * Create a new application with validation and deadline check
   * @param {string} studentId - MongoDB ObjectId of the student
   * @param {string} internshipId - Internship ID
   * @param {Object} applicationData - Application data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created application
   */
  async createApplication(studentId, internshipId, applicationData, options = {}) {
    const session = options.session || await mongoose.startSession();
    const shouldCommitSession = !options.session;

    try {
      if (shouldCommitSession) {
        await session.startTransaction();
      }

      // Validate application data
      this._validateApplicationData(applicationData);

      // Get internship details
      const internship = await Internship.findOne({ internshipId }).session(session);

      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Check if internship is open for applications
      if (internship.status !== "open_for_applications") {
        throw new Error(`Internship is not open for applications. Current status: ${internship.status}`);
      }

      // Check application deadline
      const now = new Date();
      if (internship.applicationDeadline < now) {
        throw new Error("Application deadline has passed");
      }

      // Check if student already applied
      const existingApplication = await Application.findOne({
        studentId,
        internshipId: internship._id,
      }).session(session);

      if (existingApplication) {
        throw new Error("You have already applied to this internship");
      }

      // Get student details
      const student = await Student.findById(studentId).session(session);

      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }

      // Check department match
      if (student.department !== internship.department) {
        throw new Error("Department mismatch: You can only apply to internships in your department");
      }

      // Generate unique application ID
      const applicationId = this._generateApplicationId();

      // Prepare application document
      const applicationDoc = {
        applicationId,
        studentId,
        internshipId: internship._id,
        companyId: internship.companyId,
        department: internship.department,
        status: "pending",
        appliedAt: new Date(),
        coverLetter: applicationData.coverLetter.trim(),
        resumeUrl: applicationData.resumeUrl || student.profile?.resumeUrl,
        companyFeedback: {
          status: "pending",
        },
        timeline: [
          {
            event: "Application submitted",
            timestamp: new Date(),
            performedBy: student.studentId,
            notes: "Student applied to internship",
          },
        ],
      };

      // Create application
      const application = await Application.create([applicationDoc], { session });

      // Increment applied count on internship
      await Internship.findOneAndUpdate(
        { internshipId },
        { $inc: { appliedCount: 1 } },
        { session }
      );

      if (shouldCommitSession) {
        await session.commitTransaction();
      }

      logger.info("Application created successfully", {
        applicationId,
        studentId: studentId.toString(),
        internshipId,
        companyId: internship.companyId.toString(),
      });

      // Notify company of new application (async, don't wait)
      this._notifyCompanyOfApplication(application[0], internship, student).catch(error => {
        logger.error("Failed to notify company of application", {
          applicationId,
          error: error.message,
        });
      });

      return application[0];
    } catch (error) {
      if (shouldCommitSession) {
        await session.abortTransaction();
      }

      logger.error("Failed to create application", {
        studentId: studentId.toString(),
        internshipId,
        error: error.message,
      });
      throw error;
    } finally {
      if (shouldCommitSession) {
        await session.endSession();
      }
    }
  }

  /**
   * Notify company of new application
   */
  async _notifyCompanyOfApplication(application, internship, student) {
    try {
      // Get company details
      const company = await Company.findById(internship.companyId).lean();

      if (!company) {
        logger.warn("Company not found for notification", {
          companyId: internship.companyId.toString(),
        });
        return;
      }

      await notificationService.notifyUser({
        userId: company.companyId,
        mongoId: company._id,
        role: "company",
        email: company.pointOfContact?.email || company.email,
        title: "New Application Received",
        message: `${student.profile?.firstName || "A student"} ${student.profile?.lastName || ""} has applied to your internship "${internship.title}".`,
        priority: "medium",
        actionUrl: `/company/applications/${application.applicationId}`,
        metadata: {
          applicationId: application.applicationId,
          internshipId: internship.internshipId,
          studentId: student.studentId,
        },
      });

      logger.info("Company notified of new application", {
        applicationId: application.applicationId,
        companyId: company.companyId,
      });
    } catch (error) {
      logger.error("Failed to notify company", {
        applicationId: application.applicationId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block application creation
    }
  }

  /**
   * Get applications by internship with filtering
   * @param {string} internshipId - Internship ID (can be MongoDB ObjectId or internshipId string)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Applications with pagination
   */
  async getApplicationsByInternship(internshipId, filters = {}) {
    try {
      // Determine if internshipId is MongoDB ObjectId or custom internshipId
      let query;
      if (mongoose.Types.ObjectId.isValid(internshipId) && internshipId.length === 24) {
        query = { internshipId: mongoose.Types.ObjectId(internshipId) };
      } else {
        // Find internship by custom internshipId first
        const internship = await Internship.findOne({ internshipId }).lean();
        if (!internship) {
          throw new Error(`Internship not found: ${internshipId}`);
        }
        query = { internshipId: internship._id };
      }

      // Apply status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Apply company feedback status filter
      if (filters.companyFeedbackStatus) {
        query["companyFeedback.status"] = filters.companyFeedbackStatus;
      }

      // Apply search filter (search in cover letter or student name)
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Date range filters
      if (filters.appliedFrom) {
        query.appliedAt = { ...query.appliedAt, $gte: new Date(filters.appliedFrom) };
      }

      if (filters.appliedTo) {
        query.appliedAt = { ...query.appliedAt, $lte: new Date(filters.appliedTo) };
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Sort
      const sortField = filters.sortBy || "appliedAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const [applications, total] = await Promise.all([
        Application.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("studentId", "studentId profile department readinessScore")
          .lean(),
        Application.countDocuments(query),
      ]);

      logger.info("Applications fetched by internship", {
        internshipId,
        count: applications.length,
        filters,
      });

      return {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get applications by internship", {
        internshipId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get applications by student with status filtering
   * @param {string} studentId - MongoDB ObjectId of the student
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Applications with pagination
   */
  async getApplicationsByStudent(studentId, filters = {}) {
    try {
      const query = { studentId };

      // Apply status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Apply company feedback status filter
      if (filters.companyFeedbackStatus) {
        query["companyFeedback.status"] = filters.companyFeedbackStatus;
      }

      // Date range filters
      if (filters.appliedFrom) {
        query.appliedAt = { ...query.appliedAt, $gte: new Date(filters.appliedFrom) };
      }

      if (filters.appliedTo) {
        query.appliedAt = { ...query.appliedAt, $lte: new Date(filters.appliedTo) };
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Sort
      const sortField = filters.sortBy || "appliedAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const [applications, total] = await Promise.all([
        Application.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("internshipId", "internshipId title department companyId startDate applicationDeadline")
          .populate("companyId", "companyName industry logo")
          .lean(),
        Application.countDocuments(query),
      ]);

      logger.info("Applications fetched by student", {
        studentId: studentId.toString(),
        count: applications.length,
        filters,
      });

      return {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get applications by student", {
        studentId: studentId.toString(),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Company approves an application with slot decrement and notification
   * @param {string} applicationId - Application ID
   * @param {string} companyId - MongoDB ObjectId of the company
   * @param {Object} options - Additional options (feedback, nextSteps)
   * @returns {Promise<Object>} Updated application
   */
  async companyApprove(applicationId, companyId, options = {}) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      // Get application
      const application = await Application.findOne({ applicationId }).session(session);

      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      // Verify company ownership
      if (application.companyId.toString() !== companyId.toString()) {
        throw new Error("Unauthorized: This application does not belong to your company");
      }

      // Check if application is in a state that can be approved
      if (application.status === "accepted") {
        throw new Error("Application is already accepted");
      }

      if (application.status === "rejected" || application.status === "withdrawn") {
        throw new Error(`Cannot approve application with status: ${application.status}`);
      }

      // Get internship details
      const internship = await Internship.findById(application.internshipId).session(session);

      if (!internship) {
        throw new Error("Internship not found");
      }

      // Check if slots are available
      if (internship.slotsRemaining <= 0) {
        throw new Error("No slots remaining for this internship");
      }

      // Update application status
      application.status = "accepted";
      application.companyFeedback = {
        status: "accepted",
        reviewedAt: new Date(),
        feedback: options.feedback || "Your application has been accepted!",
        nextSteps: options.nextSteps || "You will be contacted shortly with further details.",
      };

      // Add timeline event
      application.timeline.push({
        event: "Application accepted by company",
        timestamp: new Date(),
        performedBy: options.reviewedBy || companyId.toString(),
        notes: options.feedback || "Application accepted",
      });

      await application.save({ session });

      // Decrement internship slots
      await internshipService.decrementSlots(internship.internshipId, { session });

      await session.commitTransaction();

      logger.info("Application approved by company", {
        applicationId,
        companyId: companyId.toString(),
        internshipId: internship.internshipId,
      });

      // Notify student of acceptance (async, don't wait)
      this._notifyStudentOfDecision(application, "accepted", internship).catch(error => {
        logger.error("Failed to notify student of acceptance", {
          applicationId,
          error: error.message,
        });
      });

      return application;
    } catch (error) {
      await session.abortTransaction();

      logger.error("Failed to approve application", {
        applicationId,
        companyId: companyId.toString(),
        error: error.message,
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Company rejects an application with notification
   * @param {string} applicationId - Application ID
   * @param {string} companyId - MongoDB ObjectId of the company
   * @param {Object} options - Additional options (reason, feedback)
   * @returns {Promise<Object>} Updated application
   */
  async companyReject(applicationId, companyId, options = {}) {
    try {
      // Get application
      const application = await Application.findOne({ applicationId });

      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      // Verify company ownership
      if (application.companyId.toString() !== companyId.toString()) {
        throw new Error("Unauthorized: This application does not belong to your company");
      }

      // Check if application is in a state that can be rejected
      if (application.status === "accepted") {
        throw new Error("Cannot reject an already accepted application");
      }

      if (application.status === "rejected" || application.status === "withdrawn") {
        throw new Error(`Application is already ${application.status}`);
      }

      // Get internship details for notification
      const internship = await Internship.findById(application.internshipId).lean();

      // Update application status
      application.status = "rejected";
      application.companyFeedback = {
        status: "rejected",
        reviewedAt: new Date(),
        rejectionReason: options.reason || "Your application was not selected at this time.",
        feedback: options.feedback || "",
      };

      // Add timeline event
      application.timeline.push({
        event: "Application rejected by company",
        timestamp: new Date(),
        performedBy: options.reviewedBy || companyId.toString(),
        notes: options.reason || "Application rejected",
      });

      await application.save();

      logger.info("Application rejected by company", {
        applicationId,
        companyId: companyId.toString(),
        internshipId: internship?.internshipId,
      });

      // Notify student of rejection (async, don't wait)
      this._notifyStudentOfDecision(application, "rejected", internship).catch(error => {
        logger.error("Failed to notify student of rejection", {
          applicationId,
          error: error.message,
        });
      });

      return application;
    } catch (error) {
      logger.error("Failed to reject application", {
        applicationId,
        companyId: companyId.toString(),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Notify student of application decision
   */
  async _notifyStudentOfDecision(application, decision, internship) {
    try {
      // Get student details
      const student = await Student.findById(application.studentId).lean();

      if (!student) {
        logger.warn("Student not found for notification", {
          studentId: application.studentId.toString(),
        });
        return;
      }

      const isAccepted = decision === "accepted";
      const title = isAccepted ? "Application Accepted!" : "Application Update";
      const message = isAccepted
        ? `Congratulations! Your application to "${internship?.title || "the internship"}" has been accepted.`
        : `Your application to "${internship?.title || "the internship"}" was not selected at this time.`;

      await notificationService.notifyUser({
        userId: student.studentId,
        mongoId: student._id,
        role: "student",
        email: student.email || student.profile?.email,
        phone: student.profile?.phone,
        title,
        message,
        priority: isAccepted ? "high" : "medium",
        actionUrl: `/student/applications/${application.applicationId}`,
        metadata: {
          applicationId: application.applicationId,
          internshipId: internship?.internshipId,
          decision,
        },
      });

      logger.info("Student notified of application decision", {
        applicationId: application.applicationId,
        studentId: student.studentId,
        decision,
      });
    } catch (error) {
      logger.error("Failed to notify student", {
        applicationId: application.applicationId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block the decision
    }
  }

  /**
   * Get application metrics for analytics
   * @param {string} internshipId - Internship ID (can be MongoDB ObjectId or internshipId string)
   * @returns {Promise<Object>} Application metrics
   */
  async getApplicationMetrics(internshipId) {
    try {
      // Determine if internshipId is MongoDB ObjectId or custom internshipId
      let internshipObjectId;
      if (mongoose.Types.ObjectId.isValid(internshipId) && internshipId.length === 24) {
        internshipObjectId = mongoose.Types.ObjectId(internshipId);
      } else {
        // Find internship by custom internshipId first
        const internship = await Internship.findOne({ internshipId }).lean();
        if (!internship) {
          throw new Error(`Internship not found: ${internshipId}`);
        }
        internshipObjectId = internship._id;
      }

      // Aggregate application metrics
      const metrics = await Application.aggregate([
        {
          $match: { internshipId: internshipObjectId },
        },
        {
          $facet: {
            statusCounts: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],
            companyFeedbackCounts: [
              {
                $group: {
                  _id: "$companyFeedback.status",
                  count: { $sum: 1 },
                },
              },
            ],
            totalApplications: [
              {
                $count: "count",
              },
            ],
            averageResponseTime: [
              {
                $match: {
                  "companyFeedback.reviewedAt": { $exists: true },
                },
              },
              {
                $project: {
                  responseTime: {
                    $subtract: ["$companyFeedback.reviewedAt", "$appliedAt"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgResponseTime: { $avg: "$responseTime" },
                },
              },
            ],
            applicationsByDate: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" },
                  },
                  count: { $sum: 1 },
                },
              },
              {
                $sort: { _id: 1 },
              },
            ],
          },
        },
      ]);

      const result = metrics[0];

      // Format status counts
      const statusCounts = {};
      result.statusCounts.forEach(item => {
        statusCounts[item._id] = item.count;
      });

      // Format company feedback counts
      const companyFeedbackCounts = {};
      result.companyFeedbackCounts.forEach(item => {
        companyFeedbackCounts[item._id] = item.count;
      });

      // Calculate rates
      const total = result.totalApplications[0]?.count || 0;
      const accepted = statusCounts.accepted || 0;
      const rejected = statusCounts.rejected || 0;
      const pending = statusCounts.pending || 0;

      const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;
      const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;
      const pendingRate = total > 0 ? (pending / total) * 100 : 0;

      // Average response time in hours
      const avgResponseTimeMs = result.averageResponseTime[0]?.avgResponseTime || 0;
      const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

      logger.info("Application metrics calculated", {
        internshipId,
        total,
        accepted,
        rejected,
      });

      return {
        total,
        statusCounts,
        companyFeedbackCounts,
        rates: {
          acceptance: acceptanceRate.toFixed(2),
          rejection: rejectionRate.toFixed(2),
          pending: pendingRate.toFixed(2),
        },
        averageResponseTime: {
          hours: avgResponseTimeHours.toFixed(2),
          days: (avgResponseTimeHours / 24).toFixed(2),
        },
        applicationsByDate: result.applicationsByDate,
      };
    } catch (error) {
      logger.error("Failed to get application metrics", {
        internshipId,
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const applicationService = new ApplicationService();
export default applicationService;
