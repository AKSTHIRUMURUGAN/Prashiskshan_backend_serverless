import { jest } from '@jest/globals';

// Mock dependencies using unstable_mockModule for ESM support
jest.unstable_mockModule('../../../src/models/Company.js', () => ({
    default: {
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.unstable_mockModule('../../../src/controllers/helpers/context.js', () => ({
    resolveUserFromRequest: jest.fn(),
    createHttpError: jest.fn((status, message) => ({ status, message })),
}));

// Dynamic imports after mocking
const { submitReappeal } = await import('../../../src/controllers/companyController.js');
const Company = (await import('../../../src/models/Company.js')).default;
const contextHelper = await import('../../../src/controllers/helpers/context.js');

describe('Company Controller - submitReappeal', () => {
    let req, res, next;
    let mockCompany;

    beforeEach(() => {
        req = {
            body: {},
            file: null,
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        next = jest.fn();

        mockCompany = {
            _id: 'mock-id',
            companyId: 'COMP123',
            status: 'blocked',
            reappeal: {},
            blockInfo: {
                reason: 'Violation',
                blockedBy: 'admin',
                blockedAt: new Date(),
            },
        };

        // Default mock implementation
        contextHelper.resolveUserFromRequest.mockResolvedValue({
            role: 'company',
            doc: mockCompany,
        });

        Company.findByIdAndUpdate.mockResolvedValue({
            ...mockCompany,
            status: 'reappeal',
            reappeal: {
                submittedAt: new Date(),
            },
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Property 1: Message Validation', () => {
        it('should reject missing message', async () => {
            req.body = {};
            await submitReappeal(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Reappeal message is required' }));
        });

        it('should reject message shorter than 10 characters', async () => {
            req.body = { message: 'Too short' };
            await submitReappeal(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Reappeal message must be between 10 and 2000 characters' }));
        });

        it('should reject message longer than 2000 characters', async () => {
            req.body = { message: 'a'.repeat(2001) };
            await submitReappeal(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Reappeal message must be between 10 and 2000 characters' }));
        });

        it('should accept valid message', async () => {
            req.body = { message: 'This is a valid reappeal message.' };
            await submitReappeal(req, res, next);
            expect(Company.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('Property 2: Attachment Validation', () => {
        beforeEach(() => {
            req.body = { message: 'Valid message for attachment test' };
        });

        it('should reject invalid file type', async () => {
            req.file = {
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('test'),
            };
            await submitReappeal(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Attachment must be PDF, JPG, or PNG' }));
        });

        it('should reject file larger than 10MB', async () => {
            req.file = {
                mimetype: 'application/pdf',
                size: 11 * 1024 * 1024, // 11MB
                buffer: Buffer.alloc(10),
            };
            await submitReappeal(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Attachment must be under 10MB' }));
        });
    });

    describe('Property 3: Cooldown Enforcement', () => {
        it('should prevent submission if cooldown is active', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            mockCompany.reappeal = {
                cooldownEndsAt: futureDate,
            };

            req.body = { message: 'Valid message' };
            await submitReappeal(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
            expect(next.mock.calls[0][0].message).toMatch(/Cannot submit reappeal until/);
        });

        it('should allow submission if cooldown has expired', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            mockCompany.reappeal = {
                cooldownEndsAt: pastDate,
            };

            req.body = { message: 'Valid message' };
            await submitReappeal(req, res, next);

            expect(Company.findByIdAndUpdate).toHaveBeenCalled();
        });
    });

    describe('Property 4: Duplicate Prevention', () => {
        it('should prevent submission if already in reappeal status', async () => {
            mockCompany.status = 'reappeal';
            req.body = { message: 'Valid message' };

            await submitReappeal(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Reappeal already submitted and under review' }));
        });

        it('should prevent submission if company is not blocked', async () => {
            mockCompany.status = 'verified';
            req.body = { message: 'Valid message' };

            await submitReappeal(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: 'Only blocked companies can submit reappeals' }));
        });
    });
});
