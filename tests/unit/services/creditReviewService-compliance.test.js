import { jest } from "@jest/globals";
import creditReviewService from "../../../src/services/creditReviewService.js";
import CreditRequest from "../../../src/models/CreditRequest.js";
import Admin from "../../../src/models/Admin.js";
import InternshipCompletion from "../../../src/models/InternshipCompletion.js";

// Mock dependencies
jest.mock("../../../src/models/CreditRequest.js");
jest.mock("../../../src/models/Admin.js");
jest.mock("../../../src/models/InternshipCompletion.js");

describe("CreditReviewService - Compliance Validation Logging", () => {
  let mockCreditRequest;
  let mockAdmin;
  let mockCompletion;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock admin
    mockAdmin = {
      _id: "admin123",
      adminId: "ADM001",
      email: "admin@test.com",
    };

    // Mock completion
    mockCompletion = {
      _id: "completion123",
      creditRequest: {
        status: "pending_admin_review",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    // Mock credit request
    mockCreditRequest = {
      _id: "request123",
      creditRequestId: "CR-123",
      studentId: "student123",
      internshipCompletionId: "completion123",
      internshipId: "internship123",
      mentorId: "mentor123",
      status: "pending_admin_review",
      internshipDurationWeeks: 8,
      calculatedCredits: 2,
      adminReview: null,
      submissionHistory: [],
      canTransitionTo: jest.fn().mockReturnValue(true),
      transitionTo: jest.fn(),
      addToHistory: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    Admin.findById = jest.fn().mockResolvedValue(mockAdmin);
    CreditRequest.findById = jest.fn().mockResolvedValue(mockCreditRequest);
    InternshipCompletion.findById = jest.fn().mockResolvedValue(mockCompletion);
  });

  describe("Requirement 12.5: Compliance validation logging", () => {
    it("should log NEP compliance validation result in request history when compliant", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      await creditReviewService.submitAdminReview(
        mockCreditRequest._id,
        mockAdmin._id,
        "approved",
        "All requirements met",
        complianceChecks
      );

      // Verify addToHistory was called
      expect(mockCreditRequest.addToHistory).toHaveBeenCalled();

      // Get the history entry that was added
      const historyCall = mockCreditRequest.addToHistory.mock.calls[0][0];

      // Verify the feedback contains compliance validation details
      expect(historyCall.feedback).toContain("Compliance Validation");
      expect(historyCall.feedback).toContain("NEP Compliant");
      expect(historyCall.feedback).toContain("Duration 8 weeks meets minimum requirement of 4 weeks");
      expect(historyCall.feedback).toContain("Documentation Complete: Yes");
      expect(historyCall.feedback).toContain("Fees Cleared: Yes");
      expect(historyCall.feedback).toContain("Department Approved: Yes");
    });

    it("should log NEP non-compliance in request history when not compliant", async () => {
      // Update mock to have insufficient duration
      mockCreditRequest.internshipDurationWeeks = 3;

      const complianceChecks = {
        nepCompliant: false,
        documentationComplete: true,
        feesCleared: false,
        departmentApproved: true,
      };

      await creditReviewService.submitAdminReview(
        mockCreditRequest._id,
        mockAdmin._id,
        "rejected",
        "Does not meet NEP requirements",
        complianceChecks
      );

      // Verify addToHistory was called
      expect(mockCreditRequest.addToHistory).toHaveBeenCalled();

      // Get the history entry that was added
      const historyCall = mockCreditRequest.addToHistory.mock.calls[0][0];

      // Verify the feedback contains compliance validation details
      expect(historyCall.feedback).toContain("Compliance Validation");
      expect(historyCall.feedback).toContain("NEP Non-Compliant");
      expect(historyCall.feedback).toContain("Duration 3 weeks does not meet minimum requirement of 4 weeks");
      expect(historyCall.feedback).toContain("Documentation Complete: Yes");
      expect(historyCall.feedback).toContain("Fees Cleared: No");
      expect(historyCall.feedback).toContain("Department Approved: Yes");
    });

    it("should include both admin feedback and compliance log in history", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      const adminFeedback = "Student has completed all requirements successfully";

      await creditReviewService.submitAdminReview(
        mockCreditRequest._id,
        mockAdmin._id,
        "approved",
        adminFeedback,
        complianceChecks
      );

      // Get the history entry that was added
      const historyCall = mockCreditRequest.addToHistory.mock.calls[0][0];

      // Verify both admin feedback and compliance log are present
      expect(historyCall.feedback).toContain(adminFeedback);
      expect(historyCall.feedback).toContain("Compliance Validation");
      expect(historyCall.feedback).toContain("NEP Compliant");
    });

    it("should log compliance validation even when no admin feedback is provided", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      await creditReviewService.submitAdminReview(
        mockCreditRequest._id,
        mockAdmin._id,
        "approved",
        "", // No feedback
        complianceChecks
      );

      // Get the history entry that was added
      const historyCall = mockCreditRequest.addToHistory.mock.calls[0][0];

      // Verify compliance log is present even without admin feedback
      expect(historyCall.feedback).toContain("Compliance Validation");
      expect(historyCall.feedback).toContain("NEP Compliant");
      expect(historyCall.feedback).toContain("Duration 8 weeks meets minimum requirement of 4 weeks");
    });

    it("should store compliance checks in adminReview object", async () => {
      const complianceChecks = {
        nepCompliant: true,
        documentationComplete: true,
        feesCleared: true,
        departmentApproved: true,
      };

      await creditReviewService.submitAdminReview(
        mockCreditRequest._id,
        mockAdmin._id,
        "approved",
        "Approved",
        complianceChecks
      );

      // Verify adminReview was set with compliance checks
      expect(mockCreditRequest.adminReview).toBeDefined();
      expect(mockCreditRequest.adminReview.complianceChecks).toEqual(complianceChecks);
    });
  });
});
