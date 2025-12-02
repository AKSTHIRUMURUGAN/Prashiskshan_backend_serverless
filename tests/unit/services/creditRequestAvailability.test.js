import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import InternshipCompletion from '../../../src/models/InternshipCompletion.js';
import Student from '../../../src/models/Student.js';
import Internship from '../../../src/models/Internship.js';
import { creditService } from '../../../src/services/creditService.js';

describe('Credit Request Availability', () => {
  let testStudent;
  let testInternship;
  let testCompletion;

  beforeEach(async () => {
    // Create test student
    testStudent = await Student.create({
      studentId: `STU-${Date.now()}`,
      firebaseUid: `firebase-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      profile: {
        name: 'Test Student',
        department: 'Computer Science',
        year: 3,
        college: 'Test College',
      },
      credits: {
        earned: 0,
        approved: 0,
        pending: 0,
        history: [],
      },
    });

    // Create test internship
    testInternship = await Internship.create({
      internshipId: `INT-${Date.now()}`,
      title: 'Test Internship',
      description: 'Test internship description',
      companyId: new mongoose.Types.ObjectId(),
      department: 'Computer Science',
      requiredSkills: ['JavaScript', 'Node.js'],
      duration: '8 weeks',
      workMode: 'remote',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      slots: 5,
      postedBy: 'test-company',
      status: 'approved',
    });
  });

  afterEach(async () => {
    await Student.deleteMany({});
    await Internship.deleteMany({});
    await InternshipCompletion.deleteMany({});
  });

  describe('Validation for completed internships', () => {
    it('should allow credit request for completed internship', async () => {
      // Create completed internship
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'completed',
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
      });

      // Should successfully create credit request
      const creditRequest = await creditService.createCreditRequest(
        testStudent._id,
        testCompletion._id
      );

      expect(creditRequest).toBeDefined();
      expect(creditRequest.status).toBe('pending_mentor_review');
    });

    it('should reject credit request for non-completed internship', async () => {
      // Create pending internship completion
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'pending', // Not completed
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
      });

      // Should throw error
      await expect(
        creditService.createCreditRequest(testStudent._id, testCompletion._id)
      ).rejects.toThrow('Credit request can only be created for completed internships');
    });

    it('should reject credit request for issued status internship', async () => {
      // Create issued internship completion
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'issued', // Not completed
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
      });

      // Should throw error
      await expect(
        creditService.createCreditRequest(testStudent._id, testCompletion._id)
      ).rejects.toThrow('Credit request can only be created for completed internships');
    });

    it('should prevent duplicate credit requests', async () => {
      // Create completed internship
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'completed',
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
      });

      // Create first credit request
      await creditService.createCreditRequest(testStudent._id, testCompletion._id);

      // Attempt to create duplicate
      await expect(
        creditService.createCreditRequest(testStudent._id, testCompletion._id)
      ).rejects.toThrow('Credit request already exists for this internship');
    });
  });

  describe('Credit request availability indicator', () => {
    it('should show credit request available for completed internship without request', async () => {
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'completed',
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
      });

      const completion = await InternshipCompletion.findById(testCompletion._id).lean();
      
      // Check availability
      const isAvailable = completion.status === 'completed' && !completion.creditRequest?.requested;
      expect(isAvailable).toBe(true);
    });

    it('should show credit request not available for completed internship with existing request', async () => {
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'completed',
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
        creditRequest: {
          requested: true,
          requestId: new mongoose.Types.ObjectId(),
          requestedAt: new Date(),
          status: 'pending_mentor_review',
        },
      });

      const completion = await InternshipCompletion.findById(testCompletion._id).lean();
      
      // Check availability
      const isAvailable = completion.status === 'completed' && !completion.creditRequest?.requested;
      expect(isAvailable).toBe(false);
    });

    it('should show credit request not available for non-completed internship', async () => {
      testCompletion = await InternshipCompletion.create({
        completionId: `COMP-${Date.now()}`,
        studentId: testStudent._id,
        internshipId: testInternship._id,
        companyId: testInternship.companyId,
        totalHours: 320,
        creditsEarned: 2,
        completionDate: new Date(),
        status: 'pending',
        evaluation: {
          mentorScore: 85,
          companyScore: 90,
          overallComments: 'Excellent work',
        },
      });

      const completion = await InternshipCompletion.findById(testCompletion._id).lean();
      
      // Check availability
      const isAvailable = completion.status === 'completed' && !completion.creditRequest?.requested;
      expect(isAvailable).toBe(false);
    });
  });
});
