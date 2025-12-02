import { addToQueue } from "../queues/index.js";
import { logger } from "../utils/logger.js";

/**
 * Schedule periodic metrics summary logging
 * Runs every 15 minutes
 */
export const scheduleMetricsSummary = async () => {
  try {
    const job = await addToQueue(
      "metrics",
      "log_metrics_summary",
      { type: "log_summary" },
      {
        repeat: {
          pattern: "*/15 * * * *", // Every 15 minutes
        },
        jobId: "metrics-summary-recurring",
      }
    );

    logger.info("Metrics summary logging scheduled", {
      jobId: job.id,
      pattern: "Every 15 minutes",
    });

    return job;
  } catch (error) {
    logger.error("Failed to schedule metrics summary", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Schedule periodic health checks
 * Runs every 5 minutes
 */
export const scheduleHealthCheck = async () => {
  try {
    const job = await addToQueue(
      "metrics",
      "health_check",
      { type: "health_check" },
      {
        repeat: {
          pattern: "*/5 * * * *", // Every 5 minutes
        },
        jobId: "health-check-recurring",
      }
    );

    logger.info("Health check scheduled", {
      jobId: job.id,
      pattern: "Every 5 minutes",
    });

    return job;
  } catch (error) {
    logger.error("Failed to schedule health check", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Initialize all metric schedules
 */
export const initializeMetricsSchedules = async () => {
  try {
    await scheduleMetricsSummary();
    await scheduleHealthCheck();

    logger.info("All metrics schedules initialized");
  } catch (error) {
    logger.error("Failed to initialize metrics schedules", {
      error: error.message,
    });
    throw error;
  }
};

export default {
  scheduleMetricsSummary,
  scheduleHealthCheck,
  initializeMetricsSchedules,
};
