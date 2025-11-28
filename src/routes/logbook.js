import { Router } from "express";
import { submitLogbook } from "../controllers/studentController.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * /api/logbooks:
 *   post:
 *     summary: Submit a new logbook entry
 *     tags: [Logbooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - internshipId
 *               - weekNumber
 *               - activities
 *               - startDate
 *               - endDate
 *               - hoursWorked
 *             properties:
 *               internshipId:
 *                 type: string
 *               weekNumber:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               hoursWorked:
 *                 type: number
 *               activities:
 *                 type: string
 *               tasksCompleted:
 *                 type: array
 *                 items:
 *                   type: string
 *               skillsUsed:
 *                 type: array
 *                 items:
 *                   type: string
 *               challenges:
 *                 type: string
 *               learnings:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Logbook submitted successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Logbook already exists for this week
 */
router.post("/", authenticate, asyncHandler(submitLogbook));

export default router;
