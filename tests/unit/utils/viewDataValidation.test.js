/**
 * Tests for View Data Completeness Validation
 * 
 * Requirements: 3.2, 5.2, 8.2, 10.1, 11.1, 11.2, 12.1
 */

import {
  validateStudentView,
  validateMentorView,
  validateAdminView,
  validateViewData,
} from '../../../src/utils/viewDataValidation.js';

describe('View Data Completeness Validation', () => {
  describe('validateStudentView', () => {
    it('should validate complete student view data', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'pending_mentor_review',
        // Missing other required fields
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('requestedAt');
      expect(result.missingFields).toContain('lastUpdatedAt');
      expect(result.missingFields).toContain('calculatedCredits');
      expect(result.missingFields).toContain('internshipDurationWeeks');
      expect(result.missingFields).toContain('submissionHistory');
    });

    it('should require feedback for rejected requests', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'mentor_rejected',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
        // Missing mentorReview.feedback
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('feedback (required for rejected requests)');
    });

    it('should accept mentor feedback for rejected requests', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'mentor_rejected',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
        mentorReview: {
          decision: 'rejected',
          feedback: 'Logbook incomplete',
        },
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should accept admin feedback for admin rejected requests', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'admin_rejected',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
        adminReview: {
          decision: 'rejected',
          feedback: 'Fees not cleared',
        },
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should require certificate for completed requests', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'completed',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
        // Missing certificate
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('certificate.certificateUrl');
    });

    it('should validate certificate for credits_added status', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'credits_added',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
        certificate: {
          certificateUrl: 'https://example.com/cert.pdf',
          certificateId: 'CERT-123',
          generatedAt: new Date(),
        },
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });
  });

  describe('validateMentorView', () => {
    it('should validate complete mentor view data', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: {
          _id: 'student-id',
          profile: { name: 'John Doe' },
          email: 'john@example.com',
        },
        internshipId: {
          _id: 'internship-id',
          title: 'Software Engineering Intern',
        },
        internshipCompletionId: {
          _id: 'completion-id',
          logbook: [{ week: 1, activities: 'Coding' }],
          finalReport: { content: 'Report content' },
          companyCompletion: {
            evaluationScore: 4.5,
          },
        },
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
      };

      const result = validateMentorView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should detect missing student information', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: {
          _id: 'student-id',
          // Missing profile and email
        },
        internshipId: {
          _id: 'internship-id',
          title: 'Software Engineering Intern',
        },
        internshipCompletionId: {
          _id: 'completion-id',
          logbook: [{ week: 1 }],
          finalReport: { content: 'Report' },
          companyCompletion: {
            evaluationScore: 4.5,
          },
        },
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
      };

      const result = validateMentorView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('studentId.profile');
      expect(result.missingFields).toContain('studentId.email');
    });

    it('should detect missing logbook data', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: {
          _id: 'student-id',
          profile: { name: 'John Doe' },
          email: 'john@example.com',
        },
        internshipId: {
          _id: 'internship-id',
          title: 'Software Engineering Intern',
        },
        internshipCompletionId: {
          _id: 'completion-id',
          // Missing logbook
          finalReport: { content: 'Report' },
          companyCompletion: {
            evaluationScore: 4.5,
          },
        },
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
      };

      const result = validateMentorView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('internshipCompletionId.logbook');
    });

    it('should detect missing final report', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: {
          _id: 'student-id',
          profile: { name: 'John Doe' },
          email: 'john@example.com',
        },
        internshipId: {
          _id: 'internship-id',
          title: 'Software Engineering Intern',
        },
        internshipCompletionId: {
          _id: 'completion-id',
          logbook: [{ week: 1 }],
          // Missing finalReport
          companyCompletion: {
            evaluationScore: 4.5,
          },
        },
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
      };

      const result = validateMentorView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('internshipCompletionId.finalReport');
    });

    it('should detect missing company evaluation', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: {
          _id: 'student-id',
          profile: { name: 'John Doe' },
          email: 'john@example.com',
        },
        internshipId: {
          _id: 'internship-id',
          title: 'Software Engineering Intern',
        },
        internshipCompletionId: {
          _id: 'completion-id',
          logbook: [{ week: 1 }],
          finalReport: { content: 'Report' },
          companyCompletion: {
            // Missing evaluationScore
          },
        },
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
      };

      const result = validateMentorView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('internshipCompletionId.companyCompletion.evaluationScore');
    });

    it('should detect missing internship title', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: {
          _id: 'student-id',
          profile: { name: 'John Doe' },
          email: 'john@example.com',
        },
        internshipId: {
          _id: 'internship-id',
          // Missing title
        },
        internshipCompletionId: {
          _id: 'completion-id',
          logbook: [{ week: 1 }],
          finalReport: { content: 'Report' },
          companyCompletion: {
            evaluationScore: 4.5,
          },
        },
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
      };

      const result = validateMentorView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('internshipId.title');
    });
  });

  describe('validateAdminView', () => {
    it('should validate complete admin view data', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: 'student-id',
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        mentorReview: {
          decision: 'approved',
          reviewedAt: new Date(),
          reviewedBy: 'mentor-id',
        },
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should detect missing mentor review', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: 'student-id',
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        // Missing mentorReview
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('mentorReview');
    });

    it('should detect missing mentor decision', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: 'student-id',
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        mentorReview: {
          // Missing decision
          reviewedAt: new Date(),
        },
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('mentorReview.decision');
    });

    it('should require feedback for mentor rejections', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: 'student-id',
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        mentorReview: {
          decision: 'rejected',
          reviewedAt: new Date(),
          // Missing feedback
        },
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('mentorReview.feedback');
    });

    it('should detect missing compliance data (internship duration)', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: 'student-id',
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        // Missing internshipDurationWeeks
        mentorReview: {
          decision: 'approved',
          reviewedAt: new Date(),
        },
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('internshipDurationWeeks');
    });

    it('should validate NEP compliance data is present', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: 'student-id',
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8, // Present for NEP compliance check
        mentorReview: {
          decision: 'approved',
          reviewedAt: new Date(),
        },
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        // Missing multiple required fields
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('studentId');
      expect(result.missingFields).toContain('internshipId');
      expect(result.missingFields).toContain('mentorId');
      expect(result.missingFields).toContain('status');
      expect(result.missingFields).toContain('requestedAt');
      expect(result.missingFields).toContain('calculatedCredits');
      expect(result.missingFields).toContain('internshipDurationWeeks');
      expect(result.missingFields).toContain('mentorReview');
    });
  });

  describe('validateViewData', () => {
    it('should route to correct validator based on role', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [],
      };

      const studentResult = validateViewData(creditRequest, 'student');
      expect(studentResult.valid).toBe(true);

      const mentorResult = validateViewData(creditRequest, 'mentor');
      expect(mentorResult.valid).toBe(false); // Missing mentor-specific fields

      const adminResult = validateViewData(creditRequest, 'admin');
      expect(adminResult.valid).toBe(false); // Missing admin-specific fields
    });

    it('should throw error for invalid role', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
      };

      expect(() => {
        validateViewData(creditRequest, 'invalid_role');
      }).toThrow('Invalid role: invalid_role');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: null, // Null value
        internshipDurationWeeks: 8,
        submissionHistory: [],
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('calculatedCredits');
    });

    it('should handle undefined nested objects', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        studentId: undefined, // Undefined
        internshipId: 'internship-id',
        mentorId: 'mentor-id',
        status: 'pending_admin_review',
        requestedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        mentorReview: {
          decision: 'approved',
        },
      };

      const result = validateAdminView(creditRequest);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('studentId');
    });

    it('should handle empty arrays as valid', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 2,
        internshipDurationWeeks: 8,
        submissionHistory: [], // Empty array is valid
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(true);
    });

    it('should handle zero values as valid', () => {
      const creditRequest = {
        creditRequestId: 'CR-123',
        status: 'pending_mentor_review',
        requestedAt: new Date(),
        lastUpdatedAt: new Date(),
        calculatedCredits: 0, // Zero is valid
        internshipDurationWeeks: 8,
        submissionHistory: [],
      };

      const result = validateStudentView(creditRequest);
      expect(result.valid).toBe(true);
    });
  });
});
