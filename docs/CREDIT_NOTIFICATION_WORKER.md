# Credit Notification Worker

## Overview

The Credit Notification Worker is a dedicated BullMQ worker that processes credit request notification jobs with retry logic, exponential backoff, and comprehensive delivery tracking. It handles all notification events in the credit transfer system lifecycle.

## Features

### 1. Retry Logic with Exponential Backoff

The worker implements automatic retry with exponential backoff for failed notifications:

- **Max Attempts**: 3 retries
- **Backoff Strategy**: Exponential (2^attemptsMade * 1000ms)
  - Attempt 1: 2 seconds
  - Attempt 2: 4 seconds
  - Attempt 3: 8 seconds

### 2. Notification Delivery Tracking

All notification attempts are tracked in the credit request metadata:

```javascript
{
  metadata: {
    notificationsSent: [
      {
        type: "student_request_created",
        sentAt: Date,
        success: true,
        error: undefined
      }
    ],
    remindersSent: 0
  }
}
```

### 3. Notification Failure Logging

Failed notifications are logged with detailed information:

- Job ID
- Attempt number
- Error message and stack trace
- Credit request ID
- Job data

### 4. Worker Configuration

```javascript
{
  concurrency: 10,           // Process 10 jobs simultaneously
  lockDuration: 60_000,      // 1 minute lock duration
  backoffStrategy: exponential
}
```

## Notification Types

### 1. Student Request Created
**Job Name**: `credit-student-request-created`

Notifies student that their credit request has been created.

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001"
}
```

### 2. Mentor New Request
**Job Name**: `credit-mentor-new-request`

Notifies mentor of a new credit request to review (or resubmission).

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001"
}
```

### 3. Student Mentor Decision
**Job Name**: `credit-student-mentor-decision`

Notifies student of mentor's approval or rejection decision.

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001",
  decision: "approved" | "rejected"
}
```

### 4. Admin Mentor Approval
**Job Name**: `credit-admin-mentor-approval`

Notifies all admins that a credit request has been approved by mentor and needs final approval.

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001"
}
```

### 5. Student Admin Decision
**Job Name**: `credit-student-admin-decision`

Notifies student of admin's approval or rejection decision.

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001",
  decision: "approved" | "rejected"
}
```

### 6. Student Credits Added
**Job Name**: `credit-student-credits-added`

Notifies student that credits have been added to their profile.

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001",
  certificate: {
    certificateId: "CERT-2024-001",
    certificateUrl: "https://..."
  }
}
```

### 7. Review Reminder
**Job Name**: `credit-review-reminder`

Sends reminder to mentor or admin for pending review.

**Data**:
```javascript
{
  creditRequestId: "CR-2024-001",
  recipientRole: "mentor" | "admin"
}
```

## Queue Configuration

The credit notification queue is registered in `src/queues/index.js`:

```javascript
creditNotification: { 
  name: "credit-notifications",
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
}
```

## Usage

### Starting the Worker

**Development**:
```bash
npm run workers:dev
```

**Production**:
```bash
npm run workers
```

### Adding Jobs to Queue

Use the `creditNotificationService` to queue notifications:

```javascript
import { creditNotificationService } from "../services/creditNotificationService.js";

// Notify student of request creation
await creditNotificationService.notifyStudentRequestCreated(creditRequest);

// Notify mentor of new request
await creditNotificationService.notifyMentorNewRequest(creditRequest);

// Send review reminder
await creditNotificationService.sendReviewReminder(creditRequest, "mentor");
```

## Monitoring

### Queue Events

The worker emits the following events:

- **completed**: Job completed successfully
- **failed**: Job failed (logged with details)
- **retries-exhausted**: All retry attempts failed
- **stalled**: Job may have timed out or worker crashed

### Logging

All events are logged with structured data:

```javascript
logger.info("Credit notification job processed successfully", {
  job: "credit-student-request-created",
  id: "job-123",
  attemptsMade: 1
});

logger.error("Credit notification job failed", {
  job: "credit-mentor-new-request",
  id: "job-124",
  attemptsMade: 2,
  error: "Email service unavailable",
  data: { creditRequestId: "CR-2024-001" }
});
```

## Error Handling

### Automatic Retry

Failed jobs are automatically retried with exponential backoff. After 3 failed attempts, the job is marked as failed and logged.

### Manual Intervention

For jobs that exhaust all retries:

1. Check the logs for error details
2. Verify the credit request exists
3. Check external service availability (email, notification service)
4. Manually trigger notification if needed

### Graceful Shutdown

The worker handles shutdown signals gracefully:

```javascript
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Testing

Run the worker tests:

```bash
npm test -- tests/unit/workers/creditNotificationWorker.test.js
```

Test coverage includes:
- Notification delivery tracking
- Retry logic and exponential backoff
- All notification job types
- Error handling
- Worker configuration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Credit Notification Service                 │
│                  (Queues notification jobs)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Credit Notification Queue (Redis)               │
│                  (Stores pending jobs)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Credit Notification Worker                      │
│         (Processes jobs with retry & tracking)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Notification Queue (Redis)                      │
│         (Sends actual email/push notifications)              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Concurrency

The worker processes 10 jobs concurrently. Adjust based on:
- Available system resources
- Database connection pool size
- External service rate limits

### Lock Duration

Jobs have a 1-minute lock duration. Increase if:
- Database queries are slow
- External services have high latency
- Jobs frequently stall

### Queue Cleanup

Completed jobs are kept for 100 entries, failed jobs for 500 entries. This provides:
- Recent job history for debugging
- Automatic cleanup to prevent memory issues

## Requirements Validation

This implementation satisfies the following requirements:

- **1.2**: Notify student when internship is marked complete
- **2.3**: Notify mentor when credit request is created
- **3.3**: Notify admin when mentor approves
- **3.5**: Notify student of mentor rejection
- **4.1**: Notify student of rejection feedback
- **5.5**: Notify student of admin decision
- **6.1**: Notify student of administrative hold
- **7.5**: Notify student when credits are added

## Related Documentation

- [Credit Transfer System Design](../.kiro/specs/credit-transfer-system/design.md)
- [Credit Notification Service](../src/services/creditNotificationService.js)
- [Queue Configuration](../src/queues/index.js)
