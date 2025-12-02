import mongoose from "mongoose";
import CreditRequest from "../models/CreditRequest.js";
import InternshipCompletion from "../models/InternshipCompletion.js";
import Student from "../models/Student.js";
import Internship from "../models/Internship.js";
import { logger } from "../utils/logger.js";
import { storageService } from "./storageService.js";
import { randomUUID } from "node:crypto";
import creditMetricsService from "./creditMetricsService.js";

/**
 * Calculate NEP credits based on internship duration
 * NEP guideline: 1 credit = 4 weeks of internship
 * Minimum 4 weeks required for any credit
 * @param {number} durationInWeeks - Internship duration in weeks
 * @returns {number} - Calculated credits
 */
export const calculateNEPCredits = (durationInWeeks) => {
  if (durationInWeeks < 4) {
    return 0;
  }
  return Math.floor(durationInWeeks / 4);
};

/**
 * Validate if internship meets NEP compliance requirements
 * @param {Object} internshipCompletion - InternshipCompletion document
 * @returns {Object} - { compliant: boolean, reason: string }
 */
export const validateNEPCompliance = async (internshipCompletion) => {
  try {
    // Get internship details to calculate duration
    const internship = await Internship.findById(internshipCompletion.internshipId);
    if (!internship) {
      return { compliant: false, reason: "Internship not found" };
    }

    // Parse duration string (e.g., "8 weeks", "2 months")
    const durationWeeks = parseDurationToWeeks(internship.duration);
    
    if (durationWeeks < 4) {
      return { 
        compliant: false, 
        reason: `Internship duration (${durationWeeks} weeks) is less than NEP minimum requirement of 4 weeks` 
      };
    }

    // Check if logbook and report are complete
    if (!internshipCompletion.evaluation || !internshipCompletion.evaluation.overallComments) {
      return { compliant: false, reason: "Evaluation incomplete" };
    }

    return { compliant: true, reason: "Meets NEP requirements" };
  } catch (error) {
    logger.error("Error validating NEP compliance", { error: error.message });
    throw error;
  }
};

/**
 * Parse duration string to weeks
 * @param {string} duration - Duration string (e.g., "8 weeks", "2 months")
 * @returns {number} - Duration in weeks
 */
const parseDurationToWeeks = (duration) => {
  if (!duration) return 0;
  
  const lowerDuration = duration.toLowerCase();
  
  // Match patterns like "8 weeks", "2 months", "3-4 months"
  const weeksMatch = lowerDuration.match(/(\d+)\s*weeks?/);
  if (weeksMatch) {
    return parseInt(weeksMatch[1], 10);
  }
  
  const monthsMatch = lowerDuration.match(/(\d+)(?:-\d+)?\s*months?/);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10) * 4; // Approximate 1 month = 4 weeks
  }
  
  // Default to 0 if unable to parse
  return 0;
};

/**
 * Create a new credit request
 * @param {string} studentId - Student MongoDB ObjectId
 * @param {string} internshipCompletionId - InternshipCompletion MongoDB ObjectId
 * @returns {Object} - Created CreditRequest document
 */
