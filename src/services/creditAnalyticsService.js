import CreditRequest from "../models/CreditRequest.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import { logger } from "../utils/logger.js";

/**
 * Get system-wide credit transfer metrics
 * @param {Object} options - Query options (dateRange, department, status)
 * @returns {Object} - System metrics
 */
export const getSystemMetrics = async (options = {}) => {
  try {
    const { dateFrom, dateTo, department, status } = options;
    
    // Build query
    const query = {};
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) query.requestedAt.$gte = new Date(dateFrom);
      if (dateTo) query.requestedAt.$lte = new Date(dateTo);
    }
    if (status) query.status = status;

    // Get total counts by status
    const statusCounts = await CreditRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object for easier access
    const countsByStatus = {};
    statusCounts.forEach(item => {
      countsByStatus[item._id] = item.count;
    });

    // Calculate total requests
    const totalRequests = statusCounts.reduce((sum, item) => sum + item.count, 0);

    // Get total credits awarded
    const creditsAwarded = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          status: { $in: ["credits_added", "completed"] }
        } 
      },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: "$calculatedCredits" },
        },
      },
    ]);

    // Get average approval times
    const approvalTimes = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          status: { $in: ["credits_added", "completed"] }
        } 
      },
      {
        $project: {
          mentorReviewTime: {
            $subtract: ["$mentorReview.reviewedAt", "$requestedAt"]
          },
          adminReviewTime: {
            $subtract: ["$adminReview.reviewedAt", "$mentorReview.reviewedAt"]
          },
          totalTime: {
            $subtract: ["$completedAt", "$requestedAt"]
          },
        },
      },
      {
        $group: {
          _id: null,
          avgMentorReviewTime: { $avg: "$mentorReviewTime" },
          avgAdminReviewTime: { $avg: "$adminReviewTime" },
          avgTotalTime: { $avg: "$totalTime" },
        },
      },
    ]);

    // Get rejection rates
    const rejectionStats = await CreditRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          mentorRejected: {
            $sum: { $cond: [{ $eq: ["$status", "mentor_rejected"] }, 1, 0] }
          },
          adminRejected: {
            $sum: { $cond: [{ $eq: ["$status", "admin_rejected"] }, 1, 0] }
          },
        },
      },
    ]);

    const rejectionData = rejectionStats[0] || { total: 0, mentorRejected: 0, adminRejected: 0 };
    const mentorRejectionRate = rejectionData.total > 0 
      ? (rejectionData.mentorRejected / rejectionData.total) * 100 
      : 0;
    const adminRejectionRate = rejectionData.total > 0 
      ? (rejectionData.adminRejected / rejectionData.total) * 100 
      : 0;

    return {
      totalRequests,
      countsByStatus,
      creditsAwarded: creditsAwarded[0]?.totalCredits || 0,
      averageApprovalTimes: {
        mentorReview: approvalTimes[0]?.avgMentorReviewTime 
          ? Math.round(approvalTimes[0].avgMentorReviewTime / (1000 * 60 * 60 * 24)) // Convert to days
          : 0,
        adminReview: approvalTimes[0]?.avgAdminReviewTime 
          ? Math.round(approvalTimes[0].avgAdminReviewTime / (1000 * 60 * 60 * 24))
          : 0,
        total: approvalTimes[0]?.avgTotalTime 
          ? Math.round(approvalTimes[0].avgTotalTime / (1000 * 60 * 60 * 24))
          : 0,
      },
      rejectionRates: {
        mentor: Math.round(mentorRejectionRate * 100) / 100,
        admin: Math.round(adminRejectionRate * 100) / 100,
      },
    };
  } catch (error) {
    logger.error("Error getting system metrics", { error: error.message });
    throw error;
  }
};

/**
 * Get mentor-specific metrics
 * @param {string} mentorId - Mentor MongoDB ObjectId
 * @param {Object} options - Query options (dateRange)
 * @returns {Object} - Mentor metrics
 */
