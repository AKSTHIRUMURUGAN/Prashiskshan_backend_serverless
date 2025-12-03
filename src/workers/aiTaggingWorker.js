import { Worker, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { aiTaggingService } from "../services/aiTaggingService.js";
import Internship from "../models/Internship.js";
import { logger } from "../utils/logger.js";

const AI_TAGGING_QUEUE = "ai-processing";

/**
 * Process AI tagging job for an internship
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processAITagging = async (job) => {
  const { internshipId, userId } = job.data;

  logger.info("Processing AI tagging job", {
    jobId: job.id,
    internshipId,
    attemptsMade: job.attemptsMade,
  });

  try {
    // Fetch internship data
    const internship = await Internship.findOne({ internshipId }).lean();

    if (!internship) {
      throw new Error(`Internship not found: ${internshipId}`);
    }

    // Check if already tagged
    if (internship.aiTags && internship.aiTags.generatedAt) {
      logger.info("Internship already has AI tags, skipping", {
        internshipId,
        generatedAt: internship.aiTags.generatedAt,
      });
      return {
        success: true,
        skipped: true,
        reason: "already_tagged",
      };
    }

    // Generate AI tags
    const tags = await aiTaggingService.generateTags(
      {
        internshipId: internship.internshipId,
        title: internship.title,
        description: internship.description,
        requiredSkills: internship.requiredSkills,
        department: internship.department,
        duration: internship.duration,
        responsibilities: internship.responsibilities,
      },
      {
        userId: userId || "system",
        trackUsageFlag: true,
      }
    );

    // Update internship with AI tags
    await Internship.findOneAndUpdate(
      { internshipId },
      { $set: { aiTags: tags } },
      { new: true }
    );

    logger.info("AI tagging completed successfully", {
      jobId: job.id,
      internshipId,
      tags: {
        difficulty: tags.difficulty,
        careerPath: tags.careerPath,
        skillCount: tags.primarySkills.length,
      },
    });

    return {
      success: true,
      internshipId,
      tags,
    };
  } catch (error) {
    logger.error("AI tagging job failed", {
      jobId: job.id,
      internshipId,
      attemptsMade: job.attemptsMade,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
};

/**
 * Process batch AI tagging for multiple internships
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processBatchAITagging = async (job) => {
  const { internshipIds, userId } = job.data;

  logger.info("Processing batch AI tagging job", {
    jobId: job.id,
    count: internshipIds.length,
  });

  const results = {
    total: internshipIds.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const internshipId of internshipIds) {
    try {
      const result = await processAITagging({
        id: `${job.id}-${internshipId}`,
        data: { internshipId, userId },
        attemptsMade: job.attemptsMade,
      });

      if (result.skipped) {
        results.skipped += 1;
      } else {
        results.success += 1;
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({
        internshipId,
        error: error.message,
      });

      logger.error("Batch AI tagging failed for internship", {
        internshipId,
        error: error.message,
      });
    }
  }

  logger.info("Batch AI tagging completed", {
    jobId: job.id,
    results,
  });

  return results;
};

/**
 * Job handlers for AI tagging worker
 */
const jobHandlers = {
  "tag-internship": processAITagging,
  "batch-tag-internships": processBatchAITagging,
};

/**
 * Main processor for AI tagging jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processor = async (job) => {
  const handler = jobHandlers[job.name];
  
  if (!handler) {
    throw new Error(`Unsupported AI tagging job: ${job.name}`);
  }

  try {
    const result = await handler(job);
    
    logger.info("AI tagging job processed successfully", {
      job: job.name,
      id: job.id,
      attemptsMade: job.attemptsMade,
    });
    
    return result;
  } catch (error) {
    logger.error("AI tagging job processing failed", {
      job: job.name,
      id: job.id,
      attemptsMade: job.attemptsMade,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * AI tagging worker
 * Processes AI tagging jobs with retry logic and exponential backoff
 */
export const aiTaggingWorker = new Worker(AI_TAGGING_QUEUE, processor, {
  connection: bullConnection,
  concurrency: 5, // Process 5 tagging jobs concurrently
  lockDuration: 120_000, // 2 minutes for AI processing
  settings: {
    // Exponential backoff strategy
    backoffStrategy: (attemptsMade) => {
      // Exponential backoff: 2^attemptsMade * 2000ms
      // Attempt 1: 4s, Attempt 2: 8s, Attempt 3: 16s
      return Math.pow(2, attemptsMade) * 2000;
    },
  },
});

/**
 * Queue events for AI tagging worker
 */
export const aiTaggingQueueEvents = new QueueEvents(AI_TAGGING_QUEUE, {
  connection: bullConnection,
});

// Event handlers for monitoring and logging
aiTaggingQueueEvents.on("failed", ({ jobId, failedReason, prev }) => {
  logger.error("AI tagging job failed", {
    jobId,
    reason: failedReason,
    previousState: prev,
  });
});

aiTaggingQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("AI tagging job completed", {
    jobId,
    result: returnvalue,
  });
});

aiTaggingQueueEvents.on("retries-exhausted", ({ jobId }) => {
  logger.error("AI tagging job retries exhausted", {
    jobId,
    message: "All retry attempts failed, manual intervention may be required",
  });
});

aiTaggingQueueEvents.on("stalled", ({ jobId }) => {
  logger.warn("AI tagging job stalled", {
    jobId,
    message: "Job may have timed out or worker crashed",
  });
});

aiTaggingQueueEvents
  .waitUntilReady()
  .then(() => logger.info("AI tagging queue events ready"))
  .catch((error) =>
    logger.error("AI tagging queue events error", {
      error: error.message,
    })
  );

// Graceful shutdown handler
const shutdown = async () => {
  logger.info("Shutting down AI tagging worker");
  try {
    await aiTaggingWorker.close();
    await aiTaggingQueueEvents.close();
    logger.info("AI tagging worker shut down successfully");
  } catch (error) {
    logger.error("Error shutting down AI tagging worker", {
      error: error.message,
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default aiTaggingWorker;
