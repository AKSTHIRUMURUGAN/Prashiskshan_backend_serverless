import { Router } from "express";
import { applyToInternship, updateApplicationStatus } from "../controllers/applicationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// ... existing swagger ...
router.post("/", asyncHandler(applyToInternship));

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     summary: Update application status
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *               feedback:
 *                 type: string
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", asyncHandler(updateApplicationStatus));

export default router;
