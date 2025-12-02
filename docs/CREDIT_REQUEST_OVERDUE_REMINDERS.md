# Credit Request Overdue Detection and Reminder System

## Overview

This document describes the overdue detection and reminder system for credit transfer requests. The system automatically identifies overdue requests and sends reminder notifications to reviewers.

## Features Implemented

### 1. Overdue Detection Logic

**Location**: `backend/src/models/CreditRequest.js`

The `isOverdue()` method on the CreditRequest model calculates if a request is overdue based on expected timelines:

- **Pending Mentor Review**: 7 days
- **Pending Admin Review**: 5 days  
- **Pending Student Action**: 14 days

```javascript
creditRequest.isOverdue() // Returns true/false
```

### 2. Overdue Flag in Queries

**Location**: `backend/src/services/creditService.js`

All credit request query methods now include an `isOverdue` flag in the response:

- `getCreditRequestsByStudent()`
- `getCreditRequestsByMentor()`
- `getCreditRequestsByAdmin()`

Each request in the response includes:
```javascript
{
  ...requestData,
  isOverdue: true/false
}
```

### 3. Credit Reminder Service

**Location**: `backend/src/services/creditReminderService.js`

New service providing:

#### Methods

- **`getOverdueRequests()`**: Get all overdue credit requests
- **`sendReminder(creditRequestId)`**: Send reminder for a specific request
- **`sendOverdueReminders(options)`**: Send reminders for all overdue requests
  - `maxReminders`: Maximum reminders per request (default: 3)
  - `dryRun`: Preview without sending (default: false)
- **`scheduleReminderJob(options)`**: Schedule automatic reminder job
  - `maxReminders`: Maximum reminders per request
  - `repeat`: Cron pattern (default: "0 9 * * *" - daily at 9 AM)
- **`getReminderStats()`**: Get reminder statistics

#### Example Usage

```javascript
// Get overdue requests
const overdueRequests = await creditReminderService.getOverdueRequests();

// Send reminders (dry run)
const result = await creditReminderService.sendOverdueReminders({
  maxReminders: 3,
  dryRun: true
});

// Send reminders (actual)
const result = await creditReminderService.sendOverdueReminders({
  maxReminders: 3,
  dryRun: false
});

// Get statistics
const stats = await creditReminderService.getReminderStats();
```

### 4. Background Job Worker

**Location**: `backend/src/workers/notificationWorker.js`

Added `send-credit-reminders` job handler to the notification worker for automatic reminder processing.

The job:
- Runs on a schedule (configurable via cron pattern)
- Identifies all overdue requests
- Sends reminders to appropriate reviewers
- Tracks reminder count in request metadata
- Respects maximum reminder limit

### 5. Admin API Endpoints

**Location**: `backend/src/controllers/adminController.js` and `backend/src/routes/admin.js`

New endpoints for reminder management:

#### GET /api/admin/credit-requests/overdue
Get all overdue credit requests with details.

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 5,
    "requests": [
      {
        "creditRequestId": "CR-123",
        "studentId": "STU-456",
        "studentName": "John Doe",
        "internshipTitle": "Software Engineering Intern",
        "status": "pending_mentor_review",
        "lastUpdatedAt": "2024-11-20T10:00:00Z",
        "daysSinceLastUpdate": 12,
        "remindersSent": 1,
        "isOverdue": true
      }
    ]
  }
}
```

#### GET /api/admin/credit-requests/reminders/stats
Get reminder statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOverdue": 5,
    "byStatus": {
      "pending_mentor_review": 3,
      "pending_admin_review": 2
    },
    "byReminderCount": {
      "0": 2,
      "1": 2,
      "2": 1
    },
    "averageDaysOverdue": 10
  }
}
```

#### POST /api/admin/credit-requests/reminders/send
Manually trigger sending reminders.

**Request Body**:
```json
{
  "maxReminders": 3,
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOverdue": 5,
    "eligible": 4,
    "sent": 4,
    "failed": 0,
    "results": [...]
  }
}
```

#### POST /api/admin/credit-requests/reminders/schedule
Schedule automatic reminder job.

**Request Body**:
```json
{
  "maxReminders": 3,
  "cronPattern": "0 9 * * *"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "credit-reminder-job",
    "schedule": {
      "pattern": "0 9 * * *"
    }
  }
}
```

### 6. Student Reminder Endpoint

**Location**: `backend/src/controllers/creditRequestController.js`

Existing endpoint enhanced:

#### POST /api/students/:studentId/credit-requests/:requestId/reminder
Send a reminder notification to the current reviewer.

**Features**:
- Determines recipient based on request status
- Enforces maximum reminder limit (3 per request)
- Tracks reminder count in metadata
- Returns 429 if limit exceeded

## Expected Timelines

The system uses the following expected timelines for overdue detection:

| Status | Expected Timeline | Overdue After |
|--------|------------------|---------------|
| Pending Mentor Review | 7 days | 7 days |
| Pending Admin Review | 5 days | 5 days |
| Pending Student Action | 14 days | 14 days |

## Reminder Limits

- Maximum reminders per request: **3** (configurable)
- Requests exceeding the limit will not receive additional reminders
- Reminder count is tracked in `creditRequest.metadata.remindersSent`

## Notification Recipients

Reminders are sent to:

- **Mentor**: For requests in `pending_mentor_review` status
- **Admin**: For requests in `pending_admin_review` status
- **Student**: For requests in `pending_student_action` status

## Scheduling

The automatic reminder job can be scheduled using cron patterns:

- **Daily at 9 AM**: `0 9 * * *` (default)
- **Every 12 hours**: `0 */12 * * *`
- **Weekdays at 9 AM**: `0 9 * * 1-5`

## Testing

The overdue detection logic is tested in:
- `backend/tests/unit/services/creditService.test.js` - Tests that overdue flag is added to queries
- Model method `isOverdue()` is tested implicitly through service tests

## Future Enhancements

Potential improvements:
1. Escalation to department heads after multiple reminders
2. Different reminder frequencies based on urgency
3. Reminder templates with personalized content
4. Dashboard widget showing overdue requests
5. Email digest of overdue requests for admins
