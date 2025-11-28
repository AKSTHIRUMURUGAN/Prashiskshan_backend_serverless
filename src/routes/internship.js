import { Router } from "express";
import { browseInternships } from "../controllers/internshipController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * /api/internships/browse:
 *   get:
 *     summary: Browse internships
 *     tags: [Internships]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: workMode
 *         schema:
 *           type: string
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *       - in: query
 *         name: minStipend
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxStipend
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of internships
 */
router.get("/browse", asyncHandler(browseInternships));

export default router;
