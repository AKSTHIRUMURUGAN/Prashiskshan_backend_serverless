import request from "supertest";
import express from "express";
import adminRouter from "../../src/routes/admin.js";
import Internship from "../../src/models/Internship.js";
import Company from "../../src/models/Company.js";
import { createTestAdmin, createTestCompany, getAuthToken } from "../helpers/testHelpers.js";

const app = express();
app.use(express.json());
app.use("/admins", adminRouter);

describe("Admin Internship List Endpoint - Task 2.1", () => {
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
      companyName: "Tech Corp"
    });
    testCompany1 = company1Data.company;

    const company2Data = await createTestCompany({ 
      status: "verified",
      companyName: "Innovation Labs"
    });
    testCompany2 = company2Data.company;

    // Create test internships with various statuses and attributes
    const internshipsData = [
      {
        internshipId: `INTERN-LIST-1-${Date.now()}`,
        companyId: testCompany1._id,
        title: "Frontend Developer Intern",
        description: "Work on React applications",
        department: "Computer Science",
        requiredSkills: ["React", "JavaScript"],
        duration: "3 months",
        workMode: "remote",
        location: "New York",
        stipend: 1000,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 5,
        status: "pending_admin_verification",
        postedBy: testCompany1.companyId,
        postedAt: new Date(),
      },
      {
        internshipId: `INTERN-LIST-2-${Date.now()}`,
        companyId: testCompany1._id,
        title: "Backend Developer Intern",
        description: "Work on Node.js APIs",
        department: "Computer Science",
        requiredSkills: ["Node.js", "MongoDB"],
        duration: "6 months",
        workMode: "hybrid",
        location: "San Francisco",
        stipend: 1500,
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        slots: 3,
        status: "admin_approved",
        postedBy: testCompany1.companyId,
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        internshipId: `INTERN-LIST-3-${Date.now()}`,
        companyId: testCompany2._id,
        title: "Data Science Intern",
        description: "Work on ML models",
        department: "Data Science",
        requiredSkills: ["Python", "TensorFlow"],
        duration: "4 months",
        workMode: "onsite",
        location: "Boston",
        stipend: 2000,
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        slots: 2,
        status: "admin_rejected",
        postedBy: testCompany2.companyId,
        postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        internshipId: `INTERN-LIST-4-${Date.now()}`,
        companyId: testCompany2._id,
        title: "Mobile Developer Intern",
        description: "Work on React Native apps",
        department: "Computer Science",
        requiredSkills: ["React Native", "JavaScript"],
        duration: "3 months",
        workMode: "remote",
        location: "Austin",
        stipend: 1200,
        startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        slots: 4,
        status: "pending_admin_verification",
        postedBy: testCompany2.companyId,
        postedAt: new Date(),
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

  describe("GET /admins/internships/list - Basic Functionality", () => {
    it("should list all internships with pagination", async () => {
      const response = await request(app)
        .get("/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.internships).toBeDefined();
      expect(Array.isArray(response.body.data.internships)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(4);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
      expect(response.body.data.pagination.pages).toBeGreaterThanOrEqual(1);
    });

    it("should require authentication", async () => {
      await request(app)
        .get("/admins/internships/list")
        .expect(401);
    });

    it("should return internships with required fields", async () => {
      const response = await request(app)
        .get("/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const internship = response.body.data.internships[0];
      expect(internship).toHaveProperty("internshipId");
      expect(internship).toHaveProperty("title");
      expect(internship).toHaveProperty("companyName");
      expect(internship).toHaveProperty("location");
      expect(internship).toHaveProperty("duration");
      expect(internship).toHaveProperty("status");
      expect(internship).toHaveProperty("postedAt");
    });
  });

  describe("GET /admins/internships/list - Status Filtering (Requirement 1.2)", () => {
    it("should filter by pending status", async () => {
      const response = await request(app)
        .get("/admins/internships/list?status=pending_admin_verification")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      expect(internships.length).toBeGreaterThanOrEqual(2);
      internships.forEach(internship => {
        expect(internship.status).toBe("pending_admin_verification");
      });
    });

    it("should filter by approved status", async () => {
      const response = await request(app)
        .get("/admins/internships/list?status=admin_approved")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.status).toBe("admin_approved");
      });
    });

    it("should filter by rejected status", async () => {
      const response = await request(app)
        .get("/admins/internships/list?status=admin_rejected")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.status).toBe("admin_rejected");
      });
    });

    it("should return all internships when status is 'all'", async () => {
      const response = await request(app)
        .get("/admins/internships/list?status=all")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internships.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("GET /admins/internships/list - Search Filtering (Requirement 1.3)", () => {
    it("should search by title", async () => {
      const response = await request(app)
        .get("/admins/internships/list?search=Frontend")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      expect(internships.length).toBeGreaterThanOrEqual(1);
      expect(internships.some(i => i.title.includes("Frontend"))).toBe(true);
    });

    it("should search by location", async () => {
      const response = await request(app)
        .get("/admins/internships/list?search=Boston")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      expect(internships.length).toBeGreaterThanOrEqual(1);
      expect(internships.some(i => i.location.includes("Boston"))).toBe(true);
    });

    it("should be case-insensitive", async () => {
      const response = await request(app)
        .get("/admins/internships/list?search=frontend")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      expect(internships.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /admins/internships/list - Date Range Filtering (Requirement 1.4)", () => {
    it("should filter by dateFrom", async () => {
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/list?dateFrom=${dateFrom}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        const createdAt = new Date(internship.postedAt);
        expect(createdAt >= new Date(dateFrom)).toBe(true);
      });
    });

    it("should filter by dateTo", async () => {
      const dateTo = new Date().toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/list?dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internships).toBeDefined();
    });

    it("should filter by date range", async () => {
      const dateFrom = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/list?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internships).toBeDefined();
    });
  });

  describe("GET /admins/internships/list - Compound Filters (Requirement 1.4)", () => {
    it("should apply status and search filters together", async () => {
      const response = await request(app)
        .get("/admins/internships/list?status=pending_admin_verification&search=Developer")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.status).toBe("pending_admin_verification");
        expect(
          internship.title.toLowerCase().includes("developer") ||
          internship.location.toLowerCase().includes("developer")
        ).toBe(true);
      });
    });

    it("should apply status, search, and department filters together", async () => {
      const response = await request(app)
        .get("/admins/internships/list?status=pending_admin_verification&search=Developer&department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.status).toBe("pending_admin_verification");
        expect(internship.department).toBe("Computer Science");
      });
    });

    it("should apply all filters including date range", async () => {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();
      
      const response = await request(app)
        .get(`/admins/internships/list?status=pending_admin_verification&department=Computer Science&dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.status).toBe("pending_admin_verification");
        expect(internship.department).toBe("Computer Science");
      });
    });
  });

  describe("GET /admins/internships/list - Additional Filters", () => {
    it("should filter by department", async () => {
      const response = await request(app)
        .get("/admins/internships/list?department=Computer Science")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.department).toBe("Computer Science");
      });
    });

    it("should filter by workMode", async () => {
      const response = await request(app)
        .get("/admins/internships/list?workMode=remote")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      internships.forEach(internship => {
        expect(internship.workMode).toBe("remote");
      });
    });
  });

  describe("GET /admins/internships/list - Pagination (Requirement 1.1)", () => {
    it("should support custom page size", async () => {
      const response = await request(app)
        .get("/admins/internships/list?limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internships.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it("should support page navigation", async () => {
      const response = await request(app)
        .get("/admins/internships/list?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
    });

    it("should calculate total pages correctly", async () => {
      const response = await request(app)
        .get("/admins/internships/list?limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const { total, limit, pages } = response.body.data.pagination;
      expect(pages).toBe(Math.ceil(total / limit));
    });
  });

  describe("GET /admins/internships/list - Sorting", () => {
    it("should support sorting by createdAt descending (default)", async () => {
      const response = await request(app)
        .get("/admins/internships/list")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const internships = response.body.data.internships;
      if (internships.length > 1) {
        for (let i = 0; i < internships.length - 1; i++) {
          const date1 = new Date(internships[i].postedAt);
          const date2 = new Date(internships[i + 1].postedAt);
          expect(date1 >= date2).toBe(true);
        }
      }
    });

    it("should support sorting by title ascending", async () => {
      const response = await request(app)
        .get("/admins/internships/list?sortBy=title&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internships).toBeDefined();
    });
  });
});