export const getMentorMetrics = async (mentorId, options = {}) => {
  try {
    const { dateFrom, dateTo } = options;
    
    const query = { mentorId };
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) query.requestedAt.$gte = new Date(dateFrom);
      if (dateTo) query.requestedAt.$lte = new Date(dateTo);
    }

    // Get counts by status
    const statusCounts = await CreditRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsByStatus = {};
    statusCounts.forEach(item => {
      countsByStatus[item._id] = item.count;
    });

    // Get average review time
    const reviewTimes = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          "mentorReview.reviewedAt": { $exists: true }
        } 
      },
      {
        $project: {
          reviewTime: {
            $subtract: ["$mentorReview.reviewedAt", "$requestedAt"]
          },
        },
      },
      {
        $group: {
          _id: null,
          avgReviewTime: { $avg: "$reviewTime" },
        },
      },
    ]);

    // Get rejection reasons
    const rejectionReasons = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          status: "mentor_rejected",
          "mentorReview.feedback": { $exists: true }
        } 
      },
      {
        $group: {
          _id: "$mentorReview.feedback",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalReviewed: statusCounts.reduce((sum, item) => sum + item.count, 0),
      countsByStatus,
      averageReviewTime: reviewTimes[0]?.avgReviewTime 
        ? Math.round(reviewTimes[0].avgReviewTime / (1000 * 60 * 60 * 24))
        : 0,
      topRejectionReasons: rejectionReasons.map(r => ({
        reason: r._id,
        count: r.count,
      })),
    };
  } catch (error) {
    logger.error("Error getting mentor metrics", { error: error.message, mentorId });
    throw error;
  }
};

/**
 * Get admin-specific metrics
 * @param {Object} options - Query options (dateRange)
 * @returns {Object} - Admin metrics
 */
export const getAdminMetrics = async (options = {}) => {
  try {
    const { dateFrom, dateTo } = options;
    
    const query = {};
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) query.requestedAt.$gte = new Date(dateFrom);
      if (dateTo) query.requestedAt.$lte = new Date(dateTo);
    }

    // Get pending admin reviews
    const pendingCount = await CreditRequest.countDocuments({
      ...query,
      status: "pending_admin_review",
    });

    // Get average admin review time
    const reviewTimes = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          "adminReview.reviewedAt": { $exists: true }
        } 
      },
      {
        $project: {
          reviewTime: {
            $subtract: ["$adminReview.reviewedAt", "$mentorReview.reviewedAt"]
          },
        },
      },
      {
        $group: {
          _id: null,
          avgReviewTime: { $avg: "$reviewTime" },
        },
      },
    ]);

    // Get compliance check statistics
    const complianceStats = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          "adminReview.complianceChecks": { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          totalReviewed: { $sum: 1 },
          nepCompliant: {
            $sum: { $cond: ["$adminReview.complianceChecks.nepCompliant", 1, 0] }
          },
          documentationComplete: {
            $sum: { $cond: ["$adminReview.complianceChecks.documentationComplete", 1, 0] }
          },
          feesCleared: {
            $sum: { $cond: ["$adminReview.complianceChecks.feesCleared", 1, 0] }
          },
          departmentApproved: {
            $sum: { $cond: ["$adminReview.complianceChecks.departmentApproved", 1, 0] }
          },
        },
      },
    ]);

    const complianceData = complianceStats[0] || {
      totalReviewed: 0,
      nepCompliant: 0,
      documentationComplete: 0,
      feesCleared: 0,
      departmentApproved: 0,
    };

    return {
      pendingReviews: pendingCount,
      averageReviewTime: reviewTimes[0]?.avgReviewTime 
        ? Math.round(reviewTimes[0].avgReviewTime / (1000 * 60 * 60 * 24))
        : 0,
      complianceStats: {
        totalReviewed: complianceData.totalReviewed,
        nepCompliantRate: complianceData.totalReviewed > 0
          ? Math.round((complianceData.nepCompliant / complianceData.totalReviewed) * 100)
          : 0,
        documentationCompleteRate: complianceData.totalReviewed > 0
          ? Math.round((complianceData.documentationComplete / complianceData.totalReviewed) * 100)
          : 0,
        feesClearedRate: complianceData.totalReviewed > 0
          ? Math.round((complianceData.feesCleared / complianceData.totalReviewed) * 100)
          : 0,
        departmentApprovedRate: complianceData.totalReviewed > 0
          ? Math.round((complianceData.departmentApproved / complianceData.totalReviewed) * 100)
          : 0,
      },
    };
  } catch (error) {
    logger.error("Error getting admin metrics", { error: error.message });
    throw error;
  }
};

/**
 * Get bottleneck analysis for approval pipeline
 * @returns {Object} - Bottleneck analysis
 */
