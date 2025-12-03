import { Worker, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { internshipAnalyticsService } from "../services/internshipAnalyticsService.js";
import Company from "../models/Company.js";
import Mentor from "../models/Mentor.js";
import Internship from "../models/Internship.js";
import { logger } from "../utils/logger.js";

const NOTIFICATION_QUEUE = "notifications";

/**
 * Generate analytics snapshots for all entities
 * Requirements: 9.1, 10.1
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processAnalyticsSnapshots = async (job) => {
  const { period = "daily" } = job.data || {};

  logger.info("Processing analytics snapshot job", {
    jobId: job.id,
    period,
  });

  try {
    const results = {
      period,
      companies: { total: 0, success: 0, failed: 0 },
      mentors: { total: 0, success: 0, failed: 0 },
      departments: { total: 0, success: 0, failed: 0 },
      admin: { success: 0, failed: 0 },
      errors: [],
    };

    // Generate admin/system-wide snapshot
    try {
      await internshipAnalyticsService.cacheAnalyticsSnapshot("admin", null, period);
      results.admin.success += 1;
      logger.info("Admin analytics snapshot created", { period });
    } catch (error) {
      results.admin.failed += 1;
      results.errors.push({
        entityType: "admin",
        error: error.message,
      });
      logger.error("Failed to create admin analytics snapshot", {
        error: error.message,
      });
    }

    // Generate company snapshots
    const companies = await Company.find({ status: "verified" })
      .select("companyId")
      .lean();

    results.companies.total = companies.length;

    for (const company of companies) {
      try {
        await internshipAnalyticsService.cacheAnalyticsSnapshot(
          "company",
          company.companyId,
          period
        );
        results.companies.success += 1;
      } catch (error) {
        results.companies.failed += 1;
        results.errors.push({
          entityType: "company",
          entityId: company.companyId,
          error: error.message,
        });
        logger.error("Failed to create company analytics snapshot", {
          companyId: company.companyId,
          error: error.message,
        });
      }
    }

    logger.info("Company analytics snapshots completed", {
      total: results.companies.total,
      success: results.companies.success,
      failed: results.companies.failed,
    });

    // Generate mentor snapshots
    const mentors = await Mentor.find({ status: "active" })
      .select("mentorId")
      .lean();

    results.mentors.total = mentors.length;

    for (const mentor of mentors) {
      try {
        await internshipAnalyticsService.cacheAnalyticsSnapshot(
          "mentor",
          mentor.mentorId,
          period
        );
        results.mentors.success += 1;
      } catch (error) {
        results.mentors.failed += 1;
        results.errors.push({
          entityType: "mentor",
          entityId: mentor.mentorId,
          error: error.message,
        });
        logger.error("Failed to create mentor analytics snapshot", {
          mentorId: mentor.mentorId,
          error: error.message,
        });
      }
    }

    logger.info("Mentor analytics snapshots completed", {
      total: results.mentors.total,
      success: results.mentors.success,
      failed: results.mentors.failed,
    });

    // Generate department snapshots
    const departments = await Internship.distinct("department");
    results.departments.total = departments.length;

    for (const department of departments) {
      try {
        await internshipAnalyticsService.cacheAnalyticsSnapshot(
          "department",
          department,
          period
        );
        results.departments.success += 1;
      } catch (error) {
        results.departments.failed += 1;
        results.errors.push({
          entityType: "department",
          entityId: department,
          error: error.message,
        });
        logger.error("Failed to create department analytics snapshot", {
          department,
          error: error.message,
        });
      }
    }

    logger.info("Department analytics snapshots completed", {
      total: results.departments.total,
      success: results.departments.success,
      failed: results.departments.failed,
    });

    logger.info("Analytics snapshot job completed", {
      jobId: job.id,
      results,
    });

    return results;
  } catch (error) {
    logger.error("Analytics snapshot job failed", {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
};

/**
 * Generate snapshot for a specific entity
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processEntitySnapshot = async (job) => {
  const { entityType, entityId, period = "daily" } = job.data;

  logger.info("Processing entity analytics snapshot", {
    jobId: job.id,
    entityType,
    entityId,
    period,
  });

  try {
    const snapshot = await internshipAnalyticsService.cacheAnalyticsSnapshot(
      entityType,
      entityId,
      period
    );

    logger.info("Entity analytics snapshot created", {
      jobId: job.id,
      entityType,
      entityId,
      snapshotId: snapshot.snapshotId,
    });

    return {
      success: true,
      entityType,
      entityId,
      snapshotId: snapshot.snapshotId,
    };
  } catch (error) {
    logger.error("Entity analytics snapshot failed", {
      jobId: job.id,
      entityType,
      entityId,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Job handlers for analytics snapshot worker
 */
const jobHandlers = {
  "generate-analytics-snapshots": processAnalyticsSnapshots,
  "generate-entity-snapshot": processEntitySnapshot,
};

/**
 * Main processor for analytics snapshot jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processor = async (job) => {
  const handler = jobHandlers[job.name];
  
  if (!handler) {
    throw new Error(`Unsupported analytics snapshot job: ${job.name}`);
  }

  try {
    const result = await handler(job);
    
    logger.info("Analytics snapshot job processed successfully", {
      job: job.name,
      id: job.id,
    });
    
    return result;
  } catch (error) {
    logger.error("Analytics snapshot job processing failed", {
      job: job.name,
      id: job.id,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Analytics snapshot worker
 * Processes scheduled jobs to generate and cache analytics snapshots
 */
export const analyticsSnapshotWorker = new Worker(NOTIFICATION_QUEUE, processor, {
  connection: bullConnection,
  concurrency: 2, // Process 2 snapshot jobs concurrently
  lockDuration: 600_000, // 10 minutes for analytics processing
});

/**
 * Queue events for analytics snapshot worker
 */
export const analyticsSnapshotQueueEvents = new QueueEvents(NOTIFICATION_QUEUE, {
  connection: bullConnection,
});

// Event handlers for monitoring and logging
analyticsSnapshotQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Analytics snapshot job failed", {
    jobId,
    reason: failedReason,
  });
});

analyticsSnapshotQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("Analytics snapshot job completed", {
    jobId,
    result: returnvalue,
  });
});

analyticsSnapshotQueueEvents
  .waitUntilReady()
  .then(() => logger.info("Analytics snapshot queue events ready"))
  .catch((error) =>
    logger.error("Analytics snapshot queue events error", {
      error: error.message,
    })
  );

// Graceful shutdown handler
const shutdown = async () => {
  logger.info("Shutting down analytics snapshot worker");
  try {
    await analyticsSnapshotWorker.close();
    await analyticsSnapshotQueueEvents.close();
    logger.info("Analytics snapshot worker shut down successfully");
  } catch (error) {
    logger.error("Error shutting down analytics snapshot worker", {
      error: error.message,
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default analyticsSnapshotWorker;
