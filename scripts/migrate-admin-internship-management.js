/**
 * Migration script for Admin Internship Management feature
 * Task 1: Set up backend API endpoints and data models
 * 
 * This script:
 * 1. Adds new indexes for better query performance
 * 2. Initializes editHistory array for existing internships
 * 3. Adds metadata field to existing audit trail entries
 */

import mongoose from "mongoose";
import Internship from "../src/models/Internship.js";
import config from "../src/config/index.js";
import { logger } from "../src/utils/logger.js";

async function migrateAdminInternshipManagement() {
  try {
    logger.info("Starting Admin Internship Management migration...");

    // Connect to database
    await mongoose.connect(config.mongo.uri);
    logger.info("Connected to MongoDB");

    // 1. Create new indexes
    logger.info("Creating new indexes...");
    await Internship.collection.createIndex({ status: 1, createdAt: -1 });
    await Internship.collection.createIndex({ status: 1, postedAt: -1 });
    await Internship.collection.createIndex({ location: 1 });
    await Internship.collection.createIndex({ workMode: 1 });
    logger.info("Indexes created successfully");

    // 2. Initialize editHistory for existing internships with adminReview
    logger.info("Initializing editHistory for existing internships...");
    const result = await Internship.updateMany(
      { 
        adminReview: { $exists: true },
        "adminReview.editHistory": { $exists: false }
      },
      { 
        $set: { "adminReview.editHistory": [] }
      }
    );
    logger.info(`Updated ${result.modifiedCount} internships with editHistory`);

    // 3. Add metadata field to audit trail entries that don't have it
    logger.info("Adding metadata field to audit trail entries...");
    const internshipsWithAuditTrail = await Internship.find({
      auditTrail: { $exists: true, $ne: [] }
    });

    let updatedCount = 0;
    for (const internship of internshipsWithAuditTrail) {
      let modified = false;
      internship.auditTrail.forEach(entry => {
        if (!entry.metadata) {
          entry.metadata = {};
          modified = true;
        }
      });

      if (modified) {
        await internship.save();
        updatedCount++;
      }
    }
    logger.info(`Updated ${updatedCount} internships with metadata in audit trail`);

    // 4. Verify indexes
    logger.info("Verifying indexes...");
    const indexes = await Internship.collection.getIndexes();
    logger.info("Current indexes:", Object.keys(indexes));

    logger.info("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateAdminInternshipManagement();
