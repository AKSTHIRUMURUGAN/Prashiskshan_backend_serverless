import mongoose from "mongoose";
import CreditRequest from "../../../src/models/CreditRequest.js";
import Student from "../../../src/models/Student.js";
import Mentor from "../../../src/models/Mentor.js";
import Internship from "../../../src/models/Internship.js";
import InternshipCompletion from "../../../src/models/InternshipCompletion.js";
import { creditReminderService } from "../../../src/services/creditReminderService.js";
import { createMockFirebaseUser } from "../../helpers/testHelpers.js";

describe("CreditReminderService", () => {
  let student, mentor, internship, completion, creditRequest;

  beforeEach(async () => {
    // Create test student
    const firebaseUser = await createMockFirebaseUser("student");
    student = await Student.create({
      firebaseUid: firebaseUser.uid,
      studentId: `STU-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      profile: {
        fullName: "Test Student",
        firstName: "Test",
        lastName: "Student",
        name: "Test Student",
        college: "Test College",
        year: 3,
        department: "Computer Science",
      },
      credits: {
        earned: 0,
        approved: 0,
        pending: 0,
        history: [],
      },
    });

    // Create test mentor
    const mentorFirebaseUser = await createMockFirebaseUser("mentor");
    mentor = await Mentor.create({
      firebaseUid: mentorFirebaseUser.uid,
      mentorId: `MEN-${Date.now()}`,
      email: `mentor-${Date.now()}@example.com`,
      profile: {
        fullName: "Test Mentor",
        name: "Test Mentor",
        department: "Computer Science",
      },
    });

    // Create test internship
    internship = await Internship.create({
      title: "Test Internship",
      company: "Test Company",
      companyId: new mongoose.Types.ObjectId(),
      duration: "8 weeks",
      status: "approved",
    });

    // Create internship completion
    completion = await InternshipCompletion.create({
      studentId: student._id,
      internshipId: internship._id,
      status: "completed",
      completedAt: new Date(),
      evaluation: {
        overallComments: "Good work",
      },
    });

    // Create credit request
    creditRequest = await CreditRequest.create({
      creditRequestId: `CR-${Date.now()}`,
      studentId: student._id,
      internshipCompletionId: completion._id,
      internshipId: internship._id,
      mentorId: mentor._id,
      requestedCredits: 2,
      calculatedCredits: 2,
      internshipDurationWeeks: 8,
      status: "pending_mentor_review",
      requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      lastUpdatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
  });

  afterEach(async () => {
    await CreditRequest.deleteMany({});
    await InternshipCompletion.deleteMany({});
    await Internship.deleteMany({});
    await Student.deleteMany({});
    await Mentor.deleteMany({});
  });

  describe("getOverdueRequests", () => {
    it("should identify overdue credit requests", async () => {
      const overdueRequests = await creditReminderService.getOverdueRequests();

      expect(overdueRequests).toBeDefined();
      expect(Array.isArray(overdueRequests)).toBe(true);
      expect(overdueRequests.length).toBeGreaterThan(0);

      const foundRequest = overdueRequests.find(
        (req) => req.creditRequestId === creditRequest.creditRequestId
      );
      expect(foundRequest).toBeDefined();
      expect(foundRequest.isOverdue()).toBe(true);
    });

    it("should not include non-overdue requests", async () => {
      // Create a recent request
      const recentRequest = await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-recent`,
        studentId: student._id,
        internshipCompletionId: completion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
        requestedAt: new Date(), // Just now
        lastUpdatedAt: new Date(), // Just now
      });

      const overdueRequests = await creditReminderService.getOverdueRequests();

      const foundRecentRequest = overdueRequests.find(
        (req) => req.creditRequestId === recentRequest.creditRequestId
      );
      expect(foundRecentRequest).toBeUndefined();
    });

    it("should only include pending statuses", async () => {
      // Create a completed request that's old
      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-completed`,
        studentId: student._id,
        internshipCompletionId: completion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "completed",
        requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastUpdatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const overdueRequests = await creditReminderService.getOverdueRequests();

      const completedRequests = overdueRequests.filter(
        (req) => req.status === "completed"
      );
      expect(completedRequests.length).toBe(0);
    });
  });

  describe("sendOverdueReminders", () => {
    it("should return dry run results without sending reminders", async () => {
      const result = await creditReminderService.sendOverdueReminders({
        maxReminders: 3,
        dryRun: true,
      });

      expect(result.dryRun).toBe(true);
      expect(result.totalOverdue).toBeGreaterThan(0);
      expect(result.eligible).toBeGreaterThan(0);
      expect(Array.isArray(result.requests)).toBe(true);
    });

    it("should filter out requests exceeding max reminders", async () => {
      // Update request to have max reminders already sent
      creditRequest.metadata.remindersSent = 3;
      await creditRequest.save();

      const result = await creditReminderService.sendOverdueReminders({
        maxReminders: 3,
        dryRun: true,
      });

      const foundRequest = result.requests?.find(
        (req) => req.creditRequestId === creditRequest.creditRequestId
      );
      expect(foundRequest).toBeUndefined();
    });
  });

  describe("getReminderStats", () => {
    it("should return reminder statistics", async () => {
      const stats = await creditReminderService.getReminderStats();

      expect(stats).toBeDefined();
      expect(stats.totalOverdue).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byReminderCount).toBeDefined();
      expect(stats.averageDaysOverdue).toBeGreaterThan(0);
    });

    it("should group by status correctly", async () => {
      // Create another overdue request with different status
      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-admin`,
        studentId: student._id,
        internshipCompletionId: completion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_admin_review",
        requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastUpdatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      });

      const stats = await creditReminderService.getReminderStats();

      expect(stats.byStatus["pending_mentor_review"]).toBeGreaterThan(0);
      expect(stats.byStatus["pending_admin_review"]).toBeGreaterThan(0);
    });
  });

  describe("isOverdue method", () => {
    it("should correctly identify overdue mentor review", async () => {
      const request = await CreditRequest.findById(creditRequest._id);
      expect(request.isOverdue()).toBe(true);
    });

    it("should correctly identify non-overdue request", async () => {
      const recentRequest = await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-recent`,
        studentId: student._id,
        internshipCompletionId: completion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      expect(recentRequest.isOverdue()).toBe(false);
    });

    it("should return false for statuses without expected timelines", async () => {
      const completedRequest = await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-completed`,
        studentId: student._id,
        internshipCompletionId: completion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "completed",
        requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastUpdatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      expect(completedRequest.isOverdue()).toBe(false);
    });
  });
});
