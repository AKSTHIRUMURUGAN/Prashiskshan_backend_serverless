# Admin Internship Verification Endpoints

## Overview

This document describes the implementation of admin controller endpoints for the internship verification workflow (Task 10.1 and 10.2).

## Implemented Endpoints

### Task 10.1: Admin Verification Endpoints

#### 1. GET /api/admin/internships/pending
List pending internships awaiting admin verification.

**Query Parameters:**
- `page` (integer): Page number for pagination
- `limit` (integer): Items per page
- `department` (string): Filter by department
- `companyId` (string): Filter by company ID
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "internships": [...],
    "pagination": {...}
  }
}
```

**Requirements:** 2.2

#### 2. POST /api/admin/internships/:id/approve
Approve an internship posting.

**Path Parameters:**
- `id` (string): Internship ID

**Request Body:**
```json
{
  "comments": "Optional approval comments"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "internshipId": "INTERN-123",
    "status": "admin_approved",
    "adminReview": {
      "reviewedBy": "ADMIN-456",
      "reviewedAt": "2024-01-01T00:00:00.000Z",
      "decision": "approved",
      "comments": "Looks good"
    }
  }
}
```

**Requirements:** 2.2

#### 3. POST /api/admin/internships/:id/reject
Reject an internship posting with reasons.

**Path Parameters:**
- `id` (string): Internship ID

**Request Body:**
```json
{
  "reasons": ["Insufficient details", "Unclear requirements"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "internshipId": "INTERN-123",
    "status": "admin_rejected",
    "adminReview": {
      "reviewedBy": "ADMIN-456",
      "reviewedAt": "2024-01-01T00:00:00.000Z",
      "decision": "rejected",
      "reasons": ["Insufficient details", "Unclear requirements"]
    }
  }
}
```

**Requirements:** 2.3

#### 4. GET /api/admin/internships/:id
Get internship details with company history for admin review.

**Path Parameters:**
- `id` (string): Internship ID

**Response:**
```json
{
  "success": true,
  "data": {
    "internship": {...},
    "company": {
      "companyId": "COMP-123",
      "companyName": "Tech Corp",
      "status": "verified",
      "adminReview": {...}
    },
    "companyHistory": {
      "totalInternships": 10,
      "recentInternships": [...],
      "approvedCount": 8,
      "rejectedCount": 2
    }
  }
}
```

**Requirements:** 2.2

### Task 10.2: Admin Analytics Endpoints

#### 1. GET /api/admin/analytics
Get system-wide analytics.

**Query Parameters:**
- `dateFrom` (date): Start date for analytics
- `dateTo` (date): End date for analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "dateFrom": "...", "dateTo": "..." },
    "system": {
      "totalInternships": 100,
      "pendingVerifications": 10,
      "activeInternships": 50,
      "verificationsProcessed": 90,
      "verificationRate": 88.89,
      "averageVerificationTime": 2.5
    },
    "companies": {
      "total": 25,
      "topPerformers": [...]
    },
    "departments": [...],
    "mentors": {
      "total": 15,
      "topPerformers": [...]
    }
  }
}
```

**Requirements:** 10.1

#### 2. GET /api/admin/analytics/companies
Get company performance metrics.

**Query Parameters:**
- `dateFrom` (date): Start date
- `dateTo` (date): End date
- `limit` (integer): Number of results (default: 20)
- `sortBy` (string): Sort field (averageRating, internshipsPosted, applicationsReceived, completionRate)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "metrics": [
      {
        "companyId": "COMP-123",
        "companyName": "Tech Corp",
        "internshipsPosted": 10,
        "applicationsReceived": 150,
        "completionRate": 85.5,
        "averageRating": 4.5
      }
    ],
    "period": {...}
  }
}
```

**Requirements:** 10.2

#### 3. GET /api/admin/analytics/departments
Get department performance metrics.

**Query Parameters:**
- `dateFrom` (date): Start date
- `dateTo` (date): End date
- `department` (string): Specific department to analyze (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "department": "Computer Science",
        "internshipsAvailable": 30,
        "totalApplications": 200,
        "applicationRate": 2.5,
        "placementRate": 65.5,
        "averageCredits": 12.5
      }
    ],
    "period": {...}
  }
}
```

