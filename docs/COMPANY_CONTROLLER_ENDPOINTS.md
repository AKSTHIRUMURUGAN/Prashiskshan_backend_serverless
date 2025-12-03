# Company Controller Endpoints Implementation

## Overview
This document describes the implementation of company controller endpoints for the internship verification workflow system.

## Implementation Date
December 3, 2024

## Requirements Addressed
- **1.1**: Company Internship Posting - Create, update, list, and cancel internships
- **1.2**: Required Field Validation - Validation handled by internship service
- **1.4**: Verified Company Check - Enforced by `ensureCompanyContext` middleware
- **1.5**: Edit Status Reset - Automatic status reset to pending_admin_verification on updates
- **5.2**: Company Application Approval - Approve applications with slot decrement
- **5.3**: Company Application Rejection - Reject applications with feedback
- **9.1-9.5**: Company Analytics - Comprehensive analytics with export functionality

## Implemented Endpoints

### 9.1 Company Internship Endpoints

#### POST /api/company/internships
- **Purpose**: Create internship with AI tagging
- **Requirements**: 1.1, 1.2, 1.4
- **Service Used**: `internshipService.createInternship()`
- **Features**:
  - Validates all required fields (title, description, department, duration, skills, dates, slots)
  - Sets initial status to "pending_admin_verification"
  - Triggers AI tagging asynchronously via Gemini API
  - Notifies all admins of new submission
  - Creates audit trail entry

#### PUT /api/company/internships/:id
- **Purpose**: Update internship with status reset logic
- **Requirements**: 1.5
- **Service Used**: `internshipService.updateInternship()`
- **Features**:
  - Verifies company ownership
  - Resets status to "pending_admin_verification" if significant changes detected
  - Re-triggers AI tagging for updated content
  - Updates audit trail

#### GET /api/company/internships
- **Purpose**: List company internships with filters
- **Requirements**: 1.1, 1.4
- **Query Parameters**:
  - `status`: Filter by internship status
  - `search`: Full-text search
  - `startDateFrom`, `startDateTo`: Date range filters
  - `page`, `limit`: Pagination
  - `sortBy`, `sortOrder`: Sorting options
- **Features**:
  - Supports pagination
  - Supports filtering by status
  - Supports full-text search
  - Returns internships with metadata

#### GET /api/company/internships/:id
- **Purpose**: Get internship details
- **Requirements**: 1.1
- **Features**:
  - Verifies company ownership
  - Populates company details
  - Returns complete internship data including AI tags and audit trail

#### DELETE /api/company/internships/:id
- **Purpose**: Cancel internship
- **Requirements**: 1.1
- **Features**:
  - Verifies company ownership
  - Sets status to "cancelled"
  - Records closure timestamp
  - Adds audit trail entry

### 9.2 Company Application Endpoints

#### GET /api/company/internships/:id/applicants
- **Purpose**: List applicants with filters
- **Requirements**: 5.2, 5.3
- **Service Used**: `applicationService.getApplicationsByInternship()`
- **Query Parameters**:
  - `status`: Filter by application status
  - `companyFeedbackStatus`: Filter by feedback status
  - `search`: Search in applications
  - `appliedFrom`, `appliedTo`: Date range filters
  - `page`, `limit`: Pagination
  - `sortBy`, `sortOrder`: Sorting options
- **Features**:
  - Verifies internship ownership
  - Returns applications with student details
  - Supports comprehensive filtering

#### POST /api/company/applications/approve
- **Purpose**: Approve application
- **Requirements**: 5.2
- **Service Used**: `applicationService.companyApprove()`
- **Request Body**:
  - `applicationId` (required): Application to approve
  - `feedback`: Optional feedback message
  - `nextSteps`: Optional next steps information
- **Features**:
  - Verifies company ownership
  - Decrements internship slots atomically
  - Updates application status to "accepted"
  - Notifies student of acceptance
  - Adds timeline event

#### POST /api/company/applications/reject-single
- **Purpose**: Reject application
- **Requirements**: 5.3
- **Service Used**: `applicationService.companyReject()`
- **Request Body**:
  - `applicationId` (required): Application to reject
  - `reason`: Rejection reason
  - `feedback`: Optional additional feedback
