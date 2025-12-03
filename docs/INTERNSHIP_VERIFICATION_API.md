# Internship Verification Workflow API Documentation

This document provides an overview of the API endpoints for the Internship Verification and Approval Workflow system.

## Overview

The system implements a multi-stage approval process for internship postings:

1. **Company Posts** → `pending_admin_verification`
2. **Admin Approves** → `admin_approved`
3. **Mentor Approves** → `open_for_applications`
4. **Students Apply** → Applications created
5. **Company Reviews** → Applications accepted/rejected

## Workflow Status Values

- `draft` - Internship being created
- `pending_admin_verification` - Awaiting admin review
- `admin_approved` - Admin approved, awaiting mentor review
- `admin_rejected` - Rejected by admin
- `mentor_rejected` - Rejected by mentor
- `open_for_applications` - Approved and visible to students
- `closed` - Application deadline passed or slots filled
- `cancelled` - Cancelled by company

## Admin Endpoints

### Internship Verification

#### GET /api/admins/internships/pending
List all internships awaiting admin verification.

**Query Parameters:**
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 20)
- `companyId` (string) - Filter by company
- `department` (string) - Filter by department
- `sortBy` (string) - Sort field (default: postedAt)
- `sortOrder` (string) - asc/desc (default: desc)

**Response:** List of internships with status `pending_admin_verification`

#### GET /api/admins/internships/:id
Get complete internship details including company history for review.

**Response:** Full internship object with company verification history

#### POST /api/admins/internships/:id/approve
Approve internship for mentor review.

**Request Body:**
```json
{
  "comments": "Optional approval comments"
}
```

**Effect:** Status transitions to `admin_approved`, mentors notified

#### POST /api/admins/internships/:id/reject
Reject internship with reasons.

**Request Body:**
```json
{
  "reasons": "Rejection reasons (required)",
  "comments": "Additional comments"
}
```

**Effect:** Status transitions to `admin_rejected`, company notified

### Analytics

#### GET /api/admins/analytics
Get system-wide analytics with date range filtering.

**Query Parameters:**
- `dateFrom` (date) - Start date
- `dateTo` (date) - End date

#### GET /api/admins/analytics/companies
Get company performance metrics with sorting.

**Query Parameters:**
- `page`, `limit` - Pagination
- `sortBy` - averageRating, internshipsPosted, applicationsReceived, completionRate
- `sortOrder` - asc/desc

#### GET /api/admins/analytics/departments
Get department performance metrics.

**Query Parameters:**
- `department` (string) - Specific department
- `dateFrom`, `dateTo` - Date range

#### GET /api/admins/analytics/mentors
Get mentor performance metrics.

**Query Parameters:**
- `page`, `limit` - Pagination
- `sortBy` - approvalRate, approvalsProcessed, averageResponseTime, studentsSupervised
- `sortOrder` - asc/desc

#### GET /api/admins/analytics/students
Get student performance metrics.

**Query Parameters:**
- `page`, `limit` - Pagination

## Mentor Endpoints

### Internship Approval

#### GET /api/mentor/internships/pending
List admin-approved internships awaiting mentor approval for their department.

**Query Parameters:**
- `page`, `limit` - Pagination
- `sortBy` (string) - Sort field (default: postedAt)
- `sortOrder` (string) - asc/desc

**Response:** List of internships with status `admin_approved` for mentor's department

#### GET /api/mentor/internships/:internshipId
Get internship details for review.

**Response:** Full internship object

#### POST /api/mentor/internships/:internshipId/approve
Approve internship making it visible to students.

**Request Body:**
```json
{
  "comments": "Optional approval comments"
}
```

**Effect:** Status transitions to `open_for_applications`, students can now see and apply

#### POST /api/mentor/internships/:internshipId/reject
Reject internship with reasons.

**Request Body:**
```json
{
  "reasons": "Rejection reasons (required)"
}
```

**Effect:** Status transitions to `mentor_rejected`, admin and company notified

### Student Management

#### GET /api/mentor/students/list
List assigned students with filtering.

**Query Parameters:**
- `page`, `limit` - Pagination
- `sortBy` (string) - Sort field (default: profile.name)
- `sortOrder` (string) - asc/desc
- `internshipStatus` (string) - active, applied, none
- `performanceLevel` (string) - high, medium, low
- `creditCompletion` (string) - completed, in_progress, not_started
- `search` (string) - Search by name or roll number

#### GET /api/mentor/students/:studentId/details
Get student details with complete internship history.

