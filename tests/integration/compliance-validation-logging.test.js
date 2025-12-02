import { jest } from "@jest/globals";
import mongoose from "mongoose";
import CreditRequest from "../../src/models/CreditRequest.js";
import Admin from "../../src/models/Admin.js";
import Student from "../../src/models/Student.js";
import Mentor from "../../src/models/Mentor.js";
import Internship from "../../src/models/Internship.js";
import InternshipCompletion from "../../src/models/InternshipCompletion.js";
import creditReviewService from "../../src/services/creditReviewService.js";
import { connectDB } from "../../src/config/database.js";

describe("Compliance Validation Logging Integration Test", () => {
  let admin;
  let student;
  let mentor;
  let internship;
  let completion;
  let creditRequest;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up collections
    await CreditRequest.deleteMany({});
    await Admin.deleteMany({});
    await Student.deleteMany({});
    await Mentor.deleteMany({});
    await Internship.deleteMany({});
    await InternshipCompletion.deleteMany({});

    // Create test data
    admin = await Admin.create({
      adminId: "ADM-TEST-001",
      email: "admin@test.com",
      profile: {
        firstName: "Test",
        lastName: "Admin",
      },
    });

    student = await Student.create({
      studentId: "STU-TEST-001",
      email: "student@test.com",
      profile: {
        firstName: "Test",
        lastName: "Student",
      },
      credits: {
        earned: 0,
        approved: 0,
        pending: 0,
        history: [],
      },
    });

    mentor = await Mentor.create({
      mentorId: "MEN-TEST-001",
      email: "mentor@test.com",
      profile: {
        firstName: "Test",
        lastName: "Mentor",
      },
    });

    internship = await Internship.create({
      title: "Test Internship",
      companyId: new mongoose.Types.ObjectId(),
      duration: "8 weeks",
      description: "Test internship description",
      requirements: ["Test requirement"],
      skills: ["Test skill"],
      location: "Test Location",
      stipend: 10000,
      openings: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      postedBy: new mongoose.Types.ObjectId(),
      workMode: "remote",
    });

    completion = await InternshipCompletion.create({
      studentId: student._id,
      internshipId: internship._id,
      status: "completed",
      completedAt: new Date(),
      evaluation: {
        overallComments: "Good work",
      },
    });

    creditRequest = await CreditRequest.create({
      creditRequestId: `CR-${Date.now()}`,
      studentId: student._id,
      internshipCompletionId: completion._id,
      internshipId: internship._id,
      mentorId: mentor._id,
      requestedCredits: 2,
      calculatedCredits: 2,
      internshipDurationWeeks: 8,
      status: "pending_admin_review",
      mentorReview: {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: "approved",
        feedback: "Good quality work",
        qualityCriteria: {
          logbookComplete: true,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      },
    });
  });

  describe("Requirement 12.5: NEP compliance validation logging", () => {
    it("should log NEP compliance validation when admin approves request", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      const updatedRequest = await creditReviewService.submitAdminReview(
        creditRequest._id,
        admin._id,
        "approved",
        "All requirements met",
        complianceChecks
      );

      // Verify submission history contains compliance validation log
      expect(updatedRequest.submissionHistory).toBeDefined();
      expect(updatedRequest.submissionHistory.length).toBeGreaterThan(0);

      const latestHistory = updatedRequest.submissionHistory[updatedRequest.submissionHistory.length - 1];
      
      // Verify compliance validation is logged
      expect(latestHistory.feedback).toContain("Compliance Validation");
      expect(latestHistory.feedback).toContain("NEP Compliant");
      expect(latestHistory.feedback).toContain("Duration 8 weeks meets minimum requirement of 4 weeks");
      expect(latestHistory.feedback).toContain("Documentation Complete: Yes");
      expect(latestHistory.feedback).toContain("Fees Cleared: Yes");
      expect(latestHistory.feedback).toContain("Department Approved: Yes");
    });

    it("should log NEP non-compliance when duration is insufficient", async () => {
      // Update credit request with insufficient duration
      creditRequest.internshipDurationWeeks = 3;
      await creditRequest.save();

      const complianceChecks = {
        nepCompliant: false,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: false,
      };

      const updatedRequest = await creditReviewService.submitAdminReview(
        creditRequest._id,
        admin._id,
        "rejected",
        "Does not meet NEP requirements",
        complianceChecks
      );

      // Verify submission history contains compliance validation log
      const latestHistory = updatedRequest.submissionHistory[updatedRequest.submissionHistory.length - 1];
      
      // Verify non-compliance is logged
      expect(latestHistory.feedback).toContain("Compliance Validation");
      expect(latestHistory.feedback).toContain("NEP Non-Compliant");
      expect(latestHistory.feedback).toContain("Duration 3 weeks does not meet minimum requirement of 4 weeks");
      expect(latestHistory.feedback).toContain("Department Approved: No");
    });

    it("should persist compliance validation log in database", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      await creditReviewService.submitAdminReview(
        creditRequest._id,
        admin._id,
        "approved",
        "Approved",
        complianceChecks
      );

      // Fetch the credit request from database
      const savedRequest = await CreditRequest.findById(creditRequest._id);

      // Verify compliance validation is persisted
      const latestHistory = savedRequest.submissionHistory[savedRequest.submissionHistory.length - 1];
      expect(latestHistory.feedback).toContain("Compliance Validation");
      expect(latestHistory.feedback).toContain("NEP Compliant");
    });

    it("should include compliance checks in adminReview object", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      const updatedRequest = await creditReviewService.submitAdminReview(
        creditRequest._id,
        admin._id,
        "approved",
        "Approved",
        complianceChecks
      );

      // Verify adminReview contains compliance checks
      expect(updatedRequest.adminReview).toBeDefined();
      expect(updatedRequest.adminReview.complianceChecks).toEqual(complianceChecks);

      // Verify it's persisted in database
      const savedRequest = await CreditRequest.findById(creditRequest._id);
      expect(savedRequest.adminReview.complianceChecks.nepCompliant).toBe(true);
      expect(savedRequest.adminReview.complianceChecks.documentationComplete).toBe(true);
      expect(savedRequest.adminReview.complianceChecks.feesCleared).toBe(true);
      expect(savedRequest.adminReview.complianceChecks.departmentApproved).toBe(true);
    });
  });
});
