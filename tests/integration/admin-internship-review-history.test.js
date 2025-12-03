import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Internship from "../../src/models/Internship.js";
import Company from "../../src/models/Company.js";
import { createTestAdmin, createTestCompany, getAuthToken } from "../helpers/testHelpers.js";

const app = express();
app.use(express.json());
app.use("/admins", adminRouter);

describe("Admin Internship Review History - Task 10.1", () => {
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
    const companyData = await createTestCompany({ 
      status: "verified",
      companyName: "Test Tech Corp",
    });
    testCompany = companyData.company;
  });

  afterAll(async () => {
    // Cleanup
    if (testInternship) {
      await Internship.deleteOne({ _id: testInternship._id });
    }
  });

  describe("Review History Sorting (Requirement 8.4)", () => {
    beforeAll(async () => {
      // Create test internship with multiple audit trail entries at different times
      const now = Date.now();
      testInternship = await Internship.create({
        internshipId: `INTERN-HISTORY-${now}`,
        companyId: testCompany._id,
        title: "Full Stack Developer Intern",
        description: "Work on full stack web applications",
        department: "Computer Science",
        requiredSkills: ["React", "Node.js"],
        duration: "6 months",
        workMode: "hybrid",
        location: "San Francisco, CA",
        stipend: 2000,
        startDate: new Date(now + 60 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 30 * 24 * 60 * 60 * 1000),
        slots: 5,
        status: "admin_approved",
        postedBy: testCompany.companyId,
        postedAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        auditTrail: [
          {
            timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000),
            actor: testCompany.companyId,
            actorRole: "company",
            action: "created",
            fromStatus: "draft",
            toStatus: "pending_admin_verification",
            reason: "Initial submission",
          },
          {
            timestamp: new Date(now - 8 * 24 * 60 * 60 * 1000),
            actor: adminUser.adminId,
            actorRole: "admin",
            action: "rejected",
            fromStatus: "pending_admin_verification",
            toStatus: "admin_rejected",
            reason: "Missing information",
          },
          {
            timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000),
            actor: testCompany.companyId,
            actorRole: "company",
            action: "resubmitted",
            fromStatus: "admin_rejected",
            toStatus: "pending_admin_verification",
            reason: "Added missing information",
          },
          {
            timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000),
            actor: adminUser.adminId,
            actorRole: "admin",
            action: "approved",
            fromStatus: "pending_admin_verification",
            toStatus: "admin_approved",
            reason: "Looks good now",
          },
          {
            timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
            actor: adminUser.adminId,
            actorRole: "admin",
            action: "edited",
            fromStatus: "admin_approved",
            toStatus: "admin_approved",
            reason: "Minor corrections",
            metadata: { fields: ["description"] },
          },
        ],
      });
    });

    it("should return review history sorted by timestamp descending (newest first)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewHistory).toBeDefined();
      expect(Array.isArray(response.body.data.reviewHistory)).toBe(true);
      expect(response.body.data.reviewHistory.length).toBe(5);
      
      const history = response.body.data.reviewHistory;
      
      // Verify sorting - newest first
      for (let i = 0; i < history.length - 1; i++) {
        const currentTimestamp = new Date(history[i].timestamp).getTime();
        const nextTimestamp = new Date(history[i + 1].timestamp).getTime();
        expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
      }
      
      // Verify the order of actions (newest to oldest)
      expect(history[0].action).toBe("edited");
      expect(history[1].action).toBe("approved");
      expect(history[2].action).toBe("resubmitted");
      expect(history[3].action).toBe("rejected");
      expect(history[4].action).toBe("created");
    });

    it("should include all review cycles for resubmitted internships (Requirement 8.3)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const history = response.body.data.reviewHistory;
      
      // Should include all cycles: created -> rejected -> resubmitted -> approved -> edited
      expect(history.length).toBe(5);
      
      // Verify all review cycles are present
      const actions = history.map(entry => entry.action);
      expect(actions).toContain("created");
      expect(actions).toContain("rejected");
      expect(actions).toContain("resubmitted");
      expect(actions).toContain("approved");
      expect(actions).toContain("edited");
    });

    it("should include complete information for each audit entry (Requirement 8.1, 8.2)", async () => {
      const response = await request(app)
        .get(`/admins/internships/${testInternship.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const history = response.body.data.reviewHistory;
      
      // Verify each entry has complete information
      history.forEach(entry => {
        expect(entry).toHaveProperty("timestamp");
        expect(entry).toHaveProperty("actor");
        expect(entry).toHaveProperty("actorRole");
        expect(entry).toHaveProperty("action");
        expect(entry).toHaveProperty("fromStatus");
        expect(entry).toHaveProperty("toStatus");
        expect(entry).toHaveProperty("reason");
        
        // Verify timestamp is valid
        expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
        
        // Verify actor and actorRole are present
        expect(entry.actor).toBeTruthy();
        expect(entry.actorRole).toBeTruthy();
      });
      
      // Verify metadata is included when present
      const editEntry = history.find(entry => entry.action === "edited");
      expect(editEntry.metadata).toBeDefined();
      expect(editEntry.metadata.fields).toEqual(["description"]);
    });
  });

  describe("Empty Audit Trail Handling (Requirement 8.5)", () => {
    let internshipNoHistory;

    beforeAll(async () => {
      // Create internship with empty audit trail
      internshipNoHistory = await Internship.create({
        internshipId: `INTERN-NO-HISTORY-${Date.now()}`,
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
      if (internshipNoHistory) {
        await Internship.deleteOne({ _id: internshipNoHistory._id });
      }
    });

    it("should handle empty audit trail gracefully", async () => {
      const response = await request(app)
        .get(`/admins/internships/${internshipNoHistory.internshipId}/details`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewHistory).toBeDefined();
      expect(Array.isArray(response.body.data.reviewHistory)).toBe(true);
      expect(response.body.data.reviewHistory.length).toBe(0);
    });
  });
});
