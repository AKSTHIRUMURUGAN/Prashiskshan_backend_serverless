import { Queue, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { logger } from "../utils/logger.js";

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

const QUEUE_DEFINITIONS = {
  email: { name: "emails" },
  sms: { name: "sms" },
  logbook: { name: "logbook-processing" },
  report: { name: "report-generation" },
  notification: { name: "notifications" },
  completion: { name: "completion-processing" },
  ai: { name: "ai-processing" },
  creditNotification: { 
    name: "credit-notifications",
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  },
};

const queues = {};
const queueEvents = {};
let bullBoardRegistered = false;
let shuttingDown = false;
let queuesInitialized = false;

// Check if Redis is configured
const isRedisConfigured = () => {
  return !!(process.env.REDIS_HOST && process.env.REDIS_PORT);
};

const initQueue = (key, definition) => {
  try {
    const queue = new Queue(definition.name, {
      connection: bullConnection,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, ...definition.defaultJobOptions },
    });
    queues[key] = queue;

    // Only create QueueEvents if not in serverless or if explicitly enabled
    const shouldCreateEvents = process.env.ENABLE_QUEUE_EVENTS !== 'false';
    
    if (shouldCreateEvents) {
      const events = new QueueEvents(definition.name, { connection: bullConnection });
      events.on("failed", ({ jobId, failedReason }) => {
        logger.error(`Queue ${definition.name} job failed`, { jobId, failedReason });
      });
      events.on("completed", ({ jobId }) => {
        logger.info(`Queue ${definition.name} job completed`, { jobId });
      });

      events
        .waitUntilReady()
        .then(() => logger.info(`Queue events ready for ${definition.name}`))
        .catch((error) => {
          logger.error(`Queue events failed for ${definition.name}`, { error: error.message });
          // Don't crash if queue events fail
        });

      queueEvents[key] = events;
    }
    
    return queue;
  } catch (error) {
    logger.error(`Failed to initialize queue ${definition.name}`, { error: error.message });
    return null;
  }
};

// Lazy initialization - only create queues when first accessed
const ensureQueuesInitialized = () => {
  if (queuesInitialized) return;
  
  if (!isRedisConfigured()) {
    logger.warn("Redis not configured - queues will not be available");
    queuesInitialized = true;
    return;
  }
  
  try {
    logger.info("Initializing BullMQ queues...");
    Object.entries(QUEUE_DEFINITIONS).forEach(([key, definition]) => initQueue(key, definition));
    queuesInitialized = true;
    logger.info(`Initialized ${Object.keys(queues).length} queues`);
  } catch (error) {
    logger.error("Failed to initialize queues", { error: error.message });
    queuesInitialized = true; // Mark as initialized to prevent retry loops
  }
};

export const getQueue = (queueKey) => {
  ensureQueuesInitialized();
  return queues[queueKey] || null;
};

export const addToQueue = async (queueKey, jobName, data = {}, options = {}) => {
  if (!isRedisConfigured()) {
    logger.warn(`Queue ${queueKey} not available - Redis not configured`);
    return null;
  }
  
  const queue = getQueue(queueKey);
  if (!queue) {
    logger.warn(`Queue ${queueKey} is not registered or failed to initialize`);
    return null;
  }
  
  try {
    return await queue.add(jobName, data, options);
  } catch (error) {
    logger.error(`Failed to add job to queue ${queueKey}`, { error: error.message });
    return null;
  }
};

export const getQueueStatus = async (queueKey) => {
  ensureQueuesInitialized();
  const queue = getQueue(queueKey);
  if (!queue) throw new Error(`Queue ${queueKey} is not registered`);
  const [counts, metrics] = await Promise.all([queue.getJobCounts(), queue.getMetrics("completed")]);
  return {
    counts,
    metrics,
  };
};

export const registerBullBoard = async (app, { basePath = "/admin/queues", middleware } = {}) => {
  if (bullBoardRegistered) return null;
  
  if (!isRedisConfigured()) {
    logger.warn("Redis not configured - Bull Board will not be available");
    return null;
  }
  
  ensureQueuesInitialized();
  
  if (Object.keys(queues).length === 0) {
    logger.warn("No queues available - Bull Board will not be registered");
    return null;
  }
  
  try {
    const [{ createBullBoard }, { BullMQAdapter }] = await Promise.all([
      import("@bull-board/api"),
      import("@bull-board/api/bullMQAdapter"),
    ]);
    const { ExpressAdapter } = await import("@bull-board/express");
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath(basePath);

    createBullBoard({
      queues: Object.values(queues).map((queue) => new BullMQAdapter(queue, { readOnlyMode: false })),
      serverAdapter,
    });

    const router = middleware ? [middleware, serverAdapter.getRouter()] : [serverAdapter.getRouter()];
    app.use(basePath, ...router);
    bullBoardRegistered = true;
    logger.info(`Bull Board mounted at ${basePath}`);
    return serverAdapter;
  } catch (error) {
    logger.warn("Bull Board not initialized", { reason: error.message });
    return null;
  }
};

const closeQueue = async (queue) => {
  try {
    await queue.close();
  } catch (error) {
    logger.error("Failed to close queue", { error: error.message, queue: queue.name });
  }
};

const closeQueueEvents = async (events) => {
  try {
    await events.close();
  } catch (error) {
    logger.error("Failed to close queue events", { error: error.message });
  }
};

export const shutdownQueues = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down BullMQ queues");
  await Promise.all([
    ...Object.values(queues).map((queue) => closeQueue(queue)),
    ...Object.values(queueEvents).map((events) => closeQueueEvents(events)),
  ]);
  logger.info("BullMQ queues closed");
};

const gracefulShutdownHandler = (signal) => {
  logger.info(`Received ${signal}, closing queues...`);
  shutdownQueues()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
};

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.once(signal, gracefulShutdownHandler);
});

export const queueRegistry = Object.freeze({
  definitions: QUEUE_DEFINITIONS,
  queues,
});

// Export individual queues for easy access
export const emailQueue = queues.email;
export const smsQueue = queues.sms;
export const logbookQueue = queues.logbook;
export const reportQueue = queues.report;
export const notificationQueue = queues.notification;
export const completionQueue = queues.completion;
export const aiQueue = queues.ai;
export const creditNotificationQueue = queues.creditNotification;

// Additional queues for cron jobs (these need to be added to QUEUE_DEFINITIONS)
export const metricsQueue = queues.metrics || initQueue("metrics", { name: "metrics" });
export const creditReminderQueue = queues.creditReminder || initQueue("creditReminder", { name: "credit-reminders" });
export const deadlineReminderQueue = queues.deadlineReminder || initQueue("deadlineReminder", { name: "deadline-reminders" });
export const expiredInternshipQueue = queues.expiredInternship || initQueue("expiredInternship", { name: "expired-internships" });
export const analyticsSnapshotQueue = queues.analyticsSnapshot || initQueue("analyticsSnapshot", { name: "analytics-snapshots" });

export default queues;
