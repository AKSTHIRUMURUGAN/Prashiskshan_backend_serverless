import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Mentor from "../models/Mentor.js";
import Student from "../models/Student.js";
import InternshipCompletion from "../models/InternshipCompletion.js";
import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import { logger } from "../utils/logger.js";
import PDFDocument from "pdfkit";

/**
 * Internship Analytics Service
 * Provides comprehensive analytics for the internship verification workflow
 * Requirements: 8.1, 8.3, 9.1, 9.2, 9.3, 10.2, 10.3, 10.4, 10.5
 */
class InternshipAnalyticsService {
  /**
   * Get company analytics with application funnel and completion metrics
   * Requirements: 9.1, 9.2, 9.3
   */
  async getCompanyAnalytics(companyId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      
      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter.postedAt = {};
        if (dateFrom) dateFilter.postedAt.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.postedAt.$lte = new Date(dateTo);
      }

      // Get internship statistics
      const internships = await Internship.find({
        companyId,
        ...dateFilter,
      }).lean();

      const totalInternships = internships.length;
      const activeInternships = internships.filter(
        i => i.status === "open_for_applications"
      ).length;

      // Get application funnel metrics
      const internshipIds = internships.map(i => i._id);

      const applications = await Application.find({
        internshipId: { $in: internshipIds },
      }).lean();

      // Application funnel
      const totalApplications = applications.length;
      const shortlisted = applications.filter(
        a => a.status === "shortlisted"
      ).length;
      const accepted = applications.filter(
        a => a.status === "accepted"
      ).length;
      const rejected = applications.filter(
        a => a.status === "rejected"
      ).length;

      const acceptanceRate = totalApplications > 0
        ? (accepted / totalApplications) * 100
        : 0;

      // Get completion metrics
      const completions = await InternshipCompletion.find({
        companyId,
        ...(dateFrom || dateTo ? {
          completedAt: {
            ...(dateFrom && { $gte: new Date(dateFrom) }),
            ...(dateTo && { $lte: new Date(dateTo) }),
          },
        } : {}),
      }).lean();

      const totalCompletions = completions.length;
      const completionRate = accepted > 0
        ? (totalCompletions / accepted) * 100
        : 0;

      const averageRating = completions.length > 0
        ? completions.reduce((sum, c) => sum + (c.evaluationScore || 0), 0) / completions.length
        : 0;

      // Average hours worked
      const averageHours = completions.length > 0
        ? completions.reduce((sum, c) => sum + (c.totalHours || 0), 0) / completions.length
        : 0;

