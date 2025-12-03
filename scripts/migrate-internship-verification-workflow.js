import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "../src/models/Internship.js";
import Application from "../src/models/Application.js";
import AnalyticsSnapshot from "../src/models/AnalyticsSnapshot.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/internship-platform";

async function migrateInternshipVerificationWorkflow() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Step 1: Update existing internships with slotsRemaining if not set
    console.log("\n=== Step 1: Updating Internships with slotsRemaining ===");
    const internshipsWithoutSlotsRemaining = await Internship.find({
      slotsRemaining: { $exists: false }
    });
    
    console.log(`Found ${internshipsWithoutSlotsRemaining.length} internships without slotsRemaining`);
    
    for (const internship of internshipsWithoutSlotsRemaining) {
      internship.slotsRemaining = internship.slots;
      await internship.save();
      console.log(`Updated internship ${internship.internshipId} with slotsRemaining: ${internship.slotsRemaining}`);
    }

    // Step 2: Initialize empty arrays for new fields if they don't exist
    console.log("\n=== Step 2: Initializing new fields ===");
    const internshipsToUpdate = await Internship.find({
      $or: [
        { auditTrail: { $exists: false } },
        { "aiTags.primarySkills": { $exists: false } }
      ]
    });

    console.log(`Found ${internshipsToUpdate.length} internships to initialize`);

    for (const internship of internshipsToUpdate) {
      let updated = false;

      if (!internship.auditTrail) {
        internship.auditTrail = [];
        updated = true;
      }

      if (!internship.aiTags) {
        internship.aiTags = {
          primarySkills: [],
          industryFit: []
        };
        updated = true;
      }

      if (updated) {
        await internship.save();
        console.log(`Initialized fields for internship ${internship.internshipId}`);
      }
    }

    // Step 3: Verify indexes are created
    console.log("\n=== Step 3: Verifying Indexes ===");
    const internshipIndexes = await Internship.collection.getIndexes();
    console.log("Internship indexes:", Object.keys(internshipIndexes));

    const applicationIndexes = await Application.collection.getIndexes();
    console.log("Application indexes:", Object.keys(applicationIndexes));

    const analyticsIndexes = await AnalyticsSnapshot.collection.getIndexes();
    console.log("AnalyticsSnapshot indexes:", Object.keys(analyticsIndexes));

    // Step 4: Create initial audit trail entries for existing internships
    console.log("\n=== Step 4: Creating initial audit trail entries ===");
    const internshipsWithoutAudit = await Internship.find({
      $or: [
        { auditTrail: { $size: 0 } },
        { auditTrail: { $exists: false } }
      ]
    });

    console.log(`Found ${internshipsWithoutAudit.length} internships without audit trail`);

    for (const internship of internshipsWithoutAudit) {
      if (!internship.auditTrail || internship.auditTrail.length === 0) {
        internship.auditTrail = [{
          timestamp: internship.postedAt || internship.createdAt,
          actor: internship.postedBy,
          actorRole: "company",
          action: "created",
          fromStatus: null,
          toStatus: internship.status,
          reason: "Initial internship creation"
        }];
        await internship.save();
        console.log(`Created initial audit trail for internship ${internship.internshipId}`);
      }
    }

    // Step 5: Summary
    console.log("\n=== Migration Summary ===");
    const totalInternships = await Internship.countDocuments();
    const internshipsWithSlotsRemaining = await Internship.countDocuments({ slotsRemaining: { $exists: true } });
    const internshipsWithAuditTrail = await Internship.countDocuments({ auditTrail: { $exists: true, $ne: [] } });
    
    console.log(`Total internships: ${totalInternships}`);
    console.log(`Internships with slotsRemaining: ${internshipsWithSlotsRemaining}`);
    console.log(`Internships with audit trail: ${internshipsWithAuditTrail}`);

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run migration
migrateInternshipVerificationWorkflow()
  .then(() => {
    console.log("Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
