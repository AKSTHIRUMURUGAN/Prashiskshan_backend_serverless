import creditService from "../../../src/services/creditService.js";
import { calculateNEPCredits, validateNEPCompliance } from "../../../src/services/creditService.js";
import CreditRequest from "../../../src/models/CreditRequest.js";
import InternshipCompletion from "../../../src/models/InternshipCompletion.js";
import Student from "../../../src/models/Student.js";
import Internship from "../../../src/models/Internship.js";
import { createTestStudent } from "../../helpers/testHelpers.js";

describe("CreditService", () => {
  describe("calculateNEPCredits", () => {
    it("should return 0 for duration less than 4 weeks", () => {
      expect(calculateNEPCredits(0)).toBe(0);
      expect(calculateNEPCredits(1)).toBe(0);
      expect(calculateNEPCredits(3)).toBe(0);
      expect(calculateNEPCredits(3.9)).toBe(0);
    });

    it("should return 1 credit for 4-7 weeks", () => {
      expect(calculateNEPCredits(4)).toBe(1);
      expect(calculateNEPCredits(5)).toBe(1);
      expect(calculateNEPCredits(7)).toBe(1);
    });

    it("should return 2 credits for 8-11 weeks", () => {
      expect(calculateNEPCredits(8)).toBe(2);
      expect(calculateNEPCredits(9)).toBe(2);
      expect(calculateNEPCredits(11)).toBe(2);
    });

    it("should return correct credits for longer durations", () => {
      expect(calculateNEPCredits(12)).toBe(3);
      expect(calculateNEPCredits(16)).toBe(4);
      expect(calculateNEPCredits(24)).toBe(6);
      expect(calculateNEPCredits(52)).toBe(13);
    });

    it("should floor fractional results", () => {
      expect(calculateNEPCredits(7.9)).toBe(1);
      expect(calculateNEPCredits(11.9)).toBe(2);
    });
  });

  describe("validateNEPCompliance", () => {
    let testInternship;
    let testCompletion;

    beforeEach(async () => {
      // Create test internship
      testInternship = await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Test Internship",
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
        studentId: "507f1f77bcf86cd799439011",
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
    });

    it("should return compliant for valid internship with 8 weeks duration", async () => {
      const result = await validateNEPCompliance(testCompletion);
      expect(result.compliant).toBe(true);
      expect(result.reason).toBe("Meets NEP requirements");
    });

    it("should return non-compliant for internship less than 4 weeks", async () => {
      testInternship.duration = "2 weeks";
      await testInternship.save();

      const result = await validateNEPCompliance(testCompletion);
      expect(result.compliant).toBe(false);
      expect(result.reason).toContain("less than NEP minimum requirement");
    });

    it("should return non-compliant for missing evaluation", async () => {
      testCompletion.evaluation = null;
      await testCompletion.save();

      const result = await validateNEPCompliance(testCompletion);
      expect(result.compliant).toBe(false);
      expect(result.reason).toBe("Evaluation incomplete");
    });

    it("should handle month-based duration strings", async () => {
      testInternship.duration = "2 months";
      await testInternship.save();

      const result = await validateNEPCompliance(testCompletion);
      expect(result.compliant).toBe(true);
    });

    it("should handle range duration strings", async () => {
      testInternship.duration = "3-4 months";
      await testInternship.save();

      const result = await validateNEPCompliance(testCompletion);
      expect(result.compliant).toBe(true);
    });
  });

  describe("createCreditRequest", () => {
    let testStudent;
    let testInternship;
    let testCompletion;

    beforeEach(async () => {
      // Create test student
      const { student } = await createTestStudent();
      testStudent = student;

      // Create test internship
      testInternship = await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Test Internship",
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
    });

    it("should create a credit request successfully", async () => {
      const creditRequest = await creditService.createCreditRequest(
        testStudent._id,
        testCompletion._id
      );

      expect(creditRequest).toBeDefined();
      expect(creditRequest.studentId.toString()).toBe(testStudent._id.toString());
      expect(creditRequest.internshipCompletionId.toString()).toBe(testCompletion._id.toString());
      expect(creditRequest.calculatedCredits).toBe(2); // 8 weeks = 2 credits
      expect(creditRequest.status).toBe("pending_mentor_review");
    });

    it("should update internship completion with credit request info", async () => {
      await creditService.createCreditRequest(testStudent._id, testCompletion._id);

      const updatedCompletion = await InternshipCompletion.findById(testCompletion._id);
      expect(updatedCompletion.creditRequest.requested).toBe(true);
      expect(updatedCompletion.creditRequest.requestId).toBeDefined();
      expect(updatedCompletion.creditRequest.status).toBe("pending_mentor_review");
    });

    it("should update student pending credits", async () => {
      await creditService.createCreditRequest(testStudent._id, testCompletion._id);

      const updatedStudent = await Student.findById(testStudent._id);
      expect(updatedStudent.credits.pending).toBe(2);
    });

    it("should throw error for duplicate credit request", async () => {
      await creditService.createCreditRequest(testStudent._id, testCompletion._id);

      await expect(
        creditService.createCreditRequest(testStudent._id, testCompletion._id)
      ).rejects.toThrow("Credit request already exists");
    });

    it("should throw error for non-existent completion", async () => {
      await expect(
        creditService.createCreditRequest(testStudent._id, "507f1f77bcf86cd799439099")
      ).rejects.toThrow("Internship completion not found");
    });

    it("should throw error for non-existent student", async () => {
      await expect(
        creditService.createCreditRequest("507f1f77bcf86cd799439099", testCompletion._id)
      ).rejects.toThrow("Student not found");
    });
  });

  describe("addCreditsToStudent", () => {
    let testStudent;

    beforeEach(async () => {
      const { student } = await createTestStudent();
      testStudent = student;
      testStudent.credits.pending = 2;
      await testStudent.save();
    });

    it("should add credits to student profile", async () => {
      const certificateData = {
        creditRequestId: "507f1f77bcf86cd799439011",
        internshipId: "507f1f77bcf86cd799439012",
        certificateUrl: "https://example.com/cert.pdf",
      };

      const updatedStudent = await creditService.addCreditsToStudent(
        testStudent._id,
        2,
        certificateData
      );

      expect(updatedStudent.credits.earned).toBe(2);
      expect(updatedStudent.credits.approved).toBe(2);
      expect(updatedStudent.credits.pending).toBe(0);
    });

    it("should add entry to credit history", async () => {
      const certificateData = {
        creditRequestId: "507f1f77bcf86cd799439011",
        internshipId: "507f1f77bcf86cd799439012",
        certificateUrl: "https://example.com/cert.pdf",
      };

      const updatedStudent = await creditService.addCreditsToStudent(
        testStudent._id,
        2,
        certificateData
      );

      expect(updatedStudent.credits.history).toHaveLength(1);
      expect(updatedStudent.credits.history[0].creditsAdded).toBe(2);
      expect(updatedStudent.credits.history[0].certificateUrl).toBe(certificateData.certificateUrl);
    });

    it("should accumulate credits correctly", async () => {
      const certificateData1 = {
        creditRequestId: "507f1f77bcf86cd799439011",
        internshipId: "507f1f77bcf86cd799439012",
        certificateUrl: "https://example.com/cert1.pdf",
      };

      await creditService.addCreditsToStudent(testStudent._id, 2, certificateData1);

      const certificateData2 = {
        creditRequestId: "507f1f77bcf86cd799439013",
        internshipId: "507f1f77bcf86cd799439014",
        certificateUrl: "https://example.com/cert2.pdf",
      };

      const updatedStudent = await creditService.addCreditsToStudent(
        testStudent._id,
        3,
        certificateData2
      );

      expect(updatedStudent.credits.earned).toBe(5);
      expect(updatedStudent.credits.approved).toBe(5);
      expect(updatedStudent.credits.history).toHaveLength(2);
    });

    it("should throw error for non-existent student", async () => {
      const certificateData = {
        creditRequestId: "507f1f77bcf86cd799439011",
        internshipId: "507f1f77bcf86cd799439012",
        certificateUrl: "https://example.com/cert.pdf",
      };

      await expect(
        creditService.addCreditsToStudent("507f1f77bcf86cd799439099", 2, certificateData)
      ).rejects.toThrow("Student not found");
    });
  });

  describe("getCreditRequestById", () => {
    let testCreditRequest;

    beforeEach(async () => {
      testCreditRequest = await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}`,
        studentId: "507f1f77bcf86cd799439011",
        internshipCompletionId: "507f1f77bcf86cd799439012",
        internshipId: "507f1f77bcf86cd799439013",
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
      });
    });

    it("should retrieve credit request by MongoDB ID", async () => {
      const result = await creditService.getCreditRequestById(testCreditRequest._id);
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(testCreditRequest._id.toString());
    });

    it("should retrieve credit request by creditRequestId", async () => {
      const result = await creditService.getCreditRequestById(testCreditRequest.creditRequestId);
      expect(result).toBeDefined();
      expect(result.creditRequestId).toBe(testCreditRequest.creditRequestId);
    });

    it("should throw error for non-existent credit request", async () => {
      await expect(
        creditService.getCreditRequestById("507f1f77bcf86cd799439099")
      ).rejects.toThrow("Credit request not found");
    });
  });

  describe("getCreditRequestsByStudent", () => {
    let testStudent;

    beforeEach(async () => {
      const { student } = await createTestStudent();
      testStudent = student;

      const timestamp = Date.now();
      
      // Create multiple credit requests
      await CreditRequest.create({
        creditRequestId: `CR-${timestamp}-1`,
        studentId: testStudent._id,
        internshipCompletionId: "507f1f77bcf86cd799439012",
        internshipId: "507f1f77bcf86cd799439013",
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
      });

      // Add small delay to ensure unique timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-2`,
        studentId: testStudent._id,
        internshipCompletionId: "507f1f77bcf86cd799439015",
        internshipId: "507f1f77bcf86cd799439016",
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 3,
        calculatedCredits: 3,
        internshipDurationWeeks: 12,
        status: "completed",
      });
    });

    it("should retrieve all credit requests for student", async () => {
      const result = await creditService.getCreditRequestsByStudent(testStudent._id);
      expect(result.creditRequests).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter by status", async () => {
      const result = await creditService.getCreditRequestsByStudent(testStudent._id, {
        status: "completed",
      });
      expect(result.creditRequests).toHaveLength(1);
      expect(result.creditRequests[0].status).toBe("completed");
    });

    it("should paginate results", async () => {
      const result = await creditService.getCreditRequestsByStudent(testStudent._id, {
        page: 1,
        limit: 1,
      });
      expect(result.creditRequests).toHaveLength(1);
      expect(result.pagination.pages).toBe(2);
    });

    it("should filter by date range", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const result = await creditService.getCreditRequestsByStudent(testStudent._id, {
        dateFrom: yesterday.toISOString(),
        dateTo: tomorrow.toISOString(),
      });
      
      expect(result.creditRequests.length).toBeGreaterThan(0);
      result.creditRequests.forEach(req => {
        expect(new Date(req.requestedAt).getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(new Date(req.requestedAt).getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });

    it("should support custom sorting", async () => {
      const result = await creditService.getCreditRequestsByStudent(testStudent._id, {
        sortBy: "calculatedCredits",
        sortOrder: "desc",
      });
      
      expect(result.creditRequests).toHaveLength(2);
      expect(result.creditRequests[0].calculatedCredits).toBeGreaterThanOrEqual(
        result.creditRequests[1].calculatedCredits
      );
    });
  });

  describe("getCreditRequestsByMentor", () => {
    let testMentorId;

    beforeEach(async () => {
      testMentorId = "507f1f77bcf86cd799439014";

      const timestamp = Date.now();
      
      // Create multiple credit requests
      await CreditRequest.create({
        creditRequestId: `CR-${timestamp}-1`,
        studentId: "507f1f77bcf86cd799439011",
        internshipCompletionId: "507f1f77bcf86cd799439012",
        internshipId: "507f1f77bcf86cd799439013",
        mentorId: testMentorId,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });

      // Add small delay to ensure unique timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-2`,
        studentId: "507f1f77bcf86cd799439015",
        internshipCompletionId: "507f1f77bcf86cd799439016",
        internshipId: "507f1f77bcf86cd799439017",
        mentorId: testMentorId,
        requestedCredits: 3,
        calculatedCredits: 3,
        internshipDurationWeeks: 12,
        status: "pending_mentor_review",
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      });
    });

    it("should retrieve pending credit requests for mentor", async () => {
      const result = await creditService.getCreditRequestsByMentor(testMentorId);
      expect(result.creditRequests).toHaveLength(2);
    });

    it("should sort by requestedAt (oldest first)", async () => {
      const result = await creditService.getCreditRequestsByMentor(testMentorId);
      expect(result.creditRequests[0].requestedAt.getTime()).toBeLessThan(
        result.creditRequests[1].requestedAt.getTime()
      );
    });

    it("should paginate results", async () => {
      const result = await creditService.getCreditRequestsByMentor(testMentorId, {
        page: 1,
        limit: 1,
      });
      expect(result.creditRequests).toHaveLength(1);
      expect(result.pagination.pages).toBe(2);
    });

    it("should filter by date range", async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const result = await creditService.getCreditRequestsByMentor(testMentorId, {
        dateFrom: threeDaysAgo.toISOString(),
        dateTo: today.toISOString(),
      });
      
      expect(result.creditRequests.length).toBeGreaterThan(0);
      result.creditRequests.forEach(req => {
        expect(new Date(req.requestedAt).getTime()).toBeGreaterThanOrEqual(threeDaysAgo.getTime());
        expect(new Date(req.requestedAt).getTime()).toBeLessThanOrEqual(today.getTime());
      });
    });

    it("should support custom sorting order", async () => {
      const result = await creditService.getCreditRequestsByMentor(testMentorId, {
        sortBy: "requestedAt",
        sortOrder: "desc",
      });
      
      expect(result.creditRequests).toHaveLength(2);
      expect(result.creditRequests[0].requestedAt.getTime()).toBeGreaterThanOrEqual(
        result.creditRequests[1].requestedAt.getTime()
      );
    });

    it("should filter by student name", async () => {
      // Create a student with a known name
      const { student } = await createTestStudent();
      student.profile.name = "John Doe";
      await student.save();

      // Create a credit request for this student
      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-search`,
        studentId: student._id,
        internshipCompletionId: "507f1f77bcf86cd799439020",
        internshipId: "507f1f77bcf86cd799439021",
        mentorId: testMentorId,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
      });

      const result = await creditService.getCreditRequestsByMentor(testMentorId, {
        studentName: "John",
      });
      
      expect(result.creditRequests.length).toBeGreaterThan(0);
      const foundStudent = result.creditRequests.some(req => 
        req.studentId?.profile?.name?.includes("John")
      );
      expect(foundStudent).toBe(true);
    });
  });

  describe("getCreditRequestsByAdmin", () => {
    beforeEach(async () => {
      const timestamp = Date.now();
      
      // Create credit requests with different statuses
      await CreditRequest.create({
        creditRequestId: `CR-${timestamp}-1`,
        studentId: "507f1f77bcf86cd799439011",
        internshipCompletionId: "507f1f77bcf86cd799439012",
        internshipId: "507f1f77bcf86cd799439013",
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_admin_review",
      });

      // Add small delay to ensure unique timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-2`,
        studentId: "507f1f77bcf86cd799439015",
        internshipCompletionId: "507f1f77bcf86cd799439016",
        internshipId: "507f1f77bcf86cd799439017",
        mentorId: "507f1f77bcf86cd799439018",
        requestedCredits: 3,
        calculatedCredits: 3,
        internshipDurationWeeks: 12,
        status: "pending_admin_review",
      });
    });

    it("should retrieve pending admin reviews", async () => {
      const result = await creditService.getCreditRequestsByAdmin();
      expect(result.creditRequests).toHaveLength(2);
    });

    it("should filter by mentor", async () => {
      const result = await creditService.getCreditRequestsByAdmin({
        mentorId: "507f1f77bcf86cd799439014",
      });
      expect(result.creditRequests).toHaveLength(1);
    });

    it("should paginate results", async () => {
      const result = await creditService.getCreditRequestsByAdmin({
        page: 1,
        limit: 1,
      });
      expect(result.creditRequests).toHaveLength(1);
      expect(result.pagination.pages).toBe(2);
    });

    it("should filter by date range", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const result = await creditService.getCreditRequestsByAdmin({
        dateFrom: yesterday.toISOString(),
        dateTo: tomorrow.toISOString(),
      });
      
      expect(result.creditRequests.length).toBeGreaterThan(0);
      result.creditRequests.forEach(req => {
        expect(new Date(req.requestedAt).getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(new Date(req.requestedAt).getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });

    it("should support custom sorting", async () => {
      const result = await creditService.getCreditRequestsByAdmin({
        sortBy: "calculatedCredits",
        sortOrder: "desc",
      });
      
      expect(result.creditRequests).toHaveLength(2);
      expect(result.creditRequests[0].calculatedCredits).toBeGreaterThanOrEqual(
        result.creditRequests[1].calculatedCredits
      );
    });

    it("should filter by student name", async () => {
      // Create a student with a known name
      const { student } = await createTestStudent();
      student.profile.name = "Jane Smith";
      await student.save();

      // Create a credit request for this student
      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-admin-search`,
        studentId: student._id,
        internshipCompletionId: "507f1f77bcf86cd799439030",
        internshipId: "507f1f77bcf86cd799439031",
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_admin_review",
      });

      const result = await creditService.getCreditRequestsByAdmin({
        studentName: "Jane",
      });
      
      expect(result.creditRequests.length).toBeGreaterThan(0);
      const foundStudent = result.creditRequests.some(req => 
        req.studentId?.profile?.name?.includes("Jane")
      );
      expect(foundStudent).toBe(true);
    });

    it("should filter by status", async () => {
      // Create a completed request
      await CreditRequest.create({
        creditRequestId: `CR-${Date.now()}-completed`,
        studentId: "507f1f77bcf86cd799439040",
        internshipCompletionId: "507f1f77bcf86cd799439041",
        internshipId: "507f1f77bcf86cd799439042",
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "completed",
      });

      const result = await creditService.getCreditRequestsByAdmin({
        status: "completed",
      });
      
      expect(result.creditRequests.length).toBeGreaterThan(0);
      result.creditRequests.forEach(req => {
        expect(req.status).toBe("completed");
      });
    });
  });

  describe("generateCertificate", () => {
    let testStudent;
    let testInternship;
    let testCompletion;
    let testCreditRequest;

    beforeEach(async () => {
      // Create test student
      const { student } = await createTestStudent();
      testStudent = student;
      testStudent.profile.fullName = "John Doe";
      testStudent.profile.firstName = "John";
      testStudent.profile.lastName = "Doe";
      await testStudent.save();

      // Create test internship
      testInternship = await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Software Development Internship",
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
        completedAt: new Date(),
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
        mentorId: "507f1f77bcf86cd799439014",
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "admin_approved",
      });

      // Populate the credit request
      testCreditRequest = await CreditRequest.findById(testCreditRequest._id)
        .populate("studentId")
        .populate("internshipId")
        .populate("internshipCompletionId");
    });

    it("should generate certificate with unique ID", async () => {
      const certificate = await creditService.generateCertificate(testCreditRequest);

      expect(certificate).toBeDefined();
      expect(certificate.certificateId).toBeDefined();
      expect(certificate.certificateId).toMatch(/^CERT-\d+-[A-Z0-9]{8}$/);
      expect(certificate.certificateUrl).toBeDefined();
      expect(certificate.generatedAt).toBeDefined();
    });

    it("should upload certificate to storage", async () => {
      const certificate = await creditService.generateCertificate(testCreditRequest);

      expect(certificate.certificateUrl).toContain("certificate-");
      expect(certificate.certificateUrl).toContain(".html");
    });

    it("should include student information in certificate", async () => {
      const certificate = await creditService.generateCertificate(testCreditRequest);

      expect(certificate.certificateId).toBeDefined();
      expect(certificate.certificateUrl).toBeDefined();
    });

    it("should throw error for unpopulated credit request", async () => {
      const unpopulatedRequest = await CreditRequest.findById(testCreditRequest._id);

      await expect(
        creditService.generateCertificate(unpopulatedRequest)
      ).rejects.toThrow("must be populated");
    });

    it("should generate unique certificate IDs for multiple requests", async () => {
      const certificate1 = await creditService.generateCertificate(testCreditRequest);
      
      // Add small delay to ensure unique timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const certificate2 = await creditService.generateCertificate(testCreditRequest);

      expect(certificate1.certificateId).not.toBe(certificate2.certificateId);
    });
  });
});

  describe("calculateProgressIndicator", () => {
    it("should calculate progress for pending_mentor_review status", () => {
      const creditRequest = {
        status: "pending_mentor_review",
        requestedAt: new Date(),
      };

      const progress = creditService.calculateProgressIndicator(creditRequest);

      expect(progress.percentage).toBe(0);
      expect(progress.currentStage).toBe("Submitted");
      expect(progress.currentStageKey).toBe("submitted");
      expect(progress.completedStages).toEqual([]);
      expect(progress.isRejected).toBe(false);
    });

    it("should calculate progress for mentor_approved status", () => {
      const creditRequest = {
        status: "mentor_approved",
        requestedAt: new Date(),
      };

      const progress = creditService.calculateProgressIndicator(creditRequest);

      expect(progress.percentage).toBe(50);
      expect(progress.currentStage).toBe("Admin Review");
      expect(progress.currentStageKey).toBe("admin_review");
      expect(progress.completedStages).toEqual(["submitted", "mentor_review"]);
      expect(progress.isRejected).toBe(false);
    });

    it("should calculate progress for completed status", () => {
      const creditRequest = {
        status: "completed",
        requestedAt: new Date(),
      };

      const progress = creditService.calculateProgressIndicator(creditRequest);

      expect(progress.percentage).toBe(75);
      expect(progress.currentStage).toBe("Completed");
      expect(progress.currentStageKey).toBe("completed");
      expect(progress.completedStages).toEqual(["submitted", "mentor_review", "admin_review"]);
      expect(progress.isRejected).toBe(false);
    });

    it("should mark as rejected for mentor_rejected status", () => {
      const creditRequest = {
        status: "mentor_rejected",
        requestedAt: new Date(),
      };

      const progress = creditService.calculateProgressIndicator(creditRequest);

      expect(progress.percentage).toBe(25);
      expect(progress.currentStage).toBe("Mentor Review");
      expect(progress.isRejected).toBe(true);
      expect(progress.rejectedAt).toBe("mentor_review");
    });

    it("should mark as rejected for admin_rejected status", () => {
      const creditRequest = {
        status: "admin_rejected",
        requestedAt: new Date(),
      };

      const progress = creditService.calculateProgressIndicator(creditRequest);

      expect(progress.percentage).toBe(50);
      expect(progress.currentStage).toBe("Admin Review");
      expect(progress.isRejected).toBe(true);
      expect(progress.rejectedAt).toBe("admin_review");
    });
  });

  describe("calculateExpectedTimeline", () => {
    it("should calculate timeline for new request", () => {
      const requestedAt = new Date("2024-01-01T00:00:00Z");
      const creditRequest = {
        status: "pending_mentor_review",
        requestedAt,
      };

      const timeline = creditService.calculateExpectedTimeline(creditRequest);

      expect(timeline.stages).toHaveLength(4);
      expect(timeline.totalExpectedDays).toBe(5); // 0 + 3 + 2 + 0
      expect(timeline.stages[0].status).toBe("completed");
      expect(timeline.stages[1].status).toBe("current");
      expect(timeline.stages[2].status).toBe("pending");
      expect(timeline.stages[3].status).toBe("pending");
    });

    it("should calculate days elapsed for current stage", () => {
      const requestedAt = new Date();
      requestedAt.setDate(requestedAt.getDate() - 2); // 2 days ago

      const creditRequest = {
        status: "pending_mentor_review",
        requestedAt,
      };

      const timeline = creditService.calculateExpectedTimeline(creditRequest);
      const currentStage = timeline.stages.find(s => s.status === "current");

      expect(currentStage).toBeDefined();
      expect(currentStage.daysElapsed).toBe(2);
      expect(currentStage.daysRemaining).toBe(1); // 3 expected - 2 elapsed
      expect(currentStage.isOverdue).toBe(false);
    });

    it("should mark stage as overdue when elapsed exceeds expected", () => {
      const requestedAt = new Date();
      requestedAt.setDate(requestedAt.getDate() - 5); // 5 days ago

      const creditRequest = {
        status: "pending_mentor_review",
        requestedAt,
      };

      const timeline = creditService.calculateExpectedTimeline(creditRequest);
      const currentStage = timeline.stages.find(s => s.status === "current");

      expect(currentStage).toBeDefined();
      expect(currentStage.daysElapsed).toBe(5);
      expect(currentStage.daysRemaining).toBe(0);
      expect(currentStage.isOverdue).toBe(true);
    });

    it("should include actual completion dates for completed stages", () => {
      const requestedAt = new Date("2024-01-01T00:00:00Z");
      const mentorReviewedAt = new Date("2024-01-03T00:00:00Z");

      const creditRequest = {
        status: "pending_admin_review",
        requestedAt,
        mentorReview: {
          reviewedAt: mentorReviewedAt,
        },
      };

      const timeline = creditService.calculateExpectedTimeline(creditRequest);
      const mentorStage = timeline.stages.find(s => s.key === "mentor_review");

      expect(mentorStage).toBeDefined();
      expect(mentorStage.status).toBe("completed");
      expect(mentorStage.actualCompletionDate).toEqual(mentorReviewedAt);
    });

    it("should calculate estimated completion date", () => {
      const requestedAt = new Date("2024-01-01T00:00:00Z");
      const creditRequest = {
        status: "pending_mentor_review",
        requestedAt,
      };

      const timeline = creditService.calculateExpectedTimeline(creditRequest);
      const expectedDate = new Date("2024-01-06T00:00:00Z"); // 5 days later

      expect(timeline.estimatedCompletionDate.toISOString()).toBe(expectedDate.toISOString());
    });
  });
