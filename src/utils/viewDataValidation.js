/**
 * View Data Completeness Validation
 * 
 * This module provides validation functions to ensure API responses include
 * all required fields for different user roles (student, mentor, admin).
 * 
 * Requirements: 3.2, 5.2, 8.2, 10.1, 11.1, 11.2, 12.1
 */

/**
 * Required fields for student view of credit request
 */
const STUDENT_VIEW_REQUIRED_FIELDS = [
  'creditRequestId',
  'status',
  'requestedAt',
  'lastUpdatedAt',
  'calculatedCredits',
  'internshipDurationWeeks',
  'submissionHistory',
];

/**
 * Required fields for mentor view of credit request
 */
const MENTOR_VIEW_REQUIRED_FIELDS = [
  'creditRequestId',
  'studentId',
  'internshipId',
  'status',
  'requestedAt',
  'calculatedCredits',
  'internshipDurationWeeks',
];

/**
 * Required populated fields for mentor view
 */
const MENTOR_VIEW_REQUIRED_POPULATED = [
  'studentId.profile',
  'studentId.email',
  'internshipId.title',
  'internshipCompletionId.logbook',
  'internshipCompletionId.finalReport',
  'internshipCompletionId.companyCompletion.evaluationScore',
];

/**
 * Required fields for admin view of credit request
 */
const ADMIN_VIEW_REQUIRED_FIELDS = [
  'creditRequestId',
  'studentId',
  'internshipId',
  'mentorId',
  'status',
  'requestedAt',
  'calculatedCredits',
  'internshipDurationWeeks',
  'mentorReview',
];

/**
 * Required compliance fields for admin view
 */
const ADMIN_VIEW_COMPLIANCE_FIELDS = [
  'internshipDurationWeeks', // For NEP compliance check
];

/**
 * Check if a nested field exists in an object
 * @param {Object} obj - The object to check
 * @param {string} path - Dot-notation path (e.g., 'user.profile.name')
 * @returns {boolean} - True if field exists and is not null/undefined
 */
function hasNestedField(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return false;
    }
    current = current[key];
  }
  
  return current !== null && current !== undefined;
}

/**
 * Validate student view data completeness
 * @param {Object} creditRequest - Credit request object
 * @returns {Object} - { valid: boolean, missingFields: string[] }
 */
export function validateStudentView(creditRequest) {
  const missingFields = [];
  
  // Check required fields
  for (const field of STUDENT_VIEW_REQUIRED_FIELDS) {
    if (!hasNestedField(creditRequest, field)) {
      missingFields.push(field);
    }
  }
  
  // If rejected, feedback should be present
  if (creditRequest.status === 'mentor_rejected' || creditRequest.status === 'admin_rejected') {
    if (!hasNestedField(creditRequest, 'mentorReview.feedback') && 
        !hasNestedField(creditRequest, 'adminReview.feedback')) {
      missingFields.push('feedback (required for rejected requests)');
    }
  }
  
  // If completed, certificate should be present
  if (creditRequest.status === 'completed' || creditRequest.status === 'credits_added') {
    if (!hasNestedField(creditRequest, 'certificate.certificateUrl')) {
      missingFields.push('certificate.certificateUrl');
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate mentor view data completeness
 * @param {Object} creditRequest - Credit request object (should be populated)
 * @returns {Object} - { valid: boolean, missingFields: string[] }
 */
export function validateMentorView(creditRequest) {
  const missingFields = [];
  
  // Check required fields
  for (const field of MENTOR_VIEW_REQUIRED_FIELDS) {
    if (!hasNestedField(creditRequest, field)) {
      missingFields.push(field);
    }
  }
  
  // Check required populated fields
  for (const field of MENTOR_VIEW_REQUIRED_POPULATED) {
    if (!hasNestedField(creditRequest, field)) {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate admin view data completeness
 * @param {Object} creditRequest - Credit request object
 * @returns {Object} - { valid: boolean, missingFields: string[] }
 */
export function validateAdminView(creditRequest) {
  const missingFields = [];
  
  // Check required fields
  for (const field of ADMIN_VIEW_REQUIRED_FIELDS) {
    if (!hasNestedField(creditRequest, field)) {
      missingFields.push(field);
    }
  }
  
  // Check compliance fields
  for (const field of ADMIN_VIEW_COMPLIANCE_FIELDS) {
    if (!hasNestedField(creditRequest, field)) {
      missingFields.push(field);
    }
  }
  
  // Mentor review should have decision and feedback (if rejected)
  if (creditRequest.mentorReview) {
    if (!creditRequest.mentorReview.decision) {
      missingFields.push('mentorReview.decision');
    }
    if (creditRequest.mentorReview.decision === 'rejected' && !creditRequest.mentorReview.feedback) {
      missingFields.push('mentorReview.feedback');
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate view data based on role
 * @param {Object} creditRequest - Credit request object
 * @param {string} role - User role ('student', 'mentor', 'admin')
 * @returns {Object} - { valid: boolean, missingFields: string[] }
 */
export function validateViewData(creditRequest, role) {
  switch (role) {
    case 'student':
      return validateStudentView(creditRequest);
    case 'mentor':
      return validateMentorView(creditRequest);
    case 'admin':
      return validateAdminView(creditRequest);
    default:
      throw new Error(`Invalid role: ${role}`);
  }
}

/**
 * Middleware to validate response data completeness
 * @param {string} role - User role
 * @returns {Function} - Express middleware
 */
export function validateResponseData(role) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Only validate if response contains creditRequest data
      if (data && data.data && data.data.creditRequest) {
        const validation = validateViewData(data.data.creditRequest, role);
        
        if (!validation.valid) {
          console.warn(`View data validation warning for ${role}:`, validation.missingFields);
          // Log but don't fail the request - this is for monitoring
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
}
