import creditMetricsService from "../../../src/services/creditMetricsService.js";

describe("CreditMetricsService", () => {
  beforeEach(() => {
    // Reset metrics before each test
    creditMetricsService.resetAllMetrics();
  });

  describe("trackCreditRequestCreation", () => {
    it("should track credit request creation", () => {
      creditMetricsService.trackCreditRequestCreation("CR-123", {
        studentId: "student1",
        calculatedCredits: 2,
      });

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.creditRequestCreation.total).toBe(1);
      expect(metrics.creditRequestCreation.rate.perHour).toBe(1);
      expect(metrics.creditRequestCreation.rate.perDay).toBe(1);
    });

    it("should increment counters for multiple requests", () => {
      creditMetricsService.trackCreditRequestCreation("CR-123");
      creditMetricsService.trackCreditRequestCreation("CR-124");
      creditMetricsService.trackCreditRequestCreation("CR-125");

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.creditRequestCreation.total).toBe(3);
    });
  });

  describe("trackApprovalTime", () => {
    it("should track mentor approval time", () => {
      creditMetricsService.trackApprovalTime("mentor", "CR-123", 120000); // 2 minutes

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.approvalTimes.mentor.count).toBe(1);
      expect(metrics.approvalTimes.mentor.average).toBe(2); // 2 minutes
    });

    it("should track admin approval time", () => {
      creditMetricsService.trackApprovalTime("admin", "CR-123", 60000); // 1 minute

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.approvalTimes.admin.count).toBe(1);
      expect(metrics.approvalTimes.admin.average).toBe(1); // 1 minute
    });

    it("should calculate average approval time correctly", () => {
      creditMetricsService.trackApprovalTime("mentor", "CR-123", 120000); // 2 min
      creditMetricsService.trackApprovalTime("mentor", "CR-124", 180000); // 3 min
      creditMetricsService.trackApprovalTime("mentor", "CR-125", 240000); // 4 min

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.approvalTimes.mentor.average).toBe(3); // Average: 3 minutes
    });
  });

  describe("trackRejection", () => {
    it("should track mentor rejection", () => {
      creditMetricsService.trackRejection("mentor", "CR-123", "Incomplete logbook");

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.rejectionRates.mentor.total).toBe(1);
      expect(metrics.rejectionRates.mentor.rejected).toBe(1);
      expect(metrics.rejectionRates.mentor.rate).toBe(100);
    });

    it("should calculate rejection rate correctly", () => {
      creditMetricsService.trackApproval("mentor", "CR-123");
      creditMetricsService.trackApproval("mentor", "CR-124");
      creditMetricsService.trackRejection("mentor", "CR-125", "Incomplete");

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.rejectionRates.mentor.total).toBe(3);
      expect(metrics.rejectionRates.mentor.rejected).toBe(1);
      expect(metrics.rejectionRates.mentor.rate).toBeCloseTo(33.33, 1);
    });
  });

  describe("trackNotificationSent", () => {
    it("should track notification sent", () => {
      creditMetricsService.trackNotificationSent("student_request_created", "CR-123");

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.notificationDelivery.sent).toBe(1);
    });
  });

  describe("trackNotificationFailed", () => {
    it("should track notification failure", () => {
      const error = new Error("SMTP connection failed");
      creditMetricsService.trackNotificationFailed("student_request_created", "CR-123", error);

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.notificationDelivery.failed).toBe(1);
    });

    it("should calculate failure rate correctly", () => {
      creditMetricsService.trackNotificationSent("type1", "CR-123");
      creditMetricsService.trackNotificationSent("type2", "CR-124");
      creditMetricsService.trackNotificationFailed("type3", "CR-125", new Error("Failed"));

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.notificationDelivery.failureRate).toBeCloseTo(33.33, 1);
    });
  });

  describe("trackDatabaseQuery", () => {
    it("should track database query", () => {
      creditMetricsService.trackDatabaseQuery("CreditRequest.find", 50);

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.databaseQueries.count).toBe(1);
      expect(metrics.databaseQueries.averageDuration).toBe(50);
    });

    it("should track slow queries", () => {
      creditMetricsService.trackDatabaseQuery("CreditRequest.find", 1500);

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.databaseQueries.slowQueriesCount).toBe(1);
    });

    it("should calculate average query duration correctly", () => {
      creditMetricsService.trackDatabaseQuery("Query1", 100);
      creditMetricsService.trackDatabaseQuery("Query2", 200);
      creditMetricsService.trackDatabaseQuery("Query3", 300);

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.databaseQueries.averageDuration).toBe(200);
    });
  });

  describe("getMetrics", () => {
    it("should return all metrics", () => {
      creditMetricsService.trackCreditRequestCreation("CR-123");
      creditMetricsService.trackApprovalTime("mentor", "CR-123", 120000);
      creditMetricsService.trackNotificationSent("type1", "CR-123");

      const metrics = creditMetricsService.getMetrics();

      expect(metrics).toHaveProperty("creditRequestCreation");
      expect(metrics).toHaveProperty("approvalTimes");
      expect(metrics).toHaveProperty("rejectionRates");
      expect(metrics).toHaveProperty("notificationDelivery");
      expect(metrics).toHaveProperty("databaseQueries");
    });
  });

  describe("checkSystemHealth", () => {
    it("should return healthy status when no issues", async () => {
      const health = await creditMetricsService.checkSystemHealth();

      expect(health.healthy).toBe(true);
      expect(health.alerts).toEqual([]);
    });

    it("should detect high mentor rejection rate", async () => {
      // Create 60% rejection rate
      creditMetricsService.trackApproval("mentor", "CR-1");
      creditMetricsService.trackApproval("mentor", "CR-2");
      creditMetricsService.trackRejection("mentor", "CR-3", "Reason");
      creditMetricsService.trackRejection("mentor", "CR-4", "Reason");
      creditMetricsService.trackRejection("mentor", "CR-5", "Reason");

      const health = await creditMetricsService.checkSystemHealth();

      expect(health.alerts.length).toBeGreaterThan(0);
      const rejectionAlert = health.alerts.find(
        (a) => a.type === "high_mentor_rejection_rate"
      );
      expect(rejectionAlert).toBeDefined();
      expect(rejectionAlert.severity).toBe("warning");
    });

    it("should detect high notification failure rate", async () => {
      // Create 20% failure rate
      creditMetricsService.trackNotificationSent("type1", "CR-1");
      creditMetricsService.trackNotificationSent("type2", "CR-2");
      creditMetricsService.trackNotificationSent("type3", "CR-3");
      creditMetricsService.trackNotificationSent("type4", "CR-4");
      creditMetricsService.trackNotificationFailed("type5", "CR-5", new Error("Failed"));

      const health = await creditMetricsService.checkSystemHealth();

      expect(health.alerts.length).toBeGreaterThan(0);
      const notificationAlert = health.alerts.find(
        (a) => a.type === "high_notification_failure_rate"
      );
      expect(notificationAlert).toBeDefined();
      expect(notificationAlert.severity).toBe("critical");
    });
  });

  describe("resetAllMetrics", () => {
    it("should reset all metrics to zero", () => {
      creditMetricsService.trackCreditRequestCreation("CR-123");
      creditMetricsService.trackApprovalTime("mentor", "CR-123", 120000);
      creditMetricsService.trackNotificationSent("type1", "CR-123");

      creditMetricsService.resetAllMetrics();

      const metrics = creditMetricsService.getMetrics();
      expect(metrics.creditRequestCreation.total).toBe(0);
      expect(metrics.approvalTimes.mentor.count).toBe(0);
      expect(metrics.notificationDelivery.sent).toBe(0);
    });
  });
});
