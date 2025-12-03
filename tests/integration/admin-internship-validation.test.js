/**
 * Integration tests for admin internship management input validation and sanitization
 * Tests Requirements: All (Task 22.2)
 */

import request from "supertest";
import app from "../../src/server.js";
import { setupTestDB, teardownTestDB, createTestAdmin, createTestCompany, createTestInternship } from "../helpers/testHelpers.js";

describe("Admin Internship Management - Input Validation and Sanitization", () => {
  let adminToken;
  let adminUser;
  let testCompany;
  let testInternship;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    const adminData = await createTestAdmin();
    adminToken = adminData.token;
    adminUser = adminData.admin;

    const companyData = await createTestCompany();
    testCompany = companyData.company;

    const internshipData = await createTestInternship(testCompany._id);
    testInternship = internshipData.internship;
  });

  describe("Search Query Sanitization", () => {
    it("should sanitize search queries with special regex characters", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ search: "test.*+?^${}()|[]\\special" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject search queries longer than 200 characters", async () => {
      const longSearch = "a".repeat(201);
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ search: longSearch });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("200 characters");
    });

    it("should trim whitespace from search queries", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ search: "  test query  " });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Bulk Operation Size Validation", () => {
    it("should reject bulk operations with more than 100 items", async () => {
      const largeArray = Array(101).fill("INT-123");
      const response = await request(app)
        .post("/api/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: largeArray });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Maximum 100");
    });

    it("should reject bulk operations with empty array", async () => {
      const response = await request(app)
        .post("/api/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("cannot be empty");
    });

    it("should reject bulk operations with non-array input", async () => {
      const response = await request(app)
        .post("/api/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: "not-an-array" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("must be an array");
    });

    it("should reject bulk operations with invalid ID types", async () => {
      const response = await request(app)
        .post("/api/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: [123, null, "", "  "] });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("non-empty strings");
    });

    it("should accept valid bulk operations within limits", async () => {
      const validArray = [testInternship.internshipId];
      const response = await request(app)
        .post("/api/admins/internships/bulk-approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: validArray });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Rejection Reason Validation", () => {
    it("should require rejection reason for single rejection", async () => {
      const response = await request(app)
        .post(`/api/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("reason");
    });

    it("should reject whitespace-only rejection reasons", async () => {
      const response = await request(app)
        .post(`/api/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "   " });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("whitespace");
    });

    it("should reject rejection reasons shorter than 10 characters", async () => {
      const response = await request(app)
        .post(`/api/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "short" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("10");
    });

    it("should reject rejection reasons longer than 2000 characters", async () => {
      const longReason = "a".repeat(2001);
      const response = await request(app)
        .post(`/api/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: longReason });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("2000");
    });

    it("should require rejection reason for bulk rejection", async () => {
      const response = await request(app)
        .post("/api/admins/internships/bulk-reject")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ internshipIds: [testInternship.internshipId] });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("reason");
    });

    it("should accept valid rejection with proper reason", async () => {
      const response = await request(app)
        .post(`/api/admins/internships/${testInternship.internshipId}/reject-posting`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "This internship does not meet our quality standards." });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Edit Validation", () => {
    it("should validate title length on edit", async () => {
      const response = await request(app)
        .patch(`/api/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "abc" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("5");
    });

    it("should validate description length on edit", async () => {
      const response = await request(app)
        .patch(`/api/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ description: "Too short" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("50");
    });

    it("should validate work mode values", async () => {
      const response = await request(app)
        .patch(`/api/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ workMode: "invalid-mode" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("remote");
    });

    it("should validate stipend range", async () => {
      const response = await request(app)
        .patch(`/api/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ stipend: -100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("0");
    });

    it("should validate skills array size", async () => {
      const tooManySkills = Array(21).fill("skill");
      const response = await request(app)
        .patch(`/api/admins/internships/${testInternship.internshipId}/edit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ requiredSkills: tooManySkills });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("20");
    });
  });

  describe("Pagination Validation", () => {
    it("should reject negative page numbers", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("positive integer");
    });

    it("should reject page number of 0", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject limit greater than 100", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ limit: 101 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("100");
    });

    it("should reject limit less than 1", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should accept valid pagination parameters", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Status Filter Validation", () => {
    it("should reject invalid status values", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ status: "invalid_status" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should accept valid status values", async () => {
      const validStatuses = ["pending_admin_verification", "admin_approved", "admin_rejected", "all"];
      
      for (const status of validStatuses) {
        const response = await request(app)
          .get("/api/admins/internships/list")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ status });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe("Work Mode Filter Validation", () => {
    it("should reject invalid work mode values", async () => {
      const response = await request(app)
        .get("/api/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ workMode: "invalid_mode" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should accept valid work mode values", async () => {
      const validModes = ["remote", "onsite", "hybrid"];
      
      for (const workMode of validModes) {
        const response = await request(app)
          .get("/api/admins/internships/list")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ workMode });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe("Date Range Validation", () => {
    it("should reject invalid date formats", async () => {
      const response = await request(app)
        .get("/api/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ dateFrom: "not-a-date" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("ISO date");
    });

    it("should reject date ranges where start is after end", async () => {
      const response = await request(app)
        .get("/api/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ 
          dateFrom: "2024-12-31",
          dateTo: "2024-01-01"
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("before");
    });

    it("should accept valid date ranges", async () => {
      const response = await request(app)
        .get("/api/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ 
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31"
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
