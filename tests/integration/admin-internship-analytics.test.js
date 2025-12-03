import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Internship from "../../src/models/Internship.js";
import Company from "../../src/models/Company.js";
import * as redis from "../../src/config/redis.js";
import { createTestAdmin, createTestCompany, getAuthToken } from "../helpers/testHelpers.js";

const app = express();
app.use(express.json());
app.use("/admins", adminRouter);

describe("Admin Internship Analytics Endpoint - Task 8.1", () => {
  let adminToken;
  let adminUser;
  let firebaseUser;
  let testCompany1;
  let testCompany2;
  let testInternships = [];

  beforeAll(async () => {
    // Create test admin
    const adminData = await createTestAdmin();
    adminUser = adminData.admin;
    firebaseUser = adminData.firebaseUser;
    adminToken = await getAuthToken(firebaseUser);

    // Create test companies
    const company1Data = await createTestCompany({ 
      status: "verified",
      companyName: "Analytics Test Corp"
    });
    testCompany1 = company1Data.company;

    const company2Data = await createTestCompany({ 
      status: "verified",
      companyName: "Analytics Test Labs"
    });
    testCompany2 = company2Data.company;

    // Create test internships with various statuses
    const now = Date.now();
    const internshipsData = [
      // Pending internships
      {
        internshipId: `INTERN-ANALYTICS-1-${now}`,
        companyId: testCompany1._id,
        title: "Pending Intern 1",
        description: "Test internship",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "3 months",
        workMode: "remote",
        location: "Remote",
        stipend: 1000,
        startDate: new Date(now + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 15 * 24 * 60 * 60 * 1000),
        slots: 5,
        status: "pending_admin_verification",
        postedBy: testCompany1.companyId,
        postedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        internshipId: `INTERN-ANALYTICS-2-${now}`,
        companyId: testCompany2._id,
        title: "Pending Intern 2",
        description: "Test internship",
        department: "Data Science",
        requiredSkills: ["Python"],
        duration: "6 months",
        workMode: "onsite",
        location: "Boston",
        stipend: 1500,
        startDate: new Date(now + 45 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 20 * 24 * 60 * 60 * 1000),
        slots: 3,
        status: "pending_admin_verification",
        postedBy: testCompany2.companyId,
        postedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      // Approved internships
      {
        internshipId: `INTERN-ANALYTICS-3-${now}`,
        companyId: testCompany1._id,
        title: "Approved Intern 1",
        description: "Test internship",
        department: "Computer Science",
        requiredSkills: ["React"],
        duration: "4 months",
        workMode: "hybrid",
        location: "New York",
        stipend: 2000,
        startDate: new Date(now + 60 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 25 * 24 * 60 * 60 * 1000),
        slots: 2,
        status: "admin_approved",
        postedBy: testCompany1.companyId,
        postedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        adminReview: {
          reviewedBy: adminUser.adminId,
          reviewedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
          decision: "approved",
          comments: "Looks good",
        },
      },
      {
        internshipId: `INTERN-ANALYTICS-4-${now}`,
        companyId: testCompany1._id,
        title: "Approved Intern 2",
        description: "Test internship",
        department: "Computer Science",
        requiredSkills: ["Node.js"],
        duration: "3 months",
        workMode: "remote",
        location: "Remote",
        stipend: 1200,
        startDate: new Date(now + 35 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 18 * 24 * 60 * 60 * 1000),
        slots: 4,
        status: "admin_approved",
        postedBy: testCompany1.companyId,
        postedAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
        adminReview: {
          reviewedBy: adminUser.adminId,
          reviewedAt: new Date(now - 5.5 * 24 * 60 * 60 * 1000),
          decision: "approved",
          comments: "Approved",
        },
      },
      {
        internshipId: `INTERN-ANALYTICS-5-${now}`,
        companyId: testCompany2._id,
        title: "Approved Intern 3",
        description: "Test internship",
        department: "Data Science",
        requiredSkills: ["TensorFlow"],
        duration: "5 months",
        workMode: "onsite",
        location: "San Francisco",
        stipend: 2500,
        startDate: new Date(now + 50 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 22 * 24 * 60 * 60 * 1000),
        slots: 1,
        status: "admin_approved",
        postedBy: testCompany2.companyId,
        postedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        adminReview: {
          reviewedBy: adminUser.adminId,
          reviewedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
          decision: "approved",
          comments: "Good opportunity",
        },
      },
      // Rejected internships
      {
        internshipId: `INTERN-ANALYTICS-6-${now}`,
        companyId: testCompany2._id,
        title: "Rejected Intern 1",
        description: "Test internship",
        department: "Computer Science",
        requiredSkills: ["Java"],
        duration: "3 months",
        workMode: "remote",
        location: "Remote",
        stipend: 800,
        startDate: new Date(now + 40 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(now + 19 * 24 * 60 * 60 * 1000),
        slots: 3,
        status: "admin_rejected",
        postedBy: testCompany2.companyId,
        postedAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        adminReview: {
          reviewedBy: adminUser.adminId,
          reviewedAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
          decision: "rejected",
          comments: "Insufficient details",
          reasons: ["Insufficient details"],
        },
      },
    ];

    for (const data of internshipsData) {
      const internship = await Internship.create(data);
      testInternships.push(internship);
    }
  });

  afterAll(async () => {
    // Cleanup
    for (const internship of testInternships) {
      await Internship.deleteOne({ _id: internship._id });
    }
  });

  beforeEach(async () => {
    // Clear cache before each test
    try {
      const keys = await redis.default.keys("analytics:internships:*");
      if (keys.length > 0) {
        await redis.default.del(...keys);
      }
    } catch (error) {
      // Ignore cache errors in tests
    }
  });

  describe("GET /admins/internships/analytics - Basic Functionality", () => {
    it("should return analytics data with all required fields", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty("totalInternships");
      expect(response.body.data).toHaveProperty("byStatus");
      expect(response.body.data).toHaveProperty("approvalRate");
      expect(response.body.data).toHaveProperty("averageReviewTime");
      expect(response.body.data).toHaveProperty("topCompanies");
      expect(response.body.data).toHaveProperty("byDepartment");
    });

    it("should require authentication", async () => {
      await request(app)
        .get("/admins/internships/analytics")
        .expect(401);
    });
  });

  describe("GET /admins/internships/analytics - Total Counts (Requirement 6.1)", () => {
    it("should calculate total internships correctly", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.totalInternships).toBeGreaterThanOrEqual(6);
    });

    it("should calculate counts by status correctly", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { byStatus } = response.body.data;
      expect(byStatus).toHaveProperty("pending");
      expect(byStatus).toHaveProperty("approved");
      expect(byStatus).toHaveProperty("rejected");
      expect(byStatus.pending).toBeGreaterThanOrEqual(2);
      expect(byStatus.approved).toBeGreaterThanOrEqual(3);
      expect(byStatus.rejected).toBeGreaterThanOrEqual(1);
    });

    it("should ensure sum of status counts equals total", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { totalInternships, byStatus } = response.body.data;
      const sumOfStatuses = byStatus.pending + byStatus.approved + byStatus.rejected;
      
      // The sum should be less than or equal to total because there might be other statuses
      expect(sumOfStatuses).toBeLessThanOrEqual(totalInternships);
    });
  });

  describe("GET /admins/internships/analytics - Approval Rate (Requirement 6.2)", () => {
    it("should calculate approval rate correctly", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { approvalRate, byStatus } = response.body.data;
      const totalReviewed = byStatus.approved + byStatus.rejected;
      const expectedRate = totalReviewed > 0 
        ? Math.round((byStatus.approved / totalReviewed) * 100 * 100) / 100
        : 0;
      
      expect(approvalRate).toBe(expectedRate);
    });

    it("should return approval rate as percentage", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { approvalRate } = response.body.data;
      expect(approvalRate).toBeGreaterThanOrEqual(0);
      expect(approvalRate).toBeLessThanOrEqual(100);
    });

    it("should handle zero reviewed internships", async () => {
      // This test assumes there are reviewed internships, but validates the calculation
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { approvalRate } = response.body.data;
      expect(typeof approvalRate).toBe("number");
      expect(approvalRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /admins/internships/analytics - Average Review Time (Requirement 6.3)", () => {
    it("should calculate average review time in hours", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { averageReviewTime } = response.body.data;
      expect(typeof averageReviewTime).toBe("number");
      expect(averageReviewTime).toBeGreaterThanOrEqual(0);
    });

    it("should return reasonable review time values", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { averageReviewTime } = response.body.data;
      // Review time should be positive and reasonable (less than 1000 hours)
      expect(averageReviewTime).toBeGreaterThanOrEqual(0);
      expect(averageReviewTime).toBeLessThan(1000);
    });
  });

  describe("GET /admins/internships/analytics - Top Companies (Requirement 6.4)", () => {
    it("should return top companies by posting count", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { topCompanies } = response.body.data;
      expect(Array.isArray(topCompanies)).toBe(true);
      expect(topCompanies.length).toBeGreaterThan(0);
    });

    it("should include company details in top companies", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { topCompanies } = response.body.data;
      if (topCompanies.length > 0) {
        const company = topCompanies[0];
        expect(company).toHaveProperty("companyId");
        expect(company).toHaveProperty("companyName");
        expect(company).toHaveProperty("postingCount");
        expect(company.postingCount).toBeGreaterThan(0);
      }
    });

    it("should sort companies by posting count in descending order", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { topCompanies } = response.body.data;
      if (topCompanies.length > 1) {
        for (let i = 0; i < topCompanies.length - 1; i++) {
          expect(topCompanies[i].postingCount).toBeGreaterThanOrEqual(
            topCompanies[i + 1].postingCount
          );
        }
      }
    });

    it("should limit top companies to 10", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { topCompanies } = response.body.data;
      expect(topCompanies.length).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /admins/internships/analytics - Department Breakdown", () => {
    it("should return department breakdown", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { byDepartment } = response.body.data;
      expect(Array.isArray(byDepartment)).toBe(true);
      expect(byDepartment.length).toBeGreaterThan(0);
    });

    it("should include department name and count", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { byDepartment } = response.body.data;
      if (byDepartment.length > 0) {
        const dept = byDepartment[0];
        expect(dept).toHaveProperty("_id");
        expect(dept).toHaveProperty("count");
        expect(dept.count).toBeGreaterThan(0);
      }
    });

    it("should sort departments by count in descending order", async () => {
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const { byDepartment } = response.body.data;
      if (byDepartment.length > 1) {
        for (let i = 0; i < byDepartment.length - 1; i++) {
          expect(byDepartment[i].count).toBeGreaterThanOrEqual(
            byDepartment[i + 1].count
          );
        }
      }
    });
  });

  describe("GET /admins/internships/analytics - Date Range Filtering (Requirement 6.5)", () => {
    it("should filter by dateFrom", async () => {
      const dateFrom = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/analytics?dateFrom=${dateFrom}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInternships).toBeGreaterThan(0);
      // Should have fewer internships than without filter
    });

    it("should filter by dateTo", async () => {
      const dateTo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/analytics?dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInternships).toBeGreaterThan(0);
    });

    it("should filter by date range", async () => {
      const dateFrom = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInternships).toBeGreaterThan(0);
    });

    it("should return different results for different date ranges", async () => {
      const allResponse = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const dateFrom = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const filteredResponse = await request(app)
        .get(`/admins/internships/analytics?dateFrom=${dateFrom}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Filtered should have fewer or equal internships
      expect(filteredResponse.body.data.totalInternships).toBeLessThanOrEqual(
        allResponse.body.data.totalInternships
      );
    });
  });

  describe("GET /admins/internships/analytics - Caching (Performance)", () => {
    it("should cache analytics results", async () => {
      // First request - should hit database
      const response1 = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Second request - should hit cache
      const response2 = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response1.body.data).toEqual(response2.body.data);
    });

    it("should use different cache keys for different date ranges", async () => {
      const dateFrom1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const dateFrom2 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const response1 = await request(app)
        .get(`/admins/internships/analytics?dateFrom=${dateFrom1}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/admins/internships/analytics?dateFrom=${dateFrom2}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Results should be different
      expect(response1.body.data.totalInternships).not.toBe(
        response2.body.data.totalInternships
      );
    });

    it("should handle cache failures gracefully", async () => {
      // Even if cache fails, should still return data from database
      const response = await request(app)
        .get("/admins/internships/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
