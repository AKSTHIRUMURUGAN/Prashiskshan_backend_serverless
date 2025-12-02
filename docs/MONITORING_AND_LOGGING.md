# Credit Transfer System - Monitoring and Logging

## Overview

The Credit Transfer System includes comprehensive monitoring and logging capabilities to track system performance, identify bottlenecks, and ensure reliable operation.

## Features

### 1. Metrics Tracking

The system tracks the following metrics:

#### Credit Request Creation
- Total credit requests created
- Requests created per hour
- Requests created per day
- Creation rate trends

#### Approval Times
- Average mentor review time
- Average admin review time
- Individual approval durations
- Alerts for significantly delayed approvals

#### Rejection Rates
- Mentor rejection rate
- Admin rejection rate
- Rejection reasons tracking
- Alerts for high rejection rates (>50%)

#### Notification Delivery
- Total notifications sent
- Failed notifications count
- Pending notifications count
- Notification failure rate
- Alerts for high failure rates (>10%)

#### Database Query Performance
- Total query count
- Average query duration
- Slow query detection (>1000ms)
- Recent slow queries log

### 2. Health Checks

Automated health checks run every 5 minutes to monitor:

- Rejection rates (warning if >50%)
- Notification failure rates (critical if >10%)
- Slow query counts (warning if >50)
- Pending request backlog (warning if >100)

### 3. Logging

#### Structured Logging
All metrics and events are logged with structured data including:
- Timestamps
- Request IDs
- User IDs
- Operation types
- Duration metrics
- Error details

#### Log Levels
- **DEBUG**: Database query performance
- **INFO**: Successful operations, metrics summaries
- **WARN**: Slow queries, high rejection rates, system warnings
- **ERROR**: Failed operations, critical alerts

### 4. Alerting

The system generates alerts for:
- High mentor rejection rates (>50%)
- High admin rejection rates (>50%)
- High notification failure rates (>10%)
- Excessive slow queries (>50)
- Large pending request backlog (>100)
- Approval times significantly above average (>2x average)

## API Endpoints

### Get Metrics
```
GET /api/metrics
Authorization: Bearer <admin_token>
```

Returns comprehensive metrics including:
- Credit request creation stats
- Approval time averages
- Rejection rates
- Notification delivery stats
- Database query performance

**Response:**
```json
{
  "success": true,
  "data": {
    "creditRequestCreation": {
      "total": 150,
      "lastHour": 5,
      "lastDay": 45,
      "rate": {
        "perHour": 5,
        "perDay": 45
      }
    },
    "approvalTimes": {
      "mentor": {
        "average": 120,
        "count": 100
      },
      "admin": {
        "average": 60,
        "count": 95
      }
    },
    "rejectionRates": {
      "mentor": {
        "total": 100,
        "rejected": 15,
        "rate": 15.0
      },
      "admin": {
        "total": 95,
        "rejected": 5,
        "rate": 5.26
      }
    },
    "notificationDelivery": {
      "sent": 450,
      "failed": 10,
      "pending": 5,
      "failureRate": 2.17
    },
    "databaseQueries": {
      "count": 5000,
      "averageDuration": 45,
      "slowQueriesCount": 12,
      "recentSlowQueries": [...]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Metrics Summary
```
GET /api/metrics/summary
Authorization: Bearer <admin_token>
```

Returns a formatted summary of key metrics with logging.

### Check System Health
```
GET /api/metrics/health
Authorization: Bearer <admin_token>
```

Returns system health status and any active alerts.

**Response (Healthy):**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "alerts": [],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Unhealthy):**
```json
{
  "success": false,
  "data": {
    "healthy": false,
    "alerts": [
      {
        "severity": "warning",
        "type": "high_mentor_rejection_rate",
        "message": "Mentor rejection rate is 55.00%",
        "threshold": "50%"
      },
      {
        "severity": "critical",
        "type": "high_notification_failure_rate",
        "message": "Notification failure rate is 12.50%",
        "threshold": "10%"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Reset Metrics
```
POST /api/metrics/reset
Authorization: Bearer <admin_token>
```

Resets all metrics (for testing/maintenance purposes).

## Automated Monitoring

### Periodic Metrics Logging
- Runs every 15 minutes
- Logs comprehensive metrics summary
- Helps track trends over time

### Periodic Health Checks
- Runs every 5 minutes
- Checks system health
- Generates alerts for issues
- Logs warnings and errors

## Database Query Performance Tracking

### Mongoose Plugin
A Mongoose plugin automatically tracks query performance for:
- Find operations
- Save operations
- Update operations
- Delete operations
- Aggregate operations

### Slow Query Detection
Queries taking longer than 1000ms are:
- Logged as warnings
- Added to slow query list
- Tracked in metrics
- Available for analysis

### Query Metrics
For each query type, the system tracks:
- Query name (model + operation)
- Execution duration
- Model name
- Operation type

## Integration Points

### Credit Service
Tracks:
- Credit request creation
- Credit addition to student profiles

### Credit Review Service
Tracks:
- Mentor approval/rejection
- Admin approval/rejection
- Review durations
- Rejection reasons

### Credit Notification Service
Tracks:
- Notification queuing
- Notification delivery success/failure
- Notification types

### Credit Notification Worker
Tracks:
- Notification processing
- Delivery confirmation
- Failure tracking

## Usage Examples

### Monitoring Dashboard
Admins can access real-time metrics through the `/api/metrics` endpoint to:
- Monitor system performance
- Identify bottlenecks
- Track approval times
- Analyze rejection patterns

### Alert Response
When alerts are triggered:
1. Check `/api/metrics/health` for details
2. Review specific metrics in `/api/metrics`
3. Investigate slow queries or high rejection rates
4. Take corrective action

### Performance Optimization
Use metrics to:
- Identify slow database queries
- Optimize frequently-used queries
- Add indexes where needed
- Improve approval workflows

## Configuration

### Metric Reset Intervals
- Hourly metrics: Reset every 60 minutes
- Daily metrics: Reset every 24 hours

### Alert Thresholds
- Rejection rate warning: 50%
- Notification failure critical: 10%
- Slow query warning: 1000ms
- Slow query count warning: 50
- Pending requests warning: 100

### Scheduled Jobs
- Metrics summary: Every 15 minutes
- Health check: Every 5 minutes

## Best Practices

1. **Regular Monitoring**: Check metrics dashboard daily
2. **Alert Response**: Respond to critical alerts within 1 hour
3. **Trend Analysis**: Review weekly trends to identify patterns
4. **Query Optimization**: Address slow queries promptly
5. **Capacity Planning**: Use metrics to plan for growth

## Troubleshooting

### High Rejection Rates
- Review rejection reasons in logs
- Check if quality criteria are too strict
- Provide additional guidance to students/mentors

### High Notification Failure Rates
- Check notification service connectivity
- Review error logs for specific failures
- Verify email/SMS service configuration

### Slow Queries
- Review slow query logs
- Add database indexes
- Optimize query patterns
- Consider caching frequently-accessed data

### Large Pending Backlog
- Check if reviewers are active
- Send reminder notifications
- Consider adding more reviewers
- Review approval workflow efficiency

## Future Enhancements

- Integration with external monitoring services (Datadog, New Relic)
- Custom alert rules and thresholds
- Metric visualization dashboard
- Historical metric storage and analysis
- Automated performance recommendations
