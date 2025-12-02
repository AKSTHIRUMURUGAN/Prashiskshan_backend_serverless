import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validateMentorReview } from '../../../src/services/creditReviewService.js';

describe('CreditReviewService - Quality Criteria Validation', () => {
  describe('validateMentorReview', () => {
    describe('Requirement 11.4: All criteria must be met to approve', () => {
      it('should reject approval when not all criteria are met', () => {
        const reviewData = {
          decision: 'approved',
          qualityCriteria: {
            logbookComplete: true,
            reportQuality: false, // Not met
            learningOutcomes: true,
            companyEvaluation: true,
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('All quality criteria must be met to approve the request');
      });

      it('should allow approval when all criteria are met', () => {
        const reviewData = {
          decision: 'approved',
          qualityCriteria: {
            logbookComplete: true,
            reportQuality: true,
            learningOutcomes: true,
            companyEvaluation: true,
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Requirement 11.5: Unmet criteria require specific feedback', () => {
      it('should require feedback for unmet criteria', () => {
        const reviewData = {
          decision: 'rejected',
          feedback: 'Overall feedback',
          qualityCriteria: {
            logbookComplete: false, // Unmet
            reportQuality: true,
            learningOutcomes: false, // Unmet
            companyEvaluation: true,
          },
          // Missing criteriaFeedback
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Feedback is required for unmet quality criteria');
      });

      it('should require feedback for each specific unmet criterion', () => {
        const reviewData = {
          decision: 'rejected',
          feedback: 'Overall feedback',
          qualityCriteria: {
            logbookComplete: false, // Unmet
            reportQuality: true,
            learningOutcomes: false, // Unmet
            companyEvaluation: true,
          },
          criteriaFeedback: {
            logbookComplete: 'Logbook is incomplete', // Provided
            // learningOutcomes feedback missing
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Feedback is required for unmet criterion: learningOutcomes');
      });

      it('should accept when feedback is provided for all unmet criteria', () => {
        const reviewData = {
          decision: 'rejected',
          feedback: 'Overall feedback',
          qualityCriteria: {
            logbookComplete: false, // Unmet
            reportQuality: true,
            learningOutcomes: false, // Unmet
            companyEvaluation: true,
          },
          criteriaFeedback: {
            logbookComplete: 'Logbook entries are incomplete and lack detail',
            learningOutcomes: 'Learning outcomes are not clearly demonstrated',
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should not require criteriaFeedback when all criteria are met', () => {
        const reviewData = {
          decision: 'approved',
          qualityCriteria: {
            logbookComplete: true,
            reportQuality: true,
            learningOutcomes: true,
            companyEvaluation: true,
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty string feedback for unmet criteria', () => {
        const reviewData = {
          decision: 'rejected',
          feedback: 'Overall feedback',
          qualityCriteria: {
            logbookComplete: false,
            reportQuality: true,
            learningOutcomes: true,
            companyEvaluation: true,
          },
          criteriaFeedback: {
            logbookComplete: '   ', // Empty/whitespace only
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Feedback is required for unmet criterion: logbookComplete');
      });
    });

    describe('Existing validation rules', () => {
      it('should require decision', () => {
        const reviewData = {
          qualityCriteria: {
            logbookComplete: true,
            reportQuality: true,
            learningOutcomes: true,
            companyEvaluation: true,
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Decision is required');
      });

      it('should require feedback for rejections', () => {
        const reviewData = {
          decision: 'rejected',
          qualityCriteria: {
            logbookComplete: true,
            reportQuality: true,
            learningOutcomes: true,
            companyEvaluation: true,
          },
        };

        const result = validateMentorReview(reviewData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Feedback is required when rejecting a credit request');
      });
    });
  });
});
