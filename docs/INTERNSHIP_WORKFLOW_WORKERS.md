# Internship Workflow Background Workers

This document describes the background workers and scheduled jobs for the internship verification workflow system.

## Overview

The internship workflow system uses BullMQ workers to handle asynchronous tasks and scheduled jobs. These workers ensure that time-sensitive operations are performed reliably and efficiently without blocking the main application.

## Workers

### 1. AI Tagging Worker

**File:** `backend/src/workers/aiTaggingWorker.js`

**Purpose:** Processes AI tagging jobs for internships using Google's Gemini API.

**Queue:** `ai-processing`

**Concurrency:** 5 jobs

**Job Types:**
- `tag-internship`: Tag a single internship
- `batch-tag-internships`: Tag multiple internships in batch

**Retry Strategy:**
- Attempts: 3
- Backoff: Exponential (4s, 8s, 16s)

**Usage:**
```javascript
import { queueAITagging, queueBatchAITagging } from '../services/internshipWorkflowScheduler.js';

// Queue single internship
await queueAITagging(internshipId, userId);

// Queue batch
await queueBatchAITagging([id1, id2, id3], userId);
```

### 2. Deadline Reminder Worker

**File:** `backend/src/workers/deadlineReminderWorker.js`

**Purpose:** Sends reminders to companies and students about upcoming application deadlines.

**Queue:** `notifications`

**Concurrency:** 1 job (to avoid duplicates)

**Schedule:** Every 6 hours

**Reminder Thresholds:**
- 7 days before deadline
- 3 days before deadline
- 1 day before deadline

**Features:**
- Tracks sent reminders to avoid duplicates
- Notifies companies about pending applications
- Notifies students who haven't applied yet
- Limits student notifications to 100 per internship

**Usage:**
```javascript
import { triggerDeadlineReminders } from '../services/internshipWorkflowScheduler.js';

// Manually trigger
await triggerDeadlineReminders();
```

### 3. Expired Internship Worker

**File:** `backend/src/workers/expiredInternshipWorker.js`

**Purpose:** Closes internships that have passed their application deadline and notifies affected parties.

**Queue:** `notifications`

**Concurrency:** 1 job

**Schedule:** Daily at 1:00 AM

**Features:**
- Transitions expired internships to "closed" status
- Notifies companies about closure
- Notifies all pending applicants
- Updates audit trail

**Requirements:** 4.5, 12.4

**Usage:**
```javascript
import { triggerExpiredInternshipsClosure } from '../services/internshipWorkflowScheduler.js';

// Manually trigger
await triggerExpiredInternshipsClosure();
```

### 4. Analytics Snapshot Worker

**File:** `backend/src/workers/analyticsSnapshotWorker.js`

**Purpose:** Generates and caches analytics snapshots for performance optimization.

**Queue:** `notifications`

**Concurrency:** 2 jobs

**Schedule:**
- Daily: Every day at 2:00 AM
- Weekly: Every Monday at 3:00 AM
- Monthly: 1st of each month at 4:00 AM

**Entities:**
- Admin (system-wide)
- Companies
- Mentors
- Departments

**Job Types:**
- `generate-analytics-snapshots`: Generate snapshots for all entities
- `generate-entity-snapshot`: Generate snapshot for specific entity

**Requirements:** 9.1, 10.1

**Usage:**
```javascript
import { triggerAnalyticsSnapshot, queueEntitySnapshot } from '../services/internshipWorkflowScheduler.js';

// Trigger all snapshots
await triggerAnalyticsSnapshot('daily');

// Queue specific entity
await queueEntitySnapshot('company', companyId, 'daily');
```

## Scheduler Service

**File:** `backend/src/services/internshipWorkflowScheduler.js`

The scheduler service manages all scheduled jobs and provides helper functions for queueing jobs.

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Deadline Reminders | Every 6 hours | Check and send deadline reminders |
| Expired Internships | Daily at 1 AM | Close expired internships |
| Daily Analytics | Daily at 2 AM | Generate daily snapshots |
| Weekly Analytics | Mondays at 3 AM | Generate weekly snapshots |
| Monthly Analytics | 1st at 4 AM | Generate monthly snapshots |

### Helper Functions

```javascript
// AI Tagging
queueAITagging(internshipId, userId, options)
queueBatchAITagging(internshipIds, userId, options)

// Deadline Reminders
triggerDeadlineReminders()

// Expired Internships
triggerExpiredInternshipsClosure()

// Analytics
triggerAnalyticsSnapshot(period)
queueEntitySnapshot(entityType, entityId, period)

// Cleanup
removeAllScheduledJobs()
```

