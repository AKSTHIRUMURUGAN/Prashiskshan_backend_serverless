import { Worker } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { logger } from "../utils/logger.js";
import creditMetricsService from "../services/creditMetricsService.js";

const METRICS_QUEUE = "metrics";

/**
 * Process metrics jobs
 */
const processMetricsJob = async (job) => {
  const { type } = job.data;

  try {
    switch (type) {
      case "log_summary":
        await logMetricsSummary();
        break;
      case "health_check":
        await performHealthCheck();
        break;
      default:
        logger.warn("Unknown metrics job type", { type });
    }

    return { success: true, type };
  } catch (error) {
    logger.error("Error processing metrics job", {
      type,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Log metrics summary
 */
const logMetricsSummary = async () => {
  try {
    const summary = creditMetricsService.getMetricsSummary();
    
    logger.info("Periodic metrics summary logged", {
      job: "metrics_summary",
      summary,
    });

    return summary;
  } catch (error) {
    logger.error("Error logging metrics summary", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Perform system health check
 */
const performHealthCheck = async () => {
  try {
    const health = await creditMetricsService.checkSystemHealth();
    
    if (!health.healthy) {
      logger.error("System health check failed", {
        job: "health_check",
        alerts: health.alerts,
      });
    } else {
      logger.info("System health check passed", {
        job: "health_check",
      });
    }

    return health;
  } catch (error) {
    logger.error("Error performing health check", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Create and start metrics worker
 */
export const createMetricsWorker = () => {
  const worker = new Worker(METRICS_QUEUE, processMetricsJob, {
    connection: bullConnection,
    concurrency: 1,
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute max
    },
  });

  worker.on("completed", (job) => {
    logger.info("Metrics job completed", {
      jobId: job.id,
      jobName: job.name,
      type: job.data.type,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("Metrics job failed", {
      jobId: job?.id,
      jobName: job?.name,
      type: job?.data?.type,
      error: error.message,
    });
  });

  worker.on("error", (error) => {
    logger.error("Metrics worker error", {
      error: error.message,
    });
  });

  logger.info("Metrics worker started");

  return worker;
};

export default createMetricsWorker;
