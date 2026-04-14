import { logger } from "../utils/logger.js";
import CreditRequest from "../models/CreditRequest.js";
import Notification from "../models/Notification.js";
import Admin from "../models/Admin.js";

/**
 * Direct notification service for credit requests
 * Replaces queue-based notification system with direct database operations
 */

const createNotification = async (userId, title, message, type = "info", metadata = {}) => {
  try {
    const notification = await Notification.create({
      notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      message,
      type,
      metadata,
      read: false,
    });
    logger.info("Notification created", { userId, title, type });
    return notification;
  } catch (error) {
    logger.error("Failed to create notification", { error: error.message, userId, title });
    throw error;
  }
};

const trackNotificationDelivery = async (creditRequestId, notificationType, recipientRole) => {
  try {
    await CreditRequest.findByIdAndUpdate(creditRequestId, {
      $push: {
        "metadata.notificationsSent": {
          type: notificationType,
          recipientRole,
          sentAt: new Date(),
        },
      },
    });
  } catch (error) {
    logger.warn("Failed to track notification delivery", { error: error.message });
  }
};

const creditNotificationService = {
  async notifyStudentRequestCreated(creditRequest) {
    try {
      await createNotification(
        creditRequest.studentId,
        "Credit Request Submitted",
        `Your credit request for ${creditRequest.credits} credits has been submitted and is pending mentor review.`,
        "info",
        { creditRequestId: creditRequest._id, requestId: creditRequest.requestId }
      );

      await trackNotificationDelivery(creditRequest._id, "student_request_created", "student");

      return { success: true };
    } catch (error) {
      logger.error("Failed to notify student of request creation", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  async notifyMentorNewRequest(creditRequest) {
    try {
      const isResubmission = creditRequest.status === "resubmitted";
      const title = isResubmission ? "Credit Request Resubmitted" : "New Credit Request";
      const message = isResubmission
        ? `Student has resubmitted credit request ${creditRequest.requestId} for review.`
        : `New credit request ${creditRequest.requestId} for ${creditRequest.credits} credits requires your review.`;

      await createNotification(
        creditRequest.mentorId,
        title,
        message,
        "action_required",
        { creditRequestId: creditRequest._id, requestId: creditRequest.requestId }
      );

      const notificationType = isResubmission ? "mentor_request_resubmitted" : "mentor_new_request";
      await trackNotificationDelivery(creditRequest._id, notificationType, "mentor");

      return { success: true, notificationType };
    } catch (error) {
      logger.error("Failed to notify mentor of new request", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  async notifyStudentMentorDecision(creditRequest, decision) {
    try {
      const title = decision === "approved" ? "Mentor Approved Credit Request" : "Mentor Rejected Credit Request";
      const message =
        decision === "approved"
          ? `Your credit request ${creditRequest.requestId} has been approved by your mentor and forwarded to admin.`
          : `Your credit request ${creditRequest.requestId} has been rejected by your mentor. Reason: ${creditRequest.mentorReview?.comments || "No reason provided"}`;

      await createNotification(
        creditRequest.studentId,
        title,
        message,
        decision === "approved" ? "success" : "warning",
        { creditRequestId: creditRequest._id, requestId: creditRequest.requestId, decision }
      );

      await trackNotificationDelivery(creditRequest._id, `student_mentor_${decision}`, "student");

      return { success: true };
    } catch (error) {
      logger.error("Failed to notify student of mentor decision", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  async notifyAdminMentorApproval(creditRequest) {
    try {
      const admins = await Admin.find({ isActive: true }).select("_id").lean();

      if (admins.length === 0) {
        logger.warn("No active admins found for notification");
        return { success: false, error: "No active admins" };
      }

      await Promise.all(
        admins.map((admin) =>
          createNotification(
            admin._id,
            "Credit Request Pending Admin Review",
            `Credit request ${creditRequest.requestId} for ${creditRequest.credits} credits has been approved by mentor and requires admin review.`,
            "action_required",
            { creditRequestId: creditRequest._id, requestId: creditRequest.requestId }
          )
        )
      );

      await trackNotificationDelivery(creditRequest._id, "admin_mentor_approval", "admin");

      return { success: true, adminCount: admins.length };
    } catch (error) {
      logger.error("Failed to notify admins of mentor approval", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  async notifyStudentAdminDecision(creditRequest, decision) {
    try {
      const title = decision === "approved" ? "Credits Added to Your Account" : "Credit Request Rejected by Admin";
      const message =
        decision === "approved"
          ? `Your credit request ${creditRequest.requestId} has been approved. ${creditRequest.credits} credits have been added to your account.`
          : `Your credit request ${creditRequest.requestId} has been rejected by admin. Reason: ${creditRequest.adminReview?.comments || "No reason provided"}`;

      await createNotification(
        creditRequest.studentId,
        title,
        message,
        decision === "approved" ? "success" : "error",
        { creditRequestId: creditRequest._id, requestId: creditRequest.requestId, decision }
      );

      await trackNotificationDelivery(creditRequest._id, `student_admin_${decision}`, "student");

      return { success: true };
    } catch (error) {
      logger.error("Failed to notify student of admin decision", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  async notifyStudentCreditsAdded(creditRequest, certificate) {
    try {
      await createNotification(
        creditRequest.studentId,
        "Credits Added Successfully",
        `${creditRequest.credits} credits have been added to your account. Your completion certificate is ready for download.`,
        "success",
        {
          creditRequestId: creditRequest._id,
          requestId: creditRequest.requestId,
          certificateUrl: certificate?.url,
        }
      );

      await trackNotificationDelivery(creditRequest._id, "student_credits_added", "student");

      return { success: true };
    } catch (error) {
      logger.error("Failed to notify student of credits added", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  async sendReviewReminder(creditRequest, recipientRole) {
    try {
      if (recipientRole === "mentor") {
        await createNotification(
          creditRequest.mentorId,
          "Reminder: Credit Request Pending Review",
          `Credit request ${creditRequest.requestId} is still pending your review. Please review at your earliest convenience.`,
          "reminder",
          { creditRequestId: creditRequest._id, requestId: creditRequest.requestId }
        );
      } else if (recipientRole === "admin") {
        const admins = await Admin.find({ isActive: true }).select("_id").lean();
        await Promise.all(
          admins.map((admin) =>
            createNotification(
              admin._id,
              "Reminder: Credit Request Pending Admin Review",
              `Credit request ${creditRequest.requestId} is still pending admin review.`,
              "reminder",
              { creditRequestId: creditRequest._id, requestId: creditRequest.requestId }
            )
          )
        );
      } else {
        throw new Error("Invalid recipient role");
      }

      await CreditRequest.findByIdAndUpdate(creditRequest._id, {
        $inc: { "metadata.remindersSent": 1 },
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to send review reminder", { error: error.message });
      throw error;
    }
  },
};

export { creditNotificationService };
export default creditNotificationService;
