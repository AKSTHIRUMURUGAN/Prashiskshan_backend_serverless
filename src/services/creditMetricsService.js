import { logger } from "../utils/logger.js";
import CreditRequest from "../models/CreditRequest.js";

/**
 * Credit Metrics Service
 * Provides monitoring and metrics tracking for the credit transfer system
 */
class CreditMetricsService {
  constructor() {
    // In-memory metrics storage (in production, use Redis or a metrics service)
    this.metrics = {
      creditRequestCreation: {
        total: 0,
        lastHour: 0,
        lastDay: 0,
      },
      approvalTimes: {
        mentor: [],
        admin: [],
      },
      rejectionRates: {
        mentor: { total: 0, rejected: 0 },
        admin: { total: 0, rejected: 0 },
      },
      notificationDelivery: {
        sent: 0,
        failed: 0,
        pending: 0,
      },
      databaseQueries: {
        count: 0,
        totalDuration: 0,
        slowQueries: [],
      },
    };

    // Reset hourly metrics every hour
    setInterval(() => this.resetHourlyMetrics(), 60 * 60 * 1000);
    // Reset daily metrics every day
    setInterval(() => this.resetDailyMetrics(), 24 * 60 * 60 * 1000);
  }

  /**
   * Track credit request creation
   */
  trackCreditRequestCreation(creditRequestId, metadata = {}) {
    try {
      this.metrics.creditRequestCreation.total++;
      this.metrics.creditRequestCreation.lastHour++;
      this.metrics.creditRequestCreation.lastDay++;

      logger.info("Credit request creation tracked", {
        metric: "credit_request_creation",
        creditRequestId,
        total: this.metrics.creditRequestCreation.total,
        lastHour: this.metrics.creditRequestCreation.lastHour,
        lastDay: this.metrics.creditRequestCreation.lastDay,
        ...metadata,
      });
    } catch (error) {
      logger.error("Error tracking credit request creation", {
        error: error.message,
        creditRequestId,
      });
    }
  }

  /**
   * Track approval time for mentor or admin review
   */
  trackApprovalTime(role, creditRequestId, durationMs, metadata = {}) {
    try {
      const durationMinutes = Math.round(durationMs / 1000 / 60);

      if (role === "mentor" || role === "admin") {
        this.metrics.approvalTimes[role].push({
          creditRequestId,
          duration: durationMinutes,
          timestamp: new Date(),
        });

        // Keep only last 1000 entries
        if (this.metrics.approvalTimes[role].length > 1000) {
          this.metrics.approvalTimes[role].shift();
        }

        const avgTime = this.getAverageApprovalTime(role);

        logger.info("Approval time tracked", {
          metric: "approval_time",
          role,
          creditRequestId,
          durationMinutes,
          averageMinutes: avgTime,
          ...metadata,
        });

        // Alert if approval time is significantly above average
        if (avgTime > 0 && durationMinutes > avgTime * 2) {
          logger.warn("Approval time significantly above average", {
            metric: "approval_time_alert",
            role,
            creditRequestId,
            durationMinutes,
            averageMinutes: avgTime,
            threshold: avgTime * 2,
          });
        }
      }
    } catch (error) {
      logger.error("Error tracking approval time", {
        error: error.message,
        role,
        creditRequestId,
      });
    }
  }

  /**
   * Track rejection for mentor or admin review
   */
  trackRejection(role, creditRequestId, reason, metadata = {}) {
    try {
      if (role === "mentor" || role === "admin") {
        this.metrics.rejectionRates[role].total++;
        this.metrics.rejectionRates[role].rejected++;

        const rejectionRate = this.getRejectionRate(role);

        logger.info("Rejection tracked", {
          metric: "rejection",
          role,
          creditRequestId,
          reason,
          rejectionRate: `${rejectionRate.toFixed(2)}%`,
          ...metadata,
        });

        // Alert if rejection rate is high
        if (rejectionRate > 50) {
          logger.warn("High rejection rate detected", {
            metric: "rejection_rate_alert",
            role,
            rejectionRate: `${rejectionRate.toFixed(2)}%`,
            threshold: "50%",
          });
        }
      }
    } catch (error) {
      logger.error("Error tracking rejection", {
        error: error.message,
        role,
        creditRequestId,
      });
    }
  }

