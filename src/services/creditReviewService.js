import CreditRequest from "../models/CreditRequest.js";
import Mentor from "../models/Mentor.js";
import Admin from "../models/Admin.js";
import Student from "../models/Student.js";
import InternshipCompletion from "../models/InternshipCompletion.js";
import { logger } from "../utils/logger.js";
import creditMetricsService from "./creditMetricsService.js";

/**
 * Validate mentor review data
 * @param {Object} reviewData - Review data object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateMentorReview = (reviewData) => {
  const errors = [];

  // Validate decision
  if (!reviewData.decision) {
    errors.push("Decision is required");
  } else if (!["approved", "rejected"].includes(reviewData.decision)) {
    errors.push("Decision must be 'approved' or 'rejected'");
  }

  // Validate feedback requirement for rejections
  if (reviewData.decision === "rejected") {
    if (!reviewData.feedback || reviewData.feedback.trim().length === 0) {
      errors.push("Feedback is required when rejecting a credit request");
    }
  }

  // Validate quality criteria if provided
  if (reviewData.qualityCriteria) {
    const validCriteria = ["logbookComplete", "reportQuality", "learningOutcomes", "companyEvaluation"];
    const providedCriteria = Object.keys(reviewData.qualityCriteria);
    
    for (const criterion of providedCriteria) {
      if (!validCriteria.includes(criterion)) {
        errors.push(`Invalid quality criterion: ${criterion}`);
      }
      if (typeof reviewData.qualityCriteria[criterion] !== "boolean") {
        errors.push(`Quality criterion ${criterion} must be a boolean`);
      }
    }

    // Requirement 11.4: All criteria must be met to approve
    if (reviewData.decision === "approved") {
      const allCriteriaMet = validCriteria.every(
        criterion => reviewData.qualityCriteria[criterion] === true
      );
      if (!allCriteriaMet) {
        errors.push("All quality criteria must be met to approve the request");
      }
    }

    // Requirement 11.5: Unmet criteria require specific feedback
    const unmetCriteria = validCriteria.filter(
      criterion => reviewData.qualityCriteria[criterion] === false
    );
    
    if (unmetCriteria.length > 0) {
      // Check if criteriaFeedback is provided for unmet criteria
      if (!reviewData.criteriaFeedback) {
        errors.push("Feedback is required for unmet quality criteria");
      } else {
        for (const criterion of unmetCriteria) {
          if (!reviewData.criteriaFeedback[criterion] || 
              reviewData.criteriaFeedback[criterion].trim().length === 0) {
            errors.push(`Feedback is required for unmet criterion: ${criterion}`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate admin review data
 * @param {Object} reviewData - Review data object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateAdminReview = (reviewData) => {
  const errors = [];

  // Validate decision
  if (!reviewData.decision) {
    errors.push("Decision is required");
  } else if (!["approved", "rejected"].includes(reviewData.decision)) {
    errors.push("Decision must be 'approved' or 'rejected'");
  }

  // Validate feedback requirement for rejections
  if (reviewData.decision === "rejected") {
    if (!reviewData.feedback || reviewData.feedback.trim().length === 0) {
      errors.push("Feedback is required when rejecting a credit request");
    }
  }

  // Validate compliance checks if provided
  if (reviewData.complianceChecks) {
    const validChecks = ["nepCompliant", "documentationComplete", "feesCleared", "departmentApproved"];
    const providedChecks = Object.keys(reviewData.complianceChecks);
    
    for (const check of providedChecks) {
      if (!validChecks.includes(check)) {
        errors.push(`Invalid compliance check: ${check}`);
      }
      if (typeof reviewData.complianceChecks[check] !== "boolean") {
        errors.push(`Compliance check ${check} must be a boolean`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if user has permission to review a credit request
 * @param {string} userId - User MongoDB ObjectId
 * @param {string} creditRequestId - CreditRequest MongoDB ObjectId
 * @param {string} role - User role ('mentor' or 'admin')
 * @returns {Object} - { hasPermission: boolean, reason: string }
 */
