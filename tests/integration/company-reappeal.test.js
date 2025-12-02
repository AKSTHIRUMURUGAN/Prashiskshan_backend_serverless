import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import Company from "../../src/models/Company.js";
import Notification from "../../src/models/Notification.js";
import companyRoutes from "../../src/routes/company.js";
import adminRoutes from "../../src/routes/admin.js";
import { authenticate, identifyUser, authorize } from "../../src/middleware/auth.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { createTestCompany, createTestAdmin, getAuthToken } from "../helpers/testHelpers.js";

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/companies", companyRoutes);
  app.use("/api/admins", adminRoutes);
  app.use(errorHandler);
  return app;
};

describe("Company Reappeal Endpoints", () => {
  let app;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test");
    }
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Company.deleteMany({});
    await Notification.deleteMany({});
  });

  describe("POST /api/companies/reappeal", () => {
    it("should reject reappeal submission from non-blocked company", async () => {
      const { company, firebaseUser } = await createTestCompany({ status: "verified" });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .post("/api/companies/reappeal")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "This is a valid reappeal message with sufficient length" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Only blocked companies can submit reappeals");
    });

    it("should reject reappeal without message", async () => {
      const { company, firebaseUser } = await createTestCompany({ status: "blocked" });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .post("/api/companies/reappeal")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("message is required");
    });

    it("should reject reappeal with message too short", async () => {
      const { company, firebaseUser } = await createTestCompany({ status: "blocked" });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .post("/api/companies/reappeal")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Short" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("between 10 and 2000 characters");
    });

    it("should accept valid reappeal submission", async () => {
      const { company, firebaseUser } = await createTestCompany({
        status: "blocked",
        blockInfo: {
          reason: "Policy violation",
          blockedBy: "admin123",
          blockedAt: new Date(),
        },
      });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .post("/api/companies/reappeal")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "This is a valid reappeal message with sufficient length to meet requirements" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("reappeal");

      // Verify database update
      const updatedCompany = await Company.findById(company._id);
      expect(updatedCompany.status).toBe("reappeal");
      expect(updatedCompany.reappeal.message).toBe("This is a valid reappeal message with sufficient length to meet requirements");
      expect(updatedCompany.blockInfo.reason).toBe("Policy violation");
    });

    it("should reject reappeal during cooldown period", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const { company, firebaseUser } = await createTestCompany({
        status: "blocked",
        reappeal: {
          cooldownEndsAt: futureDate,
        },
      });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .post("/api/companies/reappeal")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "This is a valid reappeal message with sufficient length" });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Cannot submit reappeal until");
    });
  });

  describe("GET /api/companies/reappeal/status", () => {
    it("should return reappeal status for blocked company", async () => {
      const { company, firebaseUser } = await createTestCompany({
        status: "blocked",
        blockInfo: {
          reason: "Policy violation",
          blockedBy: "admin123",
          blockedAt: new Date(),
        },
      });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .get("/api/companies/reappeal/status")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("blocked");
      expect(response.body.data.blockReason).toBe("Policy violation");
      expect(response.body.data.canReappeal).toBe(true);
    });

    it("should indicate canReappeal false during cooldown", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const { company, firebaseUser } = await createTestCompany({
        status: "blocked",
        reappeal: {
          cooldownEndsAt: futureDate,
        },
      });
      const token = await getAuthToken(firebaseUser);

      const response = await request(app)
        .get("/api/companies/reappeal/status")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.canReappeal).toBe(false);
      expect(response.body.data.cooldownEndsAt).toBeTruthy();
    });
  });

  describe("Admin Reappeal Management", () => {
    describe("GET /api/admins/reappeals", () => {
      it("should return all companies with reappeal status", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        // Create companies with different statuses
        await createTestCompany({
          status: "reappeal",
          blockInfo: {
            reason: "Policy violation",
            blockedBy: admin.adminId,
            blockedAt: new Date(),
          },
          reappeal: {
            message: "We have addressed the policy violations and implemented new procedures",
            submittedAt: new Date(),
          },
        });

        await createTestCompany({
          status: "blocked",
          blockInfo: {
            reason: "Fraud",
            blockedBy: admin.adminId,
            blockedAt: new Date(),
          },
        });

        await createTestCompany({ status: "verified" });

        const response = await request(app)
          .get("/api/admins/reappeals")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.reappeals).toHaveLength(1);
        expect(response.body.data.reappeals[0].blockReason).toBe("Policy violation");
        expect(response.body.data.reappeals[0].reappealMessage).toBe("We have addressed the policy violations and implemented new procedures");
      });

      it("should filter reappeals by date range", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

        await createTestCompany({
          status: "reappeal",
          reappeal: {
            message: "Old reappeal",
            submittedAt: oldDate,
          },
        });

        await createTestCompany({
          status: "reappeal",
          reappeal: {
            message: "Recent reappeal",
            submittedAt: recentDate,
          },
        });

        const dateFrom = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

        const response = await request(app)
          .get("/api/admins/reappeals")
          .query({ dateFrom })
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.reappeals).toHaveLength(1);
        expect(response.body.data.reappeals[0].reappealMessage).toBe("Recent reappeal");
      });

      it("should filter reappeals by company name search", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        await createTestCompany({
          companyName: "TechCorp Solutions",
          status: "reappeal",
          reappeal: {
            message: "Reappeal from TechCorp",
            submittedAt: new Date(),
          },
        });

        await createTestCompany({
          companyName: "Business Ventures",
          status: "reappeal",
          reappeal: {
            message: "Reappeal from Business",
            submittedAt: new Date(),
          },
        });

        const response = await request(app)
          .get("/api/admins/reappeals")
          .query({ search: "TechCorp" })
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.reappeals).toHaveLength(1);
        expect(response.body.data.reappeals[0].companyName).toBe("TechCorp Solutions");
      });
    });

    describe("POST /api/admins/reappeals/:companyId/approve", () => {
      it("should approve reappeal and change status to verified", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const { company } = await createTestCompany({
          status: "reappeal",
          blockInfo: {
            reason: "Policy violation",
            blockedBy: admin.adminId,
            blockedAt: new Date(),
          },
          reappeal: {
            message: "We have addressed all issues",
            submittedAt: new Date(),
          },
        });

        const response = await request(app)
          .post(`/api/admins/reappeals/${company.companyId}/approve`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ feedback: "All issues resolved, approved" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.newStatus).toBe("verified");

        // Verify database update
        const updatedCompany = await Company.findById(company._id);
        expect(updatedCompany.status).toBe("verified");
        expect(updatedCompany.reappeal.reviewedBy).toBe(admin.adminId);
        expect(updatedCompany.reappeal.reviewFeedback).toBe("All issues resolved, approved");
        expect(updatedCompany.reappeal.history).toHaveLength(1);
        expect(updatedCompany.reappeal.history[0].decision).toBe("approved");
        expect(updatedCompany.blockInfo).toBeUndefined();

        // Verify notification was sent
        const notification = await Notification.findOne({ userId: company._id });
        expect(notification).toBeTruthy();
        expect(notification.type).toBe("reappeal_approved");
      });

      it("should reject approval for non-reappeal status", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const { company } = await createTestCompany({ status: "blocked" });

        const response = await request(app)
          .post(`/api/admins/reappeals/${company.companyId}/approve`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ feedback: "Approved" });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("not in reappeal status");
      });

      it("should return 404 for non-existent company", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const response = await request(app)
          .post("/api/admins/reappeals/COM-NONEXISTENT/approve")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ feedback: "Approved" });

        expect(response.status).toBe(404);
        expect(response.body.error).toContain("Company not found");
      });
    });

    describe("POST /api/admins/reappeals/:companyId/reject", () => {
      it("should reject reappeal and set cooldown period", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const { company } = await createTestCompany({
          status: "reappeal",
          blockInfo: {
            reason: "Policy violation",
            blockedBy: admin.adminId,
            blockedAt: new Date(),
          },
          reappeal: {
            message: "We have addressed all issues",
            submittedAt: new Date(),
          },
        });

        const response = await request(app)
          .post(`/api/admins/reappeals/${company.companyId}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ reason: "Issues not adequately addressed", cooldownDays: 45 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("blocked");
        expect(response.body.data.cooldownEndsAt).toBeTruthy();

        // Verify database update
        const updatedCompany = await Company.findById(company._id);
        expect(updatedCompany.status).toBe("blocked");
        expect(updatedCompany.reappeal.reviewedBy).toBe(admin.adminId);
        expect(updatedCompany.reappeal.rejectionReason).toBe("Issues not adequately addressed");
        expect(updatedCompany.reappeal.cooldownEndsAt).toBeTruthy();
        expect(updatedCompany.reappeal.history).toHaveLength(1);
        expect(updatedCompany.reappeal.history[0].decision).toBe("rejected");

        // Verify cooldown is approximately 45 days
        const cooldownDiff = updatedCompany.reappeal.cooldownEndsAt - new Date();
        const daysDiff = cooldownDiff / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeGreaterThan(44);
        expect(daysDiff).toBeLessThan(46);

        // Verify notification was sent
        const notification = await Notification.findOne({ userId: company._id });
        expect(notification).toBeTruthy();
        expect(notification.type).toBe("reappeal_rejected");
      });

      it("should use default cooldown of 30 days if not specified", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const { company } = await createTestCompany({
          status: "reappeal",
          reappeal: {
            message: "We have addressed all issues",
            submittedAt: new Date(),
          },
        });

        const response = await request(app)
          .post(`/api/admins/reappeals/${company.companyId}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ reason: "Issues not adequately addressed" });

        expect(response.status).toBe(200);

        const updatedCompany = await Company.findById(company._id);
        const cooldownDiff = updatedCompany.reappeal.cooldownEndsAt - new Date();
        const daysDiff = cooldownDiff / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeGreaterThan(29);
        expect(daysDiff).toBeLessThan(31);
      });

      it("should require rejection reason", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const { company } = await createTestCompany({
          status: "reappeal",
          reappeal: {
            message: "We have addressed all issues",
            submittedAt: new Date(),
          },
        });

        const response = await request(app)
          .post(`/api/admins/reappeals/${company.companyId}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Rejection reason is required");
      });

      it("should reject rejection for non-reappeal status", async () => {
        const { admin, firebaseUser: adminUser } = await createTestAdmin();
        const adminToken = await getAuthToken(adminUser);

        const { company } = await createTestCompany({ status: "verified" });

        const response = await request(app)
          .post(`/api/admins/reappeals/${company.companyId}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ reason: "Not good enough" });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("not in reappeal status");
      });
    });
  });
});
