import { Worker, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { addToQueue } from "../queues/index.js";
import { logger } from "../utils/logger.js";
import CreditRequest from "../models/CreditRequest.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Admin from "../models/Admin.js";
import creditMetricsService from "../services/creditMetricsService.js";

const CREDIT_NOTIFICATION_QUEUE = "credit-notifications";

/**
 * Track notification delivery in the credit request metadata
 * @param {string} creditRequestId - Credit request ID
 * @param {string} notificationType - Type of notification
 * @param {boolean} success - Whether notification was successful
 * @param {string} error - Error message if failed
 */
const trackNotificationDelivery = async (creditRequestId, notificationType, success, error = null) => {
  try {
    const updateData = {
      $push: {
        "metadata.notificationsSent": {
          type: notificationType,
          sentAt: new Date(),
          success,
          error: error || undefined,
        },
      },
    };

    await CreditRequest.findOneAndUpdate(
      { creditRequestId },
      updateData
    );

    logger.info("Notification delivery tracked", {
      creditRequestId,
      notificationType,
      success,
    });

    // Track metrics
    if (success) {
      creditMetricsService.trackNotificationSent(notificationType, creditRequestId);
    } else {
      creditMetricsService.trackNotificationFailed(notificationType, creditRequestId, new Error(error || "Unknown error"));
    }
  } catch (trackError) {
    logger.error("Failed to track notification delivery", {
      creditRequestId,
      notificationType,
      error: trackError.message,
    });
  }
};

/**
 * Process student request created notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processStudentRequestCreated = async (job) => {
  const { creditRequestId } = job.data;

  logger.info("Processing student request created notification", {
    jobId: job.id,
    creditRequestId,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("studentId", "email profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const student = creditRequest.studentId;
  const internship = creditRequest.internshipId;

  const notificationData = {
    userId: student._id.toString(),
    mongoId: student._id,
    email: student.email,
    title: "Credit Request Created",
    message: `Your credit request for the internship "${internship.title}" at ${internship.company} has been created and is now pending mentor review.`,
    priority: "medium",
    actionUrl: `/student/credit-requests/${creditRequest.creditRequestId}`,
    metadata: {
      creditRequestId: creditRequest.creditRequestId,
      internshipId: internship._id.toString(),
      type: "credit_request_created",
    },
  };

  await addToQueue("notification", "notify-student", notificationData);

  await trackNotificationDelivery(
    creditRequestId,
    "student_request_created",
    true
  );

  return { success: true, notificationType: "student_request_created" };
};

/**
 * Process mentor new request notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processMentorNewRequest = async (job) => {
  const { creditRequestId } = job.data;

  logger.info("Processing mentor new request notification", {
    jobId: job.id,
    creditRequestId,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("mentorId", "email profile")
    .populate("studentId", "profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const mentor = creditRequest.mentorId;
  const student = creditRequest.studentId;
  const internship = creditRequest.internshipId;

  const studentName = student.profile?.fullName || "A student";
  const isResubmission = creditRequest.submissionHistory?.length > 1;

  const notificationData = {
    userId: mentor._id.toString(),
    mongoId: mentor._id,
    email: mentor.email,
    title: isResubmission ? "Credit Request Resubmitted" : "New Credit Request for Review",
    message: `${studentName} has ${isResubmission ? "resubmitted a" : "submitted a new"} credit request for the internship "${internship.title}" at ${internship.company}. Please review the logbook and final report.`,
    priority: "high",
    actionUrl: `/mentor/credit-requests/${creditRequest.creditRequestId}`,
    metadata: {
      creditRequestId: creditRequest.creditRequestId,
      studentId: student._id.toString(),
      internshipId: internship._id.toString(),
      type: isResubmission ? "credit_request_resubmitted" : "credit_request_new",
    },
  };

  await addToQueue("notification", "notify-mentor", notificationData);

  const notificationType = isResubmission ? "mentor_request_resubmitted" : "mentor_new_request";
  await trackNotificationDelivery(creditRequestId, notificationType, true);

  return { success: true, notificationType };
};

/**
 * Process student mentor decision notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processStudentMentorDecision = async (job) => {
  const { creditRequestId, decision } = job.data;

  logger.info("Processing student mentor decision notification", {
    jobId: job.id,
    creditRequestId,
    decision,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("studentId", "email profile")
    .populate("mentorId", "profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const student = creditRequest.studentId;
  const mentor = creditRequest.mentorId;
  const internship = creditRequest.internshipId;
  const mentorName = mentor.profile?.fullName || "Your mentor";

  let title, message, priority, actionUrl;

  if (decision === "approved") {
    title = "Credit Request Approved by Mentor";
    message = `${mentorName} has approved your credit request for the internship "${internship.title}" at ${internship.company}. Your request is now pending admin approval.`;
    priority = "high";
    actionUrl = `/student/credit-requests/${creditRequest.creditRequestId}`;
  } else {
    title = "Credit Request Requires Revision";
    message = `${mentorName} has requested revisions to your credit request for the internship "${internship.title}" at ${internship.company}. Please review the feedback and resubmit.`;
    priority = "high";
    actionUrl = `/student/credit-requests/${creditRequest.creditRequestId}`;
  }

  const notificationData = {
    userId: student._id.toString(),
    mongoId: student._id,
    email: student.email,
    title,
    message,
    priority,
    actionUrl,
    metadata: {
      creditRequestId: creditRequest.creditRequestId,
      internshipId: internship._id.toString(),
      decision,
      feedback: creditRequest.mentorReview?.feedback,
      type: `mentor_decision_${decision}`,
    },
  };

  await addToQueue("notification", "notify-student", notificationData);

  await trackNotificationDelivery(
    creditRequestId,
    `student_mentor_${decision}`,
    true
  );

  return { success: true, notificationType: `student_mentor_${decision}` };
};

/**
 * Process admin mentor approval notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processAdminMentorApproval = async (job) => {
  const { creditRequestId } = job.data;

  logger.info("Processing admin mentor approval notification", {
    jobId: job.id,
    creditRequestId,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("studentId", "profile")
    .populate("mentorId", "profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const student = creditRequest.studentId;
  const mentor = creditRequest.mentorId;
  const internship = creditRequest.internshipId;

  const studentName = student.profile?.fullName || "A student";
  const mentorName = mentor.profile?.fullName || "A mentor";

  // Get all admins to notify
  const admins = await Admin.find({ role: "admin" }).select("email profile").lean();

  if (admins.length === 0) {
    logger.warn("No admins found to notify of mentor approval", {
      creditRequestId: creditRequest.creditRequestId,
    });
    return { success: false, reason: "no_admins_found" };
  }

  // Send notification to all admins
  const notificationPromises = admins.map((admin) => {
    const notificationData = {
      userId: admin._id.toString(),
      mongoId: admin._id,
      email: admin.email,
      title: "Credit Request Pending Admin Approval",
      message: `${studentName}'s credit request for the internship "${internship.title}" at ${internship.company} has been approved by ${mentorName} and is now pending your final approval.`,
      priority: "high",
      actionUrl: `/admin/credit-requests/${creditRequest.creditRequestId}`,
      metadata: {
        creditRequestId: creditRequest.creditRequestId,
        studentId: student._id.toString(),
        mentorId: mentor._id.toString(),
        internshipId: internship._id.toString(),
        type: "credit_request_admin_review",
      },
    };

    return addToQueue("notification", "notify-admin", notificationData);
  });

  await Promise.all(notificationPromises);

  await trackNotificationDelivery(
    creditRequestId,
    "admin_mentor_approval",
    true
  );

  return { success: true, notificationType: "admin_mentor_approval", adminCount: admins.length };
};

/**
 * Process student admin decision notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processStudentAdminDecision = async (job) => {
  const { creditRequestId, decision } = job.data;

  logger.info("Processing student admin decision notification", {
    jobId: job.id,
    creditRequestId,
    decision,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("studentId", "email profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const student = creditRequest.studentId;
  const internship = creditRequest.internshipId;

  let title, message, priority, actionUrl;

  if (decision === "approved") {
    title = "Credit Request Approved - Credits Being Added";
    message = `Your credit request for the internship "${internship.title}" at ${internship.company} has been approved by the admin. Your credits are being added to your profile.`;
    priority = "high";
    actionUrl = `/student/credit-requests/${creditRequest.creditRequestId}`;
  } else {
    title = "Credit Request - Administrative Hold";
    message = `Your credit request for the internship "${internship.title}" at ${internship.company} has been placed on administrative hold. Please review the feedback and resolve the issues.`;
    priority = "high";
    actionUrl = `/student/credit-requests/${creditRequest.creditRequestId}`;
  }

  const notificationData = {
    userId: student._id.toString(),
    mongoId: student._id,
    email: student.email,
    title,
    message,
    priority,
    actionUrl,
    metadata: {
      creditRequestId: creditRequest.creditRequestId,
      internshipId: internship._id.toString(),
      decision,
      feedback: creditRequest.adminReview?.feedback,
      type: `admin_decision_${decision}`,
    },
  };

  await addToQueue("notification", "notify-student", notificationData);

  await trackNotificationDelivery(
    creditRequestId,
    `student_admin_${decision}`,
    true
  );

  return { success: true, notificationType: `student_admin_${decision}` };
};

/**
 * Process student credits added notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processStudentCreditsAdded = async (job) => {
  const { creditRequestId, certificate } = job.data;

  logger.info("Processing student credits added notification", {
    jobId: job.id,
    creditRequestId,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("studentId", "email profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const student = creditRequest.studentId;
  const internship = creditRequest.internshipId;

  const notificationData = {
    userId: student._id.toString(),
    mongoId: student._id,
    email: student.email,
    title: "Credits Added to Your Profile",
    message: `Congratulations! ${creditRequest.calculatedCredits} credit(s) for your internship "${internship.title}" at ${internship.company} have been successfully added to your academic profile. Your certificate is ready for download.`,
    priority: "high",
    actionUrl: `/student/credits/certificate/${creditRequest.creditRequestId}`,
    metadata: {
      creditRequestId: creditRequest.creditRequestId,
      internshipId: internship._id.toString(),
      creditsAdded: creditRequest.calculatedCredits,
      certificateId: certificate?.certificateId,
      certificateUrl: certificate?.certificateUrl,
      type: "credits_added",
    },
  };

  await addToQueue("notification", "notify-student", notificationData);

  await trackNotificationDelivery(
    creditRequestId,
    "student_credits_added",
    true
  );

  return { success: true, notificationType: "student_credits_added" };
};

/**
 * Process review reminder notification
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processReviewReminder = async (job) => {
  const { creditRequestId, recipientRole } = job.data;

  logger.info("Processing review reminder notification", {
    jobId: job.id,
    creditRequestId,
    recipientRole,
  });

  // Populate necessary fields
  const creditRequest = await CreditRequest.findOne({ creditRequestId })
    .populate("mentorId", "email profile")
    .populate("studentId", "profile")
    .populate("internshipId", "title company")
    .lean();

  if (!creditRequest) {
    throw new Error(`Credit request not found: ${creditRequestId}`);
  }

  const student = creditRequest.studentId;
  const internship = creditRequest.internshipId;
  const studentName = student.profile?.fullName || "A student";

  if (recipientRole === "mentor") {
    const mentor = creditRequest.mentorId;

    const notificationData = {
      userId: mentor._id.toString(),
      mongoId: mentor._id,
      email: mentor.email,
      title: "Reminder: Credit Request Pending Review",
      message: `This is a reminder that ${studentName}'s credit request for the internship "${internship.title}" at ${internship.company} is still pending your review.`,
      priority: "high",
      actionUrl: `/mentor/credit-requests/${creditRequest.creditRequestId}`,
      metadata: {
        creditRequestId: creditRequest.creditRequestId,
        studentId: student._id.toString(),
        internshipId: internship._id.toString(),
        type: "reminder_mentor_review",
      },
    };

    await addToQueue("notification", "notify-mentor", notificationData);
  } else if (recipientRole === "admin") {
    // Get all admins
    const admins = await Admin.find({ role: "admin" }).select("email profile").lean();

    if (admins.length === 0) {
      logger.warn("No admins found to send reminder", {
        creditRequestId: creditRequest.creditRequestId,
      });
      return { success: false, reason: "no_admins_found" };
    }

    // Send reminder to all admins
    const reminderPromises = admins.map((admin) => {
      const adminNotificationData = {
        userId: admin._id.toString(),
        mongoId: admin._id,
        email: admin.email,
        title: "Reminder: Credit Request Pending Admin Approval",
        message: `This is a reminder that ${studentName}'s credit request for the internship "${internship.title}" at ${internship.company} is still pending your final approval.`,
        priority: "high",
        actionUrl: `/admin/credit-requests/${creditRequest.creditRequestId}`,
        metadata: {
          creditRequestId: creditRequest.creditRequestId,
          studentId: student._id.toString(),
          internshipId: internship._id.toString(),
          type: "reminder_admin_approval",
        },
      };

      return addToQueue("notification", "notify-admin", adminNotificationData);
    });

    await Promise.all(reminderPromises);
  } else {
    throw new Error(`Invalid recipient role: ${recipientRole}`);
  }

  // Increment reminder count
  await CreditRequest.findOneAndUpdate(
    { creditRequestId },
    { $inc: { "metadata.remindersSent": 1 } }
  );

  await trackNotificationDelivery(
    creditRequestId,
    `reminder_${recipientRole}`,
    true
  );

  return { success: true, notificationType: `reminder_${recipientRole}` };
};

/**
 * Job handlers for credit notification worker
 */
const jobHandlers = {
  "credit-student-request-created": processStudentRequestCreated,
  "credit-mentor-new-request": processMentorNewRequest,
  "credit-student-mentor-decision": processStudentMentorDecision,
  "credit-admin-mentor-approval": processAdminMentorApproval,
  "credit-student-admin-decision": processStudentAdminDecision,
  "credit-student-credits-added": processStudentCreditsAdded,
  "credit-review-reminder": processReviewReminder,
};

/**
 * Main processor for credit notification jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processor = async (job) => {
  const handler = jobHandlers[job.name];
  if (!handler) {
    throw new Error(`Unsupported credit notification job: ${job.name}`);
  }

  try {
    const result = await handler(job);
    logger.info("Credit notification job processed successfully", {
      job: job.name,
      id: job.id,
      attemptsMade: job.attemptsMade,
    });
    return result;
  } catch (error) {
    // Log failure with detailed information
    logger.error("Credit notification job failed", {
      job: job.name,
      id: job.id,
      attemptsMade: job.attemptsMade,
      error: error.message,
      stack: error.stack,
      data: job.data,
    });

    // Track failure in credit request metadata
    if (job.data.creditRequestId) {
      await trackNotificationDelivery(
        job.data.creditRequestId,
        job.name,
        false,
        error.message
      );
    }

    throw error;
  }
};

/**
 * Credit notification worker
 * Processes credit request notification jobs with retry logic and exponential backoff
 */
export const creditNotificationWorker = new Worker(
  CREDIT_NOTIFICATION_QUEUE,
  processor,
  {
    connection: bullConnection,
    concurrency: 10,
    lockDuration: 60_000, // 1 minute
    settings: {
      // Retry with exponential backoff
      backoffStrategy: (attemptsMade) => {
        // Exponential backoff: 2^attemptsMade * 1000ms
        // Attempt 1: 2s, Attempt 2: 4s, Attempt 3: 8s
        return Math.pow(2, attemptsMade) * 1000;
      },
    },
  }
);

/**
 * Queue events for credit notification worker
 */
export const creditNotificationQueueEvents = new QueueEvents(
  CREDIT_NOTIFICATION_QUEUE,
  {
    connection: bullConnection,
  }
);

// Event handlers for monitoring and logging
creditNotificationQueueEvents.on("failed", ({ jobId, failedReason, prev }) => {
  logger.error("Credit notification job failed", {
    jobId,
    reason: failedReason,
    previousState: prev,
  });
});

creditNotificationQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("Credit notification job completed", {
    jobId,
    result: returnvalue,
  });
});

creditNotificationQueueEvents.on("retries-exhausted", ({ jobId }) => {
  logger.error("Credit notification job retries exhausted", {
    jobId,
    message: "All retry attempts failed, manual intervention may be required",
  });
});

creditNotificationQueueEvents.on("stalled", ({ jobId }) => {
  logger.warn("Credit notification job stalled", {
    jobId,
    message: "Job may have timed out or worker crashed",
  });
});

creditNotificationQueueEvents
  .waitUntilReady()
  .then(() => logger.info("Credit notification queue events ready"))
  .catch((error) =>
    logger.error("Credit notification queue events error", {
      error: error.message,
    })
  );

// Graceful shutdown handler
const shutdown = async () => {
  logger.info("Shutting down credit notification worker");
  try {
    await creditNotificationWorker.close();
    await creditNotificationQueueEvents.close();
    logger.info("Credit notification worker shut down successfully");
  } catch (error) {
    logger.error("Error shutting down credit notification worker", {
      error: error.message,
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default creditNotificationWorker;
