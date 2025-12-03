import { jest } from "@jest/globals";
import { notificationService } from "../../../src/services/notificationService.js";
import Notification from "../../../src/models/Notification.js";
import Student from "../../../src/models/Student.js";
import Mentor from "../../../src/models/Mentor.js";
import Company from "../../../src/models/Company.js";
import Admin from "../../../src/models/Admin.js";
import mongoose from "mongoose";

// Mock all models and services
jest.mock("../../../src/models/Notification.js");
jest.mock("../../../src/models/Student.js");
jest.mock("../../../src/models/Mentor.js");
jest.mock("../../../src/models/Company.js");
jest.mock("../../../src/models/Admin.js");
jest.mock("../../../src/services/emailService.js", () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock("../../../src/services/smsService.js", () => ({
  smsService: {
    sendSMS: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock("../../../src/utils/logger.js", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("NotificationService - Workflow Events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("notifyInternshipStatusChange", () => {
    it("should notify all admins when internship is created", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockAdmins = [
        { _id: new mongoose.Types.ObjectId(), email: "admin1@test.com", status: "active" },
        { _id: new mongoose.Types.ObjectId(), email: "admin2@test.com", status: "active" },
      ];

      Admin.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAdmins),
      });

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyInternshipStatusChange(
        internship,
        null,
        "pending_admin_verification",
        { companyName: "Test Company" }
      );

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(2);
      expect(Notification.create).toHaveBeenCalledTimes(2);
    });

    it("should notify company and mentors when admin approves", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockCompany = {
        _id: internship.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      const mockMentors = [
        { _id: new mongoose.Types.ObjectId(), email: "mentor1@test.com", department: "Computer Science", status: "active" },
      ];

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Mentor.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMentors),
      });

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyInternshipStatusChange(
        internship,
        "pending_admin_verification",
        "admin_approved",
        { companyName: "Test Company" }
      );

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(2); // 1 company + 1 mentor
    });

    it("should notify company when admin rejects", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockCompany = {
        _id: internship.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyInternshipStatusChange(
        internship,
        "pending_admin_verification",
        "admin_rejected",
        { companyName: "Test Company", reasons: ["Incomplete information"] }
      );

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(1);
    });

    it("should notify company and students when mentor approves", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockCompany = {
        _id: internship.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      const mockStudents = [
        { _id: new mongoose.Types.ObjectId(), email: "student1@test.com", department: "Computer Science", status: "active" },
        { _id: new mongoose.Types.ObjectId(), email: "student2@test.com", department: "Computer Science", status: "active" },
      ];

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Student.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockStudents),
      });

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyInternshipStatusChange(
        internship,
        "admin_approved",
        "open_for_applications",
        { companyName: "Test Company" }
      );

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(3); // 1 company + 2 students
    });

    it("should notify company and admins when mentor rejects", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockCompany = {
        _id: internship.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      const mockAdmins = [
        { _id: new mongoose.Types.ObjectId(), email: "admin1@test.com", status: "active" },
      ];

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Admin.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAdmins),
      });

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyInternshipStatusChange(
        internship,
        "admin_approved",
        "mentor_rejected",
        { companyName: "Test Company", reasons: ["Not aligned with curriculum"] }
      );

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(2); // 1 company + 1 admin
    });
  });

  describe("notifyApplicationSubmitted", () => {
    it("should notify company when student submits application", async () => {
      const application = {
        applicationId: "APP-001",
        studentId: new mongoose.Types.ObjectId(),
        companyId: new mongoose.Types.ObjectId(),
        internshipId: new mongoose.Types.ObjectId(),
      };

      const studentData = {
        name: "John Doe",
      };

      const internshipData = {
        internshipId: "INT-001",
        title: "Software Engineer Intern",
      };

      const mockCompany = {
        _id: application.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyApplicationSubmitted(
        application,
        studentData,
        internshipData
      );

      expect(result.success).toBe(true);
      expect(Notification.create).toHaveBeenCalledTimes(1);
    });

    it("should handle missing company gracefully", async () => {
      const application = {
        applicationId: "APP-001",
        studentId: new mongoose.Types.ObjectId(),
        companyId: new mongoose.Types.ObjectId(),
        internshipId: new mongoose.Types.ObjectId(),
      };

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.notifyApplicationSubmitted(
        application,
        { name: "John Doe" },
        { internshipId: "INT-001", title: "Test Internship" }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Company not found");
    });
  });

  describe("notifyDeadlineApproaching", () => {
    it("should notify company and eligible students about approaching deadline", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockCompany = {
        _id: internship.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      const mockStudents = [
        { _id: new mongoose.Types.ObjectId(), email: "student1@test.com", department: "Computer Science", status: "active" },
        { _id: new mongoose.Types.ObjectId(), email: "student2@test.com", department: "Computer Science", status: "active" },
      ];

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Student.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockStudents),
      });

      // Mock Application model
      const mockApplicationModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue([]),
        }),
      };
      mongoose.model = jest.fn().mockReturnValue(mockApplicationModel);

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyDeadlineApproaching(internship, 3);

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(3); // 1 company + 2 students
    });

    it("should not notify students who have already applied", async () => {
      const internship = {
        _id: new mongoose.Types.ObjectId(),
        internshipId: "INT-001",
        title: "Software Engineer Intern",
        companyId: new mongoose.Types.ObjectId(),
        department: "Computer Science",
      };

      const mockCompany = {
        _id: internship.companyId,
        companyName: "Test Company",
        pointOfContact: { email: "company@test.com" },
      };

      const studentId1 = new mongoose.Types.ObjectId();
      const studentId2 = new mongoose.Types.ObjectId();

      const mockStudents = [
        { _id: studentId1, email: "student1@test.com", department: "Computer Science", status: "active" },
        { _id: studentId2, email: "student2@test.com", department: "Computer Science", status: "active" },
      ];

      Company.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      });

      Student.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockStudents),
      });

      // Mock that student1 has already applied
      const mockApplicationModel = {
        find: jest.fn().mockReturnValue({
          distinct: jest.fn().mockResolvedValue([studentId1]),
        }),
      };
      mongoose.model = jest.fn().mockReturnValue(mockApplicationModel);

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyDeadlineApproaching(internship, 3);

      expect(result.success).toBe(true);
      expect(result.notificationCount).toBe(2); // 1 company + 1 student (student2 only)
    });
  });

  describe("notifyBulk", () => {
    it("should send notifications to multiple recipients", async () => {
      const recipients = [
        { mongoId: new mongoose.Types.ObjectId(), role: "student", email: "student1@test.com" },
        { mongoId: new mongoose.Types.ObjectId(), role: "student", email: "student2@test.com" },
        { mongoId: new mongoose.Types.ObjectId(), role: "mentor", email: "mentor@test.com" },
      ];

      const notificationData = {
        title: "System Announcement",
        message: "This is a test announcement",
        priority: "high",
        actionUrl: "/dashboard",
      };

      Notification.create = jest.fn().mockResolvedValue({});

      const result = await notificationService.notifyBulk(recipients, notificationData);

      expect(result.success).toBe(true);
      expect(result.total).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
    });

    it("should handle partial failures gracefully", async () => {
      const recipients = [
        { mongoId: new mongoose.Types.ObjectId(), role: "student", email: "student1@test.com" },
        { mongoId: new mongoose.Types.ObjectId(), role: "student", email: "student2@test.com" },
      ];

      const notificationData = {
        title: "System Announcement",
        message: "This is a test announcement",
      };

      // Mock one success and one failure
      let callCount = 0;
      Notification.create = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({});
        }
        return Promise.reject(new Error("Database error"));
      });

      const result = await notificationService.notifyBulk(recipients, notificationData);

      expect(result.success).toBe(true);
      expect(result.total).toBe(2);
    });
  });
});
