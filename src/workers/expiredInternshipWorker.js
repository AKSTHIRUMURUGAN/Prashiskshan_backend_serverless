import { Worker, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { internshipStateMachine } from "../services/internshipStateMachine.js";
import { notificationService } from "../services/notificationService.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import { logger } from "../utils/logger.js";

const NOTIFICATION_QUEUE = "notifications";

/**
 * Close expired internships and notify pending applicants
 * Requirements: 4.5, 12.4
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processExpiredInternships = async (job) => {
  logger.info("Processing expired internships job", {
    jobId: job.id,
  });

  try {
    const now = new Date();

    // Find internships that are open but past their deadline
    const expiredInternships = await Internship.find({
      status: "open_for_applications",
      applicationDeadline: { $lt: now },
    })
      .populate("companyId", "companyName email")
      .lean();

    logger.info("Found expired internships", {
      count: expiredInternships.length,
    });

    const results = {
      total: expiredInternships.length,
      closed: 0,
      failed: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      errors: [],
    };

    // Process each expired internship
    for (const internship of expiredInternships) {
      try {
        // Transition internship to closed state
        await internshipStateMachine.transitionTo(
          internship.internshipId,
          "closed",
          { id: "system", role: "system" },
          "Application deadline passed"
        );

        results.closed += 1;

        logger.info("Expired internship closed", {
          internshipId: internship.internshipId,
          deadline: internship.applicationDeadline,
        });

        // Get all pending applications
        const pendingApplications = await Application.find({
          internshipId: internship._id,
          status: { $in: ["pending_company_review", "shortlisted"] },
        })
          .populate("studentId", "email profile")
          .lean();

        logger.info("Found pending applications for expired internship", {
          internshipId: internship.internshipId,
          count: pendingApplications.length,
        });

        // Notify company about closure
        try {
          await notificationService.notifyUser({
            userId: internship.companyId._id.toString(),
            mongoId: internship.companyId._id,
            role: "company",
            email: internship.companyId.email,
            title: `Internship Closed: ${internship.title}`,
            message: `Your internship "${internship.title}" has been automatically closed as the application deadline has passed. You had ${pendingApplications.length} pending application(s).`,
            priority: "medium",
            actionUrl: `/company/internships/${internship.internshipId}`,
            metadata: {
              internshipId: internship.internshipId,
              deadline: internship.applicationDeadline,
              pendingApplications: pendingApplications.length,
              type: "internship_closed_deadline",
            },
          });

          results.notificationsSent += 1;
        } catch (notifyError) {
          results.notificationsFailed += 1;
          logger.error("Failed to notify company of internship closure", {
            internshipId: internship.internshipId,
            error: notifyError.message,
          });
        }

        // Notify all pending applicants
        const notificationPromises = pendingApplications.map(async (application) => {
          try {
            const student = application.studentId;
            
            await notificationService.notifyUser({
              userId: student._id.toString(),
              mongoId: student._id,
              role: "student",
              email: student.email,
              title: `Application Deadline Passed: ${internship.title}`,
              message: `The application deadline for "${internship.title}" at ${internship.companyId.companyName} has passed. Your application status was "${application.status}". The company may still review pending applications.`,
              priority: "medium",
              actionUrl: `/student/applications/${application.applicationId}`,
              metadata: {
                internshipId: internship.internshipId,
                applicationId: application.applicationId,
                applicationStatus: application.status,
                deadline: internship.applicationDeadline,
                type: "application_deadline_passed",
              },
            });

            results.notificationsSent += 1;
          } catch (notifyError) {
            results.notificationsFailed += 1;
            logger.error("Failed to notify student of deadline passing", {
              applicationId: application.applicationId,
              studentId: application.studentId._id.toString(),
              error: notifyError.message,
            });
          }
        });

        await Promise.allSettled(notificationPromises);

        logger.info("Notifications sent for expired internship", {
          internshipId: internship.internshipId,
          notificationsSent: pendingApplications.length + 1, // +1 for company
        });
      } catch (error) {
        results.failed += 1;
        results.errors.push({
          internshipId: internship.internshipId,
          error: error.message,
        });

        logger.error("Failed to process expired internship", {
          internshipId: internship.internshipId,
          error: error.message,
          stack: error.stack,
        });
      }
    }

    logger.info("Expired internships processing complete", {
      jobId: job.id,
      results,
    });

    return results;
  } catch (error) {
    logger.error("Expired internships job failed", {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
};

/**
 * Job handlers for expired internship worker
 */
const jobHandlers = {
  "close-expired-internships": processExpiredInternships,
};

/**
 * Main processor for expired internship jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processor = async (job) => {
  const handler = jobHandlers[job.name];
  
  if (!handler) {
    throw new Error(`Unsupported expired internship job: ${job.name}`);
  }

  try {
    const result = await handler(job);
    
    logger.info("Expired internship job processed successfully", {
      job: job.name,
      id: job.id,
    });
    
    return result;
  } catch (error) {
    logger.error("Expired internship job processing failed", {
      job: job.name,
      id: job.id,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Expired internship worker
 * Processes scheduled jobs to close expired internships and notify applicants
 */
export const expiredInternshipWorker = new Worker(NOTIFICATION_QUEUE, processor, {
  connection: bullConnection,
  concurrency: 1, // Process one job at a time to avoid race conditions
  lockDuration: 300_000, // 5 minutes for processing
});

/**
 * Queue events for expired internship worker
 */
export const expiredInternshipQueueEvents = new QueueEvents(NOTIFICATION_QUEUE, {
  connection: bullConnection,
});

// Event handlers for monitoring and logging
expiredInternshipQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Expired internship job failed", {
    jobId,
    reason: failedReason,
  });
});

expiredInternshipQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("Expired internship job completed", {
    jobId,
    result: returnvalue,
  });
});

expiredInternshipQueueEvents
  .waitUntilReady()
  .then(() => logger.info("Expired internship queue events ready"))
  .catch((error) =>
    logger.error("Expired internship queue events error", {
      error: error.message,
    })
  );

// Graceful shutdown handler
const shutdown = async () => {
  logger.info("Shutting down expired internship worker");
  try {
    await expiredInternshipWorker.close();
    await expiredInternshipQueueEvents.close();
    logger.info("Expired internship worker shut down successfully");
  } catch (error) {
    logger.error("Error shutting down expired internship worker", {
      error: error.message,
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default expiredInternshipWorker;
