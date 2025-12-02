import CreditRequest from "../models/CreditRequest.js";
import { creditNotificationService } from "./creditNotificationService.js";
import { logger } from "../utils/logger.js";
import { addToQueue } from "../queues/index.js";

/**
 * CreditReminderService
 * Handles overdue detection and reminder notifications for credit requests
 */
class CreditReminderService {
  /**
   * Get all overdue credit requests
   * @returns {Promise<Array>} - Array of overdue credit requests
   */
  async getOverdueRequests() {
    try {
      // Get all pending requests (mentor review, admin review, student action)
      const pendingStatuses = [
        "pending_mentor_review",
        "pending_admin_review",
        "pending_student_action",
      ];

      const creditRequests = await CreditRequest.find({
        status: { $in: pendingStatuses },
      })
        .populate("studentId", "studentId email profile")
        .populate("mentorId", "mentorId email profile")
        .populate("internshipId", "title companyId duration");

      // Filter for overdue requests
      const overdueRequests = creditRequests.filter((req) => req.isOverdue());

      logger.info("Retrieved overdue credit requests", {
        total: creditRequests.length,
        overdue: overdueRequests.length,
      });

      return overdueRequests;
    } catch (error) {
      logger.error("Error getting overdue requests", { error: error.message });
      throw error;
    }
  }

  /**
   * Send reminder for a specific credit request
   * @param {string} creditRequestId - CreditRequest MongoDB ObjectId or creditRequestId
   * @returns {Promise<Object>} - Reminder result
   */
  async sendReminder(creditRequestId) {
    try {
      // Get credit request
      const creditRequest = await CreditRequest.findOne({
        $or: [{ _id: creditRequestId }, { creditRequestId }],
      })
        .populate("studentId", "studentId email profile")
        .populate("mentorId", "mentorId email profile")
        .populate("internshipId", "title companyId duration");

      if (!creditRequest) {
        throw new Error("Credit request not found");
      }

      // Check if request is in a state that requires reminders
      const reminderStates = [
        "pending_mentor_review",
        "pending_admin_review",
        "pending_student_action",
      ];

      if (!reminderStates.includes(creditRequest.status)) {
        logger.warn("Credit request not in reminder-eligible state", {
          creditRequestId: creditRequest.creditRequestId,
          status: creditRequest.status,
        });
        return {
          success: false,
          reason: "not_eligible",
          message: "Credit request is not in a state that requires reminders",
        };
      }

      // Determine recipient role based on status
      let recipientRole;
      if (creditRequest.status === "pending_mentor_review") {
        recipientRole = "mentor";
      } else if (creditRequest.status === "pending_admin_review") {
        recipientRole = "admin";
      } else if (creditRequest.status === "pending_student_action") {
        recipientRole = "student";
      }

      // Send reminder notification
      await creditNotificationService.sendReviewReminder(creditRequest, recipientRole);

      logger.info("Reminder sent for credit request", {
        creditRequestId: creditRequest.creditRequestId,
        recipientRole,
        reminderCount: creditRequest.metadata.remindersSent + 1,
      });

      return {
        success: true,
        creditRequestId: creditRequest.creditRequestId,
        recipientRole,
        reminderCount: creditRequest.metadata.remindersSent,
      };
    } catch (error) {
      logger.error("Error sending reminder", {
        error: error.message,
        creditRequestId,
      });
      throw error;
    }
  }

  /**
   * Send reminders for all overdue requests
   * @param {Object} options - Options for reminder sending
   * @returns {Promise<Object>} - Summary of reminders sent
   */
  async sendOverdueReminders(options = {}) {
    try {
      const { maxReminders = 3, dryRun = false } = options;

      // Get all overdue requests
      const overdueRequests = await this.getOverdueRequests();

      // Filter out requests that have exceeded max reminders
      const eligibleRequests = overdueRequests.filter(
        (req) => req.metadata.remindersSent < maxReminders
      );

      logger.info("Processing overdue reminders", {
        totalOverdue: overdueRequests.length,
        eligible: eligibleRequests.length,
        maxReminders,
        dryRun,
      });

      if (dryRun) {
        return {
          dryRun: true,
          totalOverdue: overdueRequests.length,
          eligible: eligibleRequests.length,
          requests: eligibleRequests.map((req) => ({
            creditRequestId: req.creditRequestId,
            status: req.status,
            daysSinceLastUpdate: Math.floor(
              (Date.now() - req.lastUpdatedAt) / (1000 * 60 * 60 * 24)
            ),
            remindersSent: req.metadata.remindersSent,
          })),
        };
      }

      // Send reminders
      const results = await Promise.allSettled(
        eligibleRequests.map((req) => this.sendReminder(req.creditRequestId))
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      logger.info("Overdue reminders sent", {
        total: eligibleRequests.length,
        successful,
        failed,
      });

      return {
        totalOverdue: overdueRequests.length,
        eligible: eligibleRequests.length,
        sent: successful,
        failed,
        results: results.map((r, idx) => ({
          creditRequestId: eligibleRequests[idx].creditRequestId,
          status: r.status,
          result: r.status === "fulfilled" ? r.value : { error: r.reason?.message },
        })),
      };
    } catch (error) {
      logger.error("Error sending overdue reminders", { error: error.message });
      throw error;
    }
  }

  /**
   * Schedule automatic reminder job
   * This should be called periodically (e.g., daily) to check for overdue requests
   * @param {Object} options - Scheduling options
   * @returns {Promise<Object>} - Job scheduling result
   */
  async scheduleReminderJob(options = {}) {
    try {
      const { maxReminders = 3, repeat = { pattern: "0 9 * * *" } } = options;

      // Add recurring job to notification queue
      const job = await addToQueue(
        "notification",
        "send-credit-reminders",
        { maxReminders },
        {
          repeat,
          jobId: "credit-reminder-job",
        }
      );

      logger.info("Credit reminder job scheduled", {
        jobId: job.id,
        repeat,
        maxReminders,
      });

      return {
        success: true,
        jobId: job.id,
        schedule: repeat,
      };
    } catch (error) {
      logger.error("Error scheduling reminder job", { error: error.message });
      throw error;
    }
  }

  /**
   * Get reminder statistics
   * @returns {Promise<Object>} - Reminder statistics
   */
  async getReminderStats() {
    try {
      const overdueRequests = await this.getOverdueRequests();

      const stats = {
        totalOverdue: overdueRequests.length,
        byStatus: {},
        byReminderCount: {},
        averageDaysOverdue: 0,
      };

      let totalDaysOverdue = 0;

      overdueRequests.forEach((req) => {
        // Count by status
        stats.byStatus[req.status] = (stats.byStatus[req.status] || 0) + 1;

        // Count by reminder count
        const reminderCount = req.metadata.remindersSent;
        stats.byReminderCount[reminderCount] =
          (stats.byReminderCount[reminderCount] || 0) + 1;

        // Calculate days overdue
        const daysOverdue = Math.floor(
          (Date.now() - req.lastUpdatedAt) / (1000 * 60 * 60 * 24)
        );
        totalDaysOverdue += daysOverdue;
      });

      if (overdueRequests.length > 0) {
        stats.averageDaysOverdue = Math.round(
          totalDaysOverdue / overdueRequests.length
        );
      }

      logger.info("Reminder statistics retrieved", stats);

      return stats;
    } catch (error) {
      logger.error("Error getting reminder stats", { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const creditReminderService = new CreditReminderService();
export default creditReminderService;
