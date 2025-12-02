import creditNotificationService from "../../../src/services/creditNotificationService.js";
import CreditRequest from "../../../src/models/CreditRequest.js";
import Student from "../../../src/models/Student.js";
import Mentor from "../../../src/models/Mentor.js";
import Admin from "../../../src/models/Admin.js";
import Internship from "../../../src/models/Internship.js";
import InternshipCompletion from "../../../src/models/InternshipCompletion.js";
import { createTestStudent } from "../../helpers/testHelpers.js";

describe("CreditNotificationService", () => {
  let testStudent;
  let testMentor;
  let testAdmin;
  let testInternship;
  let testCompletion;
  let testCreditRequest;

  beforeEach(async () => {
    // Create test student
    const { student } = await createTestStudent();
    testStudent = student;
    testStudent.profile.fullName = "John Doe";
    await testStudent.save();

    // Create test mentor
    testMentor = await Mentor.create({
      mentorId: `MNT-${Date.now()}`,
      firebaseUid: `firebase-mentor-${Date.now()}`,
      email: "mentor@test.com",
      profile: {
        name: "Jane Mentor",
        department: "Computer Science",
      },
      preferences: {
        notifications: {
          email: true,
          realtime: true,
        },
      },
    });

    // Create test admin
    testAdmin = await Admin.create({
      adminId: `ADM-${Date.now()}`,
      firebaseUid: `firebase-admin-${Date.now()}`,
      email: "admin@test.com",
      name: "Admin User",
      role: "admin",
    });

    // Create test internship
    testInternship = await Internship.create({
      internshipId: `INT-${Date.now()}`,
      companyId: "507f1f77bcf86cd799439011",
      title: "Software Development Internship",
      company: "Tech Corp",
      description: "Test description",
      department: "Computer Science",
      requiredSkills: ["JavaScript"],
      duration: "8 weeks",
      workMode: "remote",
      startDate: new Date(),
      applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      slots: 5,
      postedBy: "test-user",
    });

    // Create test completion
    testCompletion = await InternshipCompletion.create({
      completionId: `COMP-${Date.now()}`,
      studentId: testStudent._id,
      internshipId: testInternship._id,
      companyId: "507f1f77bcf86cd799439011",
      totalHours: 320,
      creditsEarned: 2,
      completionDate: new Date(),
      evaluation: {
        mentorScore: 85,
        companyScore: 90,
        overallComments: "Excellent work",
      },
    });

    // Create test credit request
    testCreditRequest = await CreditRequest.create({
      creditRequestId: `CR-${Date.now()}`,
      studentId: testStudent._id,
      internshipCompletionId: testCompletion._id,
      internshipId: testInternship._id,
      mentorId: testMentor._id,
      requestedCredits: 2,
      calculatedCredits: 2,
      internshipDurationWeeks: 8,
      status: "pending_mentor_review",
    });
  });

  describe("notifyStudentRequestCreated", () => {
    it("should send notification to student when request is created", async () => {
      const result = await creditNotificationService.notifyStudentRequestCreated(testCreditRequest);

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("student_request_created");
    });

    it("should track notification in metadata", async () => {
      await creditNotificationService.notifyStudentRequestCreated(testCreditRequest);

      const updatedRequest = await CreditRequest.findById(testCreditRequest._id);
      expect(updatedRequest.metadata.notificationsSent).toContain("student_request_created");
    });
  });

  describe("notifyMentorNewRequest", () => {
    it("should send notification to mentor for new request", async () => {
      const result = await creditNotificationService.notifyMentorNewRequest(testCreditRequest);

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("mentor_new_request");
    });

    it("should indicate resubmission when submission history exists", async () => {
      testCreditRequest.submissionHistory.push({
        submittedAt: new Date(),
        status: "mentor_rejected",
      });
      testCreditRequest.submissionHistory.push({
        submittedAt: new Date(),
        status: "pending_mentor_review",
      });
      await testCreditRequest.save();

      const result = await creditNotificationService.notifyMentorNewRequest(testCreditRequest);

      expect(result.notificationType).toBe("mentor_request_resubmitted");
    });
  });

  describe("notifyStudentMentorDecision", () => {
    beforeEach(async () => {
      testCreditRequest.mentorReview = {
        reviewedBy: testMentor._id,
        reviewedAt: new Date(),
        decision: "approved",
        feedback: "Great work!",
      };
      await testCreditRequest.save();
    });

    it("should send approval notification to student", async () => {
      const result = await creditNotificationService.notifyStudentMentorDecision(
        testCreditRequest,
        "approved"
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("student_mentor_approved");
    });

    it("should send rejection notification to student", async () => {
      testCreditRequest.mentorReview.decision = "rejected";
      testCreditRequest.mentorReview.feedback = "Please revise your report";
      await testCreditRequest.save();

      const result = await creditNotificationService.notifyStudentMentorDecision(
        testCreditRequest,
        "rejected"
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("student_mentor_rejected");
    });
  });

  describe("notifyAdminMentorApproval", () => {
    it("should send notification to all admins", async () => {
      const result = await creditNotificationService.notifyAdminMentorApproval(testCreditRequest);

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("admin_mentor_approval");
      expect(result.adminCount).toBe(1);
    });

    it("should handle case when no admins exist", async () => {
      await Admin.deleteMany({});

      const result = await creditNotificationService.notifyAdminMentorApproval(testCreditRequest);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_admins_found");
    });
  });

  describe("notifyStudentAdminDecision", () => {
    beforeEach(async () => {
      testCreditRequest.adminReview = {
        reviewedBy: testAdmin._id,
        reviewedAt: new Date(),
        decision: "approved",
        feedback: "All requirements met",
      };
      await testCreditRequest.save();
    });

    it("should send approval notification to student", async () => {
      const result = await creditNotificationService.notifyStudentAdminDecision(
        testCreditRequest,
        "approved"
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("student_admin_approved");
    });

    it("should send rejection notification to student", async () => {
      testCreditRequest.adminReview.decision = "rejected";
      testCreditRequest.adminReview.feedback = "Pending fee clearance";
      await testCreditRequest.save();

      const result = await creditNotificationService.notifyStudentAdminDecision(
        testCreditRequest,
        "rejected"
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("student_admin_rejected");
    });
  });

  describe("notifyStudentCreditsAdded", () => {
    it("should send notification with certificate details", async () => {
      const certificate = {
        certificateId: "CERT-123",
        certificateUrl: "https://example.com/cert.pdf",
      };

      const result = await creditNotificationService.notifyStudentCreditsAdded(
        testCreditRequest,
        certificate
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("student_credits_added");
    });
  });

  describe("sendReviewReminder", () => {
    it("should send reminder to mentor", async () => {
      const result = await creditNotificationService.sendReviewReminder(
        testCreditRequest,
        "mentor"
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("reminder_mentor");
    });

    it("should send reminder to all admins", async () => {
      const result = await creditNotificationService.sendReviewReminder(
        testCreditRequest,
        "admin"
      );

      expect(result.success).toBe(true);
      expect(result.notificationType).toBe("reminder_admin");
    });

    it("should increment remindersSent counter", async () => {
      await creditNotificationService.sendReviewReminder(testCreditRequest, "mentor");

      const updatedRequest = await CreditRequest.findById(testCreditRequest._id);
      expect(updatedRequest.metadata.remindersSent).toBe(1);
    });

    it("should throw error for invalid recipient role", async () => {
      await expect(
        creditNotificationService.sendReviewReminder(testCreditRequest, "invalid")
      ).rejects.toThrow("Invalid recipient role");
    });
  });
});
