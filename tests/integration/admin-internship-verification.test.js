import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Internship from "../../src/models/Internship.js";
import { createTestAdmin, createTestCompany, getAuthToken } from "../helpers/testHelpers.js";

const app = express();
app.use(express.json());
app.use("/admins", adminRouter);

describe("Admin Internship Verification Endpoints", () => {
  let adminToken;
  let adminUser;
  let firebaseUser;
  let testCompany;
  let testInternship;

  beforeAll(async () => {
    // Create test admin
    const adminData = await createTestAdmin();
    adminUser = adminData.admin;
    firebaseUser = adminData.firebaseUser;
    adminToken = await getAuthToken(firebaseUser);

    // Create test company
    const companyData = await createTestCompany({ status: "verified" });
    testCompany = companyData.company;

    // Create test internship
    testInternship = await Internship.create({
      internshipId: `INTERN-TEST-${Date.now()}`,
      companyId: testCompany._id,
      title: "Test Software Engineer Intern",
      description: "Test internship description",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "Node.js"],
      duration: "3 months",
      workMode: "remote",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 5,
      slotsRemaining: 5,
      status: "pending_admin_verification",
      postedBy: testCompany.companyId,
      postedAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testInternship) await Internship.deleteOne({ _id: testInternship._id });
  });

  describe("GET /admin/internships/pending", () => {
    it("should list pending internship verifications", async () => {
      const response = await request(app)
        .get("/admins/internships/pending")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should filter by department", async () => {
      const response = await request(app)
        .get("/admins/internships/pending?department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      await request(app)
        .get("/admins/internships/pending")
        .expect(401);
    });
  });

  describe("GET /admin/internships/:id", () => {
    it("should get internship details with company history", async () => {
      const response = await request(app)
        .get(`/admin/internships/${testInternship.internshipId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internship).toBeDefined();
      expect(response.body.data.company).toBeDefined();
      expect(response.body.data.companyHistory).toBeDefined();
    });

    it("should return 404 for non-existent internship", async () => {
      await request(app)
        .get("/admins/internships/NONEXISTENT")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("POST /admin/internships/:id/approve", () => {
    it("should approve an internship", async () => {
      const response = await request(app)
        .post(`/admin/internships/${testInternship.internshipId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Looks good" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("admin_approved");
      expect(response.body.data.adminReview).toBeDefined();
      expect(response.body.data.adminReview.decision).toBe("approved");
    });

    it("should require authentication", async () => {
      await request(app)
        .post(`/admin/internships/${testInternship.internshipId}/approve`)
        .send({ comments: "Test" })
        .expect(401);
    });
  });

  describe("POST /admin/internships/:id/reject", () => {
    let rejectInternship;

    beforeEach(async () => {
      // Create a new internship for rejection test
      rejectInternship = await Internship.create({
        internshipId: `INTERN-REJECT-${Date.now()}`,
        companyId: testCompany._id,
        title: "Test Internship to Reject",
        description: "Test description",
        department: "Computer Science",
        requiredSkills: ["Python"],
        duration: "3 months",
        workMode: "onsite",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 3,
        slotsRemaining: 3,
        status: "pending_admin_verification",
        postedBy: testCompany.companyId,
        postedAt: new Date(),
      });
    });

    afterEach(async () => {
      if (rejectInternship) {
        await Internship.deleteOne({ _id: rejectInternship._id });
      }
    });

    it("should reject an internship with reasons", async () => {
      const response = await request(app)
        .post(`/admin/internships/${rejectInternship.internshipId}/reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reasons: ["Insufficient details", "Unclear requirements"] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("admin_rejected");
      expect(response.body.data.adminReview).toBeDefined();
      expect(response.body.data.adminReview.decision).toBe("rejected");
      expect(response.body.data.adminReview.reasons).toEqual([
        "Insufficient details",
        "Unclear requirements",
      ]);
    });

    it("should require at least one rejection reason", async () => {
      await request(app)
        .post(`/admin/internships/${rejectInternship.internshipId}/reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reasons: [] })
        .expect(400);
    });
  });

  describe("GET /admin/analytics", () => {
    it("should get system-wide analytics", async () => {
      const response = await request(app)
        .get("/admins/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.companies).toBeDefined();
      expect(response.body.data.departments).toBeDefined();
      expect(response.body.data.mentors).toBeDefined();
    });

    it("should support date range filtering", async () => {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const response = await request(app)
        .get(`/admin/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBeDefined();
    });
  });

  describe("GET /admin/analytics/companies", () => {
    it("should get company performance metrics", async () => {
      const response = await request(app)
        .get("/admins/analytics/companies")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(Array.isArray(response.body.data.metrics)).toBe(true);
    });

    it("should support sorting by different fields", async () => {
      const response = await request(app)
        .get("/admins/analytics/companies?sortBy=internshipsPosted")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /admin/analytics/departments", () => {
    it("should get all department performance metrics", async () => {
      const response = await request(app)
        .get("/admins/analytics/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.departments).toBeDefined();
      expect(Array.isArray(response.body.data.departments)).toBe(true);
    });

    it("should get specific department analytics", async () => {
      const response = await request(app)
        .get("/admins/analytics/departments?department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.department).toBe("Computer Science");
    });
  });

  describe("GET /admin/analytics/mentors", () => {
    it("should get mentor performance metrics", async () => {
      const response = await request(app)
        .get("/admins/analytics/mentors")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(Array.isArray(response.body.data.metrics)).toBe(true);
    });

    it("should filter by department", async () => {
      const response = await request(app)
        .get("/admins/analytics/mentors?department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /admin/analytics/students", () => {
    it("should get student performance metrics", async () => {
      const response = await request(app)
        .get("/admins/analytics/students")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.overallStats).toBeDefined();
    });

    it("should support filtering by department", async () => {
      const response = await request(app)
        .get("/admins/analytics/students?department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/admins/analytics/students?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });
});
