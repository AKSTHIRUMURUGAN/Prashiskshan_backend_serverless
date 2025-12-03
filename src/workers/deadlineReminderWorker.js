import { Worker, QueueEvents } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { notificationService } from "../services/notificationService.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Student from "../models/Student.js";
import { logger } from "../utils/logger.js";

const NOTIFICATION_QUEUE = "notifications";

/**
 * Check and send deadline reminders for internships
 * Sends reminders at 7, 3, and 1 days before deadline
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processDeadlineReminders = async (job) => {
  logger.info("Processing deadline reminder job", {
    jobId: job.id,
  });

  try {
    const now = new Date();
    const reminderThresholds = [
      { days: 7, label: "7-day" },
      { days: 3, label: "3-day" },
      { days: 1, label: "1-day" },
    ];

    const results = {
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Process each reminder threshold
    for (const threshold of reminderThresholds) {
      const thresholdDate = new Date(now);
      thresholdDate.setDate(thresholdDate.getDate() + threshold.days);
      
      // Set time range for the threshold day (start and end of day)
      const startOfDay = new Date(thresholdDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(thresholdDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find internships with deadlines in this threshold range
      const internships = await Internship.find({
        status: "open_for_applications",
        applicationDeadline: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
        .populate("companyId", "companyName email")
        .lean();

      logger.info(`Found internships for ${threshold.label} reminder`, {
        count: internships.length,
        threshold: threshold.days,
      });

      results.total += internships.length;

      // Send reminders for each internship
      for (const internship of internships) {
        try {
          // Check if reminder already sent for this threshold
          const reminderKey = `reminder_${threshold.days}d`;
          const alreadySent = internship.metadata?.remindersSent?.[reminderKey];

          if (alreadySent) {
            logger.info("Reminder already sent, skipping", {
              internshipId: internship.internshipId,
              threshold: threshold.days,
            });
            results.skipped += 1;
            continue;
          }

          // Get all students who have applied
          const applications = await Application.find({
            internshipId: internship._id,
            status: { $in: ["pending_company_review", "shortlisted"] },
          })
            .populate("studentId", "email profile")
            .lean();

          // Send reminder to company
          await notificationService.notifyUser({
            userId: internship.companyId._id.toString(),
            mongoId: internship.companyId._id,
            role: "company",
            email: internship.companyId.email,
            title: `Deadline Approaching: ${internship.title}`,
            message: `The application deadline for your internship "${internship.title}" is in ${threshold.days} day(s). You have ${applications.length} pending application(s) to review.`,
            priority: "high",
            actionUrl: `/company/internships/${internship.internshipId}/applicants`,
            metadata: {
              internshipId: internship.internshipId,
              deadline: internship.applicationDeadline,
              daysRemaining: threshold.days,
              pendingApplications: applications.length,
              type: "deadline_reminder_company",
            },
          });

          // Send reminder to students who haven't applied yet
          // Get all students in the department
          const allStudents = await Student.find({
            "profile.department": internship.department,
          })
            .select("studentId email profile")
            .lean();

          // Filter out students who have already applied
          const appliedStudentIds = new Set(
            applications.map(app => app.studentId._id.toString())
          );

          const studentsToNotify = allStudents.filter(
            student => !appliedStudentIds.has(student._id.toString())
          );

          // Send notifications to students (limit to avoid overwhelming)
          const notificationPromises = studentsToNotify.slice(0, 100).map(student =>
            notificationService.notifyUser({
              userId: student.studentId,
              mongoId: student._id,
              role: "student",
              email: student.email,
              title: `Deadline Reminder: ${internship.title}`,
              message: `The application deadline for "${internship.title}" at ${internship.companyId.companyName} is in ${threshold.days} day(s). Apply now before it's too late!`,
              priority: "medium",
              actionUrl: `/student/internships/${internship.internshipId}`,
              metadata: {
                internshipId: internship.internshipId,
                deadline: internship.applicationDeadline,
                daysRemaining: threshold.days,
                type: "deadline_reminder_student",
              },
            }).catch(error => {
              logger.error("Failed to send student reminder", {
                studentId: student.studentId,
                error: error.message,
              });
            })
          );

          await Promise.allSettled(notificationPromises);

          // Mark reminder as sent
          await Internship.findOneAndUpdate(
            { internshipId: internship.internshipId },
            {
              $set: {
                [`metadata.remindersSent.${reminderKey}`]: new Date(),
              },
            }
          );

          results.sent += 1;

          logger.info("Deadline reminders sent successfully", {
            internshipId: internship.internshipId,
            threshold: threshold.days,
            studentsNotified: Math.min(studentsToNotify.length, 100),
          });
        } catch (error) {
          results.failed += 1;
          results.errors.push({
            internshipId: internship.internshipId,
            threshold: threshold.days,
            error: error.message,
          });

          logger.error("Failed to send deadline reminder", {
            internshipId: internship.internshipId,
            threshold: threshold.days,
            error: error.message,
          });
        }
      }
    }

    logger.info("Deadline reminder job completed", {
      jobId: job.id,
      results,
    });

    return results;
  } catch (error) {
    logger.error("Deadline reminder job failed", {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
};

/**
 * Job handlers for deadline reminder worker
 */
const jobHandlers = {
  "check-deadline-reminders": processDeadlineReminders,
};

/**
 * Main processor for deadline reminder jobs
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} - Job result
 */
const processor = async (job) => {
  const handler = jobHandlers[job.name];
  
  if (!handler) {
    throw new Error(`Unsupported deadline reminder job: ${job.name}`);
  }

  try {
    const result = await handler(job);
    
    logger.info("Deadline reminder job processed successfully", {
      job: job.name,
      id: job.id,
    });
    
    return result;
  } catch (error) {
    logger.error("Deadline reminder job processing failed", {
      job: job.name,
      id: job.id,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Deadline reminder worker
 * Processes scheduled jobs to check and send deadline reminders
 */
export const deadlineReminderWorker = new Worker(NOTIFICATION_QUEUE, processor, {
  connection: bullConnection,
  concurrency: 1, // Process one reminder job at a time to avoid duplicates
  lockDuration: 300_000, // 5 minutes for reminder processing
});

/**
 * Queue events for deadline reminder worker
 */
export const deadlineReminderQueueEvents = new QueueEvents(NOTIFICATION_QUEUE, {
  connection: bullConnection,
});

// Event handlers for monitoring and logging
deadlineReminderQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error("Deadline reminder job failed", {
    jobId,
    reason: failedReason,
  });
});

deadlineReminderQueueEvents.on("completed", ({ jobId, returnvalue }) => {
  logger.info("Deadline reminder job completed", {
    jobId,
    result: returnvalue,
  });
});

deadlineReminderQueueEvents
  .waitUntilReady()
  .then(() => logger.info("Deadline reminder queue events ready"))
  .catch((error) =>
    logger.error("Deadline reminder queue events error", {
      error: error.message,
    })
  );

// Graceful shutdown handler
const shutdown = async () => {
  logger.info("Shutting down deadline reminder worker");
  try {
    await deadlineReminderWorker.close();
    await deadlineReminderQueueEvents.close();
    logger.info("Deadline reminder worker shut down successfully");
  } catch (error) {
    logger.error("Error shutting down deadline reminder worker", {
      error: error.message,
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default deadlineReminderWorker;
