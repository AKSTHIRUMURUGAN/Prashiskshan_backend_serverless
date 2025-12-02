# Credit Request Filtering and Search API

This document describes the filtering, search, and sorting capabilities for credit request endpoints.

## Student Endpoints

### GET /api/students/:studentId/credit-requests

Retrieve credit requests for a student with filtering and sorting.

**Query Parameters:**
- `status` (string, optional): Filter by request status
  - Values: `pending_mentor_review`, `mentor_approved`, `mentor_rejected`, `pending_admin_review`, `admin_approved`, `admin_rejected`, `credits_added`, `completed`
- `dateFrom` (ISO date string, optional): Filter requests created on or after this date
- `dateTo` (ISO date string, optional): Filter requests created on or before this date
- `sortBy` (string, optional): Field to sort by (default: `requestedAt`)
  - Values: `requestedAt`, `calculatedCredits`, `status`, `lastUpdatedAt`
- `sortOrder` (string, optional): Sort direction (default: `desc`)
  - Values: `asc`, `desc`
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example:**
```
GET /api/students/STD-123/credit-requests?status=completed&sortBy=calculatedCredits&sortOrder=desc&page=1&limit=10
```

## Mentor Endpoints

### GET /api/mentors/:mentorId/credit-requests/pending

Retrieve pending credit requests for mentor review with filtering and search.

**Query Parameters:**
- `status` (string, optional): Filter by request status (default: `pending_mentor_review`)
- `dateFrom` (ISO date string, optional): Filter requests created on or after this date
- `dateTo` (ISO date string, optional): Filter requests created on or before this date
- `studentName` (string, optional): Search by student name, email, or student ID
- `sortBy` (string, optional): Field to sort by (default: `requestedAt`)
  - Values: `requestedAt`, `calculatedCredits`, `internshipDurationWeeks`
- `sortOrder` (string, optional): Sort direction (default: `asc` - oldest first)
  - Values: `asc`, `desc`
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example:**
```
GET /api/mentors/MNT-456/credit-requests/pending?studentName=John&sortBy=requestedAt&sortOrder=asc&page=1&limit=20
```

### GET /api/mentors/:mentorId/credit-requests/history

Retrieve mentor's review history with filtering and search.

**Query Parameters:**
- `status` (string, optional): Filter by request status
- `dateFrom` (ISO date string, optional): Filter by review date (from)
- `dateTo` (ISO date string, optional): Filter by review date (to)
- `dateRange` (string, optional): Alternative date range format: `startDate,endDate`
- `studentName` (string, optional): Search by student name, email, or student ID
- `sortBy` (string, optional): Field to sort by (default: `mentorReview.reviewedAt`)
- `sortOrder` (string, optional): Sort direction (default: `desc`)
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example:**
```
GET /api/mentors/MNT-456/credit-requests/history?status=mentor_approved&dateFrom=2024-01-01&studentName=Jane&page=1
```

## Admin Endpoints

### GET /api/admin/credit-requests/pending

Retrieve pending credit requests for admin approval with comprehensive filtering and search.

**Query Parameters:**
- `status` (string, optional): Filter by request status (default: `pending_admin_review`)
- `dateFrom` (ISO date string, optional): Filter requests created on or after this date
- `dateTo` (ISO date string, optional): Filter requests created on or before this date
- `studentName` (string, optional): Search by student name, email, or student ID
- `companyName` (string, optional): Search by company name
- `mentorId` (string, optional): Filter by mentor MongoDB ObjectId
- `department` (string, optional): Filter by student department
- `sortBy` (string, optional): Field to sort by (default: `requestedAt`)
  - Values: `requestedAt`, `calculatedCredits`, `status`, `lastUpdatedAt`
- `sortOrder` (string, optional): Sort direction (default: `asc` - oldest first)
  - Values: `asc`, `desc`
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Example:**
```
GET /api/admin/credit-requests/pending?department=Computer%20Science&companyName=Tech&sortBy=requestedAt&sortOrder=asc&page=1&limit=20
```

## Response Format

All endpoints return a consistent response format:

```json
{
  "success": true,
  "message": "Credit requests retrieved successfully",
  "data": {
    "creditRequests": [
      {
        "_id": "...",
        "creditRequestId": "CR-...",
        "studentId": { ... },
        "internshipId": { ... },
        "status": "pending_mentor_review",
        "calculatedCredits": 2,
        "requestedAt": "2024-01-15T10:00:00.000Z",
        ...
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

## Implementation Notes

### Search Functionality
- **Student Name Search**: Searches across student's full name, email, and student ID (case-insensitive)
- **Company Name Search**: Searches company name field (case-insensitive)
- Search is implemented as post-query filtering for flexibility

### Sorting
- Default sort order varies by endpoint:
  - Student endpoints: `desc` (newest first)
  - Mentor/Admin endpoints: `asc` (oldest first, for queue processing)
- All sortable fields support both ascending and descending order

### Date Filtering
- Dates should be provided in ISO 8601 format
- Both `dateFrom` and `dateTo` are inclusive
- Can be used independently or together for range filtering

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Page numbers start at 1
- Response includes total count and calculated page count

## Requirements Validation

This implementation satisfies the following requirements:

**Requirement 8.3**: Filter support for credit request queries (status, date range, student, mentor)
**Requirement 8.4**: Search support for student name and company name
**Requirement 9.4**: Filtering support for analytics and reporting

All list endpoints support:
- ✅ Status filtering
- ✅ Date range filtering
- ✅ Student/mentor filtering
- ✅ Search by student name
- ✅ Search by company name
- ✅ Sorting by multiple fields
- ✅ Pagination with configurable page size
