import Internship from "../models/Internship.js";
import Admin from "../models/Admin.js";
import { internshipStateMachine } from "./internshipStateMachine.js";
import { aiTaggingService } from "./aiTaggingService.js";
import { notificationService } from "./notificationService.js";
import { queueAITagging } from "./internshipWorkflowScheduler.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

/**
 * InternshipService - Manages internship lifecycle operations
 * Handles creation, updates, filtering, and slot management
 */
class InternshipService {
  /**
   * Generate unique internship ID
   */
  _generateInternshipId() {
    return `INT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Validate required fields for internship creation
   */
  _validateRequiredFields(internshipData) {
    const requiredFields = [
      "title",
      "description",
      "department",
      "duration",
      "requiredSkills",
      "startDate",
      "applicationDeadline",
      "slots",
    ];

    const missingFields = requiredFields.filter(field => {
      // Special handling for slots - check if it exists but is invalid
      if (field === "slots") {
        return internshipData[field] === undefined || internshipData[field] === null;
      }
      return !internshipData[field];
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Validate array fields
    if (!Array.isArray(internshipData.requiredSkills) || internshipData.requiredSkills.length === 0) {
      throw new Error("requiredSkills must be a non-empty array");
    }

    // Validate numeric fields
    if (typeof internshipData.slots !== "number" || internshipData.slots < 1) {
      throw new Error("slots must be a positive number");
    }

    // Validate dates
    const startDate = new Date(internshipData.startDate);
    const deadline = new Date(internshipData.applicationDeadline);

    if (isNaN(startDate.getTime())) {
      throw new Error("startDate must be a valid date");
    }

    if (isNaN(deadline.getTime())) {
      throw new Error("applicationDeadline must be a valid date");
    }

    if (deadline >= startDate) {
      throw new Error("applicationDeadline must be before startDate");
    }
  }

  /**
   * Create a new internship with validation and initial status
   * @param {string} companyId - MongoDB ObjectId of the company
   * @param {Object} internshipData - Internship data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created internship
   */
  async createInternship(companyId, internshipData, options = {}) {
    try {
      // Validate required fields
      this._validateRequiredFields(internshipData);

      // Generate unique internship ID
      const internshipId = this._generateInternshipId();

      // Prepare internship document
      const internshipDoc = {
        internshipId,
        companyId,
        title: internshipData.title,
        description: internshipData.description,
        department: internshipData.department,
        requiredSkills: internshipData.requiredSkills,
        optionalSkills: internshipData.optionalSkills || [],
        duration: internshipData.duration,
        stipend: internshipData.stipend,
        location: internshipData.location,
        workMode: internshipData.workMode || "onsite",
        startDate: new Date(internshipData.startDate),
        applicationDeadline: new Date(internshipData.applicationDeadline),
        slots: internshipData.slots,
        slotsRemaining: internshipData.slots, // Initialize with total slots
        appliedCount: 0,
        responsibilities: internshipData.responsibilities || [],
        learningOpportunities: internshipData.learningOpportunities || [],
        eligibilityRequirements: internshipData.eligibilityRequirements || {},
        status: "pending_admin_verification", // Initial status
        postedBy: options.postedBy || companyId.toString(),
        postedAt: new Date(),
        auditTrail: [
          {
            timestamp: new Date(),
            actor: options.postedBy || companyId.toString(),
            actorRole: "company",
            action: "create_internship",
            fromStatus: null,
            toStatus: "pending_admin_verification",
            reason: "Internship created by company",
          },
        ],
      };

      // Create internship
      const internship = await Internship.create(internshipDoc);

      logger.info("Internship created successfully", {
        internshipId,
        companyId: companyId.toString(),
        status: internship.status,
      });

      // Queue AI tagging job asynchronously (don't wait for it)
      if (options.enableAITagging !== false) {
        queueAITagging(internshipId, options.postedBy || companyId.toString()).catch(error => {
          logger.error("Failed to queue AI tagging for new internship", {
            internshipId,
            error: error.message,
          });
        });
      }

      // Notify all admins of new submission
      this._notifyAdminsOfNewInternship(internship).catch(error => {
        logger.error("Failed to notify admins of new internship", {
          internshipId,
          error: error.message,
        });
      });

      return internship;
    } catch (error) {
      logger.error("Failed to create internship", {
        companyId: companyId.toString(),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Trigger AI tagging for an internship (async)
   */
  async _triggerAITagging(internship) {
    try {
      const tags = await aiTaggingService.generateTags({
        internshipId: internship.internshipId,
        title: internship.title,
        description: internship.description,
        requiredSkills: internship.requiredSkills,
        department: internship.department,
        duration: internship.duration,
        responsibilities: internship.responsibilities,
      });

      // Update internship with AI tags
      await Internship.findOneAndUpdate(
        { internshipId: internship.internshipId },
        { $set: { aiTags: tags } },
        { new: true }
      );

      logger.info("AI tags generated successfully", {
        internshipId: internship.internshipId,
        tags,
      });
    } catch (error) {
      logger.error("AI tagging failed", {
        internshipId: internship.internshipId,
        error: error.message,
      });
      // Don't throw - AI tagging failure shouldn't block internship creation
    }
  }

  /**
   * Notify all active admins of new internship submission
   */
  async _notifyAdminsOfNewInternship(internship) {
    try {
      // Get all active admins
      const admins = await Admin.find({ status: "active" }).lean();

      if (admins.length === 0) {
        logger.warn("No active admins found to notify");
        return;
      }

      // Send notification to each admin
      const notificationPromises = admins.map(admin =>
        notificationService.notifyUser({
          userId: admin.adminId,
          mongoId: admin._id,
          role: "admin",
          email: admin.email,
          title: "New Internship Pending Verification",
          message: `A new internship "${internship.title}" from ${internship.department} department requires verification.`,
          priority: "medium",
          actionUrl: `/admin/internships/${internship.internshipId}`,
          metadata: {
            internshipId: internship.internshipId,
            companyId: internship.companyId.toString(),
            department: internship.department,
          },
        })
      );

      await Promise.allSettled(notificationPromises);

      logger.info("Admins notified of new internship", {
        internshipId: internship.internshipId,
        adminCount: admins.length,
      });
    } catch (error) {
      logger.error("Failed to notify admins", {
        internshipId: internship.internshipId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block internship creation
    }
  }

  /**
   * Update an existing internship with status reset logic
   * @param {string} internshipId - Internship ID
   * @param {Object} updates - Fields to update
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated internship
   */
  async updateInternship(internshipId, updates, options = {}) {
    try {
      const internship = await Internship.findOne({ internshipId });

      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Check if internship is in a terminal state
      if (internshipStateMachine.isTerminalState(internship.status)) {
        throw new Error(`Cannot update internship in ${internship.status} state`);
      }

      // Track if significant fields are being updated
      const significantFields = [
        "title",
        "description",
        "department",
        "requiredSkills",
        "duration",
        "startDate",
        "applicationDeadline",
        "slots",
      ];

      const hasSignificantChanges = significantFields.some(field => 
        updates[field] !== undefined && updates[field] !== internship[field]
      );

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (key !== "status" && key !== "internshipId" && key !== "companyId") {
          internship[key] = updates[key];
        }
      });

      // Reset status to pending_admin_verification if significant changes
      if (hasSignificantChanges && internship.status !== "pending_admin_verification") {
        const oldStatus = internship.status;
        internship.status = "pending_admin_verification";

        // Add audit trail entry
        internship.auditTrail.push({
          timestamp: new Date(),
          actor: options.actor || "system",
          actorRole: options.actorRole || "company",
          action: "update_internship",
          fromStatus: oldStatus,
          toStatus: "pending_admin_verification",
          reason: "Internship updated with significant changes, requires re-verification",
        });

        logger.info("Internship status reset due to significant changes", {
          internshipId,
          oldStatus,
          newStatus: "pending_admin_verification",
        });
      }

      await internship.save();

      logger.info("Internship updated successfully", {
        internshipId,
        hasSignificantChanges,
        status: internship.status,
      });

      // Re-queue AI tagging if content changed
      if (hasSignificantChanges && options.enableAITagging !== false) {
        queueAITagging(internshipId, options.actor || "system").catch(error => {
          logger.error("Failed to queue AI tagging for updated internship", {
            internshipId,
            error: error.message,
          });
        });
      }

      return internship;
    } catch (error) {
      logger.error("Failed to update internship", {
        internshipId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get internships by status with optional filtering
   * @param {string} status - Status to filter by
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of internships
   */
  async getInternshipsByStatus(status, filters = {}) {
    try {
      const query = { status };

      // Apply additional filters
      if (filters.department) {
        query.department = filters.department;
      }

      if (filters.companyId) {
        query.companyId = filters.companyId;
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Date range filters
      if (filters.startDateFrom) {
        query.startDate = { ...query.startDate, $gte: new Date(filters.startDateFrom) };
      }

      if (filters.startDateTo) {
        query.startDate = { ...query.startDate, $lte: new Date(filters.startDateTo) };
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Sort
      const sortField = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const [internships, total] = await Promise.all([
        Internship.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("companyId", "companyName industry logo")
          .lean(),
        Internship.countDocuments(query),
      ]);

      return {
        internships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get internships by status", {
        status,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get internships for mentor with department filtering
   * @param {string} mentorId - Mentor ID
   * @param {string} department - Department to filter by
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of internships
   */
  async getInternshipsForMentor(mentorId, department, filters = {}) {
    try {
      const query = {
        status: "admin_approved",
        department,
      };

      // Apply additional filters
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      if (filters.startDateFrom) {
        query.startDate = { ...query.startDate, $gte: new Date(filters.startDateFrom) };
      }

      if (filters.startDateTo) {
        query.startDate = { ...query.startDate, $lte: new Date(filters.startDateTo) };
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Sort
      const sortField = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const [internships, total] = await Promise.all([
        Internship.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("companyId", "companyName industry logo")
          .lean(),
        Internship.countDocuments(query),
      ]);

      logger.info("Internships fetched for mentor", {
        mentorId,
        department,
        count: internships.length,
      });

      return {
        internships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get internships for mentor", {
        mentorId,
        department,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get internships for student with status and department filtering
   * @param {string} studentId - Student ID
   * @param {string} department - Student's department
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of internships
   */
  async getInternshipsForStudent(studentId, department, filters = {}) {
    try {
      // Query for internships that are either:
      // 1. Specific to student's department with status "open_for_applications"
      // 2. "All" department with approval from student's department (status can be admin_approved or open_for_applications)
      const query = {
        $or: [
          {
            // Specific department internships
            status: "open_for_applications",
            department,
          },
          {
            // "All" department internships approved by student's department
            department: "All",
            status: { $in: ["admin_approved", "open_for_applications"] },
            "departmentApprovals.department": department,
          }
        ],
        // TODO: Re-enable deadline filter for production
        // Show internships with deadlines that haven't passed yet (end of day)
        // applicationDeadline: { 
        //   $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        // },
      };

      logger.info("Student internship query", {
        studentId,
        department,
        query: JSON.stringify(query),
      });

      // Apply additional filters
      if (filters.location) {
        query.location = { $regex: filters.location, $options: "i" };
      }

      if (filters.workMode) {
        query.workMode = filters.workMode;
      }

      if (filters.skills) {
        const skillsArray = filters.skills.split(",").map(s => s.trim());
        query.requiredSkills = { $in: skillsArray };
      }

      if (filters.minStipend) {
        query.stipend = { ...query.stipend, $gte: Number(filters.minStipend) };
      }

      if (filters.maxStipend) {
        query.stipend = { ...query.stipend, $lte: Number(filters.maxStipend) };
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Sort
      const sortField = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const [internships, total] = await Promise.all([
        Internship.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("companyId", "companyName industry logo")
          .lean(),
        Internship.countDocuments(query),
      ]);

      logger.info("Internships fetched for student", {
        studentId,
        department,
        count: internships.length,
      });

      return {
        internships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get internships for student", {
        studentId,
        department,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Decrement available slots for an internship with transaction support
   * @param {string} internshipId - Internship ID
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} Updated internship
   */
  async decrementSlots(internshipId, options = {}) {
    const session = options.session || null;

    try {
      const internship = await Internship.findOne({ internshipId }).session(session);

      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      if (internship.slotsRemaining <= 0) {
        throw new Error(`No slots remaining for internship: ${internshipId}`);
      }

      // Decrement slots
      internship.slotsRemaining -= 1;

      // If no slots remaining, close the internship
      if (internship.slotsRemaining === 0) {
        await internshipStateMachine.transitionTo(
          internshipId,
          "closed",
          { id: "system", role: "system" },
          "All slots filled"
        );
      }

      await internship.save({ session });

      logger.info("Internship slots decremented", {
        internshipId,
        slotsRemaining: internship.slotsRemaining,
      });

      return internship;
    } catch (error) {
      logger.error("Failed to decrement slots", {
        internshipId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Close expired internships (scheduled job)
   * @returns {Promise<Object>} Summary of closed internships
   */
  async closeExpiredInternships() {
    try {
      const now = new Date();

      // Find internships that are open but past their deadline
      const expiredInternships = await Internship.find({
        status: "open_for_applications",
        applicationDeadline: { $lt: now },
      });

      logger.info("Found expired internships", {
        count: expiredInternships.length,
      });

      const results = {
        total: expiredInternships.length,
        closed: 0,
        failed: 0,
        errors: [],
      };

      // Close each expired internship
      for (const internship of expiredInternships) {
        try {
          await internshipStateMachine.transitionTo(
            internship.internshipId,
            "closed",
            { id: "system", role: "system" },
            "Application deadline passed"
          );

          results.closed += 1;

          logger.info("Expired internship closed", {
            internshipId: internship.internshipId,
          });
        } catch (error) {
          results.failed += 1;
          results.errors.push({
            internshipId: internship.internshipId,
            error: error.message,
          });

          logger.error("Failed to close expired internship", {
            internshipId: internship.internshipId,
            error: error.message,
          });
        }
      }

      logger.info("Expired internships processing complete", results);

      return results;
    } catch (error) {
      logger.error("Failed to close expired internships", {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const internshipService = new InternshipService();
export default internshipService;