**Requirements:** 10.3

#### 4. GET /api/admin/analytics/mentors
Get mentor performance metrics.

**Query Parameters:**
- `dateFrom` (date): Start date
- `dateTo` (date): End date
- `department` (string): Filter by department
- `limit` (integer): Number of results (default: 20)
- `sortBy` (string): Sort field (approvalRate, approvalsProcessed, averageResponseTime, studentsSupervised)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "metrics": [
      {
        "mentorId": "MENTOR-123",
        "mentorName": "Dr. Smith",
        "department": "Computer Science",
        "approvalsProcessed": 25,
        "approvalRate": 92.0,
        "averageResponseTime": 1.5,
        "studentsSupervised": 30
      }
    ],
    "period": {...}
  }
}
```

**Requirements:** 10.4

#### 5. GET /api/admin/analytics/students
Get student performance metrics.

**Query Parameters:**
- `department` (string): Filter by department
- `minReadinessScore` (number): Minimum readiness score
- `minCredits` (number): Minimum credits earned
- `page` (integer): Page number
- `limit` (integer): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "studentId": "STD-123",
        "name": "John Doe",
        "department": "Computer Science",
        "readinessScore": 85.5,
        "creditsEarned": 15,
        "creditsRequired": 20,
        "totalApplications": 5,
        "acceptedApplications": 2,
        "completionRate": 100.0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    },
    "overallStats": {
      "totalStudents": 100,
      "averageReadinessScore": 75.5,
      "averageCreditsEarned": 12.5,
      "totalApplications": 500,
      "overallCompletionRate": 85.0
    }
  }
}
```

**Requirements:** 10.5

## Implementation Details

### Controller Methods

All controller methods are implemented in `backend/src/controllers/adminController.js`:

1. `getPendingInternshipVerifications` - Lists pending verifications
2. `approveInternshipVerification` - Approves internship
3. `rejectInternshipVerification` - Rejects internship with reasons
4. `getInternshipDetailsForAdmin` - Gets detailed internship view
5. `getSystemAnalytics` - Gets system-wide analytics
6. `getCompanyPerformanceMetrics` - Gets company metrics
7. `getDepartmentPerformanceMetrics` - Gets department metrics
8. `getMentorPerformanceMetrics` - Gets mentor metrics
9. `getStudentPerformanceMetrics` - Gets student metrics

### Routes

All routes are defined in `backend/src/routes/admin.js` with proper authentication and validation middleware.

### Services Used

- `internshipService.getInternshipsByStatus()` - For listing internships
- `approvalWorkflowService.adminApprove()` - For approving internships
- `approvalWorkflowService.adminReject()` - For rejecting internships
- `internshipAnalyticsService.getAdminAnalytics()` - For system analytics
- `internshipAnalyticsService.getDepartmentAnalytics()` - For department analytics

### Authentication & Authorization

All endpoints require:
- Valid JWT token
- Admin role authorization
- Enforced via `adminAuth` middleware: `[authenticate, identifyUser, authorize("admin")]`

### Validation

- Pagination validation via `validatePagination` middleware
- Date range validation via `validateDateRange` middleware
- Request body validation for approval/rejection actions

## Testing

Integration tests are provided in `backend/tests/integration/admin-internship-verification.test.js` covering:

- Listing pending verifications
- Approving internships
- Rejecting internships with reasons
- Getting internship details with company history
- All analytics endpoints with various filters

## Notes

- The new endpoints follow the existing admin route patterns
- All endpoints return standardized API responses using `apiSuccess()`
- Error handling is consistent with existing admin endpoints
- Logging is implemented for all critical operations
- The implementation integrates seamlessly with the existing approval workflow service

## Route Ordering Issue

**Important:** The new routes must be placed before the existing `/internships/:internshipId` routes in the admin router to avoid path conflicts. The `/internships/pending` route should match before the generic `/:id` parameter route.

## Next Steps

1. Adjust route ordering in `backend/src/routes/admin.js` to fix 404 errors
2. Run integration tests to verify all endpoints work correctly
3. Update API documentation (Swagger/OpenAPI)
4. Add frontend integration for these endpoints