export const checkReviewPermissions = async (userId, creditRequestId, role) => {
  try {
    // Get credit request
    const creditRequest = await CreditRequest.findById(creditRequestId);
    if (!creditRequest) {
      return { hasPermission: false, reason: "Credit request not found" };
    }

    if (role === "mentor") {
      // Check if mentor is assigned to this request
      if (creditRequest.mentorId.toString() !== userId.toString()) {
        return { 
          hasPermission: false, 
          reason: "You are not the assigned mentor for this credit request" 
        };
      }

      // Check if request is in a state that allows mentor review
      const validStatuses = ["pending_mentor_review", "pending_student_action"];
      if (!validStatuses.includes(creditRequest.status)) {
        return { 
          hasPermission: false, 
          reason: `Credit request is in ${creditRequest.status} status and cannot be reviewed by mentor` 
        };
      }

      return { hasPermission: true, reason: "Permission granted" };
    }

    if (role === "admin") {
      // Verify user is an admin
      const admin = await Admin.findById(userId);
      if (!admin) {
        return { hasPermission: false, reason: "User is not an admin" };
      }

      // Check if request is in a state that allows admin review
      const validStatuses = ["pending_admin_review", "admin_rejected"];
      if (!validStatuses.includes(creditRequest.status)) {
        return { 
          hasPermission: false, 
          reason: `Credit request is in ${creditRequest.status} status and cannot be reviewed by admin` 
        };
      }

      return { hasPermission: true, reason: "Permission granted" };
    }

    return { hasPermission: false, reason: "Invalid role specified" };
  } catch (error) {
    logger.error("Error checking review permissions", { error: error.message, userId, creditRequestId, role });
    throw error;
  }
};

/**
 * Submit mentor review for a credit request
 * @param {string} creditRequestId - CreditRequest MongoDB ObjectId
 * @param {string} mentorId - Mentor MongoDB ObjectId
 * @param {string} decision - 'approved' or 'rejected'
 * @param {string} feedback - Review feedback (required for rejections)
 * @param {Object} qualityCriteria - Quality criteria assessment
 * @param {Object} criteriaFeedback - Feedback for unmet criteria (required for unmet criteria)
 * @returns {Object} - Updated CreditRequest document
 */
