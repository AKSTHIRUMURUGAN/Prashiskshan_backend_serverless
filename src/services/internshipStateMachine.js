import Internship from "../models/Internship.js";
import { logger } from "../utils/logger.js";

/**
 * InternshipStateMachine - Manages state transitions for internships
 * Enforces valid state transitions and maintains audit trail
 * 
 * State Flow:
 * Company Posts → pending_admin_verification
 *                        ↓ (Admin Approves)
 *                 admin_approved
 *                        ↓ (Mentor Approves)
 *                 open_for_applications
 *                        ↓ (Deadline Passes / Slots Filled)
 *                     closed
 * 
 * Alternative Paths:
 * - pending_admin_verification → admin_rejected (Admin Rejects)
 * - admin_approved → mentor_rejected (Mentor Rejects)
 * - Any State → cancelled (Company Cancels)
 */
class InternshipStateMachine {
  constructor() {
    // Define allowed state transitions
    this.allowedTransitions = {
      draft: ["pending_admin_verification", "cancelled"],
      pending_admin_verification: ["admin_approved", "admin_rejected", "cancelled"],
      admin_approved: ["mentor_rejected", "open_for_applications", "cancelled"],
      admin_rejected: ["pending_admin_verification", "cancelled"], // Allow resubmission
      mentor_rejected: ["pending_admin_verification", "cancelled"], // Allow resubmission
      open_for_applications: ["closed", "cancelled"],
      closed: [], // Terminal state - no transitions allowed
      cancelled: [], // Terminal state - no transitions allowed
    };

    // Define one-way progression states (cannot regress once reached)
    this.progressionStates = ["open_for_applications", "closed"];
  }

  /**
   * Check if a state transition is valid
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} - True if transition is allowed
   */
  isValidTransition(fromStatus, toStatus) {
    // Same state is always valid (no-op)
    if (fromStatus === toStatus) {
      return true;
    }

    // Check if transition is in allowed transitions map
    const allowedStates = this.allowedTransitions[fromStatus];
    if (!allowedStates) {
      logger.warn("Invalid source state", { fromStatus });
      return false;
    }

    return allowedStates.includes(toStatus);
  }

  /**
   * Validate one-way progression rule
   * Once an internship reaches "open_for_applications", it cannot regress to earlier states
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} - True if progression rule is satisfied
   */
  validateProgressionRule(fromStatus, toStatus) {
    // If current state is in progression states, only allow forward movement
    if (this.progressionStates.includes(fromStatus)) {
      const regressiveStates = [
        "draft",
        "pending_admin_verification",
        "admin_approved",
        "admin_rejected",
        "mentor_rejected",
      ];
      
      if (regressiveStates.includes(toStatus)) {
        logger.warn("Attempted regression from progression state", { fromStatus, toStatus });
        return false;
      }
    }

    return true;
  }

  /**
   * Transition internship to a new state with validation and audit trail
   * @param {string} internshipId - Internship ID
   * @param {string} toStatus - Target status
   * @param {Object} actor - Actor performing the transition
   * @param {string} actor.id - Actor ID
   * @param {string} actor.role - Actor role (admin, mentor, company, system)
   * @param {string} reason - Reason for transition (optional)
   * @returns {Promise<Object>} - Updated internship document
   * @throws {Error} - If transition is invalid or internship not found
   */
  async transitionTo(internshipId, toStatus, actor, reason = "") {
    try {
      // Find the internship
      const internship = await Internship.findOne({ internshipId });
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      const fromStatus = internship.status;

      // Validate transition
      if (!this.isValidTransition(fromStatus, toStatus)) {
        throw new Error(
          `Invalid state transition from "${fromStatus}" to "${toStatus}". ` +
          `Allowed transitions: ${this.allowedTransitions[fromStatus]?.join(", ") || "none"}`
        );
      }

      // Validate progression rule
      if (!this.validateProgressionRule(fromStatus, toStatus)) {
        throw new Error(
          `Cannot regress from "${fromStatus}" to "${toStatus}". ` +
          `State progression is one-way after reaching "open_for_applications"`
        );
      }

      // No-op if same state
      if (fromStatus === toStatus) {
        logger.info("State transition skipped - same state", { internshipId, status: fromStatus });
        return internship;
      }

      // Create audit trail entry
      const auditEntry = {
        timestamp: new Date(),
        actor: actor.id,
        actorRole: actor.role,
        action: `transition_${fromStatus}_to_${toStatus}`,
        fromStatus,
        toStatus,
        reason: reason || `Transitioned from ${fromStatus} to ${toStatus}`,
      };

      // Update internship status and add audit trail
      internship.status = toStatus;
      internship.auditTrail.push(auditEntry);

      // Set closedAt timestamp for terminal states
      if (toStatus === "closed" || toStatus === "cancelled") {
        internship.closedAt = new Date();
      }

      await internship.save();

      logger.info("State transition successful", {
        internshipId,
        fromStatus,
        toStatus,
        actor: actor.id,
        actorRole: actor.role,
      });

      return internship;
    } catch (error) {
      logger.error("State transition failed", {
        internshipId,
        toStatus,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get audit trail for an internship
   * @param {string} internshipId - Internship ID
   * @returns {Promise<Array>} - Array of audit trail entries
   * @throws {Error} - If internship not found
   */
  async getAuditTrail(internshipId) {
    try {
      const internship = await Internship.findOne({ internshipId }).select("auditTrail");
      
      if (!internship) {
        throw new Error(`Internship not found: ${internshipId}`);
      }

      return internship.auditTrail || [];
    } catch (error) {
      logger.error("Failed to retrieve audit trail", {
        internshipId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get allowed transitions for a given status
   * @param {string} status - Current status
   * @returns {Array<string>} - Array of allowed target states
   */
  getAllowedTransitions(status) {
    return this.allowedTransitions[status] || [];
  }

  /**
   * Check if a status is a terminal state
   * @param {string} status - Status to check
   * @returns {boolean} - True if status is terminal
   */
  isTerminalState(status) {
    return status === "closed" || status === "cancelled";
  }

  /**
   * Validate if an actor has permission to perform a transition
   * This is a helper method - actual authorization should be done in the service layer
   * @param {string} actorRole - Role of the actor
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} - True if actor role is authorized for this transition
   */
  isAuthorizedTransition(actorRole, fromStatus, toStatus) {
    // Define role-based transition permissions
    const rolePermissions = {
      admin: {
        pending_admin_verification: ["admin_approved", "admin_rejected"],
      },
      mentor: {
        admin_approved: ["open_for_applications", "mentor_rejected"],
      },
      company: {
        draft: ["pending_admin_verification"],
        pending_admin_verification: ["cancelled"],
        admin_approved: ["cancelled"],
        mentor_rejected: ["cancelled"],
        admin_rejected: ["cancelled"],
        open_for_applications: ["cancelled"],
      },
      system: {
        // System can perform any valid transition (for automated processes)
        "*": "*",
      },
    };

    // System role has full permissions
    if (actorRole === "system") {
      return this.isValidTransition(fromStatus, toStatus);
    }

    const permissions = rolePermissions[actorRole];
    if (!permissions) {
      return false;
    }

    const allowedTargets = permissions[fromStatus];
    if (!allowedTargets) {
      return false;
    }

    return allowedTargets.includes(toStatus);
  }
}

// Export singleton instance
export const internshipStateMachine = new InternshipStateMachine();
export default internshipStateMachine;
