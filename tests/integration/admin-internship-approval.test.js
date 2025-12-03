import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Internship from "../../src/models/Internship.js";
import Company from "../../src/models/Company.js";
import Notification from "../../src/models/Notification.js";
import { createTestAdmin, createTestCompany, getAuthToken } from "../helpers/testHelpers.js";

const app = express();
app.use(express.json());
app.use("/admins", adminRouter);

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Test app error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error"
  });
});

describe("Admin Internship Approval - Task 4.1", () => {
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
    
    // Create one test internship for all tests
    testInternship = await Internship.create({
      internshipId: `INTERN-APPROVE-${Date.now()}`,
      companyId: testCompany._id,
      title: "Test Software Engineer Intern",
      description: "Test internship description for approval",
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
      auditTrail: [],
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testInternship) {
      await Internship.deleteOne({ _id: testInternship._id });
    }
    // Clean up notifications
    await Notification.deleteMany({ 
      "metadata.internshipId": testInternship?.internshipId 
    });
  });

  describe("POST /admins/internships/:id/approve-posting", () => {
    it("should approve a pending internship (Requirement 3.1)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Looks good, approved" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internship).toBeDefined();
      expect(response.body.data.internship.status).toBe("admin_approved");
    });

    it("should record admin identifier and timestamp in adminReview (Requirement 3.2)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Approved with comments" });

      if (response.status !== 200) {
        console.log("Response status:", response.status);
        console.log("Response body:", response.body);
        console.log("Internship ID:", testInternship.internshipId);
      }
      
      expect(response.status).toBe(200);
      const internship = response.body.data.internship;
      expect(internship.adminReview).toBeDefined();
      expect(internship.adminReview.reviewedBy).toBe(adminUser.adminId);
      expect(internship.adminReview.reviewedAt).toBeDefined();
      expect(internship.adminReview.decision).toBe("approved");
      expect(internship.adminReview.comments).toBe("Approved with comments");
    });

    it("should add entry to auditTrail (Requirement 3.2)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Audit trail test" })
        .expect(200);

      const internship = response.body.data.internship;
      expect(internship.auditTrail).toBeDefined();
      expect(internship.auditTrail.length).toBeGreaterThan(0);
      
      const latestEntry = internship.auditTrail[internship.auditTrail.length - 1];
      expect(latestEntry.actor).toBe(adminUser.adminId);
      expect(latestEntry.actorRole).toBe("admin");
      expect(latestEntry.action).toBe("approved");
      expect(latestEntry.fromStatus).toBe("pending_admin_verification");
      expect(latestEntry.toStatus).toBe("admin_approved");
    });

    it("should trigger notification to company (Requirement 3.3)", async () => {
      await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Notification test" })
        .expect(200);

      // Check that notification was created
      const notification = await Notification.findOne({
        userId: testCompany._id,
        type: "internship_approved",
        "metadata.internshipId": testInternship.internshipId,
      });

      expect(notification).toBeDefined();
      expect(notification.role).toBe("company");
      expect(notification.title).toBe("Internship Approved");
      expect(notification.message).toContain(testInternship.title);
      expect(notification.message).toContain("approved");
    });

    it("should make internship visible to students (Requirement 3.4)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Visibility test" })
        .expect(200);

      // Verify status is admin_approved which makes it visible to students
      expect(response.body.data.internship.status).toBe("admin_approved");
      
      // Verify in database
      const updatedInternship = await Internship.findOne({ 
        internshipId: testInternship.internshipId 
      });
      expect(updatedInternship.status).toBe("admin_approved");
    });

    it("should prevent duplicate approval (Requirement 3.5)", async () => {
      // Create a separate internship for this test
      const dupTestInternship = await Internship.create({
        internshipId: `INTERN-DUP-${Date.now()}`,
        companyId: testCompany._id,
        title: "Test Duplicate Approval",
        description: "Test description",
        department: "Computer Science",
        requiredSkills: ["Python"],
        duration: "3 months",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 3,
        slotsRemaining: 3,
        status: "pending_admin_verification",
        postedBy: testCompany.companyId,
        postedAt: new Date(),
        auditTrail: [],
      });

      // First approval
      await request(app)
        .post(`/admins/internships/${dupTestInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "First approval" })
        .expect(200);

      // Second approval attempt should fail
      const response = await request(app)
        .post(`/admins/internships/${dupTestInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Second approval" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already approved");
      
      // Cleanup
      await Internship.deleteOne({ _id: dupTestInternship._id });
    });

    it("should return 404 for non-existent internship", async () => {
      const response = await request(app)
        .post("/admins/internships/NONEXISTENT-ID/approve-posting")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ comments: "Test" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should require authentication", async () => {
      await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/approve-posting`)
        .send({ comments: "Test" })
        .expect(401);
    });

    it("should work without comments", async () => {
      // Create a separate internship for this test
      const noCommentInternship = await Internship.create({
        internshipId: `INTERN-NOCOMMENT-${Date.now()}`,
        companyId: testCompany._id,
        title: "Test No Comment Approval",
        description: "Test description",
        department: "Computer Science",
        requiredSkills: ["Java"],
        duration: "3 months",
        workMode: "onsite",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 2,
        slotsRemaining: 2,
        status: "pending_admin_verification",
        postedBy: testCompany.companyId,
        postedAt: new Date(),
        auditTrail: [],
      });

      const response = await request(app)
        .post(`/admins/internships/${noCommentInternship.internshipId}/approve-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internship.status).toBe("admin_approved");
      
      // Cleanup
      await Internship.deleteOne({ _id: noCommentInternship._id });
    });
  });
});