- **Features**:
  - Verifies company ownership
  - Updates application status to "rejected"
  - Notifies student with rejection reason
  - Adds timeline event

#### GET /api/company/applications/:applicationId
- **Purpose**: Get application details
- **Requirements**: 5.2, 5.3
- **Features**:
  - Verifies company ownership
  - Returns complete application data
  - Includes student profile and internship details

### 9.3 Company Analytics Endpoints

#### GET /api/company/analytics
- **Purpose**: Get company analytics with date range
- **Requirements**: 9.1, 9.2, 9.3, 9.4
- **Service Used**: `internshipAnalyticsService.getCompanyAnalytics()`
- **Query Parameters**:
  - `dateFrom`: Start date for analytics period
  - `dateTo`: End date for analytics period
- **Returns**:
  - **Internship Metrics**:
    - Total internships
    - Active internships
    - Closed internships
    - Cancelled internships
  - **Application Funnel**:
    - Total applications
    - Shortlisted count
    - Accepted count
    - Rejected count
    - Acceptance rate (%)
  - **Completion Metrics**:
    - Total completions
    - Completion rate (%)
    - Average rating
    - Average hours worked

#### GET /api/company/analytics/export
- **Purpose**: Export analytics report
- **Requirements**: 9.5
- **Service Used**: `internshipAnalyticsService.exportAnalytics()`
- **Query Parameters**:
  - `format`: Export format (csv or pdf)
  - `dateFrom`: Start date
  - `dateTo`: End date
- **Features**:
  - Exports to CSV or PDF format
  - Includes all analytics metrics
  - Sets appropriate content-type headers
  - Provides downloadable file

#### GET /api/company/internships/:id/metrics
- **Purpose**: Get internship-specific metrics
- **Requirements**: 9.1, 9.2
- **Service Used**: `applicationService.getApplicationMetrics()`
- **Returns**:
  - Total applications
  - Status breakdown
  - Company feedback status breakdown
  - Acceptance/rejection rates
  - Average response time
  - Applications by date

## Service Integration

### InternshipService
- `createInternship()`: Creates internship with validation and AI tagging
- `updateInternship()`: Updates internship with status reset logic
- `getInternshipsByStatus()`: Retrieves internships by status with filters

### ApplicationService
- `getApplicationsByInternship()`: Gets applications with comprehensive filtering
- `companyApprove()`: Approves application with slot decrement
- `companyReject()`: Rejects application with notification
- `getApplicationMetrics()`: Calculates application metrics

### InternshipAnalyticsService
- `getCompanyAnalytics()`: Calculates comprehensive company analytics
- `exportAnalytics()`: Exports analytics to CSV or PDF
- `getApplicationMetrics()`: Gets internship-specific metrics

## Authentication & Authorization
All endpoints require:
- Valid JWT authentication
- Company role verification via `companyAuth` middleware
- Verified company status (except for profile endpoints)
- Ownership verification for resource-specific operations

## Error Handling
All endpoints use consistent error handling:
- 400: Bad Request (validation errors, missing fields)
- 403: Forbidden (unauthorized access, unverified company)
- 404: Not Found (resource not found)
- 409: Conflict (business logic errors, e.g., no slots remaining)
- 500: Internal Server Error (unexpected errors)

## Validation
- Required field validation handled by `internshipService`
- Date validation (deadline before start date)
- Numeric validation (slots must be positive)
- Array validation (requiredSkills must be non-empty)
- Ownership verification for all resource operations

## Notifications
Automatic notifications sent for:
- New internship submission → All admins
- Application approval → Student
- Application rejection → Student

## Audit Trail
All state changes recorded with:
- Timestamp
- Actor (company ID)
- Actor role (company)
- Action performed
- From/to status
- Reason for change

## Testing Recommendations
1. **Unit Tests**: Test each controller function with mocked services
2. **Integration Tests**: Test complete request/response cycles
3. **Authorization Tests**: Verify ownership checks work correctly
4. **Validation Tests**: Test all validation rules
5. **Analytics Tests**: Verify calculations with known data sets

## Future Enhancements
- Bulk operations for applications
- Advanced filtering options
- Real-time analytics updates
- Webhook notifications
- Rate limiting for analytics exports
