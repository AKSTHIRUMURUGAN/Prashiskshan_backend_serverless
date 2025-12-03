# Internship Analytics Service Implementation

## Overview

The Internship Analytics Service provides comprehensive analytics for the internship verification workflow system. It supports role-specific analytics for companies, mentors, admins, and departments, with export capabilities and caching for expensive aggregations.

## Requirements Addressed

- **8.1**: Mentor analytics with approval rates and student supervision
- **8.3**: Department analytics
- **9.1**: Company analytics with application funnel
- **9.2**: Company completion metrics
- **9.3**: Company historical data with date range filtering
- **9.5**: Analytics export in CSV and PDF formats
- **10.1**: Admin dashboard with system-wide metrics
- **10.2**: Company performance metrics
- **10.3**: Department performance metrics
- **10.4**: Mentor performance metrics
- **10.5**: Student performance metrics

## Service Location

`backend/src/services/internshipAnalyticsService.js`

## Key Features

### 1. Company Analytics

**Method**: `getCompanyAnalytics(companyId, options)`

Provides comprehensive analytics for a specific company including:
- Internship statistics (total, active, closed, cancelled)
- Application funnel metrics (total, shortlisted, accepted, rejected, acceptance rate)
- Completion metrics (total, completion rate, average rating, average hours)

**Parameters**:
- `companyId`: Company MongoDB ObjectId
- `options.dateFrom`: Start date for filtering (optional)
- `options.dateTo`: End date for filtering (optional)

**Returns**:
```javascript
{
  companyId: String,
  period: { dateFrom, dateTo },
  internships: {
    total: Number,
    active: Number,
    closed: Number,
    cancelled: Number
  },
  applicationFunnel: {
    totalApplications: Number,
    shortlisted: Number,
    accepted: Number,
    rejected: Number,
    acceptanceRate: Number
  },
  completions: {
    total: Number,
    completionRate: Number,
    averageRating: Number,
    averageHours: Number
  }
}
```

### 2. Mentor Analytics

**Method**: `getMentorAnalytics(mentorId, options)`

Provides analytics for faculty mentors including:
- Approval metrics (total reviewed, approved, rejected, approval rate)
- Response time metrics (average response time in days)
- Student supervision metrics (supervised count, average readiness, total credits)

**Parameters**:
- `mentorId`: Mentor ID string
- `options.dateFrom`: Start date for filtering (optional)
- `options.dateTo`: End date for filtering (optional)

**Returns**:
```javascript
{
  mentorId: String,
  department: String,
  period: { dateFrom, dateTo },
  approvals: {
    totalReviewed: Number,
    approved: Number,
    rejected: Number,
    approvalRate: Number,
    averageResponseTime: Number
  },
  students: {
    supervised: Number,
    averageReadinessScore: Number,
    totalCreditsEarned: Number
  }
}
```

### 3. Admin Analytics

**Method**: `getAdminAnalytics(options)`

Provides system-wide analytics including:
- System metrics (total internships, pending verifications, active internships)
- Verification metrics (processed, rate, average time)
- Company performance (top performers by rating)
- Department performance (sorted by placement rate)
- Mentor performance (top performers by approval rate)

**Parameters**:
- `options.dateFrom`: Start date for filtering (optional)
- `options.dateTo`: End date for filtering (optional)

**Returns**:
```javascript
{
  period: { dateFrom, dateTo },
  system: {
    totalInternships: Number,
    pendingVerifications: Number,
    activeInternships: Number,
    verificationsProcessed: Number,
    verificationRate: Number,
    averageVerificationTime: Number
  },
  companies: {
    total: Number,
    topPerformers: Array<CompanyMetrics>
  },
  departments: Array<DepartmentMetrics>,
  mentors: {
    total: Number,
    topPerformers: Array<MentorMetrics>
  }
}
```

### 4. Department Analytics

**Method**: `getDepartmentAnalytics(department, options)`

Provides department-specific analytics including:
- Internship metrics (total, active)
- Application metrics (total, accepted, application rate, placement rate)
- Student metrics (total, average readiness)
- Credit metrics (total earned, average per student, students with credits)
- Mentor metrics (total, average workload)

**Parameters**:
- `department`: Department name string
- `options.dateFrom`: Start date for filtering (optional)
- `options.dateTo`: End date for filtering (optional)

**Returns**:
```javascript
{
  department: String,
  period: { dateFrom, dateTo },
  internships: {
    total: Number,
    active: Number
  },
  applications: {
    total: Number,
    accepted: Number,
    applicationRate: Number,
    placementRate: Number
  },
  students: {
    total: Number,
    averageReadiness: Number
  },
  credits: {
    totalEarned: Number,
    averagePerStudent: Number,
    studentsWithCredits: Number
  },
  mentors: {
    total: Number,
    averageWorkload: Number
  }
}
```

