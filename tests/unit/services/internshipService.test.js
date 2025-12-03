import internshipService from "../../../src/services/internshipService.js";
import Internship from "../../../src/models/Internship.js";
import Admin from "../../../src/models/Admin.js";
import { internshipStateMachine } from "../../../src/services/internshipStateMachine.js";

describe("InternshipService", () => {
  describe("createInternship", () => {
    const validInternshipData = {
      title: "Software Engineering Intern",
      description: "Work on exciting projects",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "React", "Node.js"],
      duration: "12 weeks",
      workMode: "remote",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      slots: 3,
      stipend: 5000,
      location: "Remote",
    };

    it("should create internship with pending_admin_verification status", async () => {
      const companyId = "507f1f77bcf86cd799439011";
      
      const internship = await internshipService.createInternship(
        companyId,
        validInternshipData,
        { enableAITagging: false } // Disable AI tagging for test
      );

      expect(internship).toBeDefined();
      expect(internship.status).toBe("pending_admin_verification");
      expect(internship.internshipId).toMatch(/^INT-/);
      expect(internship.title).toBe(validInternshipData.title);
      expect(internship.slotsRemaining).toBe(validInternshipData.slots);
      expect(internship.auditTrail).toHaveLength(1);
      expect(internship.auditTrail[0].action).toBe("create_internship");
    });

    it("should throw error for missing required fields", async () => {
      const companyId = "507f1f77bcf86cd799439011";
      const invalidData = { title: "Test" }; // Missing required fields

      await expect(
        internshipService.createInternship(companyId, invalidData)
      ).rejects.toThrow("Missing required fields");
    });

    it("should throw error for invalid slots", async () => {
      const companyId = "507f1f77bcf86cd799439011";
      const invalidData = {
        ...validInternshipData,
        slots: 0, // Invalid
      };

      await expect(
        internshipService.createInternship(companyId, invalidData)
      ).rejects.toThrow("slots must be a positive number");
    });

    it("should throw error for deadline after start date", async () => {
      const companyId = "507f1f77bcf86cd799439011";
      const invalidData = {
        ...validInternshipData,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // After start date
      };

      await expect(
        internshipService.createInternship(companyId, invalidData)
      ).rejects.toThrow("applicationDeadline must be before startDate");
    });
  });

  describe("updateInternship", () => {
    let testInternship;

    beforeEach(async () => {
      // Create a test internship
      testInternship = await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Original Title",
        description: "Original description",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "8 weeks",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 3,
        slotsRemaining: 3,
        status: "admin_approved",
        postedBy: "test-user",
        postedAt: new Date(),
      });
    });

    it("should update internship and reset status for significant changes", async () => {
      const updates = {
        title: "Updated Title",
        description: "Updated description",
      };

      const updated = await internshipService.updateInternship(
        testInternship.internshipId,
        updates,
        { enableAITagging: false }
      );

      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated description");
      expect(updated.status).toBe("pending_admin_verification");
      expect(updated.auditTrail.length).toBeGreaterThan(0);
    });

    it("should throw error for non-existent internship", async () => {
      await expect(
        internshipService.updateInternship("INVALID-ID", { title: "Test" })
      ).rejects.toThrow("Internship not found");
    });

    it("should throw error for updating closed internship", async () => {
      testInternship.status = "closed";
      await testInternship.save();

      await expect(
        internshipService.updateInternship(testInternship.internshipId, { title: "Test" })
      ).rejects.toThrow("Cannot update internship in closed state");
    });
  });

  describe("getInternshipsByStatus", () => {
    beforeEach(async () => {
      // Create test internships
      await Internship.create([
        {
          internshipId: `INT-${Date.now()}-1`,
          companyId: "507f1f77bcf86cd799439011",
          title: "Internship 1",
          description: "Description 1",
          department: "Computer Science",
          requiredSkills: ["JavaScript"],
          duration: "8 weeks",
          workMode: "remote",
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          slots: 3,
          status: "open_for_applications",
          postedBy: "test-user",
        },
        {
          internshipId: `INT-${Date.now()}-2`,
          companyId: "507f1f77bcf86cd799439011",
          title: "Internship 2",
          description: "Description 2",
          department: "Computer Science",
          requiredSkills: ["Python"],
          duration: "12 weeks",
          workMode: "onsite",
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          slots: 5,
          status: "open_for_applications",
          postedBy: "test-user",
        },
      ]);
    });

    it("should return internships with specified status", async () => {
      const result = await internshipService.getInternshipsByStatus("open_for_applications");

      expect(result.internships).toBeDefined();
      expect(result.internships.length).toBeGreaterThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it("should filter by department", async () => {
      const result = await internshipService.getInternshipsByStatus("open_for_applications", {
        department: "Computer Science",
      });

      expect(result.internships).toBeDefined();
      expect(result.internships.every(i => i.department === "Computer Science")).toBe(true);
    });
  });

  describe("getInternshipsForMentor", () => {
    beforeEach(async () => {
      await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "CS Internship",
        description: "Description",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "8 weeks",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 3,
        status: "admin_approved",
        postedBy: "test-user",
      });
    });

    it("should return admin_approved internships for mentor's department", async () => {
      const result = await internshipService.getInternshipsForMentor(
        "MENTOR-123",
        "Computer Science"
      );

      expect(result.internships).toBeDefined();
      expect(result.internships.length).toBeGreaterThanOrEqual(1);
      expect(result.internships.every(i => i.status === "admin_approved")).toBe(true);
      expect(result.internships.every(i => i.department === "Computer Science")).toBe(true);
    });
  });

  describe("getInternshipsForStudent", () => {
    beforeEach(async () => {
      await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Student Internship",
        description: "Description",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "8 weeks",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 3,
        status: "open_for_applications",
        postedBy: "test-user",
      });
    });

    it("should return open internships for student's department", async () => {
      const result = await internshipService.getInternshipsForStudent(
        "STUDENT-123",
        "Computer Science"
      );

      expect(result.internships).toBeDefined();
      expect(result.internships.length).toBeGreaterThanOrEqual(1);
      expect(result.internships.every(i => i.status === "open_for_applications")).toBe(true);
      expect(result.internships.every(i => i.department === "Computer Science")).toBe(true);
    });

    it("should not return internships with past deadlines", async () => {
      // Create internship with past deadline
      await Internship.create({
        internshipId: `INT-${Date.now()}-PAST`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Past Deadline",
        description: "Description",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "8 weeks",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Past deadline
        slots: 3,
        status: "open_for_applications",
        postedBy: "test-user",
      });

      const result = await internshipService.getInternshipsForStudent(
        "STUDENT-123",
        "Computer Science"
      );

      expect(result.internships.every(i => i.applicationDeadline >= new Date())).toBe(true);
    });
  });

  describe("decrementSlots", () => {
    let testInternship;

    beforeEach(async () => {
      testInternship = await Internship.create({
        internshipId: `INT-${Date.now()}`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Test Internship",
        description: "Description",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "8 weeks",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        slots: 3,
        slotsRemaining: 3,
        status: "open_for_applications",
        postedBy: "test-user",
      });
    });

    it("should decrement slots remaining", async () => {
      const updated = await internshipService.decrementSlots(testInternship.internshipId);

      expect(updated.slotsRemaining).toBe(2);
    });

    it("should close internship when slots reach zero", async () => {
      // Decrement to 1
      await internshipService.decrementSlots(testInternship.internshipId);
      await internshipService.decrementSlots(testInternship.internshipId);
      
      // Decrement to 0 - should close
      await internshipService.decrementSlots(testInternship.internshipId);

      const internship = await Internship.findOne({ internshipId: testInternship.internshipId });
      expect(internship.slotsRemaining).toBe(0);
      expect(internship.status).toBe("closed");
    });

    it("should throw error when no slots remaining", async () => {
      testInternship.slotsRemaining = 0;
      await testInternship.save();

      await expect(
        internshipService.decrementSlots(testInternship.internshipId)
      ).rejects.toThrow("No slots remaining");
    });
  });

  describe("closeExpiredInternships", () => {
    beforeEach(async () => {
      // Create expired internship
      await Internship.create({
        internshipId: `INT-${Date.now()}-EXPIRED`,
        companyId: "507f1f77bcf86cd799439011",
        title: "Expired Internship",
        description: "Description",
        department: "Computer Science",
        requiredSkills: ["JavaScript"],
        duration: "8 weeks",
        workMode: "remote",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Past deadline
        slots: 3,
        status: "open_for_applications",
        postedBy: "test-user",
      });
    });

    it("should close expired internships", async () => {
      const result = await internshipService.closeExpiredInternships();

      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.closed).toBeGreaterThanOrEqual(1);
      expect(result.failed).toBe(0);
    });
  });
});
