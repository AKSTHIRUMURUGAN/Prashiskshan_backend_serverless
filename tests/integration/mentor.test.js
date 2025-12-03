import request from "supertest";
import express from "express";
import mentorRouter from "../../src/routes/mentor.js";
import { createTestMentor, createTestStudent, createTestCompany, getAuthToken } from "../helpers/testHelpers.js";
import Internship from "../../src/models/Internship.js";
import Application from "../../src/models/Application.js";
import Logbook from "../../src/models/Logbook.js";

const app = express();
app.use(express.json());
app.use("/mentors", mentorRouter);

describe("Mentor Routes - CRUD Operations", () => {
  let mentor, firebaseUser, authToken, student, company, internship, application, logbook;

  beforeEach(async () => {
    const mentorData = await createTestMentor({
      profile: { department: "Computer Science" },
    });
    mentor = mentorData.mentor;
    firebaseUser = mentorData.firebaseUser;
    authToken = await getAuthToken(firebaseUser);

    const studentData = await createTestStudent({
      profile: { department: "Computer Science" },
    });
    student = studentData.student;

    const companyData = await createTestCompany();
    company = companyData.company;

    internship = await Internship.create({
      internshipId: `INTERN-${Date.now()}`,
      companyId: company._id,
      title: "Software Development Intern",
      description: "Join our team",
      department: "Computer Science",
      requiredSkills: ["JavaScript"],
      duration: "3 months",
      startDate: new Date(),
      applicationDeadline: new Date(),
      slots: 5,
      status: "approved",
      postedBy: company.companyId,
      postedAt: new Date(),
    });

    application = await Application.create({
      applicationId: `APP-${Date.now()}`,
      studentId: student._id,
      internshipId: internship._id,
      companyId: company._id,
      department: "Computer Science",
      coverLetter: "Test application",
      status: "pending",
    });

    logbook = await Logbook.create({
      logbookId: `LOG-${Date.now()}`,
      studentId: student._id,
      internshipId: internship._id,
      companyId: company._id,
      weekNumber: 1,
      startDate: new Date(),
      endDate: new Date(),
      hoursWorked: 40,
      activities: "Test activities",
      skillsUsed: ["JavaScript"],
      learnings: "Test learnings",
      status: "submitted",
    });
  });

  describe("GET /mentors/dashboard - Read Dashboard", () => {
    it("should get mentor dashboard", async () => {
      const response = await request(app)
        .get("/mentors/dashboard")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });
  });

  describe("GET /mentors/applications/pending - Read Pending Applications", () => {
    it("should get pending applications", async () => {
      const response = await request(app)
        .get("/mentors/applications/pending")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.applications)).toBe(true);
    });
  });

  describe("GET /mentors/applications/:applicationId - Read Application Details", () => {
    it("should get application details", async () => {
      const response = await request(app)
        .get(`/mentors/applications/${application._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.application).toBeDefined();
    });
  });

  describe("POST /mentors/applications/:applicationId/approve - Update Application", () => {
    it("should approve application", async () => {
      const response = await request(app)
        .post(`/mentors/applications/${application._id}/approve`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comments: "Great candidate",
          recommendedPreparation: ["Review Node.js", "Practice algorithms"],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /mentors/applications/:applicationId/reject - Update Application", () => {
    it("should reject application", async () => {
      const response = await request(app)
        .post(`/mentors/applications/${application._id}/reject`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comments: "Needs more experience",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentors/logbooks/pending - Read Pending Logbooks", () => {
    it("should get pending logbooks", async () => {
      const response = await request(app)
        .get("/mentors/logbooks/pending")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logbooks)).toBe(true);
    });
  });

  describe("GET /mentors/logbooks/:logbookId - Read Logbook Details", () => {
    it("should get logbook details", async () => {
      const response = await request(app)
        .get(`/mentors/logbooks/${logbook._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logbook).toBeDefined();
    });
  });

  describe("POST /mentors/logbooks/:logbookId/approve - Update Logbook", () => {
    it("should approve logbook", async () => {
      const response = await request(app)
        .post(`/mentors/logbooks/${logbook._id}/approve`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comments: "Good work",
          creditsApproved: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /mentors/logbooks/:logbookId/revision - Update Logbook", () => {
    it("should request logbook revision", async () => {
      const response = await request(app)
        .post(`/mentors/logbooks/${logbook._id}/revision`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comments: "Please add more details",
          suggestions: ["Include specific examples", "Add technical details"],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentors/skill-gaps - Read Skill Gap Analysis", () => {
    it("should get skill gap analysis", async () => {
      const response = await request(app)
        .get("/mentors/skill-gaps")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentors/department/performance - Read Performance", () => {
    it("should get department performance", async () => {
      const response = await request(app)
        .get("/mentors/department/performance")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /mentors/interventions - Create Intervention", () => {
    it("should create intervention", async () => {
      const interventionData = {
        title: "Python Workshop",
        description: "Workshop for Python programming",
        targetStudents: [student.studentId],
        modules: ["PY101", "PY102"],
      };

      const response = await request(app)
        .post("/mentors/interventions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(interventionData);

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentors/interventions - Read Interventions", () => {
    it("should get all interventions", async () => {
      const response = await request(app)
        .get("/mentors/interventions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentors/students/:studentId/progress - Read Student Progress", () => {
    it("should get student progress", async () => {
      const response = await request(app)
        .get(`/mentors/students/${student.studentId}/progress`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student).toBeDefined();
    });
  });
});

describe("Mentor Internship Approval Endpoints", () => {
  let mentor, firebaseUser, authToken, company, adminApprovedInternship;

  beforeEach(async () => {
    const mentorData = await createTestMentor({
      profile: { department: "Computer Science" },
    });
    mentor = mentorData.mentor;
    firebaseUser = mentorData.firebaseUser;
    authToken = await getAuthToken(firebaseUser);

    const companyData = await createTestCompany();
    company = companyData.company;

    // Create an admin-approved internship for mentor review
    adminApprovedInternship = await Internship.create({
      internshipId: `INTERN-ADMIN-${Date.now()}`,
      companyId: company._id,
      title: "Backend Developer Intern",
      description: "Work on backend systems",
      department: "Computer Science",
      requiredSkills: ["Node.js", "MongoDB"],
      duration: "6 months",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      slots: 3,
      slotsRemaining: 3,
      status: "admin_approved",
      postedBy: company.companyId,
      postedAt: new Date(),
      adminReview: {
        reviewedBy: "ADMIN-001",
        reviewedAt: new Date(),
        decision: "approved",
        comments: "Looks good",
      },
    });
  });

  describe("GET /mentor/internships/pending - List Pending Internships", () => {
    it("should get pending internships for mentor approval", async () => {
      const response = await request(app)
        .get("/mentors/internships/pending")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.internships)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/mentors/internships/pending?page=1&limit=10")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe("GET /mentor/internships/:internshipId - Get Internship Details", () => {
    it("should get internship details", async () => {
      const response = await request(app)
        .get(`/mentors/internships/${adminApprovedInternship.internshipId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.internshipId).toBe(adminApprovedInternship.internshipId);
    });

    it("should return 404 for non-existent internship", async () => {
      const response = await request(app)
        .get("/mentors/internships/NONEXISTENT")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /mentor/internships/:internshipId/approve - Approve Internship", () => {
    it("should approve internship for department", async () => {
      const response = await request(app)
        .post(`/mentors/internships/${adminApprovedInternship.internshipId}/approve`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          comments: "Excellent opportunity for our students",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("open_for_applications");
    });
  });

  describe("POST /mentor/internships/:internshipId/reject - Reject Internship", () => {
    it("should reject internship with reasons", async () => {
      const response = await request(app)
        .post(`/mentors/internships/${adminApprovedInternship.internshipId}/reject`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          reasons: "Not aligned with our curriculum",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("mentor_rejected");
    });

    it("should require rejection reasons", async () => {
      const response = await request(app)
        .post(`/mentors/internships/${adminApprovedInternship.internshipId}/reject`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});

describe("Mentor Student Management Endpoints", () => {
  let mentor, firebaseUser, authToken, student1, student2;

  beforeEach(async () => {
    const mentorData = await createTestMentor({
      profile: { department: "Computer Science" },
    });
    mentor = mentorData.mentor;
    firebaseUser = mentorData.firebaseUser;
    authToken = await getAuthToken(firebaseUser);

    const student1Data = await createTestStudent({
      profile: { 
        department: "Computer Science",
        name: "Alice Johnson",
      },
      readinessScore: 85,
      credits: { earned: 15 },
    });
    student1 = student1Data.student;

    const student2Data = await createTestStudent({
      profile: { 
        department: "Computer Science",
        name: "Bob Smith",
      },
      readinessScore: 45,
      credits: { earned: 5 },
    });
    student2 = student2Data.student;
  });

  describe("GET /mentor/students/list - List Assigned Students", () => {
    it("should get assigned students", async () => {
      const response = await request(app)
        .get("/mentors/students/list")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.students)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should filter by performance level", async () => {
      const response = await request(app)
        .get("/mentors/students/list?performanceLevel=high")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should filter by credit completion", async () => {
      const response = await request(app)
        .get("/mentors/students/list?creditCompletion=in_progress")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should support search", async () => {
      const response = await request(app)
        .get("/mentors/students/list?search=Alice")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentor/students/:studentId/details - Get Student Details", () => {
    it("should get student details with internship history", async () => {
      const response = await request(app)
        .get(`/mentors/students/${student1.studentId}/details`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student).toBeDefined();
      expect(response.body.data.internshipHistory).toBeDefined();
    });

    it("should return 404 for non-existent student", async () => {
      const response = await request(app)
        .get("/mentors/students/NONEXISTENT/details")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /mentor/students/:studentId/applications - Get Student Applications", () => {
    it("should get student applications", async () => {
      const response = await request(app)
        .get(`/mentors/students/${student1.studentId}/applications`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.applications)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get(`/mentors/students/${student1.studentId}/applications?status=pending`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe("Mentor Analytics Endpoints", () => {
  let mentor, firebaseUser, authToken;

  beforeEach(async () => {
    const mentorData = await createTestMentor({
      profile: { department: "Computer Science" },
    });
    mentor = mentorData.mentor;
    firebaseUser = mentorData.firebaseUser;
    authToken = await getAuthToken(firebaseUser);
  });

  describe("GET /mentor/analytics - Get Mentor Analytics", () => {
    it("should get mentor-specific analytics", async () => {
      const response = await request(app)
        .get("/mentors/analytics")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mentorId).toBe(mentor.mentorId);
      expect(response.body.data.approvals).toBeDefined();
      expect(response.body.data.students).toBeDefined();
    });

    it("should support date range filtering", async () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";
      const response = await request(app)
        .get(`/mentors/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /mentor/analytics/department - Get Department Analytics", () => {
    it("should get department analytics", async () => {
      const response = await request(app)
        .get("/mentors/analytics/department")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.department).toBe("Computer Science");
      expect(response.body.data.internships).toBeDefined();
      expect(response.body.data.applications).toBeDefined();
      expect(response.body.data.students).toBeDefined();
    });

    it("should support date range filtering", async () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";
      const response = await request(app)
        .get(`/mentors/analytics/department?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
