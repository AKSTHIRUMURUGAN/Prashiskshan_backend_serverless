# Internship Verification Workflow - Schema Updates

## Overview

This document describes the database schema updates for the Internship Verification and Approval Workflow system. The updates enable a multi-stage approval process with comprehensive tracking and analytics.

## Updated Models

### 1. Internship Model

#### New Fields

**slotsRemaining** (Number)
- Tracks available slots for the internship
- Automatically initialized to equal `slots` value on creation
- Decremented when applications are accepted
- Used to prevent over-booking

**adminReview** (Object)
- `reviewedBy` (String): Admin user ID who reviewed
- `reviewedAt` (Date): Timestamp of review
- `decision` (String): "approved" or "rejected"
- `comments` (String): Admin's review comments
- `reasons` (Array[String]): Rejection reasons if applicable

**mentorApproval** (Object)
- `status` (String): "pending", "approved", or "rejected"
- `mentorId` (String): Faculty mentor user ID
- `approvedAt` (Date): Timestamp of approval
- `comments` (String): Mentor's comments
- `department` (String): Department for which approved

**aiTags** (Object)
- `primarySkills` (Array[String]): AI-extracted key skills
- `difficulty` (String): "beginner", "intermediate", or "advanced"
- `careerPath` (String): Suggested career path
- `industryFit` (Array[String]): Relevant industries
- `learningIntensity` (String): Learning curve assessment
- `technicalDepth` (String): Technical complexity level
- `generatedAt` (Date): Timestamp of AI generation

**auditTrail** (Array[Object])
- `timestamp` (Date): When the action occurred
- `actor` (String): User ID who performed action
- `actorRole` (String): Role of the actor
- `action` (String): Description of action
- `fromStatus` (String): Previous status
- `toStatus` (String): New status
- `reason` (String): Reason for the change

#### Updated Status Values

The `status` field now includes these values:
- `draft`: Initial creation state
- `pending_admin_verification`: Awaiting admin review
- `admin_approved`: Admin approved, awaiting mentor
- `admin_rejected`: Rejected by admin
- `mentor_rejected`: Rejected by mentor
- `open_for_applications`: Approved and visible to students
- `closed`: Application deadline passed or slots filled
- `cancelled`: Cancelled by company

#### New Indexes

Compound indexes for optimized queries:
```javascript
{ status: 1, department: 1 }
{ companyId: 1, status: 1 }
{ department: 1, "mentorApproval.status": 1 }
{ department: 1, status: 1, applicationDeadline: 1 }
{ status: 1, startDate: 1 }
```

### 2. Application Model

#### New Indexes

Additional compound indexes:
```javascript
{ status: 1, "mentorApproval.status": 1 }
{ internshipId: 1, "companyFeedback.status": 1 }
```

### 3. AnalyticsSnapshot Model (New)

A new model for caching analytics data to improve query performance.

#### Schema

**snapshotId** (String, required, unique)
- Unique identifier for the snapshot

**entityType** (String, required)
- Type of entity: "company", "mentor", "department", or "admin"

**entityId** (String)
- ID of the specific entity (null for admin/system-wide)

**period** (String, required)
- Snapshot period: "daily", "weekly", or "monthly"

**date** (Date, required)
- Date of the snapshot

**metrics** (Object)
- Company Metrics:
  - `internshipsPosted` (Number)
  - `applicationsReceived` (Number)
  - `acceptanceRate` (Number)
  - `completionRate` (Number)
  - `averageRating` (Number)
  
- Mentor Metrics:
  - `approvalsProcessed` (Number)
  - `approvalRate` (Number)
  - `averageResponseTime` (Number)
  - `studentsSupervised` (Number)
  
- Department Metrics:
  - `applicationRate` (Number)
  - `placementRate` (Number)
  - `averageCredits` (Number)
  
- Admin Metrics:
  - `verificationsProcessed` (Number)
  - `verificationRate` (Number)
  - `activeInternships` (Number)

**createdAt** (Date)
- Timestamp of snapshot creation

#### Indexes

```javascript
{ entityType: 1, entityId: 1, date: -1 }
{ entityType: 1, period: 1, date: -1 }
{ date: -1, entityType: 1 }
```

## Migration

### Running the Migration

To apply these schema updates to existing data:

```bash
node backend/scripts/migrate-internship-verification-workflow.js
```

### Migration Steps

1. **Update slotsRemaining**: Sets `slotsRemaining` to equal `slots` for all existing internships
2. **Initialize new fields**: Adds empty arrays/objects for new fields
3. **Verify indexes**: Confirms all indexes are created
4. **Create audit trails**: Generates initial audit trail entries for existing internships
5. **Summary**: Reports migration statistics

### Rollback

If you need to rollback:

```javascript
// Remove new fields
db.internships.updateMany({}, {
  $unset: {
    slotsRemaining: "",
    adminReview: "",
    mentorApproval: "",
    aiTags: "",
    auditTrail: ""
  }
});

// Drop AnalyticsSnapshot collection
db.analyticssnapshots.drop();
```

## Query Patterns

### Common Queries

**Get internships pending admin verification:**
```javascript
Internship.find({ status: "pending_admin_verification" })
  .sort({ postedAt: 1 });
```

**Get internships for mentor approval by department:**
```javascript
Internship.find({
  status: "admin_approved",
  department: "Computer Science",
  "mentorApproval.status": "pending"
});
```

**Get open internships for students:**
```javascript
Internship.find({
  status: "open_for_applications",
  department: studentDepartment,
  applicationDeadline: { $gte: new Date() },
  slotsRemaining: { $gt: 0 }
});
```

**Get company's internship history:**
```javascript
Internship.find({ companyId: companyId })
  .sort({ postedAt: -1 });
```

**Get analytics snapshot:**
```javascript
AnalyticsSnapshot.findOne({
  entityType: "company",
  entityId: companyId,
  period: "monthly",
  date: { $gte: startDate, $lte: endDate }
});
```

## Performance Considerations

1. **Indexes**: All compound indexes are optimized for the most common query patterns
2. **Analytics Caching**: Use AnalyticsSnapshot for expensive aggregations
3. **Audit Trail**: Consider archiving old audit trail entries for very old internships
4. **AI Tags**: Generate asynchronously to avoid blocking internship creation

## Validation Rules

### Internship
- `slots` must be >= 1
- `slotsRemaining` must be >= 0 and <= `slots`
- `status` transitions must follow workflow rules
- `applicationDeadline` must be after current date for new internships

### AnalyticsSnapshot
- `entityType` must be one of: "company", "mentor", "department", "admin"
- `period` must be one of: "daily", "weekly", "monthly"
- `date` is required and indexed for efficient range queries

## Related Documentation

- [Requirements Document](../../.kiro/specs/internship-verification-workflow/requirements.md)
- [Design Document](../../.kiro/specs/internship-verification-workflow/design.md)
- [Implementation Tasks](../../.kiro/specs/internship-verification-workflow/tasks.md)