  /**
   * Track approval for mentor or admin review
   */
  trackApproval(role, creditRequestId, metadata = {}) {
    try {
      if (role === "mentor" || role === "admin") {
        this.metrics.rejectionRates[role].total++;

        const rejectionRate = this.getRejectionRate(role);

        logger.info("Approval tracked", {
          metric: "approval",
          role,
          creditRequestId,
          rejectionRate: `${rejectionRate.toFixed(2)}%`,
          ...metadata,
        });
      }
    } catch (error) {
      logger.error("Error tracking approval", {
        error: error.message,
        role,
        creditRequestId,
      });
    }
  }

  /**
   * Track notification delivery
   */
  trackNotificationSent(notificationType, creditRequestId, metadata = {}) {
    try {
      this.metrics.notificationDelivery.sent++;

      logger.info("Notification sent tracked", {
        metric: "notification_sent",
        notificationType,
        creditRequestId,
        totalSent: this.metrics.notificationDelivery.sent,
        ...metadata,
      });
    } catch (error) {
      logger.error("Error tracking notification sent", {
        error: error.message,
        notificationType,
        creditRequestId,
      });
    }
  }

  /**
   * Track notification failure
   */
  trackNotificationFailed(notificationType, creditRequestId, error, metadata = {}) {
    try {
      this.metrics.notificationDelivery.failed++;

      logger.error("Notification failed tracked", {
        metric: "notification_failed",
        notificationType,
        creditRequestId,
        error: error.message,
        totalFailed: this.metrics.notificationDelivery.failed,
        failureRate: `${this.getNotificationFailureRate().toFixed(2)}%`,
        ...metadata,
      });

      // Alert if failure rate is high
      const failureRate = this.getNotificationFailureRate();
      if (failureRate > 10) {
        logger.warn("High notification failure rate detected", {
          metric: "notification_failure_rate_alert",
          failureRate: `${failureRate.toFixed(2)}%`,
          threshold: "10%",
        });
      }
    } catch (err) {
      logger.error("Error tracking notification failure", {
        error: err.message,
        notificationType,
        creditRequestId,
      });
    }
  }