#### GET /api/mentor/students/:studentId/applications
Get all applications submitted by a student.

**Query Parameters:**
- `status` (string) - Filter by status
- `page`, `limit` - Pagination

### Analytics

#### GET /api/mentor/analytics
Get mentor-specific analytics including approval rates and student supervision metrics.

**Query Parameters:**
- `dateFrom`, `dateTo` - Date range

#### GET /api/mentor/analytics/department
Get analytics for mentor's department.

**Query Parameters:**
- `dateFrom`, `dateTo` - Date range

## Company Endpoints

### Internship Management

#### POST /api/companies/internships
Create new internship (status: pending_admin_verification).

**Request Body:**
```json
{
  "title": "Full Stack Developer Intern",
  "description": "...",
  "department": "Computer Science",
  "duration": "6 months",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "optionalSkills": ["TypeScript", "Docker"],
  "startDate": "2024-06-01",
  "applicationDeadline": "2024-05-15T23:59:59Z",
  "slots": 5,
  "stipend": 20000,
  "location": "Bangalore",
  "workMode": "hybrid",
  "responsibilities": ["Develop features", "Write tests"],
  "learningOpportunities": ["Mentorship", "Code reviews"],
  "eligibilityRequirements": {
    "minYear": 2,
    "minReadinessScore": 60
  }
}
```

**Effect:** Internship created with AI tagging (async), admins notified

#### GET /api/companies/internships
Get all company internships with filtering.

**Query Parameters:**
- `status` (string) - Filter by status
- `page`, `limit` - Pagination

#### GET /api/companies/internships/:internshipId
Get internship details.

#### PATCH /api/companies/internships/:internshipId
Update internship (resets status to pending_admin_verification).

**Effect:** Status resets for re-review

#### DELETE /api/companies/internships/:internshipId
Cancel internship.

**Effect:** Status transitions to `cancelled`

### Application Management

#### GET /api/companies/internships/:internshipId/applicants
Get all applicants with filtering.

**Query Parameters:**
- `status` (string) - Filter by status
- `companyFeedbackStatus` (string) - Filter by feedback status
- `search` (string) - Search by name
- `page`, `limit` - Pagination

#### POST /api/companies/applications/approve
Approve application.

**Request Body:**
```json
{
  "applicationId": "APP-123",
  "feedback": "Optional feedback",
  "nextSteps": "Optional next steps"
}
```

**Effect:** Application approved, slots decremented, student notified

#### POST /api/companies/applications/reject-single
Reject application.

**Request Body:**
```json
{
  "applicationId": "APP-123",
  "reason": "Optional reason",
  "feedback": "Optional feedback"
}
```

**Effect:** Application rejected, student notified

#### GET /api/companies/applications/:applicationId
Get application details.

### Analytics

#### GET /api/companies/analytics
Get company analytics including application funnel and completion metrics.

**Query Parameters:**
- `dateFrom`, `dateTo` - Date range

#### GET /api/companies/analytics/export
Export analytics report.

**Query Parameters:**
- `format` (string) - csv or pdf (default: csv)
- `dateFrom`, `dateTo` - Date range

**Response:** File download

#### GET /api/companies/internships/:internshipId/metrics
Get detailed metrics for a specific internship.

## Student Endpoints

### Internship Discovery

#### GET /api/students/internships
Browse mentor-approved internships for student's department.

**Query Parameters:**
- `page`, `limit` - Pagination
- `location` (string) - Filter by location
- `workMode` (string) - remote, onsite, hybrid
- `skills` (string) - Comma-separated skills
- `minStipend`, `maxStipend` (number) - Stipend range
- `search` (string) - Search query
- `includeMatchScore` (boolean) - Include AI match scores

**Response:** List of internships with status `open_for_applications`

#### GET /api/students/internships/:internshipId
Get internship details with AI match score and analysis.

**Response:** Full internship object with match analysis

#### POST /api/students/internships/:internshipId/apply
Apply to internship.

**Request Body:**
```json
{
  "coverLetter": "Cover letter text (required)",
  "resumeUrl": "Optional resume URL"
}
```

**Effect:** Application created, company notified

### Application Management

#### GET /api/students/applications
List all applications with status.

**Query Parameters:**
- `status` (string) - Filter by status
- `page`, `limit` - Pagination

#### GET /api/students/applications/:applicationId
Get application details with status tracking.

#### DELETE /api/students/applications/:applicationId
Withdraw application.

