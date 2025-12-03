# Student Internship Endpoints Documentation

This document describes the student-facing endpoints for the Internship Verification Workflow system.

## Overview

The student endpoints allow students to:
- Browse available internships with AI-powered match scores
- View detailed internship information with match analysis
- Apply to internships
- Track application status
- Access dashboard with mentor information
- View profile with credits and internship history

## Endpoints

### 1. Browse Available Internships

**GET** `/api/students/internships`

Browse internships that are open for applications in the student's department.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `location` (string): Filter by location
- `workMode` (string): Filter by work mode (remote, onsite, hybrid)
- `skills` (string): Comma-separated list of skills to filter by
- `minStipend` (number): Minimum stipend amount
- `maxStipend` (number): Maximum stipend amount
- `search` (string): Search query for title/description
- `sortBy` (string): Field to sort by (default: createdAt)
- `sortOrder` (string): Sort order (asc/desc, default: desc)
- `includeMatchScore` (boolean): Include AI match scores (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "internshipId": "INT-123",
        "title": "Software Development Intern",
        "description": "...",
        "department": "Computer Science",
        "requiredSkills": ["JavaScript", "Node.js"],
        "duration": "3 months",
        "stipend": 15000,
        "location": "Mumbai",
        "workMode": "hybrid",
        "startDate": "2024-06-01",
        "applicationDeadline": "2024-05-15",
        "slots": 5,
        "slotsRemaining": 3,
        "companyId": {
          "companyName": "Tech Corp",
          "industry": "Technology",
          "logo": "..."
        },
        "aiTags": {
          "primarySkills": ["JavaScript", "Node.js", "React"],
          "difficulty": "intermediate",
          "careerPath": "Software Engineering",
          "industryFit": ["Technology", "E-commerce"]
        },
        "alreadyApplied": false,
        "eligible": true,
        "matchScore": {
          "matchScore": 85,
          "reasoning": "Strong match based on skills and department",
          "strengths": ["JavaScript proficiency", "Node.js experience"],
          "concerns": ["Limited React experience"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "Available internships"
}
```

**Requirements Validated:** 4.1

---

### 2. Get Internship Details

**GET** `/api/students/internships/:internshipId`

Get detailed information about a specific internship with AI match analysis.

**Path Parameters:**
- `internshipId` (string): The internship ID

**Response:**
```json
{
  "success": true,
  "data": {
    "internship": {
      "internshipId": "INT-123",
      "title": "Software Development Intern",
      "description": "...",
      "department": "Computer Science",
      "requiredSkills": ["JavaScript", "Node.js"],
      "optionalSkills": ["React", "MongoDB"],
      "duration": "3 months",
      "stipend": 15000,
      "location": "Mumbai",
      "workMode": "hybrid",
      "startDate": "2024-06-01",
      "applicationDeadline": "2024-05-15",
      "slots": 5,
      "slotsRemaining": 3,
      "responsibilities": ["Develop features", "Write tests"],
      "learningOpportunities": ["Agile methodology", "Cloud deployment"],
      "eligibilityRequirements": {
        "minReadinessScore": 60,
        "requiredModules": ["CS101", "CS201"]
      },
      "companyId": {
        "companyName": "Tech Corp",
        "industry": "Technology",
        "logo": "...",
        "description": "...",
        "website": "https://techcorp.com"
      },
      "aiTags": {
        "primarySkills": ["JavaScript", "Node.js", "React"],
        "difficulty": "intermediate",
        "careerPath": "Software Engineering",
        "industryFit": ["Technology", "E-commerce"],
        "learningIntensity": "moderate",
        "technicalDepth": "moderate"
      }
    },
    "alreadyApplied": false,
    "application": null,
    "eligible": true,
    "matchAnalysis": {
      "matchScore": 85,
      "reasoning": "Strong match based on skills and department alignment",
      "strengths": [
        "JavaScript proficiency matches required skills",
        "Node.js experience aligns with internship needs",
        "Department match ensures academic relevance"
      ],
      "concerns": [
        "Limited React experience may require learning",
        "Readiness score slightly below optimal"
      ]
    }
  },
  "message": "Internship details"
}
```

**Requirements Validated:** 4.1, 4.4

---

### 3. Apply to Internship

**POST** `/api/students/internships/:internshipId/apply`

Submit an application to an internship.

**Path Parameters:**
- `internshipId` (string): The internship ID

**Request Body:**
```json
{
  "coverLetter": "I am very interested in this position...",
  "resumeUrl": "https://storage.example.com/resume.pdf" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "applicationId": "APP-456",
      "studentId": "...",
      "internshipId": "...",
      "companyId": "...",
      "department": "Computer Science",
      "status": "pending",
      "appliedAt": "2024-05-01T10:00:00Z",
      "coverLetter": "...",
      "resumeUrl": "...",
      "timeline": [
        {
          "event": "Application submitted",
          "timestamp": "2024-05-01T10:00:00Z",
          "performedBy": "STU-123",
          "notes": "Student applied to internship"
        }
      ]
    }
  },
  "message": "Application submitted successfully"
}
```

**Requirements Validated:** 4.2, 4.3

---

### 4. List My Applications

**GET** `/api/students/applications`

Get all applications submitted by the student.

**Query Parameters:**
- `status` (string): Filter by status (pending, accepted, rejected, withdrawn)
- `companyFeedbackStatus` (string): Filter by company feedback status
- `appliedFrom` (date): Filter applications from this date
- `appliedTo` (date): Filter applications to this date
- `page` (integer): Page number
- `limit` (integer): Items per page
- `sortBy` (string): Field to sort by
- `sortOrder` (string): Sort order (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "APP-456",
        "status": "accepted",
        "appliedAt": "2024-05-01T10:00:00Z",
        "internshipId": {
          "internshipId": "INT-123",
          "title": "Software Development Intern",
          "department": "Computer Science",
          "startDate": "2024-06-01",
          "applicationDeadline": "2024-05-15"
        },
        "companyId": {
          "companyName": "Tech Corp",
          "industry": "Technology",
          "logo": "..."
        },
        "companyFeedback": {
          "status": "accepted",
          "reviewedAt": "2024-05-02T14:00:00Z",
          "feedback": "Your application has been accepted!",
          "nextSteps": "You will be contacted shortly..."
        },
        "creditRequest": {
          "isCompleted": false,
          "creditRequestAvailable": false,
          "creditRequestStatus": null,
          "creditRequestId": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  },
  "message": "Student applications"
}
```