  /**
   * Track notification pending
   */
  trackNotificationPending(notificationType, creditRequestId, metadata = {}) {
    try {
      this.metrics.notificationDelivery.pending++;

      logger.info("Notification pending tracked", {
        metric: "notification_pending",
        notificationType,
        creditRequestId,
        totalPending: this.metrics.notificationDelivery.pending,
        ...metadata,
      });
    } catch (error) {
      logger.error("Error tracking notification pending", {
        error: error.message,
        notificationType,
        creditRequestId,
      });
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(queryName, durationMs, metadata = {}) {
    try {
      this.metrics.databaseQueries.count++;
      this.metrics.databaseQueries.totalDuration += durationMs;

      const avgDuration = this.getAverageDatabaseQueryTime();

      logger.debug("Database query tracked", {
        metric: "database_query",
        queryName,
        durationMs,
        averageDurationMs: avgDuration,
        totalQueries: this.metrics.databaseQueries.count,
        ...metadata,
      });

      // Track slow queries (> 1000ms)
      if (durationMs > 1000) {
        this.metrics.databaseQueries.slowQueries.push({
          queryName,
          duration: durationMs,
          timestamp: new Date(),
          ...metadata,
        });

        // Keep only last 100 slow queries
        if (this.metrics.databaseQueries.slowQueries.length > 100) {
          this.metrics.databaseQueries.slowQueries.shift();
        }

        logger.warn("Slow database query detected", {
          metric: "slow_query_alert",
          queryName,
          durationMs,
          threshold: 1000,
          ...metadata,
        });
      }
    } catch (error) {
      logger.error("Error tracking database query", {
        error: error.message,
        queryName,
      });
    }
  }

  /**
   * Get average approval time for a role
   */
  getAverageApprovalTime(role) {
    try {
      const times = this.metrics.approvalTimes[role];
      if (times.length === 0) return 0;

      const sum = times.reduce((acc, item) => acc + item.duration, 0);
      return Math.round(sum / times.length);
    } catch (error) {
      logger.error("Error calculating average approval time", {
        error: error.message,
        role,
      });
      return 0;
    }
  }

  /**
   * Get rejection rate for a role
   */
  getRejectionRate(role) {
    try {
      const { total, rejected } = this.metrics.rejectionRates[role];
      if (total === 0) return 0;
      return (rejected / total) * 100;
    } catch (error) {
      logger.error("Error calculating rejection rate", {
        error: error.message,
        role,
      });
      return 0;
    }
  }

  /**
   * Get notification failure rate
   */
  getNotificationFailureRate() {
    try {
      const { sent, failed } = this.metrics.notificationDelivery;
      const total = sent + failed;
      if (total === 0) return 0;
      return (failed / total) * 100;
    } catch (error) {
      logger.error("Error calculating notification failure rate", {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get average database query time
   */
  getAverageDatabaseQueryTime() {
    try {
      const { count, totalDuration } = this.metrics.databaseQueries;
      if (count === 0) return 0;
      return Math.round(totalDuration / count);
    } catch (error) {
      logger.error("Error calculating average database query time", {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get all current metrics
   */
  getMetrics() {
    try {
      return {
        creditRequestCreation: {
          ...this.metrics.creditRequestCreation,
          rate: {
            perHour: this.metrics.creditRequestCreation.lastHour,
            perDay: this.metrics.creditRequestCreation.lastDay,
          },
        },
        approvalTimes: {
          mentor: {
            average: this.getAverageApprovalTime("mentor"),
            count: this.metrics.approvalTimes.mentor.length,
          },
          admin: {
            average: this.getAverageApprovalTime("admin"),
            count: this.metrics.approvalTimes.admin.length,
          },
        },
        rejectionRates: {
          mentor: {
            ...this.metrics.rejectionRates.mentor,
            rate: this.getRejectionRate("mentor"),
          },
          admin: {
            ...this.metrics.rejectionRates.admin,
            rate: this.getRejectionRate("admin"),
          },
        },
        notificationDelivery: {
          ...this.metrics.notificationDelivery,
          failureRate: this.getNotificationFailureRate(),
        },
        databaseQueries: {
          count: this.metrics.databaseQueries.count,
          averageDuration: this.getAverageDatabaseQueryTime(),
          slowQueriesCount: this.metrics.databaseQueries.slowQueries.length,
          recentSlowQueries: this.metrics.databaseQueries.slowQueries.slice(-10),
        },
      };
    } catch (error) {
      logger.error("Error getting metrics", { error: error.message });
      return null;
    }
  }

  /**
   * Get metrics summary for logging
   */
  getMetricsSummary() {
    try {
      const metrics = this.getMetrics();

      logger.info("Credit transfer system metrics summary", {
        metric: "system_summary",
        creditRequests: {
          total: metrics.creditRequestCreation.total,
          perHour: metrics.creditRequestCreation.rate.perHour,
          perDay: metrics.creditRequestCreation.rate.perDay,
        },
        approvalTimes: {
          mentorAvg: `${metrics.approvalTimes.mentor.average} min`,
          adminAvg: `${metrics.approvalTimes.admin.average} min`,
        },
        rejectionRates: {
          mentor: `${metrics.rejectionRates.mentor.rate.toFixed(2)}%`,
          admin: `${metrics.rejectionRates.admin.rate.toFixed(2)}%`,
        },
        notifications: {
          sent: metrics.notificationDelivery.sent,
          failed: metrics.notificationDelivery.failed,
          failureRate: `${metrics.notificationDelivery.failureRate.toFixed(2)}%`,
        },
        database: {
          queries: metrics.databaseQueries.count,
          avgDuration: `${metrics.databaseQueries.averageDuration}ms`,
          slowQueries: metrics.databaseQueries.slowQueriesCount,
        },
      });

      return metrics;
    } catch (error) {
      logger.error("Error getting metrics summary", { error: error.message });
      return null;
    }
  }

  /**
   * Check system health and alert on critical issues
   */
  async checkSystemHealth() {
    try {
      const alerts = [];

      // Check rejection rates
      const mentorRejectionRate = this.getRejectionRate("mentor");
      const adminRejectionRate = this.getRejectionRate("admin");

      if (mentorRejectionRate > 50) {
        alerts.push({
          severity: "warning",
          type: "high_mentor_rejection_rate",
          message: `Mentor rejection rate is ${mentorRejectionRate.toFixed(2)}%`,
          threshold: "50%",
        });
      }

      if (adminRejectionRate > 50) {
        alerts.push({
          severity: "warning",
          type: "high_admin_rejection_rate",
          message: `Admin rejection rate is ${adminRejectionRate.toFixed(2)}%`,
          threshold: "50%",
        });
      }

      // Check notification failure rate
      const notificationFailureRate = this.getNotificationFailureRate();
      if (notificationFailureRate > 10) {
        alerts.push({
          severity: "critical",
          type: "high_notification_failure_rate",
          message: `Notification failure rate is ${notificationFailureRate.toFixed(2)}%`,
          threshold: "10%",
        });
      }

      // Check for slow queries
      const slowQueriesCount = this.metrics.databaseQueries.slowQueries.length;
      if (slowQueriesCount > 50) {
        alerts.push({
          severity: "warning",
          type: "high_slow_query_count",
          message: `${slowQueriesCount} slow queries detected`,
          threshold: "50",
        });
      }

      // Check pending requests count
      const pendingCount = await CreditRequest.countDocuments({
        status: { $in: ["pending_mentor_review", "pending_admin_review"] },
      });

      if (pendingCount > 100) {
        alerts.push({
          severity: "warning",
          type: "high_pending_requests",
          message: `${pendingCount} pending credit requests`,
          threshold: "100",
        });
      }

      // Log alerts
      if (alerts.length > 0) {
        logger.warn("System health check alerts", {
          metric: "health_check_alerts",
          alertCount: alerts.length,
          alerts,
        });
      } else {
        logger.info("System health check passed", {
          metric: "health_check_passed",
        });
      }

      return {
        healthy: alerts.filter((a) => a.severity === "critical").length === 0,
        alerts,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("Error checking system health", { error: error.message });
      return {
        healthy: false,
        alerts: [
          {
            severity: "critical",
            type: "health_check_error",
            message: error.message,
          },
        ],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Reset hourly metrics
   */
  resetHourlyMetrics() {
    this.metrics.creditRequestCreation.lastHour = 0;
    logger.info("Hourly metrics reset", { metric: "hourly_reset" });
  }

  /**
   * Reset daily metrics
   */
  resetDailyMetrics() {
    this.metrics.creditRequestCreation.lastDay = 0;
    logger.info("Daily metrics reset", { metric: "daily_reset" });
  }

  /**
   * Reset all metrics (for testing)
   */
  resetAllMetrics() {
    this.metrics = {
      creditRequestCreation: {
        total: 0,
        lastHour: 0,
        lastDay: 0,
      },
      approvalTimes: {
        mentor: [],
        admin: [],
      },
      rejectionRates: {
        mentor: { total: 0, rejected: 0 },
        admin: { total: 0, rejected: 0 },
      },
      notificationDelivery: {
        sent: 0,
        failed: 0,
        pending: 0,
      },
      databaseQueries: {
        count: 0,
        totalDuration: 0,
        slowQueries: [],
      },
    };
    logger.info("All metrics reset", { metric: "full_reset" });
  }
}

// Export singleton instance
export default new CreditMetricsService();
