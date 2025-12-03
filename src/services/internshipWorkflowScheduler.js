import { Queue } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { logger } from "../utils/logger.js";

/**
 * Internship Workflow Scheduler
 * Schedules recurring jobs for internship workflow background tasks
 */

// Queue instances
const notificationQueue = new Queue("notifications", { connection: bullConnection });
const aiQueue = new Queue("ai-processing", { connection: bullConnection });

/**
 * Initialize all scheduled jobs for internship workflow
 */
export const initializeInternshipWorkflowSchedules = async () => {
  try {
    logger.info("Initializing internship workflow schedules");

    // Schedule deadline reminders - Run every 6 hours
    await notificationQueue.add(
      "check-deadline-reminders",
      {},
      {
        repeat: {
          pattern: "0 */6 * * *", // Every 6 hours at minute 0
        },
        jobId: "deadline-reminders-recurring",
      }
    );
    logger.info("Deadline reminder schedule initialized (every 6 hours)");

    // Schedule expired internship closure - Run daily at 1 AM
    await notificationQueue.add(
      "close-expired-internships",
      {},
      {
        repeat: {
          pattern: "0 1 * * *", // Daily at 1:00 AM
        },
        jobId: "expired-internships-recurring",
      }
    );
    logger.info("Expired internship schedule initialized (daily at 1 AM)");

    // Schedule daily analytics snapshots - Run daily at 2 AM
    await notificationQueue.add(
      "generate-analytics-snapshots",
      { period: "daily" },
      {
        repeat: {
          pattern: "0 2 * * *", // Daily at 2:00 AM
        },
        jobId: "analytics-snapshots-daily",
      }
    );
    logger.info("Daily analytics snapshot schedule initialized (daily at 2 AM)");

    // Schedule weekly analytics snapshots - Run every Monday at 3 AM
    await notificationQueue.add(
      "generate-analytics-snapshots",
      { period: "weekly" },
      {
        repeat: {
          pattern: "0 3 * * 1", // Every Monday at 3:00 AM
        },
        jobId: "analytics-snapshots-weekly",
      }
    );
    logger.info("Weekly analytics snapshot schedule initialized (Mondays at 3 AM)");

    // Schedule monthly analytics snapshots - Run on 1st of each month at 4 AM
    await notificationQueue.add(
      "generate-analytics-snapshots",
      { period: "monthly" },
      {
        repeat: {
          pattern: "0 4 1 * *", // 1st of month at 4:00 AM
        },
        jobId: "analytics-snapshots-monthly",
      }
    );
    logger.info("Monthly analytics snapshot schedule initialized (1st of month at 4 AM)");

    logger.info("All internship workflow schedules initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize internship workflow schedules", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Queue AI tagging job for an internship
 * @param {string} internshipId - Internship ID to tag
 * @param {string} userId - User ID for tracking
 * @param {Object} options - Additional options
 */
export const queueAITagging = async (internshipId, userId = "system", options = {}) => {
  try {
    const job = await aiQueue.add(
      "tag-internship",
      { internshipId, userId },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        ...options,
      }
    );

    logger.info("AI tagging job queued", {
      jobId: job.id,
      internshipId,
    });

    return job;
  } catch (error) {
    logger.error("Failed to queue AI tagging job", {
      internshipId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Queue batch AI tagging for multiple internships
 * @param {Array<string>} internshipIds - Array of internship IDs
 * @param {string} userId - User ID for tracking
 * @param {Object} options - Additional options
 */
export const queueBatchAITagging = async (internshipIds, userId = "system", options = {}) => {
  try {
    const job = await aiQueue.add(
      "batch-tag-internships",
      { internshipIds, userId },
      {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        ...options,
      }
    );

    logger.info("Batch AI tagging job queued", {
      jobId: job.id,
      count: internshipIds.length,
    });

    return job;
  } catch (error) {
    logger.error("Failed to queue batch AI tagging job", {
      count: internshipIds.length,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Manually trigger deadline reminders check
 */
export const triggerDeadlineReminders = async () => {
  try {
    const job = await notificationQueue.add(
      "check-deadline-reminders",
      {},
      {
        priority: 1, // High priority
      }
    );

    logger.info("Manual deadline reminders check triggered", {
      jobId: job.id,
    });

    return job;
  } catch (error) {
    logger.error("Failed to trigger deadline reminders", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Manually trigger expired internships closure
 */
export const triggerExpiredInternshipsClosure = async () => {
  try {
    const job = await notificationQueue.add(
      "close-expired-internships",
      {},
      {
        priority: 1, // High priority
      }
    );

    logger.info("Manual expired internships closure triggered", {
      jobId: job.id,
    });

    return job;
  } catch (error) {
    logger.error("Failed to trigger expired internships closure", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Manually trigger analytics snapshot generation
 * @param {string} period - Period type (daily, weekly, monthly)
 */
export const triggerAnalyticsSnapshot = async (period = "daily") => {
  try {
    const job = await notificationQueue.add(
      "generate-analytics-snapshots",
      { period },
      {
        priority: 2, // Medium priority
      }
    );

    logger.info("Manual analytics snapshot generation triggered", {
      jobId: job.id,
      period,
    });

    return job;
  } catch (error) {
    logger.error("Failed to trigger analytics snapshot", {
      period,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Generate snapshot for a specific entity
 * @param {string} entityType - Entity type (company, mentor, department, admin)
 * @param {string} entityId - Entity ID
 * @param {string} period - Period type
 */
export const queueEntitySnapshot = async (entityType, entityId, period = "daily") => {
  try {
    const job = await notificationQueue.add(
      "generate-entity-snapshot",
      { entityType, entityId, period },
      {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      }
    );

    logger.info("Entity snapshot job queued", {
      jobId: job.id,
      entityType,
      entityId,
      period,
    });

    return job;
  } catch (error) {
    logger.error("Failed to queue entity snapshot", {
      entityType,
      entityId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Remove all scheduled jobs (for cleanup/testing)
 */
export const removeAllScheduledJobs = async () => {
  try {
    const jobIds = [
      "deadline-reminders-recurring",
      "expired-internships-recurring",
      "analytics-snapshots-daily",
      "analytics-snapshots-weekly",
      "analytics-snapshots-monthly",
    ];

    for (const jobId of jobIds) {
      try {
        await notificationQueue.removeRepeatableByKey(jobId);
        logger.info("Removed scheduled job", { jobId });
      } catch (error) {
        // Job might not exist, ignore error
        logger.debug("Could not remove scheduled job", {
          jobId,
          error: error.message,
        });
      }
    }

    logger.info("All scheduled jobs removed");
  } catch (error) {
    logger.error("Failed to remove scheduled jobs", {
      error: error.message,
    });
    throw error;
  }
};

export default {
  initializeInternshipWorkflowSchedules,
  queueAITagging,
  queueBatchAITagging,
  triggerDeadlineReminders,
  triggerExpiredInternshipsClosure,
  triggerAnalyticsSnapshot,
  queueEntitySnapshot,
  removeAllScheduledJobs,
};
