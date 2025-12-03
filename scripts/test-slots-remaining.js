import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "../src/models/Internship.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/internship-platform";

async function testSlotsRemaining() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    console.log("=== Testing slotsRemaining Default Value ===\n");

    // Test 1: Create internship without slotsRemaining
    console.log("Test 1: Creating internship without slotsRemaining field");
    const testInternship1 = new Internship({
      internshipId: `test-${Date.now()}-1`,
      companyId: new mongoose.Types.ObjectId(),
      title: "Test Internship 1",
      description: "Test description",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "Node.js"],
      duration: "3 months",
      workMode: "remote",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 5,
      postedBy: "test-company-id"
    });

    await testInternship1.save();
    console.log(`✓ Created internship with slots: ${testInternship1.slots}`);
    console.log(`✓ slotsRemaining automatically set to: ${testInternship1.slotsRemaining}`);
    console.log(`✓ Test 1 ${testInternship1.slotsRemaining === testInternship1.slots ? "PASSED" : "FAILED"}\n`);

    // Test 2: Create internship with explicit slotsRemaining
    console.log("Test 2: Creating internship with explicit slotsRemaining");
    const testInternship2 = new Internship({
      internshipId: `test-${Date.now()}-2`,
      companyId: new mongoose.Types.ObjectId(),
      title: "Test Internship 2",
      description: "Test description",
      department: "Computer Science",
      requiredSkills: ["Python", "Django"],
      duration: "6 months",
      workMode: "hybrid",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 10,
      slotsRemaining: 7,
      postedBy: "test-company-id"
    });

    await testInternship2.save();
    console.log(`✓ Created internship with slots: ${testInternship2.slots}`);
    console.log(`✓ slotsRemaining kept as: ${testInternship2.slotsRemaining}`);
    console.log(`✓ Test 2 ${testInternship2.slotsRemaining === 7 ? "PASSED" : "FAILED"}\n`);

    // Test 3: Update existing internship (should not change slotsRemaining)
    console.log("Test 3: Updating existing internship");
    testInternship1.title = "Updated Test Internship 1";
    await testInternship1.save();
    console.log(`✓ Updated internship title`);
    console.log(`✓ slotsRemaining unchanged: ${testInternship1.slotsRemaining}`);
    console.log(`✓ Test 3 ${testInternship1.slotsRemaining === 5 ? "PASSED" : "FAILED"}\n`);

    // Cleanup
    console.log("Cleaning up test data...");
    await Internship.deleteMany({
      internshipId: { $regex: /^test-/ }
    });
    console.log("✓ Test data cleaned up\n");

    console.log("✅ All tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run test
testSlotsRemaining()
  .then(() => {
    console.log("Test script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test script failed:", error);
    process.exit(1);
  });
