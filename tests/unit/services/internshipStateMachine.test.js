import internshipStateMachine from "../../../src/services/internshipStateMachine.js";
import Internship from "../../../src/models/Internship.js";

describe("InternshipStateMachine", () => {
  let testInternship;

  beforeEach(async () => {
    // Create a test internship
    testInternship = await Internship.create({
      internshipId: `INT-TEST-${Date.now()}`,
      companyId: "507f1f77bcf86cd799439011",
      title: "Test Software Engineer Internship",
      description: "Test internship for state machine testing",
      department: "Computer Science",
      requiredSkills: ["JavaScript", "Node.js"],
      duration: "8 weeks",
      workMode: "remote",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      slots: 5,
      status: "pending_admin_verification",
      postedBy: "test-company-user",
    });
  });

  describe("isValidTransition", () => {
    it("should allow valid transition from pending_admin_verification to admin_approved", () => {
      const isValid = internshipStateMachine.isValidTransition(
        "pending_admin_verification",
        "admin_approved"
      );
      expect(isValid).toBe(true);
    });

    it("should allow valid transition from admin_approved to open_for_applications", () => {
      const isValid = internshipStateMachine.isValidTransition(
        "admin_approved",
        "open_for_applications"
      );
      expect(isValid).toBe(true);
    });

    it("should reject invalid transition from pending_admin_verification to open_for_applications", () => {
      const isValid = internshipStateMachine.isValidTransition(
        "pending_admin_verification",
        "open_for_applications"
      );
      expect(isValid).toBe(false);
    });

    it("should allow cancellation from any non-terminal state", () => {
      expect(internshipStateMachine.isValidTransition("pending_admin_verification", "cancelled")).toBe(true);
      expect(internshipStateMachine.isValidTransition("admin_approved", "cancelled")).toBe(true);
      expect(internshipStateMachine.isValidTransition("open_for_applications", "cancelled")).toBe(true);
    });

    it("should reject transitions from terminal states", () => {
      expect(internshipStateMachine.isValidTransition("closed", "open_for_applications")).toBe(false);
      expect(internshipStateMachine.isValidTransition("cancelled", "pending_admin_verification")).toBe(false);
    });

    it("should allow same state transition (no-op)", () => {
      expect(internshipStateMachine.isValidTransition("pending_admin_verification", "pending_admin_verification")).toBe(true);
      expect(internshipStateMachine.isValidTransition("admin_approved", "admin_approved")).toBe(true);
    });
  });

  describe("validateProgressionRule", () => {
    it("should allow forward progression from open_for_applications to closed", () => {
      const isValid = internshipStateMachine.validateProgressionRule(
        "open_for_applications",
        "closed"
      );
      expect(isValid).toBe(true);
    });

    it("should reject regression from open_for_applications to admin_approved", () => {
      const isValid = internshipStateMachine.validateProgressionRule(
        "open_for_applications",
        "admin_approved"
      );
      expect(isValid).toBe(false);
    });

    it("should reject regression from open_for_applications to pending_admin_verification", () => {
      const isValid = internshipStateMachine.validateProgressionRule(
        "open_for_applications",
        "pending_admin_verification"
      );
      expect(isValid).toBe(false);
    });

    it("should allow cancellation from open_for_applications", () => {
      const isValid = internshipStateMachine.validateProgressionRule(
        "open_for_applications",
        "cancelled"
      );
      expect(isValid).toBe(true);
    });

    it("should allow normal transitions before reaching progression states", () => {
      expect(internshipStateMachine.validateProgressionRule("pending_admin_verification", "admin_approved")).toBe(true);
      expect(internshipStateMachine.validateProgressionRule("admin_approved", "mentor_rejected")).toBe(true);
    });
  });

  describe("transitionTo", () => {
    it("should successfully transition from pending_admin_verification to admin_approved", async () => {
      const actor = { id: "admin-123", role: "admin" };
      const reason = "Internship meets all requirements";

      const updatedInternship = await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "admin_approved",
        actor,
        reason
      );

      expect(updatedInternship.status).toBe("admin_approved");
      expect(updatedInternship.auditTrail).toHaveLength(1);
      expect(updatedInternship.auditTrail[0].actor).toBe("admin-123");
      expect(updatedInternship.auditTrail[0].actorRole).toBe("admin");
      expect(updatedInternship.auditTrail[0].fromStatus).toBe("pending_admin_verification");
      expect(updatedInternship.auditTrail[0].toStatus).toBe("admin_approved");
      expect(updatedInternship.auditTrail[0].reason).toBe(reason);
    });

    it("should throw error for invalid transition", async () => {
      const actor = { id: "admin-123", role: "admin" };

      await expect(
        internshipStateMachine.transitionTo(
          testInternship.internshipId,
          "open_for_applications",
          actor
        )
      ).rejects.toThrow(/Invalid state transition/);
    });

    it("should throw error for non-existent internship", async () => {
      const actor = { id: "admin-123", role: "admin" };

      await expect(
        internshipStateMachine.transitionTo(
          "NON-EXISTENT-ID",
          "admin_approved",
          actor
        )
      ).rejects.toThrow(/Internship not found/);
    });

    it("should set closedAt timestamp for terminal states", async () => {
      // First transition to open_for_applications
      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "admin_approved",
        { id: "admin-123", role: "admin" }
      );

      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "open_for_applications",
        { id: "mentor-456", role: "mentor" }
      );

      // Then close it
      const closedInternship = await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "closed",
        { id: "system", role: "system" }
      );

      expect(closedInternship.closedAt).toBeDefined();
      expect(closedInternship.closedAt).toBeInstanceOf(Date);
    });

    it("should handle multiple transitions and maintain audit trail", async () => {
      // Transition 1: Admin approves
      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "admin_approved",
        { id: "admin-123", role: "admin" },
        "Approved by admin"
      );

      // Transition 2: Mentor approves
      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "open_for_applications",
        { id: "mentor-456", role: "mentor" },
        "Approved for department"
      );

      // Transition 3: Close
      const finalInternship = await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "closed",
        { id: "system", role: "system" },
        "Application deadline passed"
      );

      expect(finalInternship.auditTrail).toHaveLength(3);
      expect(finalInternship.auditTrail[0].toStatus).toBe("admin_approved");
      expect(finalInternship.auditTrail[1].toStatus).toBe("open_for_applications");
      expect(finalInternship.auditTrail[2].toStatus).toBe("closed");
    });

    it("should reject regression from open_for_applications", async () => {
      // First get to open_for_applications
      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "admin_approved",
        { id: "admin-123", role: "admin" }
      );

      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "open_for_applications",
        { id: "mentor-456", role: "mentor" }
      );

      // Try to regress - should be rejected by isValidTransition check
      await expect(
        internshipStateMachine.transitionTo(
          testInternship.internshipId,
          "admin_approved",
          { id: "admin-123", role: "admin" }
        )
      ).rejects.toThrow(/Invalid state transition/);
    });

    it("should handle no-op transition (same state)", async () => {
      const initialInternship = await Internship.findOne({ internshipId: testInternship.internshipId });
      const initialAuditTrailLength = initialInternship.auditTrail.length;

      const result = await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "pending_admin_verification",
        { id: "admin-123", role: "admin" }
      );

      expect(result.status).toBe("pending_admin_verification");
      expect(result.auditTrail).toHaveLength(initialAuditTrailLength);
    });
  });

  describe("getAuditTrail", () => {
    it("should return empty audit trail for new internship", async () => {
      const auditTrail = await internshipStateMachine.getAuditTrail(testInternship.internshipId);
      expect(auditTrail).toEqual([]);
    });

    it("should return audit trail after transitions", async () => {
      await internshipStateMachine.transitionTo(
        testInternship.internshipId,
        "admin_approved",
        { id: "admin-123", role: "admin" },
        "Approved"
      );

      const auditTrail = await internshipStateMachine.getAuditTrail(testInternship.internshipId);
      
      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0].actor).toBe("admin-123");
      expect(auditTrail[0].fromStatus).toBe("pending_admin_verification");
      expect(auditTrail[0].toStatus).toBe("admin_approved");
    });

    it("should throw error for non-existent internship", async () => {
      await expect(
        internshipStateMachine.getAuditTrail("NON-EXISTENT-ID")
      ).rejects.toThrow(/Internship not found/);
    });
  });

  describe("getAllowedTransitions", () => {
    it("should return correct allowed transitions for pending_admin_verification", () => {
      const allowed = internshipStateMachine.getAllowedTransitions("pending_admin_verification");
      expect(allowed).toEqual(["admin_approved", "admin_rejected", "cancelled"]);
    });

    it("should return correct allowed transitions for admin_approved", () => {
      const allowed = internshipStateMachine.getAllowedTransitions("admin_approved");
      expect(allowed).toEqual(["mentor_rejected", "open_for_applications", "cancelled"]);
    });

    it("should return empty array for terminal states", () => {
      expect(internshipStateMachine.getAllowedTransitions("closed")).toEqual([]);
      expect(internshipStateMachine.getAllowedTransitions("cancelled")).toEqual([]);
    });

    it("should return empty array for invalid status", () => {
      const allowed = internshipStateMachine.getAllowedTransitions("invalid_status");
      expect(allowed).toEqual([]);
    });
  });

  describe("isTerminalState", () => {
    it("should return true for closed state", () => {
      expect(internshipStateMachine.isTerminalState("closed")).toBe(true);
    });

    it("should return true for cancelled state", () => {
      expect(internshipStateMachine.isTerminalState("cancelled")).toBe(true);
    });

    it("should return false for non-terminal states", () => {
      expect(internshipStateMachine.isTerminalState("pending_admin_verification")).toBe(false);
      expect(internshipStateMachine.isTerminalState("admin_approved")).toBe(false);
      expect(internshipStateMachine.isTerminalState("open_for_applications")).toBe(false);
    });
  });

  describe("isAuthorizedTransition", () => {
    it("should authorize admin to approve pending internship", () => {
      const isAuthorized = internshipStateMachine.isAuthorizedTransition(
        "admin",
        "pending_admin_verification",
        "admin_approved"
      );
      expect(isAuthorized).toBe(true);
    });

    it("should authorize mentor to approve admin-approved internship", () => {
      const isAuthorized = internshipStateMachine.isAuthorizedTransition(
        "mentor",
        "admin_approved",
        "open_for_applications"
      );
      expect(isAuthorized).toBe(true);
    });

    it("should authorize company to cancel their internship", () => {
      expect(internshipStateMachine.isAuthorizedTransition("company", "pending_admin_verification", "cancelled")).toBe(true);
      expect(internshipStateMachine.isAuthorizedTransition("company", "admin_approved", "cancelled")).toBe(true);
    });

    it("should not authorize company to approve internship", () => {
      const isAuthorized = internshipStateMachine.isAuthorizedTransition(
        "company",
        "pending_admin_verification",
        "admin_approved"
      );
      expect(isAuthorized).toBe(false);
    });

    it("should not authorize mentor to approve pending internship", () => {
      const isAuthorized = internshipStateMachine.isAuthorizedTransition(
        "mentor",
        "pending_admin_verification",
        "admin_approved"
      );
      expect(isAuthorized).toBe(false);
    });

    it("should authorize system role for any valid transition", () => {
      expect(internshipStateMachine.isAuthorizedTransition("system", "pending_admin_verification", "admin_approved")).toBe(true);
      expect(internshipStateMachine.isAuthorizedTransition("system", "admin_approved", "open_for_applications")).toBe(true);
      expect(internshipStateMachine.isAuthorizedTransition("system", "open_for_applications", "closed")).toBe(true);
    });

    it("should not authorize invalid role", () => {
      const isAuthorized = internshipStateMachine.isAuthorizedTransition(
        "invalid_role",
        "pending_admin_verification",
        "admin_approved"
      );
      expect(isAuthorized).toBe(false);
    });
  });
});
