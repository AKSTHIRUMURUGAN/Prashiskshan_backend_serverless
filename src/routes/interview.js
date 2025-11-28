import { Router } from "express";
import { startInterview, submitAnswer, getSession, getHistory } from "../controllers/interviewController.js";
import { authenticate } from "../middleware/auth.js";
import { aiFeatureLimit } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * /api/interviews/start:
 *   post:
 *     summary: Start interview practice
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 */
router.post("/start", authenticate, aiFeatureLimit("interview"), asyncHandler(startInterview));

/**
 * @swagger
 * /api/interviews/{sessionId}/answer:
 *   post:
 *     summary: Submit interview answer
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:sessionId/answer", authenticate, aiFeatureLimit("interview"), asyncHandler(submitAnswer));

/**
 * @swagger
 * /api/interviews/{sessionId}:
 *   get:
 *     summary: Get interview session details
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:sessionId", authenticate, asyncHandler(getSession));

export default router;
