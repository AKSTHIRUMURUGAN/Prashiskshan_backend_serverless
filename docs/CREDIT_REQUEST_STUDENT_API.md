# Student Credit Request API Endpoints

This document describes the student-facing API endpoints for the Credit Transfer System.

## Endpoints Implemented

### 1. Create Credit Request
**POST** `/api/students/:studentId/credit-requests`

Creates a new credit request for a completed internship.

**Authentication:** Required (Student role)

**Request Body:**
```json
{
  "internshipCompletionId": "ObjectId"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Credit request created successfully",
  "data": {
    "creditRequest": {
      "creditRequestId": "CR-123",
      "status": "pending_mentor_review",
      "studentId": "ObjectId",
      "internshipCompletionId": "ObjectId",
      "requestedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Validation:**
- `internshipCompletionId` is required and must be a valid MongoDB ObjectId
- Student can only create requests for their own completed internships
- Prevents duplicate requests for the same internship

---

### 2. Get All Credit Requests
**GET** `/api/students/:studentId/credit-requests`

Retrieves all credit requests for a student with pagination and filtering.

**Authentication:** Required (Student role)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "success": true,
  "message": "Credit requests retrieved successfully",
  "data": {
    "items": [
      {
        "creditRequestId": "CR-123",
        "status": "pending_mentor_review",
        "internshipId": {
          "title": "Software Engineering Intern",
          "company": "Tech Corp"
        },
        "requestedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### 3. Get Credit Request Details
**GET** `/api/students/:studentId/credit-requests/:requestId`

Retrieves detailed information about a specific credit request.

**Authentication:** Required (Student role)

**Response (200):**
```json
{
  "success": true,
  "message": "Credit request details retrieved successfully",
  "data": {
    "creditRequest": {
      "creditRequestId": "CR-123",
      "status": "pending_mentor_review",
      "studentId": "ObjectId",
      "internshipId": "ObjectId",
      "mentorId": "ObjectId",
      "calculatedCredits": 2,
      "internshipDurationWeeks": 8,
      "requestedAt": "2024-01-01T00:00:00Z",
      "submissionHistory": [],
      "mentorReview": null,
      "adminReview": null
    }
  }
}
```

---

### 4. Resubmit Credit Request
**PUT** `/api/students/:studentId/credit-requests/:requestId/resubmit`

Resubmits a rejected credit request after addressing feedback.

**Authentication:** Required (Student role)

**Request Body:**
```json
{
  "notes": "Updated logbook entries and addressed all feedback points"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Credit request resubmitted successfully",
  "data": {
    "creditRequest": {
      "creditRequestId": "CR-123",
      "status": "pending_mentor_review",
      "submissionHistory": [
        {
          "submittedAt": "2024-01-01T00:00:00Z",
          "status": "mentor_rejected",
          "feedback": "Logbook entries incomplete"
        }
      ]
    }
  }
}
```

**Validation:**
- `notes` is optional, max 1000 characters
- Only rejected requests can be resubmitted
- Preserves submission history

---

### 5. Get Credit Request Status
**GET** `/api/students/:studentId/credit-requests/:requestId/status`

Gets real-time status with progress indicator and timeline.

**Authentication:** Required (Student role)

**Response (200):**
```json
{
  "success": true,
  "message": "Credit request status retrieved successfully",
  "data": {
    "creditRequestId": "CR-123",
    "status": "pending_mentor_review",
    "stages": [
      {
        "name": "Submitted",
        "completed": true,
        "timestamp": "2024-01-01T00:00:00Z"
      },
      {
        "name": "Mentor Review",
        "completed": false,
        "timestamp": null
      },
      {
        "name": "Admin Review",
        "completed": false,
        "timestamp": null
      },
      {
        "name": "Credits Added",
        "completed": false,
        "timestamp": null
      }
    ],
    "currentTimeline": {
      "stage": "Mentor Review",
      "expectedDays": 7
    },
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}
```

---

### 6. Send Review Reminder
**POST** `/api/students/:studentId/credit-requests/:requestId/reminder`

Sends a reminder notification to the current reviewer.

**Authentication:** Required (Student role)

**Response (200):**
```json
{
  "success": true,
  "message": "Reminder sent successfully",
  "data": {
    "remindersSent": 1
  }
}
```

**Constraints:**
- Maximum 3 reminders per request
- Only available when request is pending review
- Returns 429 if limit exceeded

---

### 7. Get Credit History
**GET** `/api/students/:studentId/credits/history`

Retrieves the student's credit transfer history.

**Authentication:** Required (Student role)

**Response (200):**
```json
{
  "success": true,
  "message": "Credit history retrieved successfully",
  "data": {
    "totalCredits": 4,
    "history": [
      {
        "creditRequestId": "CR-123",
        "internship": {
          "title": "Software Engineering Intern",
          "company": "Tech Corp",
          "duration": "8 weeks"
        },
        "creditsAdded": 2,
        "addedAt": "2024-01-15T00:00:00Z",
        "certificateUrl": "https://example.com/cert.pdf",
        "certificateId": "CERT-123"
      }
    ]
  }
}
```

---

### 8. Download Certificate
**GET** `/api/students/:studentId/credits/certificate/:requestId`

Downloads the credit transfer certificate for a completed request.

**Authentication:** Required (Student role)

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate retrieved successfully",
  "data": {
    "certificateUrl": "https://example.com/certificates/cert-123.pdf",
    "certificateId": "CERT-123",
    "generatedAt": "2024-01-15T00:00:00Z"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Certificate not yet generated"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "internshipCompletionId is required",
  "details": [
    {
      "field": "internshipCompletionId",
      "message": "internshipCompletionId is required"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Cannot create credit request for another student"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Credit request not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Duplicate credit request for this internship"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Maximum of 3 reminders allowed"
}
```

---

## Authorization

All endpoints require:
1. Valid Firebase authentication token in `Authorization` header
2. User must have `student` role
3. Student can only access their own credit requests (verified by `studentId` parameter)

## Validation Middleware

The following validation middleware is applied:

- `creditRequestCreation`: Validates `internshipCompletionId` is present and valid
- `creditRequestResubmission`: Validates `notes` field (optional, max 1000 chars)
- `handleValidationErrors`: Formats validation errors consistently

## Related Requirements

These endpoints satisfy the following requirements from the design document:

- **Requirement 2.1**: Display credit request button for completed internships
- **Requirement 2.2**: Create credit request with status "Pending Mentor Review"
- **Requirement 4.3**: Allow resubmission of rejected requests
- **Requirement 10.1**: Display current status and approval stage
- **Requirement 10.5**: Send reminder notifications to reviewers
