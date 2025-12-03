/**
 * Test script for internship workflow workers
 * Tests the background workers and scheduled jobs
 */

import { connectDB } from "../src/config/database.js";
import { logger } from "../src/utils/logger.js";
import {
  queueAITagging,
  queueBatchAITagging,
  triggerDeadlineReminders,
  triggerExpiredInternshipsClosure,
  triggerAnalyticsSnapshot,
  queueEntitySnapshot,
} from "../src/services/internshipWorkflowScheduler.js";
import Internship from "../src/models/Internship.js";

/**
 * Test AI tagging worker
 */
async function testAITaggingWorker() {
  console.log("\n=== Testing AI Tagging Worker ===");
  
  try {
    // Find an internship without AI tags
    const internship = await Internship.findOne({
      $or: [
        { aiTags: { $exists: false } },
        { "aiTags.generatedAt": { $exists: false } },
      ],
    }).lean();

    if (!internship) {
      console.log("No internships found without AI tags");
      return;
    }

    console.log(`Queueing AI tagging for internship: ${internship.internshipId}`);
    const job = await queueAITagging(internship.internshipId, "test-script");
    console.log(`✓ AI tagging job queued successfully (Job ID: ${job.id})`);
  } catch (error) {
    console.error("✗ AI tagging test failed:", error.message);
  }
}

/**
 * Test batch AI tagging
 */
async function testBatchAITagging() {
  console.log("\n=== Testing Batch AI Tagging ===");
  
  try {
    // Find internships without AI tags
    const internships = await Internship.find({
      $or: [
        { aiTags: { $exists: false } },
        { "aiTags.generatedAt": { $exists: false } },
      ],
    })
      .limit(5)
      .lean();

    if (internships.length === 0) {
      console.log("No internships found for batch tagging");
      return;
    }

    const internshipIds = internships.map(i => i.internshipId);
    console.log(`Queueing batch AI tagging for ${internshipIds.length} internships`);
    
    const job = await queueBatchAITagging(internshipIds, "test-script");
    console.log(`✓ Batch AI tagging job queued successfully (Job ID: ${job.id})`);
  } catch (error) {
    console.error("✗ Batch AI tagging test failed:", error.message);
  }
}

/**
 * Test deadline reminder worker
 */
async function testDeadlineReminders() {
  console.log("\n=== Testing Deadline Reminder Worker ===");
  
  try {
    console.log("Triggering deadline reminders check...");
    const job = await triggerDeadlineReminders();
    console.log(`✓ Deadline reminders job triggered successfully (Job ID: ${job.id})`);
  } catch (error) {
    console.error("✗ Deadline reminders test failed:", error.message);
  }
}

/**
 * Test expired internship worker
 */
async function testExpiredInternships() {
  console.log("\n=== Testing Expired Internship Worker ===");
  
  try {
    // Check for expired internships
    const expiredCount = await Internship.countDocuments({
      status: "open_for_applications",
      applicationDeadline: { $lt: new Date() },
    });

    console.log(`Found ${expiredCount} expired internship(s)`);
    console.log("Triggering expired internships closure...");
    
    const job = await triggerExpiredInternshipsClosure();
    console.log(`✓ Expired internships job triggered successfully (Job ID: ${job.id})`);
  } catch (error) {
    console.error("✗ Expired internships test failed:", error.message);
  }
}

/**
 * Test analytics snapshot worker
 */
async function testAnalyticsSnapshot() {
  console.log("\n=== Testing Analytics Snapshot Worker ===");
  
  try {
    console.log("Triggering daily analytics snapshot...");
    const job = await triggerAnalyticsSnapshot("daily");
    console.log(`✓ Analytics snapshot job triggered successfully (Job ID: ${job.id})`);
  } catch (error) {
    console.error("✗ Analytics snapshot test failed:", error.message);
  }
}

/**
 * Test entity-specific snapshot
 */
async function testEntitySnapshot() {
  console.log("\n=== Testing Entity Snapshot ===");
  
  try {
    console.log("Queueing admin analytics snapshot...");
    const job = await queueEntitySnapshot("admin", null, "daily");
    console.log(`✓ Entity snapshot job queued successfully (Job ID: ${job.id})`);
  } catch (error) {
    console.error("✗ Entity snapshot test failed:", error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("✓ Database connected");

    // Run all tests
    await testAITaggingWorker();
    await testBatchAITagging();
    await testDeadlineReminders();
    await testExpiredInternships();
    await testAnalyticsSnapshot();
    await testEntitySnapshot();

    console.log("\n=== All Tests Completed ===");
    console.log("Check the worker logs to see job processing results");
    console.log("Note: Workers must be running for jobs to be processed");
    
    process.exit(0);
  } catch (error) {
    console.error("Test runner failed:", error);
    process.exit(1);
  }
}

// Run tests
runTests();
