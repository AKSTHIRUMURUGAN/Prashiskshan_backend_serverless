import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import { createTestAdmin, createTestStudent, createTestMentor, getAuthToken } from "../helpers/testHelpers.js";
import mongoose from "mongoose";
import CreditRequest from "../../src/models/CreditRequest.js";
import Student from "../../src/models/Student.js";
import Mentor from "../../src/models/Mentor.js";
import Admin from "../../src/models/Admin.js";
import InternshipCompletion from "../../src/models/InternshipCompletion.js";
import Internship from "../../src/models/Internship.js";

const app = express();
app.use(express.json());
app.use("/api/admins", adminRouter);

describe("Admin Credit Request API Integration Tests", () => {
  let adminToken;
  let adminDoc;
  let studentDoc;
  let mentorDoc;
  let creditRequestId;
  let internshipId;
  let completionId;

  beforeAll(async () => {
    const { admin, firebaseUser: adminFirebase } = await createTestAdmin();
    adminToken = await getAuthToken(adminFirebase);
    adminDoc = admin;

    const { student } = await createTestStudent();
    studentDoc = student;
    
    const { mentor } = await createTestMentor();
    mentorDoc = mentor;

    const internship = await Internship.create({
      internshipId: `INT-${Date.now()}`,
      companyId: new mongoose.Types.ObjectId(),
      title: "Test Internship",
      description: "Test internship for credit transfer testing",
      department: "Computer Science",
      requiredSkills: ["JavaScript"],
      duration: "12 weeks",
      startDate: new Date(),
      applicationDeadline: new Date(),
      slots: 1,
      status: "approved",
    });
    internshipId = internship._id;

    const completion = await InternshipCompletion.create({
      completionId: `COMP-${Date.now()}`,
      studentId: studentDoc._id,
      internshipId: internship._id,
      companyId: internship.companyId,
      status: "completed",
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      finalReport: {
        submitted: true,
        url: "https://example.com/report.pdf",
      },
      logbookEntries: 12,
      companyCompletion: {
        markedCompleteBy: "Test Manager",
        markedCompleteAt: new Date(),
        evaluationScore: 85,
        evaluationComments: "Excellent performance",
      },
    });
    completionId = completion._id;
  });

  afterAll(async () => {
    await CreditRequest.deleteMany({ studentId: studentDoc._id });
    await InternshipCompletion.deleteMany({ studentId: studentDoc._id });
    await Internship.deleteMany({ _id: internshipId });
    await Student.deleteMany({ _id: studentDoc._id });
    await Mentor.deleteMany({ _id: mentorDoc._id });
    await Admin.deleteMany({ _id: adminDoc._id });
    await mongoose.connection.close();
  });

  const createTestCreditRequest = async (status = "pending_admin_review") => {
    const creditRequest = await CreditRequest.create({
      creditRequestId: `CR-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      studentId: studentDoc._id,
      internshipCompletionId: completionId,
      internshipId: internshipId,
      mentorId: mentorDoc._id,
      requestedCredits: 3,
      calculatedCredits: 3,
      internshipDurationWeeks: 12,
      status: status,
      requestedAt: new Date(),
      lastUpdatedAt: new Date(),
      submissionHistory: [],
      metadata: {
        notificationsSent: [],
        remindersSent: 0,
        escalations: 0,
      },
    });

    if (status === "pending_admin_review") {
      creditRequest.mentorReview = {
        reviewedBy: mentorDoc._id,
        reviewedAt: new Date(),
        decision: "approved",
        feedback: "Good work",
        qualityCriteria: {
          logbookComplete: true,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();
    }

    return creditRequest;
  };

  describe("GET /api/admins/credit-requests/pending", () => {
    it("should get pending credit requests for admin approval", async () => {
      const creditRequest = await createTestCreditRequest("pending_admin_review");
      creditRequestId = creditRequest.creditRequestId;

      const response = await request(app)
        .get("/api/admins/credit-requests/pending")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.requests)).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/pending?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should support filtering by mentor", async () => {
      const response = await request(app)
        .get(`/api/admins/credit-requests/pending?mentorId=${mentorDoc.mentorId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/admins/credit-requests/:requestId", () => {
    it("should get credit request details", async () => {
      const response = await request(app)
        .get(`/api/admins/credit-requests/${creditRequestId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.creditRequestId).toBe(creditRequestId);
    });

    it("should return 404 for non-existent request", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/NONEXISTENT")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/admins/credit-requests/:requestId/review", () => {
    it("should approve a credit request", async () => {
      const response = await request(app)
        .post(`/api/admins/credit-requests/${creditRequestId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "approved",
          feedback: "All requirements met",
          complianceChecks: {
            nepCompliant: true,
            documentationComplete: true,
            feesCleared: true,
            departmentApproved: true,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("admin_approved");
    });

    it("should reject a credit request with feedback", async () => {
      const newRequest = await createTestCreditRequest("pending_admin_review");

      const response = await request(app)
        .post(`/api/admins/credit-requests/${newRequest.creditRequestId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "rejected",
          feedback: "Documentation incomplete - missing fee clearance certificate",
          complianceChecks: {
            nepCompliant: true,
            documentationComplete: false,
            feesCleared: false,
            departmentApproved: true,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("admin_rejected");
      expect(response.body.data.adminReview.feedback).toContain("Documentation incomplete");
    });

    it("should require feedback when rejecting", async () => {
      const newRequest = await createTestCreditRequest("pending_admin_review");

      const response = await request(app)
        .post(`/api/admins/credit-requests/${newRequest.creditRequestId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "rejected",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Feedback is required");
    });

    it("should validate decision values", async () => {
      const response = await request(app)
        .post(`/api/admins/credit-requests/${creditRequestId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "invalid",
          feedback: "Test feedback",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/admins/credit-requests/:requestId/resolve", () => {
    let rejectedRequestId;

    beforeEach(async () => {
      const rejectedRequest = await createTestCreditRequest("admin_rejected");
      rejectedRequestId = rejectedRequest.creditRequestId;
    });

    it("should resolve an administrative hold", async () => {
      const response = await request(app)
        .post(`/api/admins/credit-requests/${rejectedRequestId}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolution: "Fee clearance certificate has been verified and approved",
          notes: "Student provided updated documentation",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("pending_admin_review");
    });

    it("should require resolution description", async () => {
      const response = await request(app)
        .post(`/api/admins/credit-requests/${rejectedRequestId}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          notes: "Test notes",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Resolution");
    });

    it("should only work on admin_rejected requests", async () => {
      const pendingRequest = await createTestCreditRequest("pending_mentor_review");

      const response = await request(app)
        .post(`/api/admins/credit-requests/${pendingRequest.creditRequestId}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolution: "Test resolution",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/admins/credit-requests/analytics", () => {
    it("should get system-wide credit transfer analytics", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalRequests).toBeDefined();
      expect(response.body.data.countsByStatus).toBeDefined();
    });

    it("should support date range filtering", async () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";

      const response = await request(app)
        .get(`/api/admins/credit-requests/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should support department filtering", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/analytics?department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/admins/credit-requests/export", () => {
    it("should export credit transfer report as CSV", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/export?format=csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain("attachment");
    });

    it("should export credit transfer report as JSON", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/export?format=json")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.headers["content-disposition"]).toContain("attachment");
    });

    it("should support filtering in export", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/export?format=csv&status=completed&dateFrom=2024-01-01")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/csv");
    });
  });

  describe("GET /api/admins/credit-requests/bottlenecks", () => {
    it("should get approval pipeline bottleneck analysis", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/bottlenecks")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.bottlenecks).toBeDefined();
      expect(response.body.data.mentorWorkload).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });
  });

  describe("Authorization", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/admins/credit-requests/pending")
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should require admin role", async () => {
      const { student, firebaseUser } = await createTestStudent();
      const studentToken = await getAuthToken(firebaseUser);
      
      const response = await request(app)
        .get("/api/admins/credit-requests/pending")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
