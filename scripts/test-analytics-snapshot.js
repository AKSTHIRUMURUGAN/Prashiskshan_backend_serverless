import mongoose from "mongoose";
import dotenv from "dotenv";
import AnalyticsSnapshot from "../src/models/AnalyticsSnapshot.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/internship-platform";

async function testAnalyticsSnapshot() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    console.log("=== Testing AnalyticsSnapshot Model ===\n");

    // Test 1: Create company snapshot
    console.log("Test 1: Creating company analytics snapshot");
    const companySnapshot = new AnalyticsSnapshot({
      snapshotId: `test-company-${Date.now()}`,
      entityType: "company",
      entityId: "test-company-123",
      period: "monthly",
      date: new Date(),
      metrics: {
        internshipsPosted: 10,
        applicationsReceived: 150,
        acceptanceRate: 0.25,
        completionRate: 0.85,
        averageRating: 4.2
      }
    });

    await companySnapshot.save();
    console.log(`✓ Created company snapshot with ID: ${companySnapshot.snapshotId}`);
    console.log(`✓ Metrics:`, companySnapshot.metrics);

    // Test 2: Create mentor snapshot
    console.log("\nTest 2: Creating mentor analytics snapshot");
    const mentorSnapshot = new AnalyticsSnapshot({
      snapshotId: `test-mentor-${Date.now()}`,
      entityType: "mentor",
      entityId: "test-mentor-456",
      period: "weekly",
      date: new Date(),
      metrics: {
        approvalsProcessed: 25,
        approvalRate: 0.88,
        averageResponseTime: 48,
        studentsSupervised: 30
      }
    });

    await mentorSnapshot.save();
    console.log(`✓ Created mentor snapshot with ID: ${mentorSnapshot.snapshotId}`);
    console.log(`✓ Metrics:`, mentorSnapshot.metrics);

    // Test 3: Create department snapshot
    console.log("\nTest 3: Creating department analytics snapshot");
    const departmentSnapshot = new AnalyticsSnapshot({
      snapshotId: `test-dept-${Date.now()}`,
      entityType: "department",
      entityId: "Computer Science",
      period: "monthly",
      date: new Date(),
      metrics: {
        applicationRate: 0.75,
        placementRate: 0.65,
        averageCredits: 12.5
      }
    });

    await departmentSnapshot.save();
    console.log(`✓ Created department snapshot with ID: ${departmentSnapshot.snapshotId}`);
    console.log(`✓ Metrics:`, departmentSnapshot.metrics);

    // Test 4: Create admin snapshot
    console.log("\nTest 4: Creating admin analytics snapshot");
    const adminSnapshot = new AnalyticsSnapshot({
      snapshotId: `test-admin-${Date.now()}`,
      entityType: "admin",
      entityId: null,
      period: "daily",
      date: new Date(),
      metrics: {
        verificationsProcessed: 15,
        verificationRate: 0.92,
        activeInternships: 45
      }
    });

    await adminSnapshot.save();
    console.log(`✓ Created admin snapshot with ID: ${adminSnapshot.snapshotId}`);
    console.log(`✓ Metrics:`, adminSnapshot.metrics);

    // Test 5: Query snapshots by entity type
    console.log("\nTest 5: Querying snapshots by entity type");
    const companySnapshots = await AnalyticsSnapshot.find({ entityType: "company" });
    console.log(`✓ Found ${companySnapshots.length} company snapshots`);

    // Test 6: Query snapshots by date range
    console.log("\nTest 6: Querying snapshots by date range");
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const recentSnapshots = await AnalyticsSnapshot.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    console.log(`✓ Found ${recentSnapshots.length} snapshots in the last 7 days`);

    // Test 7: Query snapshots by entity and period
    console.log("\nTest 7: Querying snapshots by entity and period");
    const monthlyCompanySnapshots = await AnalyticsSnapshot.find({
      entityType: "company",
      period: "monthly"
    }).sort({ date: -1 });
    console.log(`✓ Found ${monthlyCompanySnapshots.length} monthly company snapshots`);

    // Test 8: Verify indexes
    console.log("\nTest 8: Verifying indexes");
    const indexes = await AnalyticsSnapshot.collection.getIndexes();
    console.log(`✓ AnalyticsSnapshot has ${Object.keys(indexes).length} indexes:`);
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}`);
    });

    // Cleanup
    console.log("\nCleaning up test data...");
    await AnalyticsSnapshot.deleteMany({
      snapshotId: { $regex: /^test-/ }
    });
    console.log("✓ Test data cleaned up\n");

    console.log("✅ All AnalyticsSnapshot tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run test
testAnalyticsSnapshot()
  .then(() => {
    console.log("Test script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test script failed:", error);
    process.exit(1);
  });
