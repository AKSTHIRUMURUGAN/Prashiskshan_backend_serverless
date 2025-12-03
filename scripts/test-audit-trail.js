import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "../src/models/Internship.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/internship-platform";

async function testAuditTrail() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    console.log("=== Testing Audit Trail Functionality ===\n");

    // Test 1: Create internship with audit trail
    console.log("Test 1: Creating internship with initial audit trail");
    const testInternship = new Internship({
      internshipId: `test-audit-${Date.now()}`,
      companyId: new mongoose.Types.ObjectId(),
      title: "Test Internship with Audit",
      description: "Test description",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "Node.js"],
      duration: "3 months",
      workMode: "remote",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 5,
      postedBy: "test-company-id",
      auditTrail: [{
        timestamp: new Date(),
        actor: "test-company-id",
        actorRole: "company",
        action: "created",
        fromStatus: null,
        toStatus: "pending_admin_verification",
        reason: "Initial internship creation"
      }]
    });

    await testInternship.save();
    console.log(`✓ Created internship with ${testInternship.auditTrail.length} audit trail entry`);
    console.log(`✓ Audit trail entry:`, {
      action: testInternship.auditTrail[0].action,
      fromStatus: testInternship.auditTrail[0].fromStatus,
      toStatus: testInternship.auditTrail[0].toStatus
    });

    // Test 2: Add status change to audit trail
    console.log("\nTest 2: Adding status change to audit trail");
    testInternship.status = "admin_approved";
    testInternship.auditTrail.push({
      timestamp: new Date(),
      actor: "test-admin-id",
      actorRole: "admin",
      action: "approved",
      fromStatus: "pending_admin_verification",
      toStatus: "admin_approved",
      reason: "Internship meets all requirements"
    });

    await testInternship.save();
    console.log(`✓ Updated status to: ${testInternship.status}`);
    console.log(`✓ Audit trail now has ${testInternship.auditTrail.length} entries`);
    console.log(`✓ Latest entry:`, {
      action: testInternship.auditTrail[1].action,
      fromStatus: testInternship.auditTrail[1].fromStatus,
      toStatus: testInternship.auditTrail[1].toStatus
    });

    // Test 3: Add mentor approval to audit trail
    console.log("\nTest 3: Adding mentor approval to audit trail");
    testInternship.status = "open_for_applications";
    testInternship.mentorApproval = {
      status: "approved",
      mentorId: "test-mentor-id",
      approvedAt: new Date(),
      comments: "Suitable for our students",
      department: "Computer Science"
    };
    testInternship.auditTrail.push({
      timestamp: new Date(),
      actor: "test-mentor-id",
      actorRole: "mentor",
      action: "mentor_approved",
      fromStatus: "admin_approved",
      toStatus: "open_for_applications",
      reason: "Approved for Computer Science department"
    });

    await testInternship.save();
    console.log(`✓ Updated status to: ${testInternship.status}`);
    console.log(`✓ Mentor approval status: ${testInternship.mentorApproval.status}`);
    console.log(`✓ Audit trail now has ${testInternship.auditTrail.length} entries`);

    // Test 4: Verify audit trail query
    console.log("\nTest 4: Querying audit trail");
    const retrieved = await Internship.findOne({ internshipId: testInternship.internshipId });
    console.log(`✓ Retrieved internship with ${retrieved.auditTrail.length} audit entries`);
    console.log(`✓ Audit trail history:`);
    retrieved.auditTrail.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.action}: ${entry.fromStatus || "null"} → ${entry.toStatus}`);
    });

    // Cleanup
    console.log("\nCleaning up test data...");
    await Internship.deleteMany({
      internshipId: { $regex: /^test-audit-/ }
    });
    console.log("✓ Test data cleaned up\n");

    console.log("✅ All audit trail tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run test
testAuditTrail()
  .then(() => {
    console.log("Test script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test script failed:", error);
    process.exit(1);
  });
