import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Admin from "../../src/models/Admin.js";
import Company from "../../src/models/Company.js";
import Internship from "../../src/models/Internship.js";
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

describe("Admin Internship Bulk Operations", () => {
  let adminToken;
  let adminUser;
  let firebaseUser;
  let testCompany;
  let testInternships = [];

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
    // Create test internships for each test
    testInternships = [];
    for (let i = 0; i < 5; i++) {
      const internship = await Internship.create({
        internshipId: `INT-${Date.now()}-${i}`,
        title: `Test Internship ${i}`,
        companyId: testCompany._id,
        description: "Test description",
        requiredSkills: ["JavaScript"],
        location: "Remote",
        duration: "3 months",
        stipend: 10000,
        status: "pending_admin_verification",
        department: "Computer Science",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 5,
        postedBy: testCompany.companyId,
        postedAt: new Date(),
        auditTrail: [],
      });
      testInternships.push(internship);
    }
  });

  afterEach(async () => {
    // Clean up test internships
    await Internship.deleteMany({
      _id: { $in: testInternships.map(i => i._id) },
    });
    await Notification.deleteMany({
      userId: testCompany._id,
    });
    testInternships = [];
  });

  afterAll(async () => {
    await Admin.deleteOne({ _id: adminUser._id });
    await Company.deleteOne({ _id: testCompany._id });
  });

  describe("POST /admins/internships/bulk-approve", () => {
    it("should bulk approve multiple internships", async () => {
      const internshipIds = testInternships.map(i => i.internshipId);

      const response = await request(app)
        .post("/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(5);
      expect(response.body.data.failed).toHaveLength(0);

      // Verify internships are approved
      for (const internshipId of internshipIds) {
        const internship = await Internship.findOne({ internshipId });
        expect(internship.status).toBe("admin_approved");
        expect(internship.adminReview.reviewedBy).toBe(adminUser.adminId);
        expect(internship.adminReview.decision).toBe("approved");
      }

      // Verify notifications were sent
      const notifications = await Notification.find({
        userId: testCompany._id,
        type: "internship_approved",
      });
      expect(notifications).toHaveLength(5);
    });

    it("should handle partial failures gracefully", async () => {
      const internshipIds = [
        testInternships[0].internshipId,
        "INVALID-ID",
        testInternships[1].internshipId,
      ];

      const response = await request(app)
        .post("/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(1);
      expect(response.body.data.failed[0].internshipId).toBe("INVALID-ID");
      expect(response.body.data.failed[0].error).toBe("Internship not found");
    });

    it("should reject already approved internships", async () => {
      // Approve first internship
      const firstInternship = testInternships[0];
      firstInternship.status = "admin_approved";
      await firstInternship.save();

      const internshipIds = [
        firstInternship.internshipId,
        testInternships[1].internshipId,
      ];

      const response = await request(app)
        .post("/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds })
        .expect(200);

      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
      expect(response.body.data.failed[0].error).toBe("Already approved");
    });

    it("should reject empty internshipIds array", async () => {
      const response = await request(app)
        .post("/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject requests exceeding 100 internships", async () => {
      const internshipIds = Array(101).fill("INT-TEST");

      const response = await request(app)
        .post("/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Maximum 100");
    });

    it("should require admin authentication", async () => {
      const response = await request(app)
        .post("/admins/internships/bulk-approve")
        .send({ internshipIds: ["INT-TEST"] })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /admins/internships/bulk-reject", () => {
    it("should bulk reject multiple internships with reason", async () => {
      const internshipIds = testInternships.map(i => i.internshipId);
      const reason = "Does not meet quality standards";

      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds, reason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(5);
      expect(response.body.data.failed).toHaveLength(0);

      // Verify internships are rejected
      for (const internshipId of internshipIds) {
        const internship = await Internship.findOne({ internshipId });
        expect(internship.status).toBe("admin_rejected");
        expect(internship.adminReview.reviewedBy).toBe(adminUser.adminId);
        expect(internship.adminReview.decision).toBe("rejected");
        expect(internship.adminReview.comments).toBe(reason);
        expect(internship.adminReview.reasons).toContain(reason);
      }

      // Verify notifications were sent with rejection reason
      const notifications = await Notification.find({
        userId: testCompany._id,
        type: "internship_rejected",
      });
      expect(notifications).toHaveLength(5);
      notifications.forEach(notif => {
        expect(notif.message).toContain(reason);
      });
    });

    it("should require rejection reason", async () => {
      const internshipIds = testInternships.map(i => i.internshipId);

      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("reason is required");
    });

    it("should reject empty reason string", async () => {
      const internshipIds = testInternships.map(i => i.internshipId);

      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds, reason: "   " })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("reason is required");
    });

    it("should handle partial failures gracefully", async () => {
      const internshipIds = [
        testInternships[0].internshipId,
        "INVALID-ID",
        testInternships[1].internshipId,
      ];
      const reason = "Invalid posting";

      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds, reason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(1);
      expect(response.body.data.failed[0].internshipId).toBe("INVALID-ID");
      expect(response.body.data.failed[0].error).toBe("Internship not found");
    });

    it("should reject empty internshipIds array", async () => {
      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: [], reason: "Test reason" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject requests exceeding 100 internships", async () => {
      const internshipIds = Array(101).fill("INT-TEST");

      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds, reason: "Test reason" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Maximum 100");
    });

    it("should require admin authentication", async () => {
      const response = await request(app)
        .post("/admins/internships/bulk-reject")
        .send({ internshipIds: ["INT-TEST"], reason: "Test" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should add audit trail entries for bulk rejection", async () => {
      const internshipIds = [testInternships[0].internshipId];
      const reason = "Quality issues";

      await request(app)
        .post("/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds, reason })
        .expect(200);

      const internship = await Internship.findOne({
        internshipId: internshipIds[0],
      });

      expect(internship.auditTrail).toHaveLength(1);
      expect(internship.auditTrail[0].action).toBe("bulk_rejected");
      expect(internship.auditTrail[0].actor).toBe(adminUser.adminId);
      expect(internship.auditTrail[0].reason).toBe(reason);
      expect(internship.auditTrail[0].fromStatus).toBe("pending_admin_verification");
      expect(internship.auditTrail[0].toStatus).toBe("admin_rejected");
    });
  });
});
