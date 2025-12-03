import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Internship from "../../src/models/Internship.js";
import Company from "../../src/models/Company.js";
import Application from "../../src/models/Application.js";
import Student from "../../src/models/Student.js";
import { createTestAdmin, createTestCompany, createTestStudent, getAuthToken } from "../helpers/testHelpers.js";

const app = express();
app.use(express.json());
app.use("/admins", adminRouter);

describe("Admin Internship Detail Endpoint - Task 3.1", () => {
  let adminToken;
  let adminUser;
  let firebaseUser;
  let testCompany;
  let testInternship;
  let testStudent;
  let testApplications = [];

  beforeAll(async () => {
    // Create test admin
    const adminData = await createTestAdmin();
    adminUser = adminData.admin;
    firebaseUser = adminData.firebaseUser;
    adminToken = await getAuthToken(firebaseUser);

    // Create test company with verification status
    const companyData = await createTestCompany({ 
      status: "verified",
      companyName: "Test Tech Corp",
      aiVerification: {
        riskLevel: "low",
        verifiedAt: new Date(),
      }
    });
    testCompany = companyData.company;
  });

  afterAll(async () => {
    // Cleanup
    if (testInternship) {
      await Internship.deleteOne({ _id: testInternship._id });
    }
    for (const app of testApplications) {
      await Application.deleteOne({ _id: app._id });
    }
  });

  describe("GET /admins/internships/:id/details - Basic Functionality (Requirement 2.1)", () => {
    it("should return 401 without authentication", async () => {
      await request(app)
        .get("/admins/internships/INTERN-TEST-123/details")
        .expect(401);
    });
  });

  describe("GET /admins/internships/:id/details - Complete Details (Requirements 2.1-2.5)", () => {
    beforeAll(async () => {
      // Create test student for applications
      const studentData = await createTestStudent({
        department: "Computer Science",
      });
      testStudent = studentData.student;

      // Create test internship with audit trail
      testInternship = await Internship.create({
        internshipId: `INTERN-DETAIL-${Date.now()}`,
        companyId: testCompany._id,
        title: "Full Stack Developer Intern",
        description: "Work on full stack web applications using React and Node.js",
        department: "Computer Science",
        requiredSkills: ["React", "Node.js", "MongoDB"],
        optionalSkills: ["TypeScript", "Docker"],
        duration: "6 months",
        workMode: "hybrid",
        location: "San Francisco, CA",
        stipend: 2000,
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        slots: 5,
        responsibilities: ["Develop features", "Write tests", "Code reviews"],
        learningOpportunities: ["Agile methodology", "CI/CD", "Cloud deployment"],
        status: "admin_approved",
        postedBy: testCompany.companyId,
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        adminReview: {
          reviewedBy: adminUser.adminId,
          reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          decision: "approved",
          comments: "Looks good",
          reasons: [],
          editHistory: [],
        },
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            actor: testCompany.companyId,
            actorRole: "company",
            action: "created",
            fromStatus: "draft",
            toStatus: "pending_admin_verification",
            reason: "Initial submission",
          },
          {
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            actor: adminUser.adminId,
            actorRole: "admin",
            action: "approved",
            fromStatus: "pending_admin_verification",
            toStatus: "admin_approved",
            reason: "Looks good",
          },
        ],
      });

      // Create test applications
      for (let i = 0; i < 3; i++) {
        const application = await Application.create({
          applicationId: `APP-DETAIL-${Date.now()}-${i}`,
          studentId: testStudent._id,
          internshipId: testInternship._id,
          companyId: testCompany._id,
          department: "Computer Science",
          status: "pending",
          coverLetter: `Test cover letter ${i}`,
          appliedAt: new Date(),
        });
        testApplications.push(application);
      }
    });

    it("should return complete internship details", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.internship).toBeDefined();
      
      const internship = response.body.data.internship;
      expect(internship.internshipId).toBe(testInternship.internshipId);
      expect(internship.title).toBe(testInternship.title);
      expect(internship.description).toBe(testInternship.description);
      expect(internship.requiredSkills).toEqual(testInternship.requiredSkills);
      expect(internship.optionalSkills).toEqual(testInternship.optionalSkills);
      expect(internship.responsibilities).toEqual(testInternship.responsibilities);
      expect(internship.learningOpportunities).toEqual(testInternship.learningOpportunities);
      expect(internship.stipend).toBe(testInternship.stipend);
    });

    it("should include company information with verification status (Requirement 2.4)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.company).toBeDefined();
      const company = response.body.data.company;
      
      expect(company.companyId).toBe(testCompany.companyId);
      expect(company.companyName).toBe(testCompany.companyName);
      expect(company.status).toBe(testCompany.status);
      expect(company.verificationStatus).toBe(testCompany.status);
      expect(company.riskLevel).toBe("low");
    });

    it("should include application count (Requirement 2.5)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.applicationCount).toBeDefined();
      expect(response.body.data.applicationCount).toBe(3);
    });

    it("should include review history from audit trail (Requirement 2.2, 8.1)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.reviewHistory).toBeDefined();
      expect(Array.isArray(response.body.data.reviewHistory)).toBe(true);
      expect(response.body.data.reviewHistory.length).toBe(2);
      
      const history = response.body.data.reviewHistory;
      expect(history[0]).toHaveProperty("timestamp");
      expect(history[0]).toHaveProperty("actor");
      expect(history[0]).toHaveProperty("actorRole");
      expect(history[0]).toHaveProperty("action");
      expect(history[0]).toHaveProperty("fromStatus");
      expect(history[0]).toHaveProperty("toStatus");
      expect(history[0]).toHaveProperty("reason");
    });

    it("should include posted date and last modified date (Requirement 2.3)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const internship = response.body.data.internship;
      expect(internship.postedAt).toBeDefined();
      expect(internship.createdAt).toBeDefined();
      expect(internship.updatedAt).toBeDefined();
    });

    it("should include current approval status and review comments (Requirement 2.2)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const internship = response.body.data.internship;
      expect(internship.status).toBe("admin_approved");
      expect(internship.adminReview).toBeDefined();
      expect(internship.adminReview.decision).toBe("approved");
      expect(internship.adminReview.comments).toBe("Looks good");
    });

    it("should return 404 for non-existent internship", async () => {
      const response = await request(app)
        .get("/admins/internships/NONEXISTENT-ID/details")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /admins/internships/:id/details - Edge Cases", () => {
    let internshipNoApplications;

    beforeAll(async () => {
      // Create internship with no applications
      internshipNoApplications = await Internship.create({
        internshipId: `INTERN-NO-APPS-${Date.now()}`,
        companyId: testCompany._id,
        title: "Backend Developer Intern",
        description: "Work on Node.js APIs",
        department: "Computer Science",
        requiredSkills: ["Node.js"],
        duration: "3 months",
        workMode: "remote",
        location: "Remote",
        stipend: 1500,
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        slots: 2,
        status: "pending_admin_verification",
        postedBy: testCompany.companyId,
        postedAt: new Date(),
        auditTrail: [],
      });
    });

    afterAll(async () => {
      if (internshipNoApplications) {
        await Internship.deleteOne({ _id: internshipNoApplications._id });
      }
    });

    it("should handle internship with zero applications", async () => {
      const response = await request(app)
        .get(`/admins/internships/${internshipNoApplications.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.applicationCount).toBe(0);
    });

    it("should handle internship with empty audit trail", async () => {
      const response = await request(app)
        .get(`/admins/internships/${internshipNoApplications.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.reviewHistory).toBeDefined();
      expect(Array.isArray(response.body.data.reviewHistory)).toBe(true);
      expect(response.body.data.reviewHistory.length).toBe(0);
    });
  });
});
