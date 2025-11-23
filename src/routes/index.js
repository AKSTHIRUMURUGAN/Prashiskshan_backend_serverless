import { Router } from "express";
import authRouter from "./auth.js";
import studentRouter from "./student.js";
import mentorRouter from "./mentor.js";
import companyRouter from "./company.js";
import adminRouter from "./admin.js";
import testRouter from "./tests.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns API health status and uptime
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Prashiskshan API is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       example: 1234.56
 */
router.get("/health", (_req, res) => {
  res.json(apiSuccess({ uptime: process.uptime() }, "Prashiskshan API is healthy"));
});

router.use("/auth", authRouter);
router.use("/students", studentRouter);
router.use("/mentors", mentorRouter);
router.use("/companies", companyRouter);
router.use("/admins", adminRouter);
router.use("/tests", testRouter);

router.use((req, res) => {
  res.status(404).json(apiError("Route not found", { path: req.originalUrl }, { status: 404 }));
});

export default router;