### 5. Export Analytics

**Method**: `exportAnalytics(entityType, entityId, format, options)`

Exports analytics data in CSV or PDF format.

**Parameters**:
- `entityType`: "company", "mentor", "department", or "admin"
- `entityId`: Entity identifier (required for company, mentor, department)
- `format`: "csv" or "pdf"
- `options.dateFrom`: Start date for filtering (optional)
- `options.dateTo`: End date for filtering (optional)

**Returns**:
```javascript
{
  format: String,
  data: String | Buffer,
  filename: String
}
```

**CSV Format**: Plain text CSV with Metric and Value columns
**PDF Format**: Formatted PDF document with sections and metrics

### 6. Analytics Caching

**Method**: `cacheAnalyticsSnapshot(entityType, entityId, period)`

Caches analytics snapshots for expensive aggregations.

**Parameters**:
- `entityType`: "company", "mentor", "department", or "admin"
- `entityId`: Entity identifier (optional for admin)
- `period`: "daily", "weekly", or "monthly"

**Returns**: AnalyticsSnapshot document

**Method**: `getCachedSnapshot(entityType, entityId, period, dateFrom, dateTo)`

Retrieves cached analytics snapshots.

**Parameters**:
- `entityType`: "company", "mentor", "department", or "admin"
- `entityId`: Entity identifier (optional for admin)
- `period`: "daily", "weekly", or "monthly"
- `dateFrom`: Start date for filtering (optional)
- `dateTo`: End date for filtering (optional)

**Returns**: Array of AnalyticsSnapshot documents

## Usage Examples

### Get Company Analytics

```javascript
import internshipAnalyticsService from "../services/internshipAnalyticsService.js";

// Get all-time analytics
const analytics = await internshipAnalyticsService.getCompanyAnalytics(companyId);

// Get analytics for specific date range
const analytics = await internshipAnalyticsService.getCompanyAnalytics(companyId, {
  dateFrom: "2024-01-01",
  dateTo: "2024-12-31"
});
```

### Get Mentor Analytics

```javascript
const analytics = await internshipAnalyticsService.getMentorAnalytics(mentorId, {
  dateFrom: "2024-01-01",
  dateTo: "2024-12-31"
});
```

### Get Admin Analytics

```javascript
const analytics = await internshipAnalyticsService.getAdminAnalytics({
  dateFrom: "2024-01-01",
  dateTo: "2024-12-31"
});
```

### Export Analytics

```javascript
// Export to CSV
const csvExport = await internshipAnalyticsService.exportAnalytics(
  "company",
  companyId,
  "csv",
  { dateFrom: "2024-01-01", dateTo: "2024-12-31" }
);

// Export to PDF
const pdfExport = await internshipAnalyticsService.exportAnalytics(
  "mentor",
  mentorId,
  "pdf"
);
```

### Cache Analytics Snapshot

```javascript
// Cache daily snapshot
await internshipAnalyticsService.cacheAnalyticsSnapshot("company", companyId, "daily");

// Get cached snapshots
const snapshots = await internshipAnalyticsService.getCachedSnapshot(
  "company",
  companyId,
  "daily",
  "2024-01-01",
  "2024-12-31"
);
```

## Performance Considerations

### Caching Strategy

The service implements a caching layer using the `AnalyticsSnapshot` model to store pre-calculated metrics:

1. **Daily Snapshots**: Calculated once per day for each entity
2. **Weekly Snapshots**: Calculated once per week for trend analysis
3. **Monthly Snapshots**: Calculated once per month for historical reporting

### Query Optimization

- Uses MongoDB aggregation pipelines for efficient data processing
- Leverages existing indexes on models (status, department, dates)
- Limits result sets for top performers (top 10)
- Uses `.lean()` for read-only operations

### Recommended Usage

1. **Real-time Analytics**: Call methods directly for up-to-date data
2. **Historical Trends**: Use cached snapshots for faster retrieval
3. **Exports**: Generate on-demand, consider background job for large datasets
4. **Dashboard Displays**: Use cached snapshots with periodic refresh

## Error Handling

All methods include comprehensive error handling:
- Logs errors with context (entity type, entity ID, parameters)
- Throws errors for upstream handling
- Returns meaningful error messages

## Testing

Unit tests should cover:
- Analytics calculation accuracy
- Date range filtering
- Export format generation
- Caching functionality
- Error scenarios

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live analytics
2. **Custom Metrics**: Allow users to define custom analytics queries
3. **Comparative Analysis**: Compare metrics across time periods
4. **Predictive Analytics**: ML-based predictions for trends
5. **Advanced Exports**: Excel format with charts and formatting
