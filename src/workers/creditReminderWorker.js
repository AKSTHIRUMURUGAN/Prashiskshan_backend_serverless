import { Worker, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { creditReminderService } from "../services/creditReminderService.js";
import { logger } from "../utils/logger.js";

const NOTIFICATION_QUEUE = "notifications";

/**
 * Process credit reminder jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processCreditReminders = async (job) => {
  try {
    const { maxReminders = 3 } = job.data || {};

    logger.info("Processing credit reminder job", {
      jobId: job.id,
      maxReminders,
    });

    // Send reminders for all overdue requests
    const result = await creditReminderService.sendOverdueReminders({
      maxReminders,
      dryRun: false,
    });

    logger.info("Credit reminder job completed", {
      jobId: job.id,
      totalOverdue: result.totalOverdue,
      sent: result.sent,
      failed: result.failed,
    });

    return result;
  } catch (error) {
    logger.error("Credit reminder job failed", {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Job handlers for credit reminder worker
 */
const jobHandlers = {
  "send-credit-reminders": processCreditReminders,
};

/**
 * Main processor for credit reminder jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processor = async (job) => {
  const handler = jobHandlers[job.name];
  if (!handler) {
    throw new Error(`Unsupported credit reminder job: ${job.name}`);
  }

  const result = await handler(job);
  logger.info("Credit reminder job processed", {
    job: job.name,
    id: job.id,
  });

  return result;
};

/**
 * Credit reminder worker
 * Processes jobs from the notification queue for credit reminders
 */
export const creditReminderWorker = new Worker(NOTIFICATION_QUEUE, processor, {
  connection: bullConnection,
  concurrency: 5,
  lockDuration: 120_000, // 2 minutes for reminder processing
});

/**
 * Queue events for credit reminder worker
 */
export const creditReminderQueueEvents = new QueueEvents(NOTIFICATION_QUEUE, {
  connection: bullConnection,
});

creditReminderQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Credit reminder job failed", { jobId, reason: failedReason });
});

creditReminderQueueEvents.on("completed", ({ jobId }) => {
  logger.info("Credit reminder job completed", { jobId });
});

creditReminderQueueEvents
  .waitUntilReady()
  .then(() => logger.info("Credit reminder queue events ready"))
  .catch((error) =>
    logger.error("Credit reminder queue events error", {
      error: error.message,
    })
  );

export default creditReminderWorker;
