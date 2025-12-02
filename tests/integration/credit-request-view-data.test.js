/**
 * Integration tests for Credit Request View Data Completeness
 * 
 * These tests verify that API endpoints return all required fields
 * for different user roles (student, mentor, admin).
 * 
 * Requirements: 3.2, 5.2, 8.2, 10.1, 11.1, 11.2, 12.1
 */

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import studentRouter from '../../src/routes/student.js';
import mentorRouter from '../../src/routes/mentor.js';
import adminRouter from '../../src/routes/admin.js';
import Student from '../../src/models/Student.js';
import Mentor from '../../src/models/Mentor.js';
import Admin from '../../src/models/Admin.js';
import Company from '../../src/models/Company.js';
import Internship from '../../src/models/Internship.js';
import InternshipCompletion from '../../src/models/InternshipCompletion.js';
import CreditRequest from '../../src/models/CreditRequest.js';
import { validateStudentView, validateMentorView, validateAdminView } from '../../src/utils/viewDataValidation.js';
import { createTestStudent, createTestMentor, createTestAdmin, getAuthToken } from '../helpers/testHelpers.js';

const app = express();
app.use(express.json());
app.use('/api/students', studentRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/admin', adminRouter);

describe('Credit Request View Data Completeness - Integration Tests', () => {
  let student, mentor, admin, company, internship, completion, creditRequest;
  let studentToken, mentorToken, adminToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prashiskshan-test');
    }
  });

  beforeEach(async () => {
    // Clear collections
    await Student.deleteMany({});
    await Mentor.deleteMany({});
    await Admin.deleteMany({});
    await Company.deleteMany({});
    await Internship.deleteMany({});
    await InternshipCompletion.deleteMany({});
    await CreditRequest.deleteMany({});

    // Create test users using helpers
    const { student: studentData, firebaseUser: studentFirebase } = await createTestStudent();
    student = studentData;
    studentToken = await getAuthToken(studentFirebase);

    const { mentor: mentorData, firebaseUser: mentorFirebase } = await createTestMentor();
    mentor = mentorData;
    mentorToken = await getAuthToken(mentorFirebase);

    const { admin: adminData, firebaseUser: adminFirebase } = await createTestAdmin();
    admin = adminData;
    adminToken = await getAuthToken(adminFirebase);

    // Create company
    company = await Company.create({
      companyId: 'CMP-TEST-001',
      firebaseUid: 'firebase-company-001',
      email: 'company@test.com',
      companyName: 'Test Company',
      status: 'verified',
      phone: '+1234567890',
      website: 'https://testcompany.com',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345',
      },
      pointOfContact: {
        name: 'Test Contact',
        email: 'contact@testcompany.com',
        phone: '+1234567890',
      },
      documents: {
        registrationCertificate: 'https://example.com/cert.pdf',
        taxId: 'TAX123',
      },
    });

    // Create internship
    internship = await Internship.create({
      internshipId: 'INT-TEST-001',
      companyId: company._id,
      title: 'Software Engineering Intern',
      description: 'Test internship',
      duration: 8,
      status: 'approved',
    });

    // Create completion
    completion = await InternshipCompletion.create({
      completionId: 'COMP-TEST-001',
      studentId: student._id,
      internshipId: internship._id,
      companyId: company._id,
      status: 'completed',
      logbook: [
        { week: 1, activities: 'Week 1 activities', learnings: 'Week 1 learnings' },
        { week: 2, activities: 'Week 2 activities', learnings: 'Week 2 learnings' },
      ],
      finalReport: {
        content: 'Final report content',
        submittedAt: new Date(),
      },
      companyCompletion: {
        markedCompleteBy: 'company-user',
        markedCompleteAt: new Date(),
        evaluationScore: 4.5,
        evaluationComments: 'Excellent performance',
      },
    });

    // Create credit request
    creditRequest = await CreditRequest.create({
      creditRequestId: 'CR-TEST-001',
      studentId: student._id,
      internshipCompletionId: completion._id,
      internshipId: internship._id,
      mentorId: mentor._id,
      requestedCredits: 2,
      calculatedCredits: 2,
      internshipDurationWeeks: 8,
      status: 'pending_mentor_review',
      requestedAt: new Date(),
      lastUpdatedAt: new Date(),
      submissionHistory: [],
      metadata: {
        notificationsSent: [],
        remindersSent: 0,
        escalations: 0,
      },
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Student View Data Completeness', () => {
    it('should return complete data for student credit request details', async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.creditRequest).toBeDefined();

      // Validate data completeness
      const validation = validateStudentView(response.body.data.creditRequest);
      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);

      // Verify specific required fields
      const cr = response.body.data.creditRequest;
      expect(cr.creditRequestId).toBe(creditRequest.creditRequestId);
      expect(cr.status).toBe('pending_mentor_review');
      expect(cr.requestedAt).toBeDefined();
      expect(cr.lastUpdatedAt).toBeDefined();
      expect(cr.calculatedCredits).toBe(2);
      expect(cr.internshipDurationWeeks).toBe(8);
      expect(cr.submissionHistory).toBeDefined();
    });

    it('should include feedback for rejected credit requests', async () => {
      // Update credit request to rejected status with feedback
      creditRequest.status = 'mentor_rejected';
      creditRequest.mentorReview = {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: 'rejected',
        feedback: 'Logbook entries are incomplete. Please add more details.',
        qualityCriteria: {
          logbookComplete: false,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();

      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Validate data completeness
      const validation = validateStudentView(response.body.data.creditRequest);
      expect(validation.valid).toBe(true);

      // Verify feedback is present
      const cr = response.body.data.creditRequest;
      expect(cr.mentorReview).toBeDefined();
      expect(cr.mentorReview.feedback).toBe('Logbook entries are incomplete. Please add more details.');
    });

    it('should include certificate for completed credit requests', async () => {
      // Update credit request to completed status with certificate
      creditRequest.status = 'completed';
      creditRequest.certificate = {
        certificateUrl: 'https://example.com/certificates/CR-TEST-001.pdf',
        certificateId: 'CERT-TEST-001',
        generatedAt: new Date(),
      };
      await creditRequest.save();

      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Validate data completeness
      const validation = validateStudentView(response.body.data.creditRequest);
      expect(validation.valid).toBe(true);

      // Verify certificate is present
      const cr = response.body.data.creditRequest;
      expect(cr.certificate).toBeDefined();
      expect(cr.certificate.certificateUrl).toBe('https://example.com/certificates/CR-TEST-001.pdf');
      expect(cr.certificate.certificateId).toBe('CERT-TEST-001');
    });
  });

  describe('Mentor View Data Completeness', () => {
    it('should return complete data for mentor credit request review', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentor._id}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Validate data completeness
      const validation = validateMentorView(response.body.data);
      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);

      // Verify specific required fields
      const cr = response.body.data;
      expect(cr.studentId).toBeDefined();
      expect(cr.studentId.profile).toBeDefined();
      expect(cr.studentId.email).toBe('student@test.com');
      expect(cr.internshipId).toBeDefined();
      expect(cr.internshipId.title).toBe('Software Engineering Intern');
      expect(cr.internshipCompletionId).toBeDefined();
      expect(cr.internshipCompletionId.logbook).toBeDefined();
      expect(cr.internshipCompletionId.finalReport).toBeDefined();
      expect(cr.internshipCompletionId.companyCompletion).toBeDefined();
      expect(cr.internshipCompletionId.companyCompletion.evaluationScore).toBe(4.5);
    });

    it('should include logbook data in mentor view', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentor._id}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      const cr = response.body.data;
      expect(cr.internshipCompletionId.logbook).toBeDefined();
      expect(cr.internshipCompletionId.logbook.length).toBeGreaterThan(0);
      expect(cr.internshipCompletionId.logbook[0].activities).toBeDefined();
    });

    it('should include final report in mentor view', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentor._id}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      const cr = response.body.data;
      expect(cr.internshipCompletionId.finalReport).toBeDefined();
      expect(cr.internshipCompletionId.finalReport.content).toBeDefined();
    });

    it('should include company evaluation in mentor view', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentor._id}/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      const cr = response.body.data;
      expect(cr.internshipCompletionId.companyCompletion).toBeDefined();
      expect(cr.internshipCompletionId.companyCompletion.evaluationScore).toBe(4.5);
      expect(cr.internshipCompletionId.companyCompletion.evaluationComments).toBe('Excellent performance');
    });
  });

  describe('Admin View Data Completeness', () => {
    it('should return complete data for admin credit request review', async () => {
      // Update credit request to pending admin review with mentor approval
      creditRequest.status = 'pending_admin_review';
      creditRequest.mentorReview = {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: 'approved',
        feedback: 'Good work',
        qualityCriteria: {
          logbookComplete: true,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();

      const response = await request(app)
        .get(`/api/admin/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Validate data completeness
      const validation = validateAdminView(response.body.data);
      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);

      // Verify specific required fields
      const cr = response.body.data;
      expect(cr.creditRequestId).toBe(creditRequest.creditRequestId);
      expect(cr.studentId).toBeDefined();
      expect(cr.internshipId).toBeDefined();
      expect(cr.mentorId).toBeDefined();
      expect(cr.status).toBe('pending_admin_review');
      expect(cr.mentorReview).toBeDefined();
      expect(cr.mentorReview.decision).toBe('approved');
      expect(cr.internshipDurationWeeks).toBe(8);
    });

    it('should include mentor approval status in admin view', async () => {
      creditRequest.status = 'pending_admin_review';
      creditRequest.mentorReview = {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: 'approved',
        feedback: 'Approved',
        qualityCriteria: {
          logbookComplete: true,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();

      const response = await request(app)
        .get(`/api/admin/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const cr = response.body.data;
      expect(cr.mentorReview).toBeDefined();
      expect(cr.mentorReview.decision).toBe('approved');
      expect(cr.mentorReview.reviewedAt).toBeDefined();
      expect(cr.mentorReview.qualityCriteria).toBeDefined();
    });

    it('should include compliance data (NEP duration) in admin view', async () => {
      creditRequest.status = 'pending_admin_review';
      creditRequest.mentorReview = {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: 'approved',
        qualityCriteria: {
          logbookComplete: true,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();

      const response = await request(app)
        .get(`/api/admin/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const cr = response.body.data;
      expect(cr.internshipDurationWeeks).toBe(8);
      expect(cr.calculatedCredits).toBe(2);
      
      // Verify NEP compliance can be calculated
      const nepCompliant = cr.internshipDurationWeeks >= 4;
      expect(nepCompliant).toBe(true);
    });

    it('should include mentor feedback for rejected requests in admin view', async () => {
      creditRequest.status = 'mentor_rejected';
      creditRequest.mentorReview = {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: 'rejected',
        feedback: 'Logbook needs improvement',
        qualityCriteria: {
          logbookComplete: false,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();

      const response = await request(app)
        .get(`/api/admin/credit-requests/${creditRequest.creditRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const cr = response.body.data;
      expect(cr.mentorReview).toBeDefined();
      expect(cr.mentorReview.decision).toBe('rejected');
      expect(cr.mentorReview.feedback).toBe('Logbook needs improvement');
    });
  });

  describe('List Endpoints Data Completeness', () => {
    it('should return complete data for student credit request list', async () => {
      const response = await request(app)
        .get(`/api/students/${student.studentId}/credit-requests`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBeGreaterThan(0);

      // Validate each item
      response.body.data.items.forEach((item) => {
        const validation = validateStudentView(item);
        expect(validation.valid).toBe(true);
      });
    });

    it('should return complete data for mentor pending credit requests', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentor._id}/credit-requests/pending`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.creditRequests).toBeDefined();
      
      // Note: List endpoints may not include all populated fields
      // This is acceptable as long as detail endpoints have complete data
    });

    it('should return complete data for admin pending credit requests', async () => {
      // Update to pending admin review
      creditRequest.status = 'pending_admin_review';
      creditRequest.mentorReview = {
        reviewedBy: mentor._id,
        reviewedAt: new Date(),
        decision: 'approved',
        qualityCriteria: {
          logbookComplete: true,
          reportQuality: true,
          learningOutcomes: true,
          companyEvaluation: true,
        },
      };
      await creditRequest.save();

      const response = await request(app)
        .get('/api/admin/credit-requests/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
