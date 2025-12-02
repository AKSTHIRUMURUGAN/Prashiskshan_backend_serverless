import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import creditMetricsService from "../services/creditMetricsService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * @route GET /api/metrics
 * @desc Get credit transfer system metrics
 * @access Admin only
 */
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const metrics = creditMetricsService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error fetching metrics", { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch metrics",
        details: error.message,
      },
    });
  }
});

/**
 * @route GET /api/metrics/summary
 * @desc Get metrics summary with logging
 * @access Admin only
 */
router.get("/summary", authenticate, authorize("admin"), async (req, res) => {
  try {
    const summary = creditMetricsService.getMetricsSummary();
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error fetching metrics summary", { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch metrics summary",
        details: error.message,
      },
    });
  }
});

/**
 * @route GET /api/metrics/health
 * @desc Check system health and get alerts
 * @access Admin only
 */
router.get("/health", authenticate, authorize("admin"), async (req, res) => {
  try {
    const health = await creditMetricsService.checkSystemHealth();
    
    const statusCode = health.healthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.healthy,
      data: health,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error checking system health", { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to check system health",
        details: error.message,
      },
    });
  }
});

/**
 * @route POST /api/metrics/reset
 * @desc Reset all metrics (for testing/maintenance)
 * @access Admin only
 */
router.post("/reset", authenticate, authorize("admin"), async (req, res) => {
  try {
    creditMetricsService.resetAllMetrics();
    
    logger.info("Metrics reset by admin", {
      adminId: req.user.uid,
    });
    
    res.json({
      success: true,
      message: "All metrics have been reset",
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error resetting metrics", { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to reset metrics",
        details: error.message,
      },
    });
  }
});

export default router;
