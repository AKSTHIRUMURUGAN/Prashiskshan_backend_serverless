/**
 * Script to verify database indexes for Admin Internship Management
 * Task 23.1: Add database indexes
 */

import mongoose from "mongoose";
import Internship from "../src/models/Internship.js";
import config from "../src/config/index.js";
import { logger } from "../src/utils/logger.js";

async function verifyIndexes() {
  try {
    logger.info("Verifying database indexes...");

    // Connect to database
    await mongoose.connect(config.mongo.uri);
    logger.info("Connected to MongoDB");

    // Get all indexes
    const indexes = await Internship.collection.getIndexes();
    
    logger.info("\n=== Current Indexes ===");
    Object.entries(indexes).forEach(([name, index]) => {
      logger.info(`\nIndex: ${name}`);
      logger.info(`Keys: ${JSON.stringify(index.key)}`);
      if (index.weights) {
        logger.info(`Weights: ${JSON.stringify(index.weights)}`);
      }
    });

    // Check for required indexes
    const requiredIndexes = [
      { name: "status_1_createdAt_-1", description: "Compound index on (status, createdAt)" },
      { name: "title_text_description_text", description: "Text index on (title, description)" },
      { name: "companyId_1", description: "Index on companyId" },
      { name: "department_1", description: "Index on department" },
    ];

    logger.info("\n=== Required Indexes Check ===");
    let allPresent = true;
    for (const required of requiredIndexes) {
      const exists = indexes[required.name] !== undefined;
      const status = exists ? "✓" : "✗";
      logger.info(`${status} ${required.description} (${required.name})`);
      if (!exists) {
        allPresent = false;
      }
    }

    if (allPresent) {
      logger.info("\n✓ All required indexes are present!");
    } else {
      logger.warn("\n✗ Some required indexes are missing. Run the migration script.");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error("Verification failed:", error);
    process.exit(1);
  }
}

// Run verification
verifyIndexes();
