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

describe("Admin Internship Edit - Task 17", () => {
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
      internshipId: `INTERN-EDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyId: testCompany._id,
      title: "Original Software Engineer Intern",
      description: "Original internship description",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "Node.js"],
      optionalSkills: ["React"],
      location: "Mumbai",
      duration: "3 months",
      stipend: 10000,
      workMode: "remote",
      responsibilities: ["Code review", "Testing"],
      learningOpportunities: ["Learn Node.js", "Learn React"],
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 5,
      slotsRemaining: 5,
      status: "admin_approved",
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

  describe("PATCH /admins/internships/:id/edit", () => {
    it("should successfully edit internship details (Requirement 7.2)", async () => {
      const updates = {
        title: "Updated Software Engineer Intern",
        description: "Updated internship description",
        stipend: 15000,
        editReason: "Updating stipend and title"
      };

      const response = await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internship.title).toBe(updates.title);
      expect(response.body.data.internship.description).toBe(updates.description);
      expect(response.body.data.internship.stipend).toBe(updates.stipend);
    });

    it("should record edit in edit history (Requirement 7.3)", async () => {
      const updates = {
        title: "Updated Title",
        editReason: "Testing edit history"
      };

      const response = await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      const updatedInternship = response.body.data.internship;
      expect(updatedInternship.adminReview).toBeDefined();
      expect(updatedInternship.adminReview.editHistory).toBeDefined();
      expect(updatedInternship.adminReview.editHistory.length).toBeGreaterThan(0);
      
      const lastEdit = updatedInternship.adminReview.editHistory[
        updatedInternship.adminReview.editHistory.length - 1
      ];
      expect(lastEdit.editedBy).toBe(adminUser.adminId);
      expect(lastEdit.reason).toBe(updates.editReason);
      expect(lastEdit.changes).toBeDefined();
      expect(lastEdit.changes.title).toBeDefined();
    });

    it("should add entry to audit trail (Requirement 7.3)", async () => {
      const updates = {
        location: "Delhi",
        editReason: "Updating location"
      };

      const response = await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      const updatedInternship = response.body.data.internship;
      expect(updatedInternship.auditTrail).toBeDefined();
      expect(updatedInternship.auditTrail.length).toBeGreaterThan(0);
      
      const lastAudit = updatedInternship.auditTrail[
        updatedInternship.auditTrail.length - 1
      ];
      expect(lastAudit.action).toBe("edited");
      expect(lastAudit.actor).toBe(adminUser.adminId);
      expect(lastAudit.actorRole).toBe("admin");
    });

    it("should send notification to company (Requirement 7.4)", async () => {
      const updates = {
        duration: "6 months",
        editReason: "Extending duration"
      };

      await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      // Check that notification was created
      const notification = await Notification.findOne({
        userId: testCompany._id,
        type: "internship_edited",
        "metadata.internshipId": testInternship.internshipId
      });

      expect(notification).toBeDefined();
      expect(notification.title).toBe("Internship Updated");
      expect(notification.message).toContain("duration");
    });

    it("should preserve approved status when editing (Requirement 7.5)", async () => {
      const updates = {
        title: "New Title",
        editReason: "Testing status preservation"
      };

      const response = await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.internship.status).toBe("admin_approved");
    });

    it("should reject edit without changes", async () => {
      const response = await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ editReason: "No changes" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("No valid changes");
    });

    it("should reject edit for non-existent internship", async () => {
      const response = await request(app)
        .patch(`/admins/internships/NONEXISTENT-ID/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "New Title",
          editReason: "Testing"
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it("should update multiple fields at once", async () => {
      const updates = {
        title: "Full Stack Developer Intern",
        description: "Completely new description",
        requiredSkills: ["Python", "Django", "PostgreSQL"],
        optionalSkills: ["Docker", "Kubernetes"],
        location: "Bangalore",
        duration: "6 months",
        stipend: 20000,
        workMode: "hybrid",
        responsibilities: ["Backend development", "Database design", "API development"],
        learningOpportunities: ["Learn Django", "Learn PostgreSQL", "Learn Docker"],
        editReason: "Complete overhaul of internship details"
      };

      const response = await request(app)
        .patch(`/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      const updatedInternship = response.body.data.internship;
      expect(updatedInternship.title).toBe(updates.title);
      expect(updatedInternship.description).toBe(updates.description);
      expect(updatedInternship.requiredSkills).toEqual(updates.requiredSkills);
      expect(updatedInternship.optionalSkills).toEqual(updates.optionalSkills);
      expect(updatedInternship.location).toBe(updates.location);
      expect(updatedInternship.duration).toBe(updates.duration);
      expect(updatedInternship.stipend).toBe(updates.stipend);
      expect(updatedInternship.workMode).toBe(updates.workMode);
      expect(updatedInternship.responsibilities).toEqual(updates.responsibilities);
      expect(updatedInternship.learningOpportunities).toEqual(updates.learningOpportunities);
    });
  });
});
