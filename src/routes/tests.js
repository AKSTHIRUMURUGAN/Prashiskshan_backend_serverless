import { Router } from "express";
import multer from "multer";
import { authenticate, identifyUser, authorize } from "../middleware/auth.js";
import { emailService } from "../services/emailService.js";
import { storageService } from "../services/storageService.js";
import { addToQueue } from "../queues/index.js";
import { aiService } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

const router = Router();
const adminAuth = [authenticate, identifyUser, authorize("admin")];

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * /api/tests/email:
 *   post:
 *     summary: Test email service
 *     description: Send a test email to verify email service configuration (Admin only)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - template
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               subject:
 *                 type: string
 *                 example: "Test Email"
 *               template:
 *                 type: string
 *                 enum: [welcome, application_received, application_approved, application_rejected, logbook_approved, logbook_revision, completion_certificate]
 *                 example: "welcome"
 *               data:
 *                 type: object
 *                 example:
 *                   name: "John Doe"
 *                   link: "https://example.com"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Email service error
 */
router.post(
  "/email",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { to, subject, template, data } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json(apiError("Missing required fields: to, subject, template"));
    }

    try {
      const result = await emailService.sendEmail({
        to,
        subject,
        template,
        data: data || {},
      });

      logger.info("Test email sent", { to, template, result });
      res.json(apiSuccess({ messageId: result.messageId, to, template }, "Test email sent successfully"));
    } catch (error) {
      logger.error("Test email failed", error);
      res.status(500).json(apiError("Failed to send test email", { error: error.message }));
    }
  }),
);

/**
 * @swagger
 * /api/tests/s3:
 *   post:
 *     summary: Test S3 storage service
 *     description: Upload a test file to S3 to verify storage configuration (Admin only)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 example: "test"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                     key:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Storage service error
 */
router.post(
  "/s3",
  adminAuth,
  fileUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json(apiError("No file provided"));
    }

    try {
      const folder = req.body.folder || "test";
      const result = await storageService.uploadFile({
        file: req.file.buffer,
        filename: req.file.originalname,
        folder,
        mimetype: req.file.mimetype,
      });

      logger.info("Test file uploaded", { url: result.url, key: result.key });
      res.json(apiSuccess(result, "Test file uploaded successfully"));
    } catch (error) {
      logger.error("Test S3 upload failed", error);
      res.status(500).json(apiError("Failed to upload test file", { error: error.message }));
    }
  }),
);

/**
 * @swagger
 * /api/tests/queue:
 *   post:
 *     summary: Test queue service
 *     description: Add a test job to the queue to verify queue configuration (Admin only)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queueName
 *             properties:
 *               queueName:
 *                 type: string
 *                 enum: [email, sms, logbook, report, notification, completion, ai]
 *                 example: "email"
 *               data:
 *                 type: object
 *                 example:
 *                   to: "test@example.com"
 *                   template: "welcome"
 *     responses:
 *       200:
 *         description: Job added to queue successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     queueName:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Queue service error
 */
router.post(
  "/queue",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { queueName, data } = req.body;

    if (!queueName) {
      return res.status(400).json(apiError("Missing required field: queueName"));
    }

    const validQueues = ["email", "sms", "logbook", "report", "notification", "completion", "ai"];
    if (!validQueues.includes(queueName)) {
      return res.status(400).json(apiError(`Invalid queue name. Must be one of: ${validQueues.join(", ")}`));
    }

    try {
      const job = await addToQueue(queueName, data || {}, {
        priority: 1,
        attempts: 1,
      });

      logger.info("Test job added to queue", { queueName, jobId: job.id });
      res.json(apiSuccess({ jobId: job.id, queueName }, "Test job added to queue successfully"));
    } catch (error) {
      logger.error("Test queue job failed", error);
      res.status(500).json(apiError("Failed to add test job to queue", { error: error.message }));
    }
  }),
);

/**
 * @swagger
 * /api/tests/gemini:
 *   post:
 *     summary: Test Gemini AI service
 *     description: Send a test prompt to Gemini AI to verify AI service configuration (Admin only)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Write a brief summary about artificial intelligence"
 *               model:
 *                 type: string
 *                 enum: [flash, pro]
 *                 default: flash
 *                 example: "flash"
 *     responses:
 *       200:
 *         description: AI response received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                     model:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: AI service error
 */
router.post(
  "/gemini",
  adminAuth,
  asyncHandler(async (req, res) => {
    const { prompt, model = "flash" } = req.body;

    if (!prompt) {
      return res.status(400).json(apiError("Missing required field: prompt"));
    }

    if (!["flash", "pro"].includes(model)) {
      return res.status(400).json(apiError("Invalid model. Must be 'flash' or 'pro'"));
    }

    try {
      const response = await aiService.generateText(prompt, { model });

      logger.info("Test Gemini AI request completed", { model, promptLength: prompt.length });
      res.json(apiSuccess({ response, model }, "AI response generated successfully"));
    } catch (error) {
      logger.error("Test Gemini AI failed", error);
      res.status(500).json(apiError("Failed to generate AI response", { error: error.message }));
    }
  }),
);

/**
 * @swagger
 * /api/tests/status:
 *   get:
 *     summary: Get test services status
 *     description: Check the status of all test services (Email, S3, Queue, Gemini) (Admin only)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Services status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *                     s3:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *                     queue:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                     gemini:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  "/status",
  adminAuth,
  asyncHandler(async (req, res) => {
    const status = {
      email: {
        configured: !!process.env.BREVO_API_KEY || !!process.env.MAILGUN_API_KEY,
      },
      s3: {
        configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      },
      queue: {
        connected: true, // Redis connection is checked at startup
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
      },
    };

    res.json(apiSuccess(status, "Test services status retrieved"));
  }),
);

export default router;