export const getBottleneckAnalysis = async () => {
  try {
    // Get counts at each stage
    const stageCounts = await CreditRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgAge: {
            $avg: {
              $subtract: [new Date(), "$requestedAt"]
            }
          },
        },
      },
    ]);

    // Get overdue requests (pending > 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueByStage = await CreditRequest.aggregate([
      {
        $match: {
          requestedAt: { $lt: sevenDaysAgo },
          status: { $in: ["pending_mentor_review", "pending_admin_review"] },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get mentor workload distribution
    const mentorWorkload = await CreditRequest.aggregate([
      {
        $match: {
          status: "pending_mentor_review",
        },
      },
      {
        $group: {
          _id: "$mentorId",
          pendingCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "mentors",
          localField: "_id",
          foreignField: "_id",
          as: "mentor",
        },
      },
      {
        $unwind: "$mentor",
      },
      {
        $project: {
          mentorId: "$mentor.mentorId",
          mentorName: "$mentor.profile.name",
          pendingCount: 1,
        },
      },
      { $sort: { pendingCount: -1 } },
      { $limit: 10 },
    ]);

    // Calculate bottleneck scores
    const bottlenecks = stageCounts.map(stage => {
      const overdue = overdueByStage.find(o => o._id === stage._id);
      const avgAgeDays = Math.round(stage.avgAge / (1000 * 60 * 60 * 24));
      const overdueCount = overdue?.count || 0;
      
      // Bottleneck score: combination of count, age, and overdue percentage
      const bottleneckScore = (stage.count * 0.3) + (avgAgeDays * 0.4) + (overdueCount * 0.3);
      
      return {
        stage: stage._id,
        count: stage.count,
        avgAgeDays,
        overdueCount,
        bottleneckScore: Math.round(bottleneckScore * 100) / 100,
      };
    });

    // Sort by bottleneck score
    bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);

    return {
      bottlenecks,
      mentorWorkload,
      recommendations: generateRecommendations(bottlenecks, mentorWorkload),
    };
  } catch (error) {
    logger.error("Error getting bottleneck analysis", { error: error.message });
    throw error;
  }
};

/**
 * Generate recommendations based on bottleneck analysis
 * @param {Array} bottlenecks - Bottleneck data
 * @param {Array} mentorWorkload - Mentor workload data
 * @returns {Array} - Recommendations
 */
const generateRecommendations = (bottlenecks, mentorWorkload) => {
  const recommendations = [];

  // Check for mentor review bottleneck
  const mentorBottleneck = bottlenecks.find(b => b.stage === "pending_mentor_review");
  if (mentorBottleneck && mentorBottleneck.count > 10) {
    recommendations.push({
      priority: "high",
      area: "Mentor Review",
      issue: `${mentorBottleneck.count} requests pending mentor review`,
      suggestion: "Consider sending reminder notifications to mentors or redistributing workload",
    });
  }

  // Check for admin review bottleneck
  const adminBottleneck = bottlenecks.find(b => b.stage === "pending_admin_review");
  if (adminBottleneck && adminBottleneck.count > 15) {
    recommendations.push({
      priority: "high",
      area: "Admin Review",
      issue: `${adminBottleneck.count} requests pending admin review`,
      suggestion: "Consider adding more admin reviewers or streamlining the approval process",
    });
  }

  // Check for unbalanced mentor workload
  if (mentorWorkload.length > 0) {
    const maxWorkload = mentorWorkload[0].pendingCount;
    const avgWorkload = mentorWorkload.reduce((sum, m) => sum + m.pendingCount, 0) / mentorWorkload.length;
    
    if (maxWorkload > avgWorkload * 2) {
      recommendations.push({
        priority: "medium",
        area: "Workload Distribution",
        issue: `Unbalanced mentor workload (max: ${maxWorkload}, avg: ${Math.round(avgWorkload)})`,
        suggestion: "Consider redistributing pending requests to balance mentor workload",
      });
    }
  }

  // Check for overdue requests
  const totalOverdue = bottlenecks.reduce((sum, b) => sum + b.overdueCount, 0);
  if (totalOverdue > 5) {
    recommendations.push({
      priority: "high",
      area: "Overdue Requests",
      issue: `${totalOverdue} requests are overdue (>7 days)`,
      suggestion: "Send urgent reminders and escalate to department heads if necessary",
    });
  }

  return recommendations;
};

/**
 * Get rejection analysis
 * @param {Object} options - Query options (dateRange)
 * @returns {Object} - Rejection analysis
 */
