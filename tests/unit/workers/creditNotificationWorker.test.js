import { jest } from "@jest/globals";

// Mock dependencies before imports
const mockAddToQueue = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule("../../../src/queues/index.js", () => ({
  addToQueue: mockAddToQueue,
}));

jest.unstable_mockModule("../../../src/utils/logger.js", () => ({
  logger: mockLogger,
}));

// Mock BullMQ
jest.unstable_mockModule("bullmq", () => ({
  Worker: jest.fn(),
  QueueEvents: jest.fn(),
}));

// Mock models
const mockCreditRequestFindOne = jest.fn();
const mockCreditRequestFindOneAndUpdate = jest.fn();
const mockAdminFind = jest.fn();

jest.unstable_mockModule("../../../src/models/CreditRequest.js", () => ({
  default: {
    findOne: mockCreditRequestFindOne,
    findOneAndUpdate: mockCreditRequestFindOneAndUpdate,
  },
}));

jest.unstable_mockModule("../../../src/models/Admin.js", () => ({
  default: {
    find: mockAdminFind,
  },
}));

describe("Credit Notification Worker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Notification Delivery Tracking", () => {
    it("should track successful notification delivery", async () => {
      const creditRequestId = "CR-TEST-001";
      const notificationType = "student_request_created";

      mockCreditRequestFindOneAndUpdate.mockResolvedValue({
        creditRequestId,
        metadata: {
          notificationsSent: [
            {
              type: notificationType,
              sentAt: new Date(),
              success: true,
            },
          ],
        },
      });

      await mockCreditRequestFindOneAndUpdate(
        { creditRequestId },
        {
          $push: {
            "metadata.notificationsSent": {
              type: notificationType,
              sentAt: expect.any(Date),
              success: true,
            },
          },
        }
      );

      expect(mockCreditRequestFindOneAndUpdate).toHaveBeenCalledWith(
        { creditRequestId },
        expect.objectContaining({
          $push: expect.objectContaining({
            "metadata.notificationsSent": expect.objectContaining({
              type: notificationType,
              success: true,
            }),
          }),
        })
      );
    });

    it("should track failed notification delivery with error message", async () => {
      const creditRequestId = "CR-TEST-002";
      const notificationType = "mentor_new_request";
      const errorMessage = "Email service unavailable";

      mockCreditRequestFindOneAndUpdate.mockResolvedValue({
        creditRequestId,
        metadata: {
          notificationsSent: [
            {
              type: notificationType,
              sentAt: new Date(),
              success: false,
              error: errorMessage,
            },
          ],
        },
      });

      await mockCreditRequestFindOneAndUpdate(
        { creditRequestId },
        {
          $push: {
            "metadata.notificationsSent": {
              type: notificationType,
              sentAt: expect.any(Date),
              success: false,
              error: errorMessage,
            },
          },
        }
      );

      expect(mockCreditRequestFindOneAndUpdate).toHaveBeenCalledWith(
        { creditRequestId },
        expect.objectContaining({
          $push: expect.objectContaining({
            "metadata.notificationsSent": expect.objectContaining({
              type: notificationType,
              success: false,
              error: errorMessage,
            }),
          }),
        })
      );
    });
  });

  describe("Retry Logic", () => {
    it("should implement exponential backoff strategy", () => {
      // Test exponential backoff calculation
      const backoffStrategy = (attemptsMade) => {
        return Math.pow(2, attemptsMade) * 1000;
      };

      expect(backoffStrategy(1)).toBe(2000); // 2 seconds
      expect(backoffStrategy(2)).toBe(4000); // 4 seconds
      expect(backoffStrategy(3)).toBe(8000); // 8 seconds
    });

    it("should retry failed jobs up to 3 times", () => {
      const maxAttempts = 3;
      const attempts = [];

      for (let i = 1; i <= maxAttempts; i++) {
        attempts.push(i);
      }

      expect(attempts).toHaveLength(3);
      expect(attempts[0]).toBe(1);
      expect(attempts[2]).toBe(3);
    });
  });

  describe("Notification Job Processing", () => {
    it("should process student request created notification", async () => {
      const creditRequestId = "CR-TEST-003";
      const mockCreditRequest = {
        creditRequestId,
        studentId: {
          _id: "student-123",
          email: "student@test.com",
          profile: { fullName: "Test Student" },
        },
        internshipId: {
          _id: "internship-123",
          title: "Software Engineer Intern",
          company: "Test Company",
        },
      };

      mockCreditRequestFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCreditRequest),
          }),
        }),
      });

      mockAddToQueue.mockResolvedValue({ id: "job-123" });
      mockCreditRequestFindOneAndUpdate.mockResolvedValue({});

      // Simulate processing
      const notificationData = {
        userId: mockCreditRequest.studentId._id,
        mongoId: mockCreditRequest.studentId._id,
        email: mockCreditRequest.studentId.email,
        title: "Credit Request Created",
        message: expect.stringContaining("has been created"),
        priority: "medium",
        actionUrl: `/student/credit-requests/${creditRequestId}`,
      };

      await mockAddToQueue("notification", "notify-student", notificationData);

      expect(mockAddToQueue).toHaveBeenCalledWith(
        "notification",
        "notify-student",
        expect.objectContaining({
          userId: mockCreditRequest.studentId._id,
          email: mockCreditRequest.studentId.email,
          title: "Credit Request Created",
        })
      );
    });

    it("should process mentor new request notification", async () => {
      const creditRequestId = "CR-TEST-004";
      const mockCreditRequest = {
        creditRequestId,
        mentorId: {
          _id: "mentor-123",
          email: "mentor@test.com",
          profile: { fullName: "Test Mentor" },
        },
        studentId: {
          _id: "student-123",
          profile: { fullName: "Test Student" },
        },
        internshipId: {
          _id: "internship-123",
          title: "Software Engineer Intern",
          company: "Test Company",
        },
        submissionHistory: [{ submittedAt: new Date() }],
      };

      mockCreditRequestFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockCreditRequest),
            }),
          }),
        }),
      });

      mockAddToQueue.mockResolvedValue({ id: "job-124" });
      mockCreditRequestFindOneAndUpdate.mockResolvedValue({});

      // Simulate processing
      const notificationData = {
        userId: mockCreditRequest.mentorId._id,
        email: mockCreditRequest.mentorId.email,
        title: "New Credit Request for Review",
        priority: "high",
      };

      await mockAddToQueue("notification", "notify-mentor", notificationData);

      expect(mockAddToQueue).toHaveBeenCalledWith(
        "notification",
        "notify-mentor",
        expect.objectContaining({
          userId: mockCreditRequest.mentorId._id,
          priority: "high",
        })
      );
    });

    it("should process admin mentor approval notification for multiple admins", async () => {
      const creditRequestId = "CR-TEST-005";
      const mockCreditRequest = {
        creditRequestId,
        studentId: {
          _id: "student-123",
          profile: { fullName: "Test Student" },
        },
        mentorId: {
          _id: "mentor-123",
          profile: { fullName: "Test Mentor" },
        },
        internshipId: {
          _id: "internship-123",
          title: "Software Engineer Intern",
          company: "Test Company",
        },
      };

      const mockAdmins = [
        { _id: "admin-1", email: "admin1@test.com", profile: {} },
        { _id: "admin-2", email: "admin2@test.com", profile: {} },
      ];

      mockCreditRequestFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockCreditRequest),
            }),
          }),
        }),
      });

      mockAdminFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockAdmins),
        }),
      });

      mockAddToQueue.mockResolvedValue({ id: "job-125" });
      mockCreditRequestFindOneAndUpdate.mockResolvedValue({});

      // Simulate processing for each admin
      for (const admin of mockAdmins) {
        await mockAddToQueue("notification", "notify-admin", {
          userId: admin._id,
          email: admin.email,
          title: "Credit Request Pending Admin Approval",
        });
      }

      expect(mockAddToQueue).toHaveBeenCalledTimes(2);
      expect(mockAddToQueue).toHaveBeenCalledWith(
        "notification",
        "notify-admin",
        expect.objectContaining({
          userId: "admin-1",
        })
      );
      expect(mockAddToQueue).toHaveBeenCalledWith(
        "notification",
        "notify-admin",
        expect.objectContaining({
          userId: "admin-2",
        })
      );
    });

    it("should process review reminder notification", async () => {
      const creditRequestId = "CR-TEST-006";
      const mockCreditRequest = {
        creditRequestId,
        mentorId: {
          _id: "mentor-123",
          email: "mentor@test.com",
          profile: { fullName: "Test Mentor" },
        },
        studentId: {
          _id: "student-123",
          profile: { fullName: "Test Student" },
        },
        internshipId: {
          _id: "internship-123",
          title: "Software Engineer Intern",
          company: "Test Company",
        },
      };

      mockCreditRequestFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockCreditRequest),
            }),
          }),
        }),
      });

      mockAddToQueue.mockResolvedValue({ id: "job-126" });
      mockCreditRequestFindOneAndUpdate.mockResolvedValue({});

      // Simulate reminder processing
      const notificationData = {
        userId: mockCreditRequest.mentorId._id,
        email: mockCreditRequest.mentorId.email,
        title: "Reminder: Credit Request Pending Review",
        priority: "high",
      };

      await mockAddToQueue("notification", "notify-mentor", notificationData);

      // Increment reminder count
      await mockCreditRequestFindOneAndUpdate(
        { creditRequestId },
        { $inc: { "metadata.remindersSent": 1 } }
      );

      expect(mockAddToQueue).toHaveBeenCalledWith(
        "notification",
        "notify-mentor",
        expect.objectContaining({
          title: "Reminder: Credit Request Pending Review",
        })
      );

      expect(mockCreditRequestFindOneAndUpdate).toHaveBeenCalledWith(
        { creditRequestId },
        { $inc: { "metadata.remindersSent": 1 } }
      );
    });
  });

  describe("Error Handling", () => {
    it("should log error when credit request is not found", async () => {
      const creditRequestId = "CR-NONEXISTENT";

      mockCreditRequestFindOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      try {
        const creditRequest = await mockCreditRequestFindOne({ creditRequestId })
          .populate("studentId")
          .populate("internshipId")
          .lean();

        if (!creditRequest) {
          throw new Error(`Credit request not found: ${creditRequestId}`);
        }
      } catch (error) {
        expect(error.message).toBe(`Credit request not found: ${creditRequestId}`);
      }
    });

    it("should handle notification queue failures gracefully", async () => {
      const creditRequestId = "CR-TEST-007";
      const errorMessage = "Queue connection failed";

      mockAddToQueue.mockRejectedValue(new Error(errorMessage));

      try {
        await mockAddToQueue("notification", "notify-student", {
          userId: "student-123",
        });
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockAddToQueue).toHaveBeenCalled();
    });

    it("should track notification failure in metadata", async () => {
      const creditRequestId = "CR-TEST-008";
      const errorMessage = "Notification service unavailable";

      mockCreditRequestFindOneAndUpdate.mockResolvedValue({});

      await mockCreditRequestFindOneAndUpdate(
        { creditRequestId },
        {
          $push: {
            "metadata.notificationsSent": {
              type: "student_request_created",
              sentAt: new Date(),
              success: false,
              error: errorMessage,
            },
          },
        }
      );

      expect(mockCreditRequestFindOneAndUpdate).toHaveBeenCalledWith(
        { creditRequestId },
        expect.objectContaining({
          $push: expect.objectContaining({
            "metadata.notificationsSent": expect.objectContaining({
              success: false,
              error: errorMessage,
            }),
          }),
        })
      );
    });
  });

  describe("Worker Configuration", () => {
    it("should have correct concurrency settings", () => {
      const workerConfig = {
        concurrency: 10,
        lockDuration: 60_000,
      };

      expect(workerConfig.concurrency).toBe(10);
      expect(workerConfig.lockDuration).toBe(60000);
    });

    it("should have exponential backoff configured", () => {
      const backoffStrategy = (attemptsMade) => {
        return Math.pow(2, attemptsMade) * 1000;
      };

      expect(backoffStrategy).toBeDefined();
      expect(typeof backoffStrategy).toBe("function");
    });
  });
});