## Starting Workers

Workers are automatically started when you run the worker process:

```bash
# Start all workers
npm run workers

# Or using node directly
node src/workers/startWorkers.js
```

The `startWorkers.js` file initializes all workers and schedules:
1. Connects to database
2. Starts all worker instances
3. Initializes scheduled jobs
4. Sets up graceful shutdown handlers

## Testing Workers

Use the test script to verify workers are functioning:

```bash
node scripts/test-internship-workers.js
```

This script will:
- Queue AI tagging jobs
- Trigger deadline reminders
- Trigger expired internship closure
- Trigger analytics snapshot generation

**Note:** Workers must be running for jobs to be processed.

## Monitoring

### Bull Board

Access the Bull Board dashboard to monitor queues:

```
http://localhost:5000/admin/queues
```

Features:
- View job counts (waiting, active, completed, failed)
- Inspect job details
- Retry failed jobs
- Clean old jobs

### Logs

Workers log all activities using the logger service:

```javascript
logger.info("Job completed", { jobId, result });
logger.error("Job failed", { jobId, error });
```

Check logs for:
- Job processing status
- Error messages
- Performance metrics

## Error Handling

### Retry Logic

All workers implement exponential backoff retry:
- AI Tagging: 3 attempts (4s, 8s, 16s)
- Deadline Reminders: Default (2s, 4s, 8s)
- Expired Internships: Default (2s, 4s, 8s)
- Analytics: 2 attempts (3s, 6s)

### Failed Jobs

When jobs fail after all retries:
1. Error is logged with full context
2. Job is moved to failed queue
3. Can be manually retried via Bull Board
4. Notifications are tracked in metadata

### Graceful Shutdown

Workers handle shutdown signals (SIGTERM, SIGINT):
1. Stop accepting new jobs
2. Complete active jobs
3. Close queue connections
4. Exit cleanly

## Performance Considerations

### Concurrency

- AI Tagging: 5 concurrent jobs (API rate limiting)
- Deadline Reminders: 1 job (avoid duplicates)
- Expired Internships: 1 job (avoid race conditions)
- Analytics: 2 concurrent jobs (database load)

### Lock Duration

- AI Tagging: 2 minutes (API calls)
- Deadline Reminders: 5 minutes (bulk notifications)
- Expired Internships: 5 minutes (state transitions)
- Analytics: 10 minutes (complex aggregations)

### Queue Cleanup

Jobs are automatically removed:
- Completed: Keep last 100
- Failed: Keep last 500

## Integration with Services

### Internship Service

The internship service automatically queues AI tagging when:
- New internship is created
- Internship is updated with significant changes

```javascript
// In internshipService.js
await queueAITagging(internshipId, userId);
```

### Notification Service

Workers use the notification service to send notifications:
- Deadline reminders
- Internship closure notifications
- Application status updates

### Analytics Service

The analytics snapshot worker uses the analytics service:
- Generate metrics for all entities
- Cache results in AnalyticsSnapshot collection
- Optimize expensive aggregations

## Troubleshooting

### Jobs Not Processing

1. Check if workers are running:
   ```bash
   ps aux | grep startWorkers
   ```

2. Check Redis connection:
   ```bash
   redis-cli ping
   ```

3. Check Bull Board for stuck jobs

### High Memory Usage

1. Reduce concurrency settings
2. Increase job cleanup frequency
3. Check for memory leaks in job handlers

### Slow Job Processing

1. Check database query performance
2. Monitor API rate limits (Gemini)
3. Review lock duration settings
4. Check Redis performance

### Duplicate Notifications

1. Verify reminder tracking in metadata
2. Check concurrency settings
3. Review job deduplication logic

## Best Practices

1. **Always use the scheduler service** to queue jobs
2. **Monitor Bull Board** regularly for failed jobs
3. **Set appropriate timeouts** for long-running operations
4. **Track job metadata** for debugging
5. **Test workers** before deploying changes
6. **Use exponential backoff** for retries
7. **Log all errors** with context
8. **Handle graceful shutdown** properly

## Future Enhancements

Potential improvements:
- Add job priority levels
- Implement job result caching
- Add more granular monitoring
- Create admin UI for job management
- Add job scheduling via API
- Implement job chaining for workflows
