import Internship from "../models/Internship.js";
import Mentor from "../models/Mentor.js";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import { internshipStateMachine } from "./internshipStateMachine.js";
import { notificationService } from "./notificationService.js";
import { logger } from "../utils/logger.js";

/**
 * ApprovalWorkflowService - Manages approval workflow for internships
 * Handles admin verification and mentor approval processes
 * 
 * Requirements: 2.2, 2.3, 2.4, 3.2, 3.3, 3.5
 */
class ApprovalWorkflowService {
  /**
   * Admin approves an internship
   * Transitions status to "admin_approved" and notifies relevant mentors
   * 
   * @param {string} internshipId - Internship ID
   * @param {string} adminId - Admin MongoDB ObjectId
   * @param {string} comments - Optional approval comments
   * @returns {Promise<Object>} Updated internship
   * @throws {Error} If validation fails or internship not found
   * 
   * Requirements: 2.2, 2.4
   */
  async adminApprove(internshipId, adminId, comments = "") {
    try {
      // Find the internship
      const internship = await Internship.findOne({ internshipId });
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Validate current status
      if (internship.status !== "pending_admin_verification") {
        throw new Error(
          `Cannot approve internship in ${internship.status} state. ` +
          `Expected status: pending_admin_verification`
        );
      }

      // Get admin details for audit trail
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error(`Admin not found: ${adminId}`);
      }

      // Transition to admin_approved state
      await internshipStateMachine.transitionTo(
        internshipId,
        "admin_approved",
        { id: admin.adminId, role: "admin" },
        comments || "Admin approved internship"
      );

      // Update admin review information
      internship.adminReview = {
        reviewedBy: admin.adminId,
        reviewedAt: new Date(),
        decision: "approved",
        comments: comments || "",
      };

      await internship.save();

      logger.info("Admin approved internship", {
        internshipId,
        adminId: admin.adminId,
        department: internship.department,
      });

      // Notify mentors in the relevant department
      await this._notifyMentorsOfApproval(internship, admin);

      return internship;
    } catch (error) {
      logger.error("Admin approval failed", {
        internshipId,
        adminId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Admin rejects an internship
   * Transitions status to "admin_rejected" and notifies the company
   * 
   * @param {string} internshipId - Internship ID
   * @param {string} adminId - Admin MongoDB ObjectId
   * @param {Array<string>} reasons - Rejection reasons
   * @returns {Promise<Object>} Updated internship
   * @throws {Error} If validation fails or internship not found
   * 
   * Requirements: 2.3
   */
  async adminReject(internshipId, adminId, reasons = []) {
    try {
      // Find the internship
      const internship = await Internship.findOne({ internshipId })
        .populate("companyId");
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Validate current status
      if (internship.status !== "pending_admin_verification") {
        throw new Error(
          `Cannot reject internship in ${internship.status} state. ` +
          `Expected status: pending_admin_verification`
        );
      }

      // Validate reasons
      if (!Array.isArray(reasons) || reasons.length === 0) {
        throw new Error("At least one rejection reason is required");
      }

      // Get admin details for audit trail
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error(`Admin not found: ${adminId}`);
      }

      // Transition to admin_rejected state
      const reasonText = reasons.join("; ");
      await internshipStateMachine.transitionTo(
        internshipId,
        "admin_rejected",
        { id: admin.adminId, role: "admin" },
        `Admin rejected: ${reasonText}`
      );

      // Update admin review information
      internship.adminReview = {
        reviewedBy: admin.adminId,
        reviewedAt: new Date(),
        decision: "rejected",
        comments: reasonText,
        reasons: reasons,
      };

      await internship.save();

      logger.info("Admin rejected internship", {
        internshipId,
        adminId: admin.adminId,
        reasons: reasons,
      });

      // Notify company of rejection
      await this._notifyCompanyOfRejection(internship, admin, reasons);

      return internship;
    } catch (error) {
      logger.error("Admin rejection failed", {
        internshipId,
        adminId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mentor approves an internship for their department
   * Transitions status to "open_for_applications" and makes visible to students
   * 
   * @param {string} internshipId - Internship ID
   * @param {string} mentorId - Mentor MongoDB ObjectId
   * @param {string} comments - Optional approval comments
   * @returns {Promise<Object>} Updated internship
   * @throws {Error} If validation fails or internship not found
   * 
   * Requirements: 3.2, 3.4
   */
  async mentorApprove(internshipId, mentorId, comments = "") {
    try {
      // Find the internship
      const internship = await Internship.findOne({ internshipId });
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Validate current status
      if (internship.status !== "admin_approved") {
        throw new Error(
          `Cannot approve internship in ${internship.status} state. ` +
          `Expected status: admin_approved`
        );
      }

      // Get mentor details
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        throw new Error(`Mentor not found: ${mentorId}`);
      }

      // Validate department match - allow "All" department internships
      if (internship.department !== mentor.profile.department && internship.department !== 'All') {
        throw new Error(
          `Mentor department (${mentor.profile.department}) does not match ` +
          `internship department (${internship.department})`
        );
      }

      // Check if this department has already approved
      if (!internship.departmentApprovals) {
        internship.departmentApprovals = [];
      }
      
      const alreadyApproved = internship.departmentApprovals.some(
        approval => approval.department === mentor.profile.department
      );
      
      if (alreadyApproved) {
        throw new Error(
          `This internship has already been approved for ${mentor.profile.department} department`
        );
      }

      // Add department approval
      internship.departmentApprovals.push({
        department: mentor.profile.department,
        mentorId: mentor.mentorId,
        approvedAt: new Date(),
        comments: comments || "",
      });

      // If this is NOT an "All" department internship, transition to open_for_applications
      // If it IS "All", keep it as admin_approved so other departments can also approve
      if (internship.department !== 'All') {
        await internshipStateMachine.transitionTo(
          internshipId,
          "open_for_applications",
          { id: mentor.mentorId, role: "mentor" },
          comments || `Mentor approved internship for ${mentor.profile.department} department`
        );
      }

      // Update mentor approval information (for backward compatibility)
      internship.mentorApproval = {
        status: "approved",
        mentorId: mentor.mentorId,
        approvedAt: new Date(),
        comments: comments || "",
        department: mentor.profile.department,
      };

      await internship.save();

      logger.info("Mentor approved internship", {
        internshipId,
        mentorId: mentor.mentorId,
        department: mentor.profile.department,
      });

      // Notify company of approval (internship is now live)
      await this._notifyCompanyOfMentorApproval(internship, mentor);

      return internship;
    } catch (error) {
      logger.error("Mentor approval failed", {
        internshipId,
        mentorId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mentor rejects an internship for their department
   * Transitions status to "mentor_rejected" and notifies admin and company
   * 
   * @param {string} internshipId - Internship ID
   * @param {string} mentorId - Mentor MongoDB ObjectId
   * @param {string} reasons - Rejection reasons
   * @returns {Promise<Object>} Updated internship
   * @throws {Error} If validation fails or internship not found
   * 
   * Requirements: 3.3
   */
  async mentorReject(internshipId, mentorId, reasons = "") {
    try {
      // Find the internship
      const internship = await Internship.findOne({ internshipId })
        .populate("companyId");
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Validate current status
      if (internship.status !== "admin_approved") {
        throw new Error(
          `Cannot reject internship in ${internship.status} state. ` +
          `Expected status: admin_approved`
        );
      }

      // Validate reasons
      if (!reasons || reasons.trim().length === 0) {
        throw new Error("Rejection reason is required");
      }

      // Get mentor details
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        throw new Error(`Mentor not found: ${mentorId}`);
      }

      // Validate department match
      if (mentor.profile.department !== internship.department) {
        throw new Error(
          `Mentor department (${mentor.profile.department}) does not match ` +
          `internship department (${internship.department})`
        );
      }

      // Transition to mentor_rejected state
      await internshipStateMachine.transitionTo(
        internshipId,
        "mentor_rejected",
        { id: mentor.mentorId, role: "mentor" },
        `Mentor rejected: ${reasons}`
      );

      // Update mentor approval information
      internship.mentorApproval = {
        status: "rejected",
        mentorId: mentor.mentorId,
        approvedAt: new Date(),
        comments: reasons,
        department: mentor.profile.department,
      };

      await internship.save();

      logger.info("Mentor rejected internship", {
        internshipId,
        mentorId: mentor.mentorId,
        department: mentor.profile.department,
        reasons,
      });

      // Notify both admin and company of rejection
      await this._notifyMentorRejection(internship, mentor, reasons);

      return internship;
    } catch (error) {
      logger.error("Mentor rejection failed", {
        internshipId,
        mentorId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate if a user has permission to perform an approval action
   * 
   * @param {string} userId - User MongoDB ObjectId
   * @param {string} role - User role (admin, mentor)
   * @param {string} internshipId - Internship ID
   * @param {string} action - Action to perform (approve, reject)
   * @returns {Promise<Object>} Validation result with user details
   * @throws {Error} If validation fails
   * 
   * Requirements: 3.5
   */
  async validateApprovalPermission(userId, role, internshipId, action) {
    try {
      // Find the internship
      const internship = await Internship.findOne({ internshipId });
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      // Validate based on role
      if (role === "admin") {
        // Admin can approve/reject internships in pending_admin_verification state
        const admin = await Admin.findById(userId);
        if (!admin) {
          throw new Error(`Admin not found: ${userId}`);
        }

        if (admin.status !== "active") {
          throw new Error(`Admin account is not active: ${admin.status}`);
        }

        if (internship.status !== "pending_admin_verification") {
          throw new Error(
            `Admin cannot ${action} internship in ${internship.status} state`
          );
        }

        return {
          authorized: true,
          user: admin,
          userType: "admin",
        };
      } else if (role === "mentor") {
        // Mentor can approve/reject internships in admin_approved state for their department
        const mentor = await Mentor.findById(userId);
        if (!mentor) {
          throw new Error(`Mentor not found: ${userId}`);
        }

        if (mentor.status !== "active") {
          throw new Error(`Mentor account is not active: ${mentor.status}`);
        }

        if (internship.status !== "admin_approved") {
          throw new Error(
            `Mentor cannot ${action} internship in ${internship.status} state`
          );
        }

        // Validate department match (Requirement 3.5)
        if (mentor.profile.department !== internship.department) {
          throw new Error(
            `Mentor department (${mentor.profile.department}) does not match ` +
            `internship department (${internship.department}). ` +
            `Only mentors from ${internship.department} can ${action} this internship.`
          );
        }

        return {
          authorized: true,
          user: mentor,
          userType: "mentor",
        };
      } else {
        throw new Error(`Invalid role for approval: ${role}`);
      }
    } catch (error) {
      logger.error("Approval permission validation failed", {
        userId,
        role,
        internshipId,
        action,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Notify mentors in the relevant department of admin approval
   * @private
   */
  async _notifyMentorsOfApproval(internship, admin) {
    try {
      // Use the enhanced notification service method
      const company = await Company.findById(internship.companyId).lean();
      await notificationService.notifyInternshipStatusChange(
        internship,
        "pending_admin_verification",
        "admin_approved",
        {
          companyName: company?.companyName || "the company",
          adminId: admin.adminId,
        }
      );

      logger.info("Mentors notified of admin approval via enhanced service", {
        internshipId: internship.internshipId,
        department: internship.department,
      });
    } catch (error) {
      logger.error("Failed to notify mentors of approval", {
        internshipId: internship.internshipId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block approval
    }
  }

  /**
   * Notify company of admin rejection
   * @private
   */
  async _notifyCompanyOfRejection(internship, admin, reasons) {
    try {
      // Use the enhanced notification service method
      const company = await Company.findById(internship.companyId).lean();
      await notificationService.notifyInternshipStatusChange(
        internship,
        "pending_admin_verification",
        "admin_rejected",
        {
          companyName: company?.companyName || "the company",
          reasons,
          adminId: admin.adminId,
        }
      );

      logger.info("Company notified of rejection via enhanced service", {
        internshipId: internship.internshipId,
        companyId: internship.companyId,
      });
    } catch (error) {
      logger.error("Failed to notify company of rejection", {
        internshipId: internship.internshipId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block rejection
    }
  }

  /**
   * Notify company of mentor approval (internship is now live)
   * @private
   */
  async _notifyCompanyOfMentorApproval(internship, mentor) {
    try {
      const company = await Company.findById(internship.companyId);

      if (!company) {
        logger.warn("Company not found for mentor approval notification", {
          internshipId: internship.internshipId,
        });
        return;
      }

      await notificationService.notifyUser({
        userId: company.companyId,
        mongoId: company._id,
        role: "company",
        email: company.email,
        phone: company.phone,
        title: "Internship Posting is Now Live",
        message: `Your internship posting "${internship.title}" has been approved and is now visible to students in ${internship.department}.`,
        priority: "high",
        actionUrl: `/company/internships/${internship.internshipId}`,
        metadata: {
          internshipId: internship.internshipId,
          department: internship.department,
          mentorId: mentor.mentorId,
        },
      });

      logger.info("Company notified of mentor approval", {
        internshipId: internship.internshipId,
        companyId: company.companyId,
      });
    } catch (error) {
      logger.error("Failed to notify company of mentor approval", {
        internshipId: internship.internshipId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block approval
    }
  }

  /**
   * Notify admin and company of mentor rejection
   * @private
   */
  async _notifyMentorRejection(internship, mentor, reasons) {
    try {
      // Use the enhanced notification service method
      const company = await Company.findById(internship.companyId).lean();
      await notificationService.notifyInternshipStatusChange(
        internship,
        "admin_approved",
        "mentor_rejected",
        {
          companyName: company?.companyName || "the company",
          reasons: Array.isArray(reasons) ? reasons : [reasons],
          mentorId: mentor.mentorId,
          mentorName: mentor.profile?.name || "the mentor",
        }
      );

      logger.info("Mentor rejection notifications sent via enhanced service", {
        internshipId: internship.internshipId,
        mentorId: mentor.mentorId,
      });
    } catch (error) {
      logger.error("Failed to notify mentor rejection", {
        internshipId: internship.internshipId,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block rejection
    }
  }
}

// Export singleton instance
export const approvalWorkflowService = new ApprovalWorkflowService();
export default approvalWorkflowService;
