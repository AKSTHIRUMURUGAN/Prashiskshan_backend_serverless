import CreditRequest from "../models/CreditRequest.js";
import { creditNotificationService } from "./creditNotificationService.js";
import { logger } from "../utils/logger.js";

/**
 * Credit reminder service for overdue requests
 * Replaces queue-based reminder system with direct database operations
 */

const creditReminderService = {
  /**
   * Get overdue credit requests that need reminders
   */
  async getOverdueRequests() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const overdueRequests = await CreditRequest.find({
        status: { $in: ["pending_mentor_review", "pending_admin_review"] },
        createdAt: { $lt: threeDaysAgo },
        "metadata.remindersSent": { $lt: 3 },
      })
        .populate("studentId", "studentId profile.firstName profile.lastName email")
        .populate("mentorId", "mentorId profile.firstName profile.lastName email")
        .lean();

      return overdueRequests;
    } catch (error) {
      logger.error("Failed to get overdue requests", { error: error.message });
      return [];
    }
  },

  /**
   * Send reminders for overdue requests
   */
  async sendOverdueReminders({ maxReminders = 3, dryRun = false } = {}) {
    try {
      const overdueRequests = await this.getOverdueRequests();

      if (dryRun) {
        return {
          dryRun: true,
          totalOverdue: overdueRequests.length,
          requests: overdueRequests.map((req) => ({
            requestId: req.requestId,
            status: req.status,
            daysSinceCreation: Math.floor((Date.now() - req.createdAt) / (1000 * 60 * 60 * 24)),
            remindersSent: req.metadata?.remindersSent || 0,
          })),
        };
      }

      const results = {
        sent: 0,
        failed: 0,
        skipped: 0,
      };

      for (const request of overdueRequests) {
        const remindersSent = request.metadata?.remindersSent || 0;

        if (remindersSent >= maxReminders) {
          results.skipped++;
          continue;
        }

        try {
          const recipientRole = request.status === "pending_mentor_review" ? "mentor" : "admin";
          await creditNotificationService.sendReviewReminder(request, recipientRole);
          results.sent++;
        } catch (error) {
          logger.error("Failed to send reminder", { requestId: request.requestId, error: error.message });
          results.failed++;
        }
      }

      logger.info("Overdue reminders sent", results);
      return { ...results, totalOverdue: overdueRequests.length };
    } catch (error) {
      logger.error("Failed to send overdue reminders", { error: error.message });
      throw error;
    }
  },

  /**
   * Get reminder statistics
   */
  async getReminderStats() {
    try {
      const [byStatus, totalOverdue, highReminderCount] = await Promise.all([
        CreditRequest.aggregate([
          {
            $match: {
              status: { $in: ["pending_mentor_review", "pending_admin_review"] },
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              avgRemindersSent: { $avg: { $ifNull: ["$metadata.remindersSent", 0] } },
            },
          },
        ]),
        CreditRequest.countDocuments({
          status: { $in: ["pending_mentor_review", "pending_admin_review"] },
          createdAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        }),
        CreditRequest.countDocuments({
          "metadata.remindersSent": { $gte: 2 },
          status: { $in: ["pending_mentor_review", "pending_admin_review"] },
        }),
      ]);

      const stats = {
        byStatus: {},
        totalOverdue,
        highReminderCount,
      };

      byStatus.forEach((item) => {
        stats.byStatus[item._id] = item.count;
      });

      return stats;
    } catch (error) {
      logger.error("Failed to get reminder stats", { error: error.message });
      return { byStatus: {}, totalOverdue: 0, highReminderCount: 0 };
    }
  },
};

export { creditReminderService };
export default creditReminderService;
