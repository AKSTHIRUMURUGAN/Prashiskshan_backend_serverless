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

describe("Admin Internship Rejection - Task 5.1", () => {
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
  });

  beforeEach(async () => {
    // Create a fresh test internship for each test
    testInternship = await Internship.create({
      internshipId: `INTERN-REJECT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyId: testCompany._id,
      title: "Test Software Engineer Intern",
      description: "Test internship description for rejection",
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

  describe("POST /admins/internships/:id/reject-posting", () => {
    it("should require rejection reason (Requirement 4.1)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("reason");
    });

    it("should reject empty reason string (Requirement 4.1)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "   " })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("reason");
    });

    it("should reject internship with valid reason (Requirement 4.2)", async () => {
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Incomplete job description" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internship).toBeDefined();
      expect(response.body.data.internship.status).toBe("admin_rejected");
    });

    it("should record admin identifier, timestamp, and reason in adminReview (Requirement 4.3)", async () => {
      const rejectionReason = "Missing required skills information";
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: rejectionReason })
        .expect(200);

      const internship = response.body.data.internship;
      expect(internship.adminReview).toBeDefined();
      expect(internship.adminReview.reviewedBy).toBe(adminUser.adminId);
      expect(internship.adminReview.reviewedAt).toBeDefined();
      expect(internship.adminReview.decision).toBe("rejected");
      expect(internship.adminReview.comments).toBe(rejectionReason);
      expect(internship.adminReview.reasons).toContain(rejectionReason);
    });

    it("should add entry to auditTrail (Requirement 4.3)", async () => {
      const rejectionReason = "Audit trail test rejection";
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: rejectionReason })
        .expect(200);

      const internship = response.body.data.internship;
      expect(internship.auditTrail).toBeDefined();
      expect(internship.auditTrail.length).toBeGreaterThan(0);
      
      const latestEntry = internship.auditTrail[internship.auditTrail.length - 1];
      expect(latestEntry.actor).toBe(adminUser.adminId);
      expect(latestEntry.actorRole).toBe("admin");
      expect(latestEntry.action).toBe("rejected");
      expect(latestEntry.fromStatus).toBe("pending_admin_verification");
      expect(latestEntry.toStatus).toBe("admin_rejected");
      expect(latestEntry.reason).toBe(rejectionReason);
    });

    it("should trigger notification to company with rejection reason (Requirement 4.4)", async () => {
      const rejectionReason = "Stipend amount is below minimum requirements";
      await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: rejectionReason })
        .expect(200);

      // Check that notification was created
      const notification = await Notification.findOne({
        userId: testCompany._id,
        type: "internship_rejected",
        "metadata.internshipId": testInternship.internshipId,
      });

      expect(notification).toBeDefined();
      expect(notification.role).toBe("company");
      expect(notification.title).toBe("Internship Rejected");
      expect(notification.message).toContain(testInternship.title);
      expect(notification.message).toContain("rejected");
      expect(notification.message).toContain(rejectionReason);
      expect(notification.priority).toBe("high");
      expect(notification.metadata.reason).toBe(rejectionReason);
    });

    it("should handle multiple predefined reasons (Requirement 4.3)", async () => {
      const mainReason = "Multiple issues found";
      const predefinedReasons = [
        "Incomplete description",
        "Missing eligibility criteria",
        "Unclear responsibilities"
      ];

      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ 
          reason: mainReason,
          reasons: predefinedReasons
        })
        .expect(200);

      const internship = response.body.data.internship;
      expect(internship.adminReview.comments).toBe(mainReason);
      expect(internship.adminReview.reasons).toEqual(predefinedReasons);
    });

    it("should return 404 for non-existent internship", async () => {
      const response = await request(app)
        .post("/admins/internships/NONEXISTENT-ID/reject-posting")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Test rejection" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should require authentication", async () => {
      await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .send({ reason: "Test rejection" })
        .expect(401);
    });

    it("should preserve previous status in audit trail", async () => {
      // First, update the internship to a different status
      testInternship.status = "open_for_applications";
      await testInternship.save();

      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Status preservation test" })
        .expect(200);

      const latestEntry = response.body.data.internship.auditTrail[
        response.body.data.internship.auditTrail.length - 1
      ];
      expect(latestEntry.fromStatus).toBe("open_for_applications");
      expect(latestEntry.toStatus).toBe("admin_rejected");
    });

    it("should handle rejection with long reason text", async () => {
      const longReason = "This is a very detailed rejection reason that explains multiple issues with the internship posting including incomplete job description, missing required skills, unclear responsibilities, inadequate stipend information, and various other compliance issues that need to be addressed before resubmission.";
      
      const response = await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: longReason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internship.adminReview.comments).toBe(longReason);
    });

    it("should include rejection metadata in notification", async () => {
      const rejectionReason = "Metadata test rejection";
      const predefinedReasons = ["reason1", "reason2"];

      await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ 
          reason: rejectionReason,
          reasons: predefinedReasons
        })
        .expect(200);

      const notification = await Notification.findOne({
        userId: testCompany._id,
        type: "internship_rejected",
        "metadata.internshipId": testInternship.internshipId,
      });

      expect(notification.metadata.reviewedBy).toBe(adminUser.adminId);
      expect(notification.metadata.reason).toBe(rejectionReason);
      expect(notification.metadata.reasons).toEqual(predefinedReasons);
    });

    it("should set correct action URL in notification", async () => {
      await request(app)
        .post(`/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Action URL test" })
        .expect(200);

      const notification = await Notification.findOne({
        userId: testCompany._id,
        type: "internship_rejected",
        "metadata.internshipId": testInternship.internshipId,
      });

      expect(notification.actionUrl).toBe(`/company/internships/${testInternship.internshipId}`);
    });
  });
});
