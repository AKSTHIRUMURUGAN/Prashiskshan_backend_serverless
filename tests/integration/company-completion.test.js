import request from "supertest";
import express from "express";
import companyRouter from "../../src/routes/company.js";
import { createTestCompany, createTestStudent, getAuthToken } from "../helpers/testHelpers.js";
import InternshipCompletion from "../../src/models/InternshipCompletion.js";
import Internship from "../../src/models/Internship.js";
import Logbook from "../../src/models/Logbook.js";

const app = express();
app.use(express.json());
app.use("/companies", companyRouter);

describe("Company Completion API Endpoints", () => {
  let company, firebaseUser, authToken, student, internship, completion;

  beforeEach(async () => {
    const companyData = await createTestCompany({ status: "verified" });
    company = companyData.company;
    firebaseUser = companyData.firebaseUser;
    authToken = await getAuthToken(firebaseUser);

    const studentData = await createTestStudent();
    student = studentData.student;

    internship = await Internship.create({
      internshipId: `INTERN-${Date.now()}`,
      companyId: company._id,
      title: "Software Development Intern",
      description: "Join our team as a software development intern",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "Node.js"],
      duration: "3 months",
      stipend: 15000,
      location: "Mumbai",
      workMode: "hybrid",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 5,
      status: "approved",
      postedBy: company.companyId,
      postedAt: new Date(),
    });

    // Create approved logbooks (milestone requirement)
    await Logbook.create({
      logbookId: `LOG-${Date.now()}`,
      studentId: student._id,
      internshipId: internship._id,
      companyId: company._id,
      weekNumber: 1,
      startDate: new Date(),
      endDate: new Date(),
      hoursWorked: 40,
      activities: "Test activities for week 1",
      skillsUsed: ["JavaScript"],
      learnings: "Test learnings for week 1",
      status: "approved",
    });

    completion = await InternshipCompletion.create({
      completionId: `COMP-${Date.now()}`,
      studentId: student._id,
      internshipId: internship._id,
      companyId: company._id,
      totalHours: 120,
      creditsEarned: 3,
      completionDate: new Date(),
      status: "pending",
    });
  });

  describe("PUT /companies/completions/:completionId/mark-complete", () => {
    it("should mark internship completion as complete with valid data", async () => {
      const response = await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 8.5,
          evaluationComments: "Excellent performance throughout the internship period",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.companyCompletion).toBeDefined();
      expect(response.body.data.companyCompletion.evaluationScore).toBe(8.5);
      expect(response.body.data.companyCompletion.markedCompleteBy).toBe(company.companyId);
      expect(response.body.data.status).toBe("completed");
    });

    it("should reject marking complete without evaluationScore", async () => {
      const response = await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationComments: "Good work",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject marking complete without evaluationComments", async () => {
      const response = await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 8.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject evaluationScore outside valid range", async () => {
      const response = await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 15,
          evaluationComments: "Excellent work",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject marking complete when no approved logbooks exist", async () => {
      // Delete the approved logbook
      await Logbook.deleteMany({ internshipId: internship._id });

      const response = await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 8.5,
          evaluationComments: "Good work for the internship period",
        });

      expect(response.status).toBe(400);
      // Check that error message contains "milestones" if error field exists
      if (response.body.error) {
        expect(response.body.error).toContain("milestones");
      }
    });

    it("should reject marking complete for non-existent completion", async () => {
      const response = await request(app)
        .put(`/companies/completions/COMP-NONEXISTENT/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 8.5,
          evaluationComments: "Good work for the internship period",
        });

      expect(response.status).toBe(404);
    });

    it("should reject marking complete twice", async () => {
      // Mark complete first time
      await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 8.5,
          evaluationComments: "Excellent performance throughout the internship",
        });

      // Try to mark complete again
      const response = await request(app)
        .put(`/companies/completions/${completion.completionId}/mark-complete`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          evaluationScore: 9.0,
          evaluationComments: "Updated evaluation for the internship",
        });

      expect(response.status).toBe(400);
      // Check that error message contains "already marked" if error field exists
      if (response.body.error) {
        expect(response.body.error).toContain("already marked");
      }
    });
  });

  describe("GET /companies/completions/completed", () => {
    beforeEach(async () => {
      // Mark the completion as complete
      completion.companyCompletion = {
        markedCompleteBy: company.companyId,
        markedCompleteAt: new Date(),
        evaluationScore: 8.5,
        evaluationComments: "Great work",
      };
      completion.status = "completed";
      await completion.save();
    });

    it("should get list of completed internships", async () => {
      const response = await request(app)
        .get("/companies/completions/completed")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completions).toBeDefined();
      expect(Array.isArray(response.body.data.completions)).toBe(true);
      expect(response.body.data.completions.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/companies/completions/completed?page=1&limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it("should return empty list when no completions exist", async () => {
      // Delete all completions
      await InternshipCompletion.deleteMany({ companyId: company._id });

      const response = await request(app)
        .get("/companies/completions/completed")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completions).toEqual([]);
    });
  });
});
