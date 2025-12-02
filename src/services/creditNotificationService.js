import { addToQueue } from "../queues/index.js";
import { logger } from "../utils/logger.js";
import CreditRequest from "../models/CreditRequest.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Admin from "../models/Admin.js";
import Internship from "../models/Internship.js";
import creditMetricsService from "./creditMetricsService.js";

/**
 * Add a credit notification job to the queue
 * @param {string} jobName - Name of the notification job
 * @param {Object} data - Job data
 * @param {Object} options - Additional job options
 * @returns {Promise<Object>} - Job result
 */
const addCreditNotificationJob = async (jobName, data, options = {}) => {
  try {
    const job = await addToQueue("creditNotification", jobName, data, {
      priority: options.priority || 1,
      ...options,
    });
    logger.info("Credit notification job added to queue", {
      jobName,
      jobId: job.id,
      creditRequestId: data.creditRequestId,
    });
    
    // Track notification as pending
    creditMetricsService.trackNotificationPending(jobName, data.creditRequestId);
    
    return job;
  } catch (error) {
    logger.error("Failed to add credit notification job to queue", {
      jobName,
      error: error.message,
      data,
    });
    
    // Track notification failure
    creditMetricsService.trackNotificationFailed(jobName, data.creditRequestId, error);
    
    throw error;
  }
};

/**
 * CreditNotificationService
 * Handles all notifications for the credit transfer system lifecycle
 */
class CreditNotificationService {
  /**
   * Notify student that their credit request has been created
   * @param {Object} creditRequest - The credit request document
   * @returns {Promise<Object>} - Notification result
   */
  async notifyStudentRequestCreated(creditRequest) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-student-request-created", {
        creditRequestId: creditRequest.creditRequestId,
      });

      logger.info("Student request created notification queued", {
        creditRequestId: creditRequest.creditRequestId,
      });

      return { success: true, notificationType: "student_request_created" };
    } catch (error) {
      logger.error("Failed to queue student request created notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
      });
      throw error;
    }
  }

  /**
   * Notify mentor of a new credit request to review
   * @param {Object} creditRequest - The credit request document
   * @returns {Promise<Object>} - Notification result
   */
  async notifyMentorNewRequest(creditRequest) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-mentor-new-request", {
        creditRequestId: creditRequest.creditRequestId,
      }, {
        priority: 2, // Higher priority for mentor notifications
      });

      logger.info("Mentor new request notification queued", {
        creditRequestId: creditRequest.creditRequestId,
      });

      return { success: true, notificationType: "mentor_new_request" };
    } catch (error) {
      logger.error("Failed to queue mentor new request notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
      });
      throw error;
    }
  }

  /**
   * Notify student of mentor's decision (approval or rejection)
   * @param {Object} creditRequest - The credit request document
   * @param {string} decision - 'approved' or 'rejected'
   * @returns {Promise<Object>} - Notification result
   */
  async notifyStudentMentorDecision(creditRequest, decision) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-student-mentor-decision", {
        creditRequestId: creditRequest.creditRequestId,
        decision,
      }, {
        priority: 2, // Higher priority for decision notifications
      });

      logger.info("Student mentor decision notification queued", {
        creditRequestId: creditRequest.creditRequestId,
        decision,
      });

      return { success: true, notificationType: `student_mentor_${decision}` };
    } catch (error) {
      logger.error("Failed to queue student mentor decision notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
        decision,
      });
      throw error;
    }
  }

  /**
   * Notify admin of a mentor-approved credit request
   * @param {Object} creditRequest - The credit request document
   * @returns {Promise<Object>} - Notification result
   */
  async notifyAdminMentorApproval(creditRequest) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-admin-mentor-approval", {
        creditRequestId: creditRequest.creditRequestId,
      }, {
        priority: 2, // Higher priority for admin notifications
      });

      logger.info("Admin mentor approval notification queued", {
        creditRequestId: creditRequest.creditRequestId,
      });

      return { success: true, notificationType: "admin_mentor_approval" };
    } catch (error) {
      logger.error("Failed to queue admin mentor approval notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
      });
      throw error;
    }
  }

  /**
   * Notify student of admin's decision (approval or rejection)
   * @param {Object} creditRequest - The credit request document
   * @param {string} decision - 'approved' or 'rejected'
   * @returns {Promise<Object>} - Notification result
   */
  async notifyStudentAdminDecision(creditRequest, decision) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-student-admin-decision", {
        creditRequestId: creditRequest.creditRequestId,
        decision,
      }, {
        priority: 2, // Higher priority for decision notifications
      });

      logger.info("Student admin decision notification queued", {
        creditRequestId: creditRequest.creditRequestId,
        decision,
      });

      return { success: true, notificationType: `student_admin_${decision}` };
    } catch (error) {
      logger.error("Failed to queue student admin decision notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
        decision,
      });
      throw error;
    }
  }

  /**
   * Notify student that credits have been added to their profile
   * @param {Object} creditRequest - The credit request document
   * @param {Object} certificate - Certificate data with URL and ID
   * @returns {Promise<Object>} - Notification result
   */
  async notifyStudentCreditsAdded(creditRequest, certificate) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-student-credits-added", {
        creditRequestId: creditRequest.creditRequestId,
        certificate,
      }, {
        priority: 2, // Higher priority for completion notifications
      });

      logger.info("Student credits added notification queued", {
        creditRequestId: creditRequest.creditRequestId,
      });

      return { success: true, notificationType: "student_credits_added" };
    } catch (error) {
      logger.error("Failed to queue student credits added notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
      });
      throw error;
    }
  }

  /**
   * Send a reminder notification for pending reviews
   * @param {Object} creditRequest - The credit request document
   * @param {string} recipientRole - 'mentor' or 'admin'
   * @returns {Promise<Object>} - Notification result
   */
  async sendReviewReminder(creditRequest, recipientRole) {
    try {
      // Queue the notification job
      await addCreditNotificationJob("credit-review-reminder", {
        creditRequestId: creditRequest.creditRequestId,
        recipientRole,
      }, {
        priority: 2, // Higher priority for reminders
      });

      logger.info("Review reminder notification queued", {
        creditRequestId: creditRequest.creditRequestId,
        recipientRole,
      });

      return { success: true, notificationType: `reminder_${recipientRole}` };
    } catch (error) {
      logger.error("Failed to queue review reminder notification", {
        error: error.message,
        creditRequestId: creditRequest.creditRequestId,
        recipientRole,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const creditNotificationService = new CreditNotificationService();
export default creditNotificationService;
