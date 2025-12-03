import { logger } from "../utils/logger.js";

/**
 * Enhanced admin authorization middleware with audit logging
 * Ensures only admin users can access protected endpoints
 * Logs all admin actions for audit trail
 * 
 * Requirements: All (Task 22.1)
 */
export const requireAdminRole = (req, res, next) => {
  const actualRole = req.user?.role;
  const adminId = req.user?.adminId;
  const mongoId = req.user?.mongoId;

  // Check if user is authenticated
  if (!actualRole) {
    logger.warn("Unauthorized access attempt to admin endpoint", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(401).json({
      success: false,
      error: "Unauthenticated",
      message: "Authentication required",
    });
  }

  // Check if user has admin role
  if (actualRole !== "admin") {
    logger.warn("Forbidden access attempt to admin endpoint", {
      path: req.path,
      method: req.method,
      role: actualRole,
      userId: mongoId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Admin privileges required",
      details: `Required role: admin, but you are: ${actualRole}`,
    });
  }

  // Log admin action for audit trail
  logger.info("Admin action", {
    adminId,
    mongoId,
    path: req.path,
    method: req.method,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
  });

  return next();
};

/**
 * Log admin action with details
 * Used for logging specific admin operations beyond endpoint access
 * 
 * @param {string} action - The action being performed
 * @param {object} details - Additional details about the action
 * @param {object} req - Express request object
 */
export const logAdminAction = (action, details, req) => {
  const adminId = req.user?.adminId;
  const mongoId = req.user?.mongoId;

  logger.info("Admin operation", {
    action,
    adminId,
    mongoId,
    details,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
  });
};