export const getRejectionAnalysis = async (options = {}) => {
  try {
    const { dateFrom, dateTo } = options;
    
    const query = {
      status: { $in: ["mentor_rejected", "admin_rejected"] },
    };
    
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) query.requestedAt.$gte = new Date(dateFrom);
      if (dateTo) query.requestedAt.$lte = new Date(dateTo);
    }

    // Get rejection counts by type
    const rejectionCounts = await CreditRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get common mentor rejection reasons
    const mentorReasons = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          status: "mentor_rejected",
          "mentorReview.feedback": { $exists: true, $ne: "" }
        } 
      },
      {
        $group: {
          _id: "$mentorReview.feedback",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get common admin rejection reasons
    const adminReasons = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          status: "admin_rejected",
          "adminReview.feedback": { $exists: true, $ne: "" }
        } 
      },
      {
        $group: {
          _id: "$adminReview.feedback",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get quality criteria failure patterns
    const qualityCriteriaFailures = await CreditRequest.aggregate([
      { 
        $match: { 
          ...query,
          status: "mentor_rejected",
          "mentorReview.qualityCriteria": { $exists: true }
        } 
      },
      {
        $project: {
          logbookIncomplete: { $not: "$mentorReview.qualityCriteria.logbookComplete" },
          reportPoor: { $not: "$mentorReview.qualityCriteria.reportQuality" },
          learningOutcomesMissing: { $not: "$mentorReview.qualityCriteria.learningOutcomes" },
          evaluationMissing: { $not: "$mentorReview.qualityCriteria.companyEvaluation" },
        },
      },
      {
        $group: {
          _id: null,
          logbookIncomplete: { $sum: { $cond: ["$logbookIncomplete", 1, 0] } },
          reportPoor: { $sum: { $cond: ["$reportPoor", 1, 0] } },
          learningOutcomesMissing: { $sum: { $cond: ["$learningOutcomesMissing", 1, 0] } },
          evaluationMissing: { $sum: { $cond: ["$evaluationMissing", 1, 0] } },
        },
      },
    ]);

    return {
      rejectionCounts: rejectionCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mentorRejectionReasons: mentorReasons.map(r => ({
        reason: r._id,
        count: r.count,
      })),
      adminRejectionReasons: adminReasons.map(r => ({
        reason: r._id,
        count: r.count,
      })),
      qualityCriteriaFailures: qualityCriteriaFailures[0] || {
        logbookIncomplete: 0,
        reportPoor: 0,
        learningOutcomesMissing: 0,
        evaluationMissing: 0,
      },
    };
  } catch (error) {
    logger.error("Error getting rejection analysis", { error: error.message });
    throw error;
  }
};

/**
 * Export credit transfer report
 * @param {Object} options - Export options (format, filters)
 * @returns {Object} - Report data
 */
export const exportCreditReport = async (options = {}) => {
  try {
    const { format = "csv", dateFrom, dateTo, status, department } = options;
    
    const query = {};
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) query.requestedAt.$gte = new Date(dateFrom);
      if (dateTo) query.requestedAt.$lte = new Date(dateTo);
    }
    if (status) query.status = status;

    // Get credit requests with all details
    const creditRequests = await CreditRequest.find(query)
      .populate("studentId", "studentId email profile")
      .populate("internshipId", "title companyId duration")
      .populate("mentorId", "mentorId email profile")
      .populate("mentorReview.reviewedBy", "mentorId profile.name")
      .populate("adminReview.reviewedBy", "adminId profile.name")
      .sort({ requestedAt: -1 })
      .lean();

    // Filter by department if specified
    let filteredRequests = creditRequests;
    if (department) {
      filteredRequests = creditRequests.filter(
        req => req.studentId?.profile?.department === department
      );
    }

    // Format data for export
    const reportData = filteredRequests.map(req => ({
      creditRequestId: req.creditRequestId,
      studentId: req.studentId?.studentId || "N/A",
      studentName: req.studentId?.profile?.name || "N/A",
      studentEmail: req.studentId?.email || "N/A",
      department: req.studentId?.profile?.department || "N/A",
      internshipTitle: req.internshipId?.title || "N/A",
      duration: `${req.internshipDurationWeeks} weeks`,
      creditsRequested: req.requestedCredits,
      creditsCalculated: req.calculatedCredits,
      status: req.status,
      requestedAt: req.requestedAt,
      mentorReviewedAt: req.mentorReview?.reviewedAt || null,
      mentorDecision: req.mentorReview?.decision || "N/A",
      adminReviewedAt: req.adminReview?.reviewedAt || null,
      adminDecision: req.adminReview?.decision || "N/A",
      completedAt: req.completedAt || null,
      certificateUrl: req.certificate?.certificateUrl || "N/A",
    }));

    if (format === "csv") {
      return {
        format: "csv",
        data: convertToCSV(reportData),
        filename: `credit-transfer-report-${Date.now()}.csv`,
      };
    }

    // Default to JSON
    return {
      format: "json",
      data: reportData,
      filename: `credit-transfer-report-${Date.now()}.json`,
    };
  } catch (error) {
    logger.error("Error exporting credit report", { error: error.message });
    throw error;
  }
};

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects
 * @returns {string} - CSV string
 */
const convertToCSV = (data) => {
  if (data.length === 0) return "";
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }
      // Handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",");
  });
  
  // Combine headers and rows
  return [headers.join(","), ...rows].join("\n");
};

export const creditAnalyticsService = {
  getSystemMetrics,
  getMentorMetrics,
  getAdminMetrics,
  getBottleneckAnalysis,
  getRejectionAnalysis,
  exportCreditReport,
};

export default creditAnalyticsService;