### Dashboard

#### GET /api/students/dashboard
Get dashboard data including mentor details, application statuses, and active internships.

#### GET /api/students/profile
Get profile including total credits, readiness score, and internship history.

## Data Models

### Enhanced Internship Schema

```json
{
  "internshipId": "INT-2024001",
  "companyId": "COM-2024001",
  "title": "Full Stack Developer Intern",
  "description": "...",
  "department": "Computer Science",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "optionalSkills": ["TypeScript", "Docker"],
  "duration": "6 months",
  "stipend": 20000,
  "location": "Bangalore",
  "workMode": "hybrid",
  "status": "open_for_applications",
  "slots": 5,
  "slotsRemaining": 3,
  "appliedCount": 15,
  "startDate": "2024-06-01",
  "applicationDeadline": "2024-05-15T23:59:59Z",
  "responsibilities": ["Develop features", "Write tests"],
  "learningOpportunities": ["Mentorship", "Code reviews"],
  "eligibilityRequirements": {
    "minYear": 2,
    "minReadinessScore": 60,
    "requiredModules": []
  },
  "adminReview": {
    "reviewedBy": "ADM-001",
    "reviewedAt": "2024-01-15T10:00:00Z",
    "decision": "approved",
    "comments": "Looks good",
    "reasons": []
  },
  "mentorApproval": {
    "status": "approved",
    "mentorId": "MEN-001",
    "approvedAt": "2024-01-16T14:00:00Z",
    "comments": "Relevant for our students",
    "department": "Computer Science"
  },
  "aiTags": {
    "primarySkills": ["JavaScript", "React", "Node.js"],
    "difficulty": "intermediate",
    "careerPath": "Software Engineering",
    "industryFit": ["Technology", "Startups"],
    "learningIntensity": "moderate",
    "technicalDepth": "moderate",
    "generatedAt": "2024-01-15T09:30:00Z"
  },
  "auditTrail": [
    {
      "timestamp": "2024-01-15T09:00:00Z",
      "actor": "COM-2024001",
      "actorRole": "company",
      "action": "created",
      "fromStatus": null,
      "toStatus": "pending_admin_verification",
      "reason": "Initial creation"
    },
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "actor": "ADM-001",
      "actorRole": "admin",
      "action": "approved",
      "fromStatus": "pending_admin_verification",
      "toStatus": "admin_approved",
      "reason": "Verified company and internship details"
    },
    {
      "timestamp": "2024-01-16T14:00:00Z",
      "actor": "MEN-001",
      "actorRole": "mentor",
      "action": "approved",
      "fromStatus": "admin_approved",
      "toStatus": "open_for_applications",
      "reason": "Relevant for department students"
    }
  ],
  "postedBy": "COM-2024001",
  "postedAt": "2024-01-15T09:00:00Z",
  "closedAt": null
}
```

## Authentication

All endpoints require Bearer token authentication using Firebase ID tokens:

```
Authorization: Bearer <firebase-id-token>
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid state transition",
  "details": {
    "currentStatus": "open_for_applications",
    "attemptedStatus": "pending_admin_verification"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "AuthorizationError",
  "message": "Department mismatch",
  "details": {
    "mentorDepartment": "Computer Science",
    "internshipDepartment": "Mechanical Engineering"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Internship not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "ConflictError",
  "message": "No slots remaining"
}
```

## Rate Limiting

- Standard endpoints: 100 requests per 15 minutes per user
- AI-powered endpoints: 20 requests per 15 minutes per user

## Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/endpoint?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## Notifications

The system automatically sends notifications for:

- Internship status changes (to all affected stakeholders)
- Application submissions (to companies)
- Application decisions (to students)
- Deadline reminders (7, 3, and 1 days before)
- Mentor approval requests (to department mentors)

## AI Features

### AI Tagging (Gemini API)
Automatically generates tags for internships:
- Primary skills extraction
- Difficulty level assessment
- Career path categorization
- Industry fit analysis
- Learning intensity evaluation
- Technical depth assessment

### AI Match Scoring
Calculates match scores between students and internships based on:
- Skill alignment
- Department match
- Experience level
- Readiness score
- Career interests

## Complete API Documentation

For complete API documentation with request/response examples, visit:
- Development: http://localhost:5000/api-docs
- Production: https://api.prashiskshan.com/api-docs

Or view the generated OpenAPI specification:
- JSON: `backend/src/docs/openapi.json`
- Examples: `backend/src/docs/openapi-examples.json`
