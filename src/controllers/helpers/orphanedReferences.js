import Application from "../../models/Application.js";
import InternshipCompletion from "../../models/InternshipCompletion.js";
import Internship from "../../models/Internship.js";
import { logger } from "../../utils/logger.js";

/**
 * Logs orphaned internship references with appropriate context
 * @param {Object} options - Logging options
 * @param {string} options.collection - Collection name where orphaned reference was found
 * @param {string} options.operation - Operation being performed when orphaned reference was detected
 * @param {string} options.userId - ID of the user making the request
 * @param {string} [options.studentId] - Student ID if applicable
 * @param {Array<Object>} options.orphanedReferences - Array of orphaned reference details
 * @returns {void}
 */
export const logOrphanedReferences = ({ collection, operation, userId, studentId, orphanedReferences }) => {
  if (!orphanedReferences || orphanedReferences.length === 0) {
    return;
  }

  // Log warning level for single orphaned reference
  // Aggregate multiple orphaned references in single request
  const logLevel = orphanedReferences.length === 1 ? "warn" : "warn";
  const message =
    orphanedReferences.length === 1
      ? "Orphaned internship reference detected"
      : `Multiple orphaned internship references detected (${orphanedReferences.length})`;

  // Include context (collection, operation, IDs, user, timestamp)
  const context = {
    collection,
    operation,
    userId,
    orphanedCount: orphanedReferences.length,
    orphanedReferences: orphanedReferences.map((ref) => ({
      recordId: ref.recordId || ref.applicationMongoId || ref.completionMongoId,
      customId: ref.customId || ref.applicationId || ref.completionId,
      internshipIdRef: ref.internshipIdRef,
    })),
    timestamp: new Date().toISOString(),
  };

  // Add studentId to context if provided
  if (studentId) {
    context.studentId = studentId;
  }

  logger[logLevel](message, context);
};

/**
 * Handles orphaned internship references by returning cached or placeholder data
 * @param {Object} record - Application or InternshipCompletion document
 * @param {string} type - Type of record ('application' or 'completion')
 * @returns {Object} Orphaned internship data with isOrphaned flag
 */
export const handleOrphanedInternship = (record, type) => {
  // Check for cached data
  if (record.cachedInternshipData) {
    return {
      _id: null,
      title: record.cachedInternshipData.title,
      department: record.cachedInternshipData.department,
      companyName: record.cachedInternshipData.companyName,
      startDate: record.cachedInternshipData.startDate,
      endDate: record.cachedInternshipData.endDate,
      applicationDeadline: record.cachedInternshipData.applicationDeadline,
      isOrphaned: true,
    };
  }

  // Return placeholder data if no cache exists
  return {
    _id: null,
    title: "Internship No Longer Available",
    department: "Unknown",
    companyName: "Unknown",
    startDate: null,
    endDate: null,
    applicationDeadline: null,
    isOrphaned: true,
  };
};

/**
 * Caches internship data in all related applications and completions before deletion
 * @param {string} internshipId - ID of the internship to cache
 * @returns {Promise<void>}
 */
export const cacheInternshipData = async (internshipId) => {
  try {
    // Fetch internship with company populate
    const internship = await Internship.findById(internshipId).populate("companyId", "companyName");

    if (!internship) {
      logger.warn("Attempted to cache data for non-existent internship", {
        internshipId,
      });
      return;
    }

    // Extract essential fields
    const cacheData = {
      title: internship.title,
      department: internship.department,
      companyName: internship.companyId?.companyName || "Unknown",
      startDate: internship.startDate,
      endDate: internship.endDate,
      applicationDeadline: internship.applicationDeadline,
    };

    // Update all related applications with cached data
    const applicationsResult = await Application.updateMany(
      { internshipId },
      { $set: { cachedInternshipData: cacheData } }
    );

    // Update all related completions with cached data
    const completionsResult = await InternshipCompletion.updateMany(
      { internshipId },
      { $set: { cachedInternshipData: cacheData } }
    );

    logger.info("Cached internship data for related records", {
      internshipId,
      internshipTitle: internship.title,
      applicationsUpdated: applicationsResult.modifiedCount,
      completionsUpdated: completionsResult.modifiedCount,
    });
  } catch (error) {
    logger.error("Error caching internship data", {
      internshipId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Soft deletes an internship by marking it as deleted instead of removing it
 * @param {string} internshipId - MongoDB ObjectId of the internship
 * @param {string} userId - ID of the user performing the deletion
 * @param {string} userRole - Role of the user (e.g., 'company', 'admin')
 * @returns {Promise<Object>} Updated internship document
 */
export const softDeleteInternship = async (internshipId, userId, userRole = "company") => {
  try {
    // Fetch internship
    const internship = await Internship.findById(internshipId);

    if (!internship) {
      const error = new Error(`Internship not found: ${internshipId}`);
      error.statusCode = 404;
      throw error;
    }

    // Check if already deleted
    if (internship.isDeleted) {
      logger.warn("Attempted to delete already deleted internship", {
        internshipId,
        userId,
      });
      return internship;
    }

    // Cache internship data before deletion
    await cacheInternshipData(internshipId);

    // Set soft delete fields
    internship.isDeleted = true;
    internship.deletedAt = new Date();
    internship.deletedBy = userId;

    // Add audit trail entry
    internship.auditTrail.push({
      timestamp: new Date(),
      actor: userId,
      actorRole: userRole,
      action: "soft_delete_internship",
      fromStatus: internship.status,
      toStatus: internship.status, // Status remains the same
      reason: "Internship soft deleted",
      metadata: {
        deletedAt: internship.deletedAt,
      },
    });

    await internship.save();

    // Log deletion operation
    logger.info("Internship soft deleted successfully", {
      internshipId,
      internshipTitle: internship.title,
      deletedBy: userId,
      deletedByRole: userRole,
      deletedAt: internship.deletedAt,
    });

    return internship;
  } catch (error) {
    logger.error("Error soft deleting internship", {
      internshipId,
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