**Requirements Validated:** 7.2

---

### 5. Get Application Details

**GET** `/api/students/applications/:applicationId`

Get detailed information about a specific application.

**Path Parameters:**
- `applicationId` (string): The application ID

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "applicationId": "APP-456",
      "status": "accepted",
      "appliedAt": "2024-05-01T10:00:00Z",
      "coverLetter": "...",
      "resumeUrl": "...",
      "internshipId": {
        "internshipId": "INT-123",
        "title": "Software Development Intern",
        "department": "Computer Science"
      },
      "companyId": {
        "companyName": "Tech Corp",
        "industry": "Technology",
        "logo": "..."
      },
      "companyFeedback": {
        "status": "accepted",
        "reviewedAt": "2024-05-02T14:00:00Z",
        "feedback": "Your application has been accepted!",
        "nextSteps": "You will be contacted shortly..."
      },
      "timeline": [
        {
          "event": "Application submitted",
          "timestamp": "2024-05-01T10:00:00Z",
          "performedBy": "STU-123",
          "notes": "Student applied to internship"
        },
        {
          "event": "Application accepted by company",
          "timestamp": "2024-05-02T14:00:00Z",
          "performedBy": "COMP-789",
          "notes": "Application accepted"
        }
      ],
      "creditRequest": {
        "isCompleted": false,
        "creditRequestAvailable": false,
        "creditRequestStatus": null,
        "creditRequestId": null
      }
    }
  },
  "message": "Application details"
}
```

---

### 6. Get Student Dashboard

**GET** `/api/students/dashboard`

Get dashboard data including mentor info, application stats, and active internships.

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "studentId": "STU-123",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "department": "Computer Science",
      "readinessScore": 75
    },
    "mentorInfo": {
      "mentorId": "MEN-456",
      "name": "Dr. Jane Smith",
      "department": "Computer Science",
      "email": "jane.smith@university.edu"
    },
    "stats": {
      "total": 8,
      "pending": 2,
      "accepted": 3,
      "rejected": 2,
      "withdrawn": 1,
      "pendingLogbooks": 1
    },
    "credits": {
      "total": 20,
      "approved": 12,
      "pending": 8
    },
    "activeInternships": [
      {
        "applicationId": "APP-456",
        "status": "accepted",
        "internshipId": {
          "internshipId": "INT-123",
          "title": "Software Development Intern",
          "department": "Computer Science",
          "startDate": "2024-06-01"
        },
        "companyId": {
          "companyName": "Tech Corp"
        }
      }
    ],
    "logbooks": [...],
    "notifications": [...],
    "recommendations": [...],
    "deadlines": [...]
  },
  "message": "Student dashboard"
}
```

