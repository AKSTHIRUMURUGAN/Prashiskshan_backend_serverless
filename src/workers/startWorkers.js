/**
 * Worker Process Starter
 * Starts all BullMQ workers for background job processing
 */
import { logger } from "../utils/logger.js";
import { connectDB } from "../config/database.js";

// Import workers
import notificationWorker from "./notificationWorker.js";
import creditNotificationWorker from "./creditNotificationWorker.js";
import creditReminderWorker from "./creditReminderWorker.js";
import { createMetricsWorker } from "./metricsWorker.js";
import { initializeMetricsSchedules } from "../services/metricsScheduler.js";

const metricsWorker = createMetricsWorker();

const workers = [
  { name: "Notification Worker", worker: notificationWorker },
  { name: "Credit Notification Worker", worker: creditNotificationWorker },
  { name: "Credit Reminder Worker", worker: creditReminderWorker },
  { name: "Metrics Worker", worker: metricsWorker },
];

/**
 * Start all workers
 */
const startWorkers = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info("Database connected for workers");

    // Log worker status
    workers.forEach(({ name, worker }) => {
      logger.info(`${name} started`, {
        concurrency: worker.opts.concurrency,
        lockDuration: worker.opts.lockDuration,
      });
    });

    // Initialize metrics schedules
    await initializeMetricsSchedules();
    logger.info("Metrics schedules initialized");

    logger.info("All workers started successfully");
  } catch (error) {
    logger.error("Failed to start workers", { error: error.message });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const shutdown = async () => {
  logger.info("Shutting down workers...");
  try {
    await Promise.all(
      workers.map(async ({ name, worker }) => {
        await worker.close();
        logger.info(`${name} shut down`);
      })
    );
    logger.info("All workers shut down successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error during worker shutdown", { error: error.message });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection in worker process", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception in worker process", { error: error.message });
  process.exit(1);
});

// Start workers
startWorkers();
