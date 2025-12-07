import { jest } from "@jest/globals";
import { handleOrphanedInternship } from "../../../../src/controllers/helpers/orphanedReferences.js";

describe("Orphaned References Helper - Task 6.1", () => {
  describe("logOrphanedReferences - Integration", () => {
    it("should be callable and handle single orphaned reference", async () => {
      const { logOrphanedReferences } = await import("../../../../src/controllers/helpers/orphanedReferences.js");
      
      const orphanedReferences = [
        {
          recordId: "507f1f77bcf86cd799439011",
          customId: "APP-123",
          internshipIdRef: "507f1f77bcf86cd799439012",
        },
      ];

      // Should not throw
      expect(() => {
        logOrphanedReferences({
          collection: "Application",
          operation: "getMyApplications",
          userId: "507f1f77bcf86cd799439013",
          studentId: "STD-123",
          orphanedReferences,
        });
      }).not.toThrow();
    });

    it("should handle multiple orphaned references", async () => {
      const { logOrphanedReferences } = await import("../../../../src/controllers/helpers/orphanedReferences.js");
      
      const orphanedReferences = [
        {
          recordId: "507f1f77bcf86cd799439011",
          customId: "APP-123",
          internshipIdRef: "507f1f77bcf86cd799439012",
        },
        {
          recordId: "507f1f77bcf86cd799439014",
          customId: "APP-456",
          internshipIdRef: "507f1f77bcf86cd799439015",
        },
      ];

      // Should not throw
      expect(() => {
        logOrphanedReferences({
          collection: "Application",
          operation: "getMyApplications",
          userId: "507f1f77bcf86cd799439013",
          studentId: "STD-123",
          orphanedReferences,
        });
      }).not.toThrow();
    });

    it("should handle empty orphanedReferences array", async () => {
      const { logOrphanedReferences } = await import("../../../../src/controllers/helpers/orphanedReferences.js");
      
      // Should not throw
      expect(() => {
        logOrphanedReferences({
          collection: "Application",
          operation: "getMyApplications",
          userId: "507f1f77bcf86cd799439013",
          studentId: "STD-123",
          orphanedReferences: [],
        });
      }).not.toThrow();
    });

    it("should handle null orphanedReferences", async () => {
      const { logOrphanedReferences } = await import("../../../../src/controllers/helpers/orphanedReferences.js");
      
      // Should not throw
      expect(() => {
        logOrphanedReferences({
          collection: "Application",
          operation: "getMyApplications",
          userId: "507f1f77bcf86cd799439013",
          studentId: "STD-123",
          orphanedReferences: null,
        });
      }).not.toThrow();
    });

    it("should work without studentId parameter", async () => {
      const { logOrphanedReferences } = await import("../../../../src/controllers/helpers/orphanedReferences.js");
      
      const orphanedReferences = [
        {
          recordId: "507f1f77bcf86cd799439011",
          customId: "COMP-123",
          internshipIdRef: "507f1f77bcf86cd799439012",
        },
      ];

      // Should not throw
      expect(() => {
        logOrphanedReferences({
          collection: "InternshipCompletion",
          operation: "getCompletedInternships",
          userId: "507f1f77bcf86cd799439013",
          orphanedReferences,
        });
      }).not.toThrow();
    });
  });



  describe("handleOrphanedInternship", () => {
    it("should return cached data when available", () => {
      const record = {
        cachedInternshipData: {
          title: "Software Engineering Intern",
          department: "Engineering",
          companyName: "Tech Corp",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-06-01"),
          applicationDeadline: new Date("2023-12-15"),
        },
      };

      const result = handleOrphanedInternship(record, "application");

      expect(result).toEqual({
        _id: null,
        title: "Software Engineering Intern",
        department: "Engineering",
        companyName: "Tech Corp",
        startDate: record.cachedInternshipData.startDate,
        endDate: record.cachedInternshipData.endDate,
        applicationDeadline: record.cachedInternshipData.applicationDeadline,
        isOrphaned: true,
      });
    });

    it("should return placeholder data when no cache exists", () => {
      const record = {};

      const result = handleOrphanedInternship(record, "application");

      expect(result).toEqual({
        _id: null,
        title: "Internship No Longer Available",
        department: "Unknown",
        companyName: "Unknown",
        startDate: null,
        endDate: null,
        applicationDeadline: null,
        isOrphaned: true,
      });
    });

    it("should always set isOrphaned flag to true", () => {
      const recordWithCache = {
        cachedInternshipData: {
          title: "Test Internship",
          department: "Test Dept",
          companyName: "Test Company",
          startDate: new Date(),
          endDate: new Date(),
        },
      };

      const recordWithoutCache = {};

      expect(handleOrphanedInternship(recordWithCache, "application").isOrphaned).toBe(true);
      expect(handleOrphanedInternship(recordWithoutCache, "completion").isOrphaned).toBe(true);
    });
  });
});