**Requirements Validated:** 7.1

---

### 7. Get Student Profile

**GET** `/api/students/profile`

Get student profile with credits and internship history.

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "studentId": "STU-123",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+91-9876543210"
      },
      "department": "Computer Science",
      "year": 3
    },
    "credits": {
      "total": 20,
      "approved": 12,
      "pending": 8,
      "earned": 12
    },
    "readinessScore": 75,
    "skills": ["JavaScript", "Node.js", "React", "MongoDB"],
    "completedModules": ["CS101", "CS201", "CS301"],
    "internshipHistory": [
      {
        "internshipId": "INT-100",
        "title": "Backend Developer Intern",
        "company": "Tech Corp",
        "department": "Computer Science",
        "completionDate": "2024-03-31",
        "hoursWorked": 360,
        "evaluationScore": 85,
        "creditsEarned": 12
      }
    ],
    "stats": {
      "totalApplications": 8,
      "completedInternships": 1,
      "creditRequests": 1,
      "interviewAttempts": 5
    }
  },
  "message": "Student profile"
}
```

**Requirements Validated:** 7.5

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "coverLetter is required",
  "timestamp": "2024-05-01T10:00:00Z"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "AuthorizationError",
  "message": "This internship is not available for your department",
  "timestamp": "2024-05-01T10:00:00Z"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Internship not found",
  "timestamp": "2024-05-01T10:00:00Z"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "ConflictError",
  "message": "You have already applied to this internship",
  "timestamp": "2024-05-01T10:00:00Z"
}
```

## Implementation Notes

### Services Used

1. **InternshipService**: Handles internship filtering and retrieval
   - `getInternshipsForStudent()`: Filters internships by department and status
   - Ensures only "open_for_applications" internships are shown
   - Checks application deadlines

2. **ApplicationService**: Manages application lifecycle
   - `createApplication()`: Creates application with validation
   - `getApplicationsByStudent()`: Retrieves student's applications
   - Handles slot decrement and notifications

3. **AITaggingService**: Provides AI-powered features
   - `calculateMatchScore()`: Generates match scores between student and internship
   - Uses Gemini API for intelligent analysis
   - Provides fallback logic if AI service fails

### Validation

- Cover letters must be between 50-5000 characters
- Students can only apply to internships in their department
- Application deadline must not have passed
- Eligibility requirements (readiness score, modules) are checked
- Duplicate applications are prevented

### Notifications

- Company is notified when student applies (async)
- Student is notified when application is accepted/rejected (async)
- Notification failures don't block the main operation

### Caching

- Dashboard data is cached for 5 minutes (300 seconds)
- Cache key includes student ID for isolation

## Testing

Integration tests should cover:
- Browsing internships with various filters
- Viewing internship details
- Applying to internships
- Listing applications
- Viewing application details
- Dashboard retrieval
- Profile retrieval

## Related Documentation

- [Internship Service Implementation](./INTERNSHIP_SERVICE_IMPLEMENTATION.md)
- [Application Service Implementation](./APPLICATION_SERVICE_IMPLEMENTATION.md)
- [AI Tagging Service](./AI_TAGGING_SERVICE.md)
- [Approval Workflow Service](./APPROVAL_WORKFLOW_SERVICE.md)
