import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/server.js";
import Student from "../../src/models/Student.js";
import Mentor from "../../src/models/Mentor.js";
import Internship from "../../src/models/Internship.js";
import InternshipCompletion from "../../src/models/InternshipCompletion.js";
import CreditRequest from "../../src/models/CreditRequest.js";
import Company from "../../src/models/Company.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/config/firebase.js";

describe("Student Credit Request API Endpoints", () => {
  let studentToken;
  let student;
  let mentor;
  let company;
  let internship;
  let internshipCompletion;

  beforeAll(async () => {
    // Create test student
    const studentData = {
      studentId: `STU-${Date.now()}`,
      firebaseUid: `test-student-${Date.now()}`,
      email: `student-${Date.now()}@test.com`,
      profile: {
        name: "Test Student",
        department: "Computer Science",
        year: 3,
      },
      credits: {
        earned: 0,
        approved: 0,
        pending: 0,
        history: [],
      },
    };
    student = await Student.create(studentData);

    // Create test mentor
    const mentorData = {
      mentorId: `MEN-${Date.now()}`,
      firebaseUid: `test-mentor-${Date.now()}`,
      email: `mentor-${Date.now()}@test.com`,
      profile: {
        name: "Test Mentor",
        department: "Computer Science",
      },
    };
    mentor = await Mentor.create(mentorData);

    // Create test company
    const companyData = {
      companyId: `COM-${Date.now()}`,
      firebaseUid: `test-company-${Date.now()}`,
      email: `company-${Date.now()}@test.com`,
      companyName: "Test Company",
      status: "approved",
    };
    company = await Company.create(companyData);

    // Create test internship
    const internshipData = {
      internshipId: `INT-${Date.now()}`,
      companyId: company._id,
      title: "Test Internship",
      description: "Test internship description for credit transfer testing",
      department: "Computer Science",
      duration: "8 weeks",
      requiredSkills: ["JavaScript", "Node.js"],
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      applicationDeadline: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
      slots: 5,
      status: "approved",
    };
    internship = await Internship.create(internshipData);

    // Create completed internship
    const completionData = {
      completionId: `COMP-${Date.now()}`,
      studentId: student._id,
      internshipId: internship._id,
      companyId: company._id,
      mentorId: mentor._id,
      status: "completed",
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      hoursCompleted: 320,
      finalReport: {
        submitted: true,
        url: "https://example.com/report.pdf",
        submittedAt: new Date(),
      },
      companyCompletion: {
        markedCompleteBy: "Test Manager",
        markedCompleteAt: new Date(),
        evaluationScore: 4.5,
        evaluationComments: "Excellent work",
      },
    };
    internshipCompletion = await InternshipCompletion.create(completionData);

    // Mock authentication token
    studentToken = "mock-student-token";
  });

  afterAll(async () => {
    // Cleanup
    await Student.deleteMany({ studentId: { $regex: /^STU-/ } });
    await Mentor.deleteMany({ mentorId: { $regex: /^MEN-/ } });
    await Company.deleteMany({ companyId: { $regex: /^COM-/ } });
    await Internship.deleteMany({ internshipId: { $regex: /^INT-/ } });
    await InternshipCompletion.deleteMany({ completionId: { $regex: /^COMP-/ } });
    await CreditRequest.deleteMany({ creditRequestId: { $regex: /^CR-/ } });
  });

  describe("POST /api/students/:studentId/credit-requests", () => {
    it("should create a credit request for a completed internship", async () => {
      const response = await request(app)
        .post(`/api/students/${student.studentId}/credit-requests`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          internshipCompletionId: internshipCompletion._id.toString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.creditRequest).toBeDefined();
      expect(response.body.data.creditRequest.status).toBe("pending_mentor_review");
    }, 10000);

    it("should return 400 if internshipCompletionId is missing", async () => {
      const response = await request(app)
        .post(`/api/students/${student.studentId}/credit-requests`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 if internshipCompletionId is invalid", async () => {
      const response = await request(app)
        .post(`/api/students/${student.studentId}/credit-requests`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          internshipCompletionId: "invalid-id",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/students/:studentId/credit-requests", () => {
    it("should get all credit requests for a student", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests?page=1&limit=10`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it("should support status filtering", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests?status=pending_mentor_review`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/students/:studentId/credit-requests/:requestId", () => {
    let creditRequest;

    beforeAll(async () => {
      // Create a credit request for testing
      const requestData = {
        creditRequestId: `CR-${Date.now()}`,
        studentId: student._id,
        internshipCompletionId: internshipCompletion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        submissionHistory: [],
        metadata: {
          notificationsSent: [],
          remindersSent: 0,
          escalations: 0,
        },
      };
      creditRequest = await CreditRequest.create(requestData);
    });

    it("should get credit request details", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests/${creditRequest.creditRequestId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.creditRequest).toBeDefined();
      expect(response.body.data.creditRequest.creditRequestId).toBe(creditRequest.creditRequestId);
    });

    it("should return 404 for non-existent credit request", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests/CR-NONEXISTENT`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/students/:studentId/credit-requests/:requestId/status", () => {
    let creditRequest;

    beforeAll(async () => {
      const requestData = {
        creditRequestId: `CR-STATUS-${Date.now()}`,
        studentId: student._id,
        internshipCompletionId: internshipCompletion._id,
        internshipId: internship._id,
        mentorId: mentor._id,
        requestedCredits: 2,
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        status: "pending_mentor_review",
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        submissionHistory: [],
        metadata: {
          notificationsSent: [],
          remindersSent: 0,
          escalations: 0,
        },
      };
      creditRequest = await CreditRequest.create(requestData);
    });

    it("should get credit request status with progress indicator", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests/${creditRequest.creditRequestId}/status`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("pending_mentor_review");
      expect(response.body.data.stages).toBeDefined();
      expect(Array.isArray(response.body.data.stages)).toBe(true);
      expect(response.body.data.currentTimeline).toBeDefined();
    });
  });

  describe("GET /api/students/:studentId/credits/history", () => {
    it("should get credit history for a student", async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credits/history`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toBeDefined();
      expect(Array.isArray(response.body.data.history)).toBe(true);
      expect(response.body.data.totalCredits).toBeDefined();
    });
  });
});