      return {
        companyId,
        period: { dateFrom, dateTo },
        internships: {
          total: totalInternships,
          active: activeInternships,
          closed: internships.filter(i => i.status === "closed").length,
          cancelled: internships.filter(i => i.status === "cancelled").length,
        },
        applicationFunnel: {
          totalApplications,
          shortlisted,
          accepted,
          rejected,
          acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        },
        completions: {
          total: totalCompletions,
          completionRate: Math.round(completionRate * 100) / 100,
          averageRating: Math.round(averageRating * 100) / 100,
          averageHours: Math.round(averageHours * 10) / 10,
        },
      };
    } catch (error) {
      logger.error("Error getting company analytics", {
        error: error.message,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Get mentor analytics with approval rates and student supervision
   * Requirements: 8.1, 8.3
   */
  async getMentorAnalytics(mentorId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;

      // Get mentor details
      const mentor = await Mentor.findOne({ mentorId }).lean();
      if (!mentor) {
        throw new Error("Mentor not found");
      }

      const department = mentor.profile.department;

      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter["mentorApproval.approvedAt"] = {};
        if (dateFrom) dateFilter["mentorApproval.approvedAt"].$gte = new Date(dateFrom);
        if (dateTo) dateFilter["mentorApproval.approvedAt"].$lte = new Date(dateTo);
      }

      // Get internships reviewed by this mentor
      const reviewedInternships = await Internship.find({
        department,
        "mentorApproval.mentorId": mentorId,
        ...dateFilter,
      }).lean();

      const totalReviewed = reviewedInternships.length;
      const approved = reviewedInternships.filter(
        i => i.mentorApproval.status === "approved"
      ).length;
      const rejected = reviewedInternships.filter(
        i => i.mentorApproval.status === "rejected"
      ).length;

      const approvalRate = totalReviewed > 0
        ? (approved / totalReviewed) * 100
        : 0;

      // Calculate average response time
      const responseTimes = reviewedInternships
        .filter(i => i.mentorApproval.approvedAt && i.adminReview?.reviewedAt)
        .map(i => {
          const reviewTime = new Date(i.mentorApproval.approvedAt) - new Date(i.adminReview.reviewedAt);
          return reviewTime / (1000 * 60 * 60 * 24); // Convert to days
        });

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Get students supervised
      const studentsSupervised = mentor.assignedStudents?.length || 0;

      // Get student performance metrics
      const students = await Student.find({
        _id: { $in: mentor.assignedStudents || [] },
      }).lean();

      const averageReadinessScore = students.length > 0
        ? students.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / students.length
        : 0;

      const totalCreditsEarned = students.reduce(
        (sum, s) => sum + (s.credits?.earned || 0),
        0
      );

      return {
        mentorId,
        department,
        period: { dateFrom, dateTo },
        approvals: {
          totalReviewed,
          approved,
          rejected,
          approvalRate: Math.round(approvalRate * 100) / 100,
          averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        },
        students: {
          supervised: studentsSupervised,
          averageReadinessScore: Math.round(averageReadinessScore * 100) / 100,
          totalCreditsEarned,
        },
      };
    } catch (error) {
      logger.error("Error getting mentor analytics", {
        error: error.message,
        mentorId,
      });
      throw error;
    }
  }

  /**
   * Get admin analytics with system-wide metrics
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   */
  async getAdminAnalytics(options = {}) {
    try {
      const { dateFrom, dateTo } = options;

      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter.postedAt = {};
        if (dateFrom) dateFilter.postedAt.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.postedAt.$lte = new Date(dateTo);
      }

      // System-wide internship metrics
      const allInternships = await Internship.find(dateFilter).lean();
      const totalInternships = allInternships.length;
      const pendingVerifications = allInternships.filter(
        i => i.status === "pending_admin_verification"
      ).length;
      const activeInternships = allInternships.filter(
        i => i.status === "open_for_applications"
      ).length;

      // Verification metrics
      const verifiedInternships = allInternships.filter(
        i => i.adminReview?.decision === "approved"
      ).length;
      const rejectedInternships = allInternships.filter(
        i => i.adminReview?.decision === "rejected"
      ).length;

      const verificationRate = (verifiedInternships + rejectedInternships) > 0
        ? (verifiedInternships / (verifiedInternships + rejectedInternships)) * 100
        : 0;

      // Calculate average verification time
      const verificationTimes = allInternships
        .filter(i => i.adminReview?.reviewedAt && i.postedAt)
        .map(i => {
          const verifyTime = new Date(i.adminReview.reviewedAt) - new Date(i.postedAt);
          return verifyTime / (1000 * 60 * 60 * 24); // Convert to days
        });

      const averageVerificationTime = verificationTimes.length > 0
        ? verificationTimes.reduce((sum, time) => sum + time, 0) / verificationTimes.length
        : 0;

      // Company performance metrics
      const companies = await Company.find({ status: "verified" }).lean();
      const totalCompanies = companies.length;

      const companyMetrics = await Promise.all(
        companies.slice(0, 10).map(async (company) => {
          const companyInternships = allInternships.filter(
            i => i.companyId.toString() === company._id.toString()
          );
          const applications = await Application.find({
            companyId: company._id,
          }).lean();

          const completions = await InternshipCompletion.find({
            companyId: company._id,
          }).lean();

          const avgRating = completions.length > 0
            ? completions.reduce((sum, c) => sum + (c.evaluationScore || 0), 0) / completions.length
            : 0;

          return {
            companyId: company.companyId,
            companyName: company.companyName,
            internshipsPosted: companyInternships.length,
            applicationsReceived: applications.length,
            completionRate: applications.filter(a => a.status === "accepted").length > 0
              ? (completions.length / applications.filter(a => a.status === "accepted").length) * 100
              : 0,
            averageRating: Math.round(avgRating * 100) / 100,
          };
        })
      );

      // Department performance metrics
      const departments = [...new Set(allInternships.map(i => i.department))];
      const departmentMetrics = await Promise.all(
        departments.map(async (dept) => {
          const deptInternships = allInternships.filter(i => i.department === dept);
          const deptApplications = await Application.find({
            department: dept,
          }).lean();

          const deptStudents = await Student.find({
            "profile.department": dept,
          }).lean();

          const applicationRate = deptStudents.length > 0
            ? (deptApplications.length / deptStudents.length)
            : 0;

          const placementRate = deptStudents.length > 0
            ? (deptApplications.filter(a => a.status === "accepted").length / deptStudents.length) * 100
            : 0;

          const avgCredits = deptStudents.length > 0
            ? deptStudents.reduce((sum, s) => sum + (s.credits?.earned || 0), 0) / deptStudents.length
            : 0;

          return {
            department: dept,
            internshipsAvailable: deptInternships.filter(i => i.status === "open_for_applications").length,
            totalApplications: deptApplications.length,
            applicationRate: Math.round(applicationRate * 100) / 100,
            placementRate: Math.round(placementRate * 100) / 100,
            averageCredits: Math.round(avgCredits * 100) / 100,
          };
        })
      );

      // Mentor performance metrics
      const mentors = await Mentor.find({ status: "active" }).lean();
      const mentorMetrics = await Promise.all(
        mentors.slice(0, 10).map(async (mentor) => {
          const mentorInternships = allInternships.filter(
            i => i.mentorApproval?.mentorId === mentor.mentorId
          );

          const approved = mentorInternships.filter(
            i => i.mentorApproval.status === "approved"
          ).length;

          const approvalRate = mentorInternships.length > 0
            ? (approved / mentorInternships.length) * 100
            : 0;

          const responseTimes = mentorInternships
            .filter(i => i.mentorApproval.approvedAt && i.adminReview?.reviewedAt)
            .map(i => {
              const reviewTime = new Date(i.mentorApproval.approvedAt) - new Date(i.adminReview.reviewedAt);
              return reviewTime / (1000 * 60 * 60 * 24);
            });

          const avgResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;

          return {
            mentorId: mentor.mentorId,
            mentorName: mentor.profile.name,
            department: mentor.profile.department,
            approvalsProcessed: mentorInternships.length,
            approvalRate: Math.round(approvalRate * 100) / 100,
            averageResponseTime: Math.round(avgResponseTime * 10) / 10,
            studentsSupervised: mentor.assignedStudents?.length || 0,
          };
        })
      );

      return {
        period: { dateFrom, dateTo },
        system: {
          totalInternships,
          pendingVerifications,
          activeInternships,
          verificationsProcessed: verifiedInternships + rejectedInternships,
          verificationRate: Math.round(verificationRate * 100) / 100,
          averageVerificationTime: Math.round(averageVerificationTime * 10) / 10,
        },
        companies: {
          total: totalCompanies,
          topPerformers: companyMetrics.sort((a, b) => b.averageRating - a.averageRating),
        },
        departments: departmentMetrics.sort((a, b) => b.placementRate - a.placementRate),
        mentors: {
          total: mentors.length,
          topPerformers: mentorMetrics.sort((a, b) => b.approvalRate - a.approvalRate),
        },
      };
    } catch (error) {
      logger.error("Error getting admin analytics", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get department analytics with placement and credit metrics
   * Requirements: 10.3
   */
  async getDepartmentAnalytics(department, options = {}) {
    try {
      const { dateFrom, dateTo } = options;

      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter.postedAt = {};
        if (dateFrom) dateFilter.postedAt.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.postedAt.$lte = new Date(dateTo);
      }

      // Get department internships
      const internships = await Internship.find({
        department,
        ...dateFilter,
      }).lean();

      const totalInternships = internships.length;
      const activeInternships = internships.filter(
        i => i.status === "open_for_applications"
      ).length;

      // Get department applications
      const applications = await Application.find({
        department,
      }).lean();

      const totalApplications = applications.length;
      const acceptedApplications = applications.filter(
        a => a.status === "accepted"
      ).length;

      // Get department students
      const students = await Student.find({
        "profile.department": department,
      }).lean();

      const totalStudents = students.length;
      const applicationRate = totalStudents > 0
        ? (totalApplications / totalStudents)
        : 0;

      const placementRate = totalStudents > 0
        ? (acceptedApplications / totalStudents) * 100
        : 0;

      // Credit metrics
      const totalCreditsEarned = students.reduce(
        (sum, s) => sum + (s.credits?.earned || 0),
        0
      );

      const averageCredits = totalStudents > 0
        ? totalCreditsEarned / totalStudents
        : 0;

      const studentsWithCredits = students.filter(
        s => (s.credits?.earned || 0) > 0
      ).length;

      // Readiness score distribution
      const readinessScores = students.map(s => s.readinessScore || 0);
      const averageReadiness = readinessScores.length > 0
        ? readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length
        : 0;

      // Get department mentors
      const mentors = await Mentor.find({
        "profile.department": department,
        status: "active",
      }).lean();

      return {
        department,
        period: { dateFrom, dateTo },
        internships: {
          total: totalInternships,
          active: activeInternships,
        },
        applications: {
          total: totalApplications,
          accepted: acceptedApplications,
          applicationRate: Math.round(applicationRate * 100) / 100,
          placementRate: Math.round(placementRate * 100) / 100,
        },
        students: {
          total: totalStudents,
          averageReadiness: Math.round(averageReadiness * 100) / 100,
        },
        credits: {
          totalEarned: totalCreditsEarned,
          averagePerStudent: Math.round(averageCredits * 100) / 100,
          studentsWithCredits,
        },
        mentors: {
          total: mentors.length,
          averageWorkload: mentors.length > 0
            ? Math.round((totalStudents / mentors.length) * 10) / 10
            : 0,
        },
      };
    } catch (error) {
      logger.error("Error getting department analytics", {
        error: error.message,
        department,
      });
      throw error;
    }
  }

  /**
   * Export analytics to CSV or PDF format
   * Requirements: 9.5
   */
  async exportAnalytics(entityType, entityId, format = "csv", options = {}) {
    try {
      let data;

      // Get analytics data based on entity type
      switch (entityType) {
        case "company":
          data = await this.getCompanyAnalytics(entityId, options);
          break;
        case "mentor":
          data = await this.getMentorAnalytics(entityId, options);
          break;
        case "department":
          data = await this.getDepartmentAnalytics(entityId, options);
          break;
        case "admin":
          data = await this.getAdminAnalytics(options);
          break;
        default:
          throw new Error(`Invalid entity type: ${entityType}`);
      }

      if (format === "csv") {
        return this._exportToCSV(entityType, data);
      } else if (format === "pdf") {
        return this._exportToPDF(entityType, data);
      } else {
        throw new Error(`Invalid format: ${format}`);
      }
    } catch (error) {
      logger.error("Error exporting analytics", {
        error: error.message,
        entityType,
        entityId,
        format,
      });
      throw error;
    }
  }

  /**
   * Export analytics to CSV format
   */
  _exportToCSV(entityType, data) {
    try {
      let csvData = [];

      if (entityType === "company") {
        csvData = [
          { metric: "Total Internships", value: data.internships.total },
          { metric: "Active Internships", value: data.internships.active },
          { metric: "Closed Internships", value: data.internships.closed },
          { metric: "Total Applications", value: data.applicationFunnel.totalApplications },
          { metric: "Shortlisted", value: data.applicationFunnel.shortlisted },
          { metric: "Accepted", value: data.applicationFunnel.accepted },
          { metric: "Rejected", value: data.applicationFunnel.rejected },
          { metric: "Acceptance Rate (%)", value: data.applicationFunnel.acceptanceRate },
          { metric: "Total Completions", value: data.completions.total },
          { metric: "Completion Rate (%)", value: data.completions.completionRate },
          { metric: "Average Rating", value: data.completions.averageRating },
          { metric: "Average Hours", value: data.completions.averageHours },
        ];
      } else if (entityType === "mentor") {
        csvData = [
          { metric: "Total Reviewed", value: data.approvals.totalReviewed },
          { metric: "Approved", value: data.approvals.approved },
          { metric: "Rejected", value: data.approvals.rejected },
          { metric: "Approval Rate (%)", value: data.approvals.approvalRate },
          { metric: "Average Response Time (days)", value: data.approvals.averageResponseTime },
          { metric: "Students Supervised", value: data.students.supervised },
          { metric: "Average Readiness Score", value: data.students.averageReadinessScore },
          { metric: "Total Credits Earned", value: data.students.totalCreditsEarned },
        ];
      } else if (entityType === "department") {
        csvData = [
          { metric: "Total Internships", value: data.internships.total },
          { metric: "Active Internships", value: data.internships.active },
          { metric: "Total Applications", value: data.applications.total },
          { metric: "Accepted Applications", value: data.applications.accepted },
          { metric: "Application Rate", value: data.applications.applicationRate },
          { metric: "Placement Rate (%)", value: data.applications.placementRate },
          { metric: "Total Students", value: data.students.total },
          { metric: "Average Readiness", value: data.students.averageReadiness },
          { metric: "Total Credits Earned", value: data.credits.totalEarned },
          { metric: "Average Credits Per Student", value: data.credits.averagePerStudent },
          { metric: "Students With Credits", value: data.credits.studentsWithCredits },
          { metric: "Total Mentors", value: data.mentors.total },
          { metric: "Average Mentor Workload", value: data.mentors.averageWorkload },
        ];
      }

      // Convert to CSV manually
      const headers = ["Metric", "Value"];
      const rows = csvData.map(row => [row.metric, row.value]);
      const csvString = [
        headers.join(","),
        ...rows.map(row => row.join(",")),
      ].join("\n");

      return {
        format: "csv",
        data: csvString,
        filename: `${entityType}-analytics-${Date.now()}.csv`,
      };
    } catch (error) {
      logger.error("Error exporting to CSV", {
        error: error.message,
        entityType,
      });
      throw error;
    }
  }

  /**
   * Export analytics to PDF format
   */
  _exportToPDF(entityType, data) {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve({
            format: "pdf",
            data: pdfBuffer,
            filename: `${entityType}-analytics-${Date.now()}.pdf`,
          });
        });
        doc.on("error", reject);

        // Add title
        doc.fontSize(20).text(`${entityType.toUpperCase()} Analytics Report`, {
          align: "center",
        });
        doc.moveDown();

        // Add date range if available
        if (data.period) {
          doc.fontSize(12).text(
            `Period: ${data.period.dateFrom || "All time"} to ${data.period.dateTo || "Present"}`,
            { align: "center" }
          );
          doc.moveDown();
        }

        // Add metrics based on entity type
        doc.fontSize(14);

        if (entityType === "company") {
          doc.text("Internship Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Internships: ${data.internships.total}`);
          doc.text(`Active Internships: ${data.internships.active}`);
          doc.text(`Closed Internships: ${data.internships.closed}`);
          doc.moveDown();

          doc.fontSize(14).text("Application Funnel", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Applications: ${data.applicationFunnel.totalApplications}`);
          doc.text(`Shortlisted: ${data.applicationFunnel.shortlisted}`);
          doc.text(`Accepted: ${data.applicationFunnel.accepted}`);
          doc.text(`Rejected: ${data.applicationFunnel.rejected}`);
          doc.text(`Acceptance Rate: ${data.applicationFunnel.acceptanceRate}%`);
          doc.moveDown();

          doc.fontSize(14).text("Completion Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Completions: ${data.completions.total}`);
          doc.text(`Completion Rate: ${data.completions.completionRate}%`);
          doc.text(`Average Rating: ${data.completions.averageRating}`);
          doc.text(`Average Hours: ${data.completions.averageHours}`);
        } else if (entityType === "mentor") {
          doc.text("Approval Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Reviewed: ${data.approvals.totalReviewed}`);
          doc.text(`Approved: ${data.approvals.approved}`);
          doc.text(`Rejected: ${data.approvals.rejected}`);
          doc.text(`Approval Rate: ${data.approvals.approvalRate}%`);
          doc.text(`Average Response Time: ${data.approvals.averageResponseTime} days`);
          doc.moveDown();

          doc.fontSize(14).text("Student Supervision", { underline: true });
          doc.fontSize(12);
          doc.text(`Students Supervised: ${data.students.supervised}`);
          doc.text(`Average Readiness Score: ${data.students.averageReadinessScore}`);
          doc.text(`Total Credits Earned: ${data.students.totalCreditsEarned}`);
        } else if (entityType === "department") {
          doc.text("Internship Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Internships: ${data.internships.total}`);
          doc.text(`Active Internships: ${data.internships.active}`);
          doc.moveDown();

          doc.fontSize(14).text("Application Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Applications: ${data.applications.total}`);
          doc.text(`Accepted Applications: ${data.applications.accepted}`);
          doc.text(`Application Rate: ${data.applications.applicationRate}`);
          doc.text(`Placement Rate: ${data.applications.placementRate}%`);
          doc.moveDown();

          doc.fontSize(14).text("Student Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Students: ${data.students.total}`);
          doc.text(`Average Readiness: ${data.students.averageReadiness}`);
          doc.moveDown();

          doc.fontSize(14).text("Credit Metrics", { underline: true });
          doc.fontSize(12);
          doc.text(`Total Credits Earned: ${data.credits.totalEarned}`);
          doc.text(`Average Credits Per Student: ${data.credits.averagePerStudent}`);
          doc.text(`Students With Credits: ${data.credits.studentsWithCredits}`);
        }

        doc.end();
      });
    } catch (error) {
      logger.error("Error exporting to PDF", {
        error: error.message,
        entityType,
      });
      throw error;
    }
  }

  /**
   * Cache analytics snapshot for expensive aggregations
   * Requirements: Caching layer for expensive aggregations
   */
  async cacheAnalyticsSnapshot(entityType, entityId, period = "daily") {
    try {
      const snapshotId = `${entityType}-${entityId || "system"}-${period}-${Date.now()}`;
      const date = new Date();

      let metrics = {};

      // Get metrics based on entity type
      if (entityType === "company") {
        const analytics = await this.getCompanyAnalytics(entityId);
        metrics = {
          internshipsPosted: analytics.internships.total,
          applicationsReceived: analytics.applicationFunnel.totalApplications,
          acceptanceRate: analytics.applicationFunnel.acceptanceRate,
          completionRate: analytics.completions.completionRate,
          averageRating: analytics.completions.averageRating,
        };
      } else if (entityType === "mentor") {
        const analytics = await this.getMentorAnalytics(entityId);
        metrics = {
          approvalsProcessed: analytics.approvals.totalReviewed,
          approvalRate: analytics.approvals.approvalRate,
          averageResponseTime: analytics.approvals.averageResponseTime,
          studentsSupervised: analytics.students.supervised,
        };
      } else if (entityType === "department") {
        const analytics = await this.getDepartmentAnalytics(entityId);
        metrics = {
          applicationRate: analytics.applications.applicationRate,
          placementRate: analytics.applications.placementRate,
          averageCredits: analytics.credits.averagePerStudent,
        };
      } else if (entityType === "admin") {
        const analytics = await this.getAdminAnalytics();
        metrics = {
          verificationsProcessed: analytics.system.verificationsProcessed,
          verificationRate: analytics.system.verificationRate,
          activeInternships: analytics.system.activeInternships,
        };
      }

      // Create snapshot
      const snapshot = await AnalyticsSnapshot.create({
        snapshotId,
        entityType,
        entityId: entityId || null,
        period,
        date,
        metrics,
      });

      logger.info("Analytics snapshot cached", {
        snapshotId,
        entityType,
        entityId,
        period,
      });

      return snapshot;
    } catch (error) {
      logger.error("Error caching analytics snapshot", {
        error: error.message,
        entityType,
        entityId,
        period,
      });
      throw error;
    }
  }

  /**
   * Get cached analytics snapshot
   */
  async getCachedSnapshot(entityType, entityId, period = "daily", dateFrom, dateTo) {
    try {
      const query = {
        entityType,
        period,
      };

      if (entityId) {
        query.entityId = entityId;
      }

      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const snapshots = await AnalyticsSnapshot.find(query)
        .sort({ date: -1 })
        .limit(30)
        .lean();

      return snapshots;
    } catch (error) {
      logger.error("Error getting cached snapshot", {
        error: error.message,
        entityType,
        entityId,
        period,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const internshipAnalyticsService = new InternshipAnalyticsService();
export default internshipAnalyticsService;