export const submitMentorReview = async (creditRequestId, mentorId, decision, feedback, qualityCriteria = {}, criteriaFeedback = {}) => {
  try {
    // Validate review data
    const validation = validateMentorReview({ decision, feedback, qualityCriteria, criteriaFeedback });
    if (!validation.valid) {
      const error = new Error("Validation failed");
      error.validationErrors = validation.errors;
      throw error;
    }

    // Check permissions
    const permission = await checkReviewPermissions(mentorId, creditRequestId, "mentor");
    if (!permission.hasPermission) {
      const error = new Error(permission.reason);
      error.code = "PERMISSION_DENIED";
      throw error;
    }

    // Get credit request
    const creditRequest = await CreditRequest.findById(creditRequestId);
    if (!creditRequest) {
      throw new Error("Credit request not found");
    }

    // Verify mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      throw new Error("Mentor not found");
    }

    // Determine new status based on decision
    let newStatus;
    if (decision === "approved") {
      newStatus = "mentor_approved";
    } else {
      newStatus = "mentor_rejected";
    }

    // Validate state transition
    if (!creditRequest.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid state transition from ${creditRequest.status} to ${newStatus}`
      );
    }

    // Update mentor review
    creditRequest.mentorReview = {
      reviewedBy: mentorId,
      reviewedAt: new Date(),
      decision,
      feedback: feedback || "",
      qualityCriteria: {
        logbookComplete: qualityCriteria.logbookComplete || false,
        reportQuality: qualityCriteria.reportQuality || false,
        learningOutcomes: qualityCriteria.learningOutcomes || false,
        companyEvaluation: qualityCriteria.companyEvaluation || false,
      },
      criteriaFeedback: criteriaFeedback || {},
    };

    // Add to submission history
    creditRequest.addToHistory({
      submittedAt: new Date(),
      status: newStatus,
      reviewedBy: mentorId,
      reviewerModel: "Mentor",
      reviewedAt: new Date(),
      feedback: feedback || "",
    });

    // Transition to new status
    creditRequest.transitionTo(newStatus);

    // If approved, transition to pending admin review
    if (decision === "approved") {
      creditRequest.transitionTo("pending_admin_review");
    }

    // Save credit request
    await creditRequest.save();

    // Update internship completion status
    const completion = await InternshipCompletion.findById(creditRequest.internshipCompletionId);
    if (completion && completion.creditRequest) {
      completion.creditRequest.status = creditRequest.status;
      await completion.save();
    }

    logger.info("Mentor review submitted", {
      creditRequestId,
      mentorId,
      decision,
      newStatus: creditRequest.status,
    });

    // Track metrics
    const reviewDuration = new Date() - creditRequest.requestedAt;
    if (decision === "approved") {
      creditMetricsService.trackApproval("mentor", creditRequest.creditRequestId, {
        mentorId,
        durationMs: reviewDuration,
      });
      creditMetricsService.trackApprovalTime("mentor", creditRequest.creditRequestId, reviewDuration, {
        mentorId,
      });
    } else {
      creditMetricsService.trackRejection("mentor", creditRequest.creditRequestId, feedback, {
        mentorId,
      });
    }

    return creditRequest;
  } catch (error) {
    logger.error("Error submitting mentor review", {
      error: error.message,
      creditRequestId,
      mentorId,
      decision,
    });
    throw error;
  }
};

/**
 * Submit admin review for a credit request
 * @param {string} creditRequestId - CreditRequest MongoDB ObjectId
 * @param {string} adminId - Admin MongoDB ObjectId
 * @param {string} decision - 'approved' or 'rejected'
 * @param {string} feedback - Review feedback (required for rejections)
 * @param {Object} complianceChecks - Compliance checks assessment
 * @returns {Object} - Updated CreditRequest document
 */
export const submitAdminReview = async (creditRequestId, adminId, decision, feedback, complianceChecks = {}) => {
  try {
    // Validate review data
    const validation = validateAdminReview({ decision, feedback, complianceChecks });
    if (!validation.valid) {
      const error = new Error("Validation failed");
      error.validationErrors = validation.errors;
      throw error;
    }

    // Check permissions
    const permission = await checkReviewPermissions(adminId, creditRequestId, "admin");
    if (!permission.hasPermission) {
      const error = new Error(permission.reason);
      error.code = "PERMISSION_DENIED";
      throw error;
    }

    // Get credit request
    const creditRequest = await CreditRequest.findById(creditRequestId);
    if (!creditRequest) {
      throw new Error("Credit request not found");
    }

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error("Admin not found");
    }

    // Determine new status based on decision
    let newStatus;
    if (decision === "approved") {
      newStatus = "admin_approved";
    } else {
      newStatus = "admin_rejected";
    }

    // Validate state transition
    if (!creditRequest.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid state transition from ${creditRequest.status} to ${newStatus}`
      );
    }

    // Update admin review
    creditRequest.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      decision,
      feedback: feedback || "",
      complianceChecks: {
        nepCompliant: complianceChecks.nepCompliant || false,
        documentationComplete: complianceChecks.documentationComplete || false,
        feesCleared: complianceChecks.feesCleared || false,
        departmentApproved: complianceChecks.departmentApproved || false,
      },
    };

    // Log NEP compliance validation result in request history
    const nepComplianceStatus = complianceChecks.nepCompliant 
      ? `NEP Compliant: Duration ${creditRequest.internshipDurationWeeks} weeks meets minimum requirement of 4 weeks`
      : `NEP Non-Compliant: Duration ${creditRequest.internshipDurationWeeks} weeks does not meet minimum requirement of 4 weeks`;
    
    const complianceLogEntry = `Compliance Validation - ${nepComplianceStatus}. ` +
      `Documentation Complete: ${complianceChecks.documentationComplete ? 'Yes' : 'No'}. ` +
      `Fees Cleared: ${complianceChecks.feesCleared ? 'Yes' : 'No'}. ` +
      `Department Approved: ${complianceChecks.departmentApproved ? 'Yes' : 'No'}.`;

    // Add to submission history with compliance validation details
    creditRequest.addToHistory({
      submittedAt: new Date(),
      status: newStatus,
      reviewedBy: adminId,
      reviewerModel: "Admin",
      reviewedAt: new Date(),
      feedback: feedback ? `${feedback}\n\n${complianceLogEntry}` : complianceLogEntry,
    });

    // Transition to new status
    creditRequest.transitionTo(newStatus);

    // Save credit request
    await creditRequest.save();

    // Update internship completion status
    const completion = await InternshipCompletion.findById(creditRequest.internshipCompletionId);
    if (completion && completion.creditRequest) {
      completion.creditRequest.status = creditRequest.status;
      await completion.save();
    }

    logger.info("Admin review submitted", {
      creditRequestId,
      adminId,
      decision,
      newStatus: creditRequest.status,
    });

    // Track metrics
    const mentorReviewTime = creditRequest.mentorReview?.reviewedAt 
      ? new Date() - creditRequest.mentorReview.reviewedAt 
      : 0;
    
    if (decision === "approved") {
      creditMetricsService.trackApproval("admin", creditRequest.creditRequestId, {
        adminId,
        durationMs: mentorReviewTime,
      });
      if (mentorReviewTime > 0) {
        creditMetricsService.trackApprovalTime("admin", creditRequest.creditRequestId, mentorReviewTime, {
          adminId,
        });
      }
    } else {
      creditMetricsService.trackRejection("admin", creditRequest.creditRequestId, feedback, {
        adminId,
      });
    }

    return creditRequest;
  } catch (error) {
    logger.error("Error submitting admin review", {
      error: error.message,
      creditRequestId,
      adminId,
      decision,
    });
    throw error;
  }
};

export const creditReviewService = {
  validateMentorReview,
  validateAdminReview,
  checkReviewPermissions,
  submitMentorReview,
  submitAdminReview,
};

export default creditReviewService;