export const createCreditRequest = async (studentId, internshipCompletionId) => {
  try {
    // Validate internship completion exists
    const completion = await InternshipCompletion.findById(internshipCompletionId)
      .populate("internshipId");
    
    if (!completion) {
      throw new Error("Internship completion not found");
    }

    // Validate internship is marked as completed
    if (completion.status !== 'completed') {
      throw new Error("Credit request can only be created for completed internships");
    }

    // Check if credit request already exists
    if (completion.creditRequest?.requested) {
      throw new Error("Credit request already exists for this internship");
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Get internship details
    const internship = completion.internshipId;
    if (!internship) {
      throw new Error("Internship not found");
    }

    // Calculate duration and credits
    const durationWeeks = parseDurationToWeeks(internship.duration);
    const calculatedCredits = calculateNEPCredits(durationWeeks);

    // Validate NEP compliance
    const compliance = await validateNEPCompliance(completion);
    if (!compliance.compliant) {
      throw new Error(`NEP compliance validation failed: ${compliance.reason}`);
    }

    // Get mentor ID - for now, use a placeholder if not assigned
    // In production, this should be properly assigned to the student
    const mentorId = student.profile?.mentorId || "507f1f77bcf86cd799439099";

    // Generate unique credit request ID
    const creditRequestId = `CR-${Date.now()}-${studentId.toString().slice(-6)}`;

    // Create credit request
    const creditRequest = await CreditRequest.create({
      creditRequestId,
      studentId,
      internshipCompletionId,
      internshipId: internship._id,
      mentorId,
      requestedCredits: calculatedCredits,
      calculatedCredits,
      internshipDurationWeeks: durationWeeks,
      status: "pending_mentor_review",
      requestedAt: new Date(),
    });

    // Update internship completion with credit request info
    completion.creditRequest = {
      requested: true,
      requestId: creditRequest._id,
      requestedAt: new Date(),
      status: "pending_mentor_review",
    };
    await completion.save();

    // Update student pending credits
    student.credits.pending = (student.credits.pending || 0) + calculatedCredits;
    await student.save();

    logger.info("Credit request created", { 
      creditRequestId, 
      studentId, 
      internshipCompletionId,
      calculatedCredits 
    });

    // Track metrics
    creditMetricsService.trackCreditRequestCreation(creditRequestId, {
      studentId,
      internshipCompletionId,
      calculatedCredits,
      durationWeeks,
    });

    return creditRequest;
  } catch (error) {
    logger.error("Error creating credit request", { error: error.message, studentId, internshipCompletionId });
    throw error;
  }
};

/**
 * Add approved credits to student profile with transaction support
 * @param {string} studentId - Student MongoDB ObjectId
 * @param {number} credits - Number of credits to add
 * @param {Object} certificateData - Certificate information
 * @param {Object} session - MongoDB session for transaction (optional)
 * @returns {Object} - Updated student document
 */
export const addCreditsToStudent = async (studentId, credits, certificateData, session = null) => {
  try {
    const student = await Student.findById(studentId).session(session);
    if (!student) {
      throw new Error("Student not found");
    }

    // Validate credit amount
    if (typeof credits !== "number" || credits <= 0) {
      throw new Error("Invalid credit amount");
    }

    // Add credits to earned total
    student.credits.earned = (student.credits.earned || 0) + credits;
    
    // Remove from pending
    student.credits.pending = Math.max(0, (student.credits.pending || 0) - credits);
    
    // Add to approved
    student.credits.approved = (student.credits.approved || 0) + credits;

    // Add to history
    student.credits.history.push({
      creditRequestId: certificateData.creditRequestId,
      internshipId: certificateData.internshipId,
      creditsAdded: credits,
      addedAt: new Date(),
      certificateUrl: certificateData.certificateUrl,
    });

    await student.save({ session });

    logger.info("Credits added to student profile", { 
      studentId, 
      credits, 
      totalEarned: student.credits.earned 
    });

    return student;
  } catch (error) {
    logger.error("Error adding credits to student", { error: error.message, studentId, credits });
    throw error;
  }
};

/**
 * Get credit request by ID
 * @param {string} creditRequestId - CreditRequest MongoDB ObjectId or creditRequestId
 * @returns {Object} - CreditRequest document with populated fields
 */
export const getCreditRequestById = async (creditRequestId) => {
  try {
    // Try to find by creditRequestId string first, then by MongoDB _id
    let creditRequest;
    
    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(creditRequestId);
    
    if (isObjectId) {
      creditRequest = await CreditRequest.findById(creditRequestId)
        .populate("studentId", "studentId email profile")
        .populate("internshipId", "title companyId duration")
        .populate("internshipCompletionId")
        .populate("mentorId", "mentorId email profile")
        .populate("mentorReview.reviewedBy", "mentorId email profile")
        .populate("adminReview.reviewedBy", "adminId email profile");
    } else {
      creditRequest = await CreditRequest.findOne({ creditRequestId })
        .populate("studentId", "studentId email profile")
        .populate("internshipId", "title companyId duration")
        .populate("internshipCompletionId")
        .populate("mentorId", "mentorId email profile")
        .populate("mentorReview.reviewedBy", "mentorId email profile")
        .populate("adminReview.reviewedBy", "adminId email profile");
    }

    if (!creditRequest) {
      throw new Error("Credit request not found");
    }

    return creditRequest;
  } catch (error) {
    logger.error("Error getting credit request", { error: error.message, creditRequestId });
    throw error;
  }
};

/**
 * Get credit requests by student with filters
 * @param {string} studentId - Student MongoDB ObjectId
 * @param {Object} filters - Filter options (status, dateFrom, dateTo, page, limit, sortBy, sortOrder)
 * @returns {Object} - Paginated credit requests
 */
export const getCreditRequestsByStudent = async (studentId, filters = {}) => {
  try {
    const { 
      status, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 20,
      sortBy = "requestedAt",
      sortOrder = "desc"
    } = filters;
    
    const query = { studentId };
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) {
        query.requestedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.requestedAt.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [creditRequests, total] = await Promise.all([
      CreditRequest.find(query)
        .populate("internshipId", "title companyId duration")
        .populate("mentorId", "mentorId email profile")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      CreditRequest.countDocuments(query)
    ]);

    // Add overdue flag to each request
    const requestsWithOverdue = creditRequests.map(req => {
      const reqObj = req.toObject();
      reqObj.isOverdue = req.isOverdue();
      return reqObj;
    });

    return {
      creditRequests: requestsWithOverdue,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error("Error getting student credit requests", { error: error.message, studentId });
    throw error;
  }
};

/**
 * Get credit requests by mentor with filters
 * @param {string} mentorId - Mentor MongoDB ObjectId
 * @param {Object} filters - Filter options (status, dateFrom, dateTo, studentName, page, limit, sortBy, sortOrder)
 * @returns {Object} - Paginated credit requests
 */
export const getCreditRequestsByMentor = async (mentorId, filters = {}) => {
  try {
    const { 
      status, 
      dateFrom, 
      dateTo, 
      studentName,
      page = 1, 
      limit = 20, 
      sortBy = "requestedAt",
      sortOrder = "asc"
    } = filters;
    
    const query = { mentorId };
    
    // Status filter - default to pending if not specified
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) {
        query.requestedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.requestedAt.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // First, get the credit requests
    let creditRequestsQuery = CreditRequest.find(query)
      .populate("studentId", "studentId email profile")
      .populate("internshipId", "title companyId duration")
      .populate("internshipCompletionId")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const [creditRequests, total] = await Promise.all([
      creditRequestsQuery,
      CreditRequest.countDocuments(query)
    ]);

    // Add overdue flag to each request
    const requestsWithOverdue = creditRequests.map(req => {
      const reqObj = req.toObject();
      reqObj.isOverdue = req.isOverdue();
      return reqObj;
    });

    // Filter by student name if provided (post-query filtering)
    let filteredRequests = requestsWithOverdue;
    if (studentName) {
      const searchTerm = studentName.toLowerCase();
      filteredRequests = requestsWithOverdue.filter(req => {
        const student = req.studentId;
        if (!student) return false;
        
        const fullName = student.profile?.name?.toLowerCase() || "";
        const email = student.email?.toLowerCase() || "";
        const studentId = student.studentId?.toLowerCase() || "";
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               studentId.includes(searchTerm);
      });
    }

    return {
      creditRequests: filteredRequests,
      pagination: {
        total: studentName ? filteredRequests.length : total,
        page,
        limit,
        pages: Math.ceil((studentName ? filteredRequests.length : total) / limit)
      }
    };
  } catch (error) {
    logger.error("Error getting mentor credit requests", { error: error.message, mentorId });
    throw error;
  }
};

/**
 * Get credit requests for admin with filters
 * @param {Object} filters - Filter options (status, dateFrom, dateTo, studentName, companyName, mentorId, department, page, limit, sortBy, sortOrder)
 * @returns {Object} - Paginated credit requests
 */
export const getCreditRequestsByAdmin = async (filters = {}) => {
  try {
    const { 
      status, 
      dateFrom,
      dateTo,
      studentName,
      companyName,
      mentorId, 
      department,
      page = 1, 
      limit = 20,
      sortBy = "requestedAt",
      sortOrder = "asc"
    } = filters;
    
    const query = {};
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Mentor filter
    if (mentorId) {
      query.mentorId = mentorId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.requestedAt = {};
      if (dateFrom) {
        query.requestedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.requestedAt.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    let creditRequestsQuery = CreditRequest.find(query)
      .populate("studentId", "studentId email profile")
      .populate({
        path: "internshipId",
        select: "title companyId duration",
        populate: {
          path: "companyId",
          select: "companyName"
        }
      })
      .populate("internshipCompletionId")
      .populate("mentorId", "mentorId email profile")
      .populate("mentorReview.reviewedBy", "mentorId email profile")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const [creditRequests, total] = await Promise.all([
      creditRequestsQuery,
      CreditRequest.countDocuments(query)
    ]);

    // Add overdue flag to each request
    const requestsWithOverdue = creditRequests.map(req => {
      const reqObj = req.toObject();
      reqObj.isOverdue = req.isOverdue();
      return reqObj;
    });

    // Apply post-query filters
    let filteredRequests = requestsWithOverdue;
    
    // Filter by department if specified
    if (department) {
      filteredRequests = filteredRequests.filter(
        req => req.studentId?.profile?.department === department
      );
    }

    // Filter by student name if specified
    if (studentName) {
      const searchTerm = studentName.toLowerCase();
      filteredRequests = filteredRequests.filter(req => {
        const student = req.studentId;
        if (!student) return false;
        
        const fullName = student.profile?.name?.toLowerCase() || "";
        const email = student.email?.toLowerCase() || "";
        const studentId = student.studentId?.toLowerCase() || "";
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               studentId.includes(searchTerm);
      });
    }

    // Filter by company name if specified
    if (companyName) {
      const searchTerm = companyName.toLowerCase();
      filteredRequests = filteredRequests.filter(req => {
        const internship = req.internshipId;
        if (!internship) return false;
        
        const company = internship.companyId;
        if (!company) return false;
        
        const companyNameStr = company.companyName?.toLowerCase() || "";
        return companyNameStr.includes(searchTerm);
      });
    }

    return {
      creditRequests: filteredRequests,
      pagination: {
        total: (department || studentName || companyName) ? filteredRequests.length : total,
        page,
        limit,
        pages: Math.ceil(((department || studentName || companyName) ? filteredRequests.length : total) / limit)
      }
    };
  } catch (error) {
    logger.error("Error getting admin credit requests", { error: error.message });
    throw error;
  }
};

/**
 * Generate a certificate template as HTML
 * @param {Object} certificateData - Data for certificate generation
 * @returns {string} - HTML certificate template
 */
const generateCertificateTemplate = (certificateData) => {
  const {
    certificateId,
    studentName,
    studentId,
    internshipTitle,
    companyName,
    credits,
    duration,
    completionDate,
    issueDate,
  } = certificateData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Transfer Certificate</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', serif;
      background: #f5f5f5;
      padding: 40px;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      border: 20px solid #1e3a8a;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 20px;
    }
    .title {
      font-size: 36px;
      color: #1e3a8a;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: #64748b;
      font-style: italic;
    }
    .content {
      margin: 40px 0;
      line-height: 2;
      font-size: 16px;
      color: #334155;
    }
    .highlight {
      font-weight: bold;
      color: #1e3a8a;
      font-size: 18px;
    }
    .details {
      margin: 30px 0;
      padding: 20px;
      background: #f8fafc;
      border-left: 4px solid #1e3a8a;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 5px 0;
    }
    .detail-label {
      font-weight: bold;
      color: #475569;
    }
    .detail-value {
      color: #1e3a8a;
      font-weight: 600;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    .certificate-id {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 20px;
    }
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin-top: 40px;
    }
    .signature {
      text-align: center;
    }
    .signature-line {
      width: 200px;
      border-top: 2px solid #334155;
      margin: 10px auto;
    }
    .signature-label {
      font-size: 14px;
      color: #64748b;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="title">CERTIFICATE OF CREDIT TRANSFER</div>
      <div class="subtitle">Academic Credit Recognition</div>
    </div>
    
    <div class="content">
      <p>This is to certify that</p>
      <p class="highlight">${studentName}</p>
      <p>Student ID: ${studentId}</p>
      <p style="margin-top: 20px;">has successfully completed an internship program and has been awarded</p>
      <p class="highlight">${credits} Academic Credit${credits !== 1 ? 's' : ''}</p>
      <p>in accordance with the National Education Policy (NEP) guidelines.</p>
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Internship Title:</span>
        <span class="detail-value">${internshipTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Company:</span>
        <span class="detail-value">${companyName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration:</span>
        <span class="detail-value">${duration}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Completion Date:</span>
        <span class="detail-value">${completionDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Credits Awarded:</span>
        <span class="detail-value">${credits} Credit${credits !== 1 ? 's' : ''}</span>
      </div>
    </div>

    <div class="signature-section">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-label">Faculty Mentor</div>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-label">Department Head</div>
      </div>
    </div>

    <div class="footer">
      <p>Issued on: ${issueDate}</p>
      <p class="certificate-id">Certificate ID: ${certificateId}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate credit transfer certificate
 * @param {Object} creditRequest - CreditRequest document (populated)
 * @returns {Object} - Certificate data with URL and ID
 */
export const generateCertificate = async (creditRequest) => {
  try {
    // Ensure creditRequest is populated (check if fields are objects, not just ObjectIds)
    if (!creditRequest.studentId || typeof creditRequest.studentId === 'string' || !creditRequest.studentId.email) {
      throw new Error("Credit request must be populated with student data");
    }
    if (!creditRequest.internshipId || typeof creditRequest.internshipId === 'string' || !creditRequest.internshipId.title) {
      throw new Error("Credit request must be populated with internship data");
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Prepare certificate data
    const student = creditRequest.studentId;
    const internship = creditRequest.internshipId;
    const completion = creditRequest.internshipCompletionId;

    const certificateData = {
      certificateId,
      studentName: student.profile?.fullName || `${student.profile?.firstName || ''} ${student.profile?.lastName || ''}`.trim() || student.email,
      studentId: student.studentId || student._id.toString(),
      internshipTitle: internship.title || "Internship Program",
      companyName: internship.companyId?.companyName || internship.companyId?.toString() || "Company",
      credits: creditRequest.calculatedCredits,
      duration: `${creditRequest.internshipDurationWeeks} weeks`,
      completionDate: completion?.completedAt 
        ? new Date(completion.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    // Generate HTML certificate
    const certificateHtml = generateCertificateTemplate(certificateData);

    // Convert HTML to buffer for upload
    const certificateBuffer = Buffer.from(certificateHtml, 'utf-8');

    // Upload certificate to storage
    const filename = `certificate-${certificateId}.html`;
    const uploadResult = await storageService.uploadFile(certificateBuffer, {
      filename,
      contentType: 'text/html',
      provider: 's3', // Use S3 for certificate storage
    });

    logger.info("Certificate generated and uploaded", { 
      certificateId, 
      creditRequestId: creditRequest.creditRequestId,
      url: uploadResult.url 
    });

    return {
      certificateId,
      certificateUrl: uploadResult.url,
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Error generating certificate", { 
      error: error.message, 
      creditRequestId: creditRequest?.creditRequestId 
    });
    throw error;
  }
};

/**
 * Calculate progress indicator based on current status
 * Returns percentage complete and current stage information
 * @param {Object} creditRequest - CreditRequest document
 * @returns {Object} - { percentage: number, currentStage: string, completedStages: string[], pendingStages: string[] }
 */
export const calculateProgressIndicator = (creditRequest) => {
  const stages = [
    { key: 'submitted', label: 'Submitted', statuses: ['pending_student_action', 'pending_mentor_review'] },
    { key: 'mentor_review', label: 'Mentor Review', statuses: ['mentor_approved', 'mentor_rejected'] },
    { key: 'admin_review', label: 'Admin Review', statuses: ['pending_admin_review', 'admin_approved', 'admin_rejected'] },
    { key: 'completed', label: 'Completed', statuses: ['credits_added', 'completed'] }
  ];

  const status = creditRequest.status;
  let currentStageIndex = 0;
  let completedStages = [];
  let pendingStages = [];

  // Determine current stage based on status
  if (status === 'pending_student_action' || status === 'pending_mentor_review') {
    currentStageIndex = 0;
  } else if (status === 'mentor_rejected') {
    currentStageIndex = 1;
    completedStages.push('submitted');
  } else if (status === 'mentor_approved' || status === 'pending_admin_review') {
    currentStageIndex = 2;
    completedStages.push('submitted', 'mentor_review');
  } else if (status === 'admin_rejected') {
    currentStageIndex = 2;
    completedStages.push('submitted', 'mentor_review');
  } else if (status === 'admin_approved' || status === 'credits_added' || status === 'completed') {
    currentStageIndex = 3;
    completedStages.push('submitted', 'mentor_review', 'admin_review');
  }

  // Calculate pending stages
  pendingStages = stages
    .slice(currentStageIndex + 1)
    .map(stage => stage.key);

  // Calculate percentage (each stage is 25%)
  const percentage = (completedStages.length / stages.length) * 100;

  return {
    percentage: Math.round(percentage),
    currentStage: stages[currentStageIndex].label,
    currentStageKey: stages[currentStageIndex].key,
    completedStages,
    pendingStages,
    isRejected: status === 'mentor_rejected' || status === 'admin_rejected',
    rejectedAt: status === 'mentor_rejected' ? 'mentor_review' : status === 'admin_rejected' ? 'admin_review' : null
  };
};

/**
 * Calculate expected timeline for each stage
 * Returns expected completion dates based on current status and stage durations
 * @param {Object} creditRequest - CreditRequest document
 * @returns {Object} - { stages: Array, totalExpectedDays: number, estimatedCompletionDate: Date }
 */
export const calculateExpectedTimeline = (creditRequest) => {
  const stageDurations = {
    submitted: 0, // Immediate
    mentor_review: 3, // 3 business days
    admin_review: 2, // 2 business days
    completed: 0 // Immediate after admin approval
  };

  const stages = [
    { key: 'submitted', label: 'Submitted', expectedDays: stageDurations.submitted },
    { key: 'mentor_review', label: 'Mentor Review', expectedDays: stageDurations.mentor_review },
    { key: 'admin_review', label: 'Admin Review', expectedDays: stageDurations.admin_review },
    { key: 'completed', label: 'Completed', expectedDays: stageDurations.completed }
  ];

  const status = creditRequest.status;
  const requestedAt = new Date(creditRequest.requestedAt);
  const now = new Date();

  let timeline = [];
  let cumulativeDays = 0;
  let currentStageIndex = 0;

  // Determine current stage
  if (status === 'pending_student_action' || status === 'pending_mentor_review') {
    currentStageIndex = 1;
  } else if (status === 'mentor_rejected') {
    currentStageIndex = 1;
  } else if (status === 'mentor_approved' || status === 'pending_admin_review') {
    currentStageIndex = 2;
  } else if (status === 'admin_rejected') {
    currentStageIndex = 2;
  } else if (status === 'admin_approved' || status === 'credits_added' || status === 'completed') {
    currentStageIndex = 3;
  }

  // Build timeline for each stage
  stages.forEach((stage, index) => {
    const stageInfo = {
      key: stage.key,
      label: stage.label,
      expectedDays: stage.expectedDays,
      status: index < currentStageIndex ? 'completed' : index === currentStageIndex ? 'current' : 'pending'
    };

    // Calculate expected start and end dates
    if (index === 0) {
      stageInfo.startDate = requestedAt;
      stageInfo.endDate = requestedAt;
    } else {
      const startDate = new Date(requestedAt);
      startDate.setDate(startDate.getDate() + cumulativeDays);
      stageInfo.startDate = startDate;

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + stage.expectedDays);
      stageInfo.endDate = endDate;
    }

    // Calculate actual completion date if stage is completed
    if (stageInfo.status === 'completed') {
      if (index === 1 && creditRequest.mentorReview?.reviewedAt) {
        stageInfo.actualCompletionDate = creditRequest.mentorReview.reviewedAt;
      } else if (index === 2 && creditRequest.adminReview?.reviewedAt) {
        stageInfo.actualCompletionDate = creditRequest.adminReview.reviewedAt;
      } else if (index === 3 && creditRequest.completedAt) {
        stageInfo.actualCompletionDate = creditRequest.completedAt;
      }
    }

    // Calculate days elapsed for current stage
    if (stageInfo.status === 'current') {
      const elapsed = Math.floor((now - stageInfo.startDate) / (1000 * 60 * 60 * 24));
      stageInfo.daysElapsed = elapsed;
      stageInfo.daysRemaining = Math.max(0, stage.expectedDays - elapsed);
      stageInfo.isOverdue = elapsed > stage.expectedDays;
    }

    timeline.push(stageInfo);
    cumulativeDays += stage.expectedDays;
  });

  // Calculate total expected days and estimated completion date
  const totalExpectedDays = Object.values(stageDurations).reduce((sum, days) => sum + days, 0);
  const estimatedCompletionDate = new Date(requestedAt);
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + totalExpectedDays);

  return {
    stages: timeline,
    totalExpectedDays,
    estimatedCompletionDate,
    currentStage: timeline.find(s => s.status === 'current')
  };
};

/**
 * Process credit addition with transaction support and rollback
 * This function handles the complete credit addition workflow with proper error handling
 * @param {Object} creditRequest - Credit request document
 * @param {Object} certificate - Generated certificate data
 * @returns {Object} - Result with success status and updated documents
 */
export const processCreditAdditionWithTransaction = async (creditRequest, certificate) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update credit request with certificate
    creditRequest.certificate = certificate;
    await creditRequest.save({ session });

    // Add credits to student profile
    const updatedStudent = await addCreditsToStudent(
      creditRequest.studentId,
      creditRequest.calculatedCredits,
      {
        creditRequestId: creditRequest._id,
        internshipId: creditRequest.internshipId,
        certificateUrl: certificate.certificateUrl,
      },
      session
    );

    // Transition to credits_added status
    creditRequest.transitionTo("credits_added");
    await creditRequest.save({ session });

    // Commit transaction
    await session.commitTransaction();
    
    logger.info("Credit addition transaction completed successfully", {
      creditRequestId: creditRequest.creditRequestId,
      studentId: creditRequest.studentId,
      credits: creditRequest.calculatedCredits,
    });

    return {
      success: true,
      creditRequest,
      student: updatedStudent,
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    
    logger.error("Credit addition transaction failed, rolled back", {
      error: error.message,
      creditRequestId: creditRequest.creditRequestId,
      studentId: creditRequest.studentId,
    });

    throw new Error(`Failed to add credits: ${error.message}`);
  } finally {
    session.endSession();
  }
};

export const creditService = {
  calculateNEPCredits,
  validateNEPCompliance,
  createCreditRequest,
  addCreditsToStudent,
  generateCertificate,
  getCreditRequestById,
  getCreditRequestsByStudent,
  getCreditRequestsByMentor,
  getCreditRequestsByAdmin,
  calculateProgressIndicator,
  calculateExpectedTimeline,
  processCreditAdditionWithTransaction,
};

export default creditService;
