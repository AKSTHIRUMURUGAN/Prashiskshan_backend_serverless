import mongoose from 'mongoose';
import Company from '../../../src/models/Company.js';

describe('Company Model - Reappeal Fields', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Company.deleteMany({});
  });

  describe('Status Enum', () => {
    it('should accept "reappeal" as a valid status', async () => {
      const companyData = {
        companyId: 'TEST001',
        firebaseUid: 'firebase-test-uid',
        companyName: 'Test Company',
        website: 'https://test.com',
        email: 'test@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123456',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
      };

      const company = new Company(companyData);
      await company.validate();
      
      expect(company.status).toBe('reappeal');
    });

    it('should reject invalid status values', async () => {
      const companyData = {
        companyId: 'TEST002',
        firebaseUid: 'firebase-test-uid-2',
        companyName: 'Test Company 2',
        website: 'https://test2.com',
        email: 'test2@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123457',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'invalid_status',
      };

      const company = new Company(companyData);
      
      await expect(company.validate()).rejects.toThrow();
    });
  });

  describe('BlockInfo Schema', () => {
    it('should store block information', async () => {
      const companyData = {
        companyId: 'TEST003',
        firebaseUid: 'firebase-test-uid-3',
        companyName: 'Test Company 3',
        website: 'https://test3.com',
        email: 'test3@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123458',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'blocked',
        blockInfo: {
          reason: 'Policy violation',
          blockedBy: 'admin123',
          blockedAt: new Date(),
        },
      };

      const company = new Company(companyData);
      await company.validate();
      
      expect(company.blockInfo.reason).toBe('Policy violation');
      expect(company.blockInfo.blockedBy).toBe('admin123');
      expect(company.blockInfo.blockedAt).toBeInstanceOf(Date);
    });
  });

  describe('Reappeal Schema', () => {
    it('should store reappeal information', async () => {
      const companyData = {
        companyId: 'TEST004',
        firebaseUid: 'firebase-test-uid-4',
        companyName: 'Test Company 4',
        website: 'https://test4.com',
        email: 'test4@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123459',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
        reappeal: {
          message: 'This is a valid reappeal message with sufficient length',
          attachment: 'https://r2.example.com/reappeal-doc.pdf',
          submittedAt: new Date(),
        },
      };

      const company = new Company(companyData);
      await company.validate();
      
      expect(company.reappeal.message).toBe('This is a valid reappeal message with sufficient length');
      expect(company.reappeal.attachment).toBe('https://r2.example.com/reappeal-doc.pdf');
      expect(company.reappeal.submittedAt).toBeInstanceOf(Date);
    });

    it('should reject reappeal message shorter than 10 characters', async () => {
      const companyData = {
        companyId: 'TEST005',
        firebaseUid: 'firebase-test-uid-5',
        companyName: 'Test Company 5',
        website: 'https://test5.com',
        email: 'test5@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123460',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
        reappeal: {
          message: 'Short',
          submittedAt: new Date(),
        },
      };

      const company = new Company(companyData);
      
      await expect(company.validate()).rejects.toThrow();
    });

    it('should reject reappeal message longer than 2000 characters', async () => {
      const longMessage = 'a'.repeat(2001);
      const companyData = {
        companyId: 'TEST006',
        firebaseUid: 'firebase-test-uid-6',
        companyName: 'Test Company 6',
        website: 'https://test6.com',
        email: 'test6@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123461',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
        reappeal: {
          message: longMessage,
          submittedAt: new Date(),
        },
      };

      const company = new Company(companyData);
      
      await expect(company.validate()).rejects.toThrow();
    });

    it('should store reappeal history', async () => {
      const companyData = {
        companyId: 'TEST007',
        firebaseUid: 'firebase-test-uid-7',
        companyName: 'Test Company 7',
        website: 'https://test7.com',
        email: 'test7@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123462',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
        reappeal: {
          message: 'Current reappeal message',
          submittedAt: new Date(),
          history: [
            {
              message: 'Previous reappeal message',
              submittedAt: new Date('2024-01-01'),
              reviewedAt: new Date('2024-01-05'),
              decision: 'rejected',
              reviewedBy: 'admin123',
              feedback: 'Insufficient evidence',
            },
          ],
        },
      };

      const company = new Company(companyData);
      await company.validate();
      
      expect(company.reappeal.history).toHaveLength(1);
      expect(company.reappeal.history[0].decision).toBe('rejected');
      expect(company.reappeal.history[0].reviewedBy).toBe('admin123');
    });
  });

  describe('Reappeal Attachment Cleanup', () => {
    it('should have pre-remove hook defined', () => {
      const hooks = Company.schema.s.hooks;
      const preRemoveHooks = hooks._pres.get('remove');
      
      expect(preRemoveHooks).toBeDefined();
      expect(preRemoveHooks.length).toBeGreaterThan(0);
    });

    it('should have pre-deleteOne hook defined', () => {
      const hooks = Company.schema.s.hooks;
      const preDeleteOneHooks = hooks._pres.get('deleteOne');
      
      expect(preDeleteOneHooks).toBeDefined();
      expect(preDeleteOneHooks.length).toBeGreaterThan(0);
    });

    it('should not throw error when deleting company without reappeal attachment', async () => {
      const companyData = {
        companyId: 'TEST008',
        firebaseUid: 'firebase-test-uid-8',
        companyName: 'Test Company 8',
        website: 'https://test8.com',
        email: 'test8@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123463',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'blocked',
      };

      const company = new Company(companyData);
      await company.save();
      
      // Should not throw error even without reappeal attachment
      await expect(company.deleteOne()).resolves.not.toThrow();
    });

    it('should handle company with reappeal attachment during deletion', async () => {
      const companyData = {
        companyId: 'TEST009',
        firebaseUid: 'firebase-test-uid-9',
        companyName: 'Test Company 9',
        website: 'https://test9.com',
        email: 'test9@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123464',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
        reappeal: {
          message: 'Test reappeal message for cleanup',
          attachment: 'https://pub-test.r2.dev/2025-12-01/test-attachment.pdf',
          submittedAt: new Date(),
        },
      };

      const company = new Company(companyData);
      await company.save();
      
      // Should not throw error even if storage deletion fails
      await expect(company.deleteOne()).resolves.not.toThrow();
    });

    it('should handle company with historical reappeal attachments during deletion', async () => {
      const companyData = {
        companyId: 'TEST010',
        firebaseUid: 'firebase-test-uid-10',
        companyName: 'Test Company 10',
        website: 'https://test10.com',
        email: 'test10@test.com',
        phone: '1234567890',
        address: 'Test Address',
        documents: {
          cinNumber: 'CIN123465',
        },
        pointOfContact: {
          name: 'Test Contact',
          email: 'contact@test.com',
          phone: '1234567890',
        },
        status: 'reappeal',
        reappeal: {
          message: 'Current reappeal message',
          attachment: 'https://pub-test.r2.dev/2025-12-01/current-attachment.pdf',
          submittedAt: new Date(),
          history: [
            {
              message: 'Previous reappeal message',
              attachment: 'https://pub-test.r2.dev/2025-11-01/old-attachment.pdf',
              submittedAt: new Date('2024-11-01'),
              reviewedAt: new Date('2024-11-05'),
              decision: 'rejected',
              reviewedBy: 'admin123',
            },
          ],
        },
      };

      const company = new Company(companyData);
      await company.save();
      
      // Should not throw error even if storage deletion fails
      await expect(company.deleteOne()).resolves.not.toThrow();
    });
  });
});
