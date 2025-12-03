# Database Migration and Seeding Scripts

This directory contains scripts for migrating the database schema and seeding test data for the Internship Verification Workflow feature.

## Overview

The internship verification workflow introduces several enhancements to the database schema:
- Enhanced Internship model with workflow states, admin review, mentor approval, AI tags, and audit trails
- AnalyticsSnapshot model for performance metrics caching
- Additional indexes for query optimization

## Scripts

### 1. Migration Script: `migrate-internship-verification-workflow.js`

This script migrates existing internship data to support the new verification workflow.

**What it does:**
- Adds `slotsRemaining` field to existing internships (defaults to `slots` value)
- Initializes empty arrays for `auditTrail` and `aiTags` fields
- Creates initial audit trail entries for existing internships
- Verifies that all required indexes are created

**Usage:**
```bash
node backend/scripts/migrate-internship-verification-workflow.js
```

**When to run:**
- After deploying the new Internship model schema
- Before running the application with the new workflow features
- Safe to run multiple times (idempotent)

**Output:**
The script provides detailed logging of:
- Number of internships updated
- Index verification results
- Migration summary statistics

### 2. Seed Script: `seed.js`

This script generates comprehensive test data for development and demo purposes.

**What it creates:**
- **3 Admins** with different roles (super_admin, admin)
- **10 Mentors** (2 per department) across 5 departments
- **10 Companies** with various verification statuses (verified, pending, rejected)
- **50 Students** (10 per department) with varying profiles and readiness scores
- **30 Internships** in different workflow states:
  - Pending admin verification
  - Admin approved
  - Open for applications
  - Closed
  - Admin rejected
  - Mentor rejected
- **~75 Applications** with various statuses (pending, shortlisted, rejected, accepted)
- **48 Analytics Snapshots** for companies, mentors, departments, and system-wide metrics

**Usage:**
```bash
node backend/scripts/seed.js
```

**⚠️ Warning:**
This script **clears all existing data** before seeding. Only use in development/testing environments!

**Generated Data Details:**

#### Departments
- Computer Science
- Mechanical Engineering
- Electrical Engineering
- Civil Engineering
- Data Science

#### Internship States Distribution
The script creates internships in various states to test the complete workflow:
- ~13% Pending Admin Verification
- ~13% Admin Approved (waiting for mentor)
- ~40% Open for Applications (fully approved)
- ~13% Closed (deadline passed)
- ~20% Rejected (admin or mentor rejected)

#### Application States
Applications are created for open internships with realistic distributions:
- Pending company review
- Shortlisted for interview
- Rejected
- Accepted

#### Analytics Snapshots
Snapshots are created for three time periods (daily, weekly, monthly) for:
- Top 5 verified companies
- Top 5 mentors
- All 5 departments
- System-wide admin metrics

## Database Schema Changes

### Internship Model Enhancements

**New Fields:**
```javascript
{
  slotsRemaining: Number,           // Tracks available slots
  adminReview: {                    // Admin verification details
    reviewedBy: String,
    reviewedAt: Date,
    decision: String,
    comments: String,
    reasons: [String]
  },
  mentorApproval: {                 // Mentor approval details
    status: String,
    mentorId: String,
    approvedAt: Date,
    comments: String,
    department: String
  },
  aiTags: {                         // AI-generated tags
    primarySkills: [String],
    difficulty: String,
    careerPath: String,
    industryFit: [String],
    learningIntensity: String,
    technicalDepth: String,
    generatedAt: Date
  },
  auditTrail: [{                    // Complete history
    timestamp: Date,
    actor: String,
    actorRole: String,
    action: String,
    fromStatus: String,
    toStatus: String,
    reason: String
  }]
}
```

**New Status Values:**
- `pending_admin_verification` (initial state)
- `admin_approved` (passed admin review)
- `admin_rejected` (failed admin review)
- `mentor_rejected` (failed mentor review)
- `open_for_applications` (fully approved)
- `closed` (deadline passed or slots filled)
- `cancelled` (company cancelled)

**New Indexes:**
```javascript
{ status: 1, department: 1 }
{ companyId: 1, status: 1 }
{ department: 1, "mentorApproval.status": 1 }
{ department: 1, status: 1, applicationDeadline: 1 }
```

### AnalyticsSnapshot Model

New collection for caching analytics metrics:
```javascript
{
  snapshotId: String,
  entityType: String,              // "company", "mentor", "department", "admin"
  entityId: String,
  period: String,                  // "daily", "weekly", "monthly"
  date: Date,
  metrics: {
    // Company metrics
    internshipsPosted: Number,
    applicationsReceived: Number,
    acceptanceRate: Number,
    completionRate: Number,
    averageRating: Number,
    
    // Mentor metrics
    approvalsProcessed: Number,
    approvalRate: Number,
    averageResponseTime: Number,
    studentsSupervised: Number,
    
    // Department metrics
    applicationRate: Number,
    placementRate: Number,
    averageCredits: Number,
    
    // Admin metrics
    verificationsProcessed: Number,
    verificationRate: Number,
    activeInternships: Number
  }
}
```

## Testing the Workflow

After seeding, you can test the complete workflow:

1. **Admin Verification**
   - Login as admin (admin1@platform.com, admin2@platform.com, admin3@platform.com)
   - View pending internships
   - Approve or reject internships

2. **Mentor Approval**
   - Login as mentor (mentor.computerscience1@university.edu, etc.)
   - View admin-approved internships for your department
   - Approve or reject for your students

3. **Student Application**
   - Login as student (student1@university.edu through student50@university.edu)
   - Browse open internships for your department
   - Submit applications

4. **Company Review**
   - Login as company (use Firebase UIDs from seeded data)
   - Review applications
   - Shortlist or reject candidates

5. **Analytics**
   - View role-specific analytics dashboards
   - Export analytics reports
   - Check analytics snapshots

## Environment Variables

Ensure these are set in your `.env` file:
```bash
MONGODB_URI=mongodb://localhost:27017/internship-platform
```

## Troubleshooting

### Migration Issues

**Problem:** "Internships without slotsRemaining" count is high
- **Solution:** This is expected on first run. The script will update all internships.

**Problem:** Indexes not showing up
- **Solution:** Ensure MongoDB is running and the connection is successful. Indexes are created automatically by Mongoose.

### Seeding Issues

**Problem:** Script fails with "duplicate key error"
- **Solution:** The script clears data first, but if it fails mid-execution, run it again.

**Problem:** "Cannot find module" errors
- **Solution:** Ensure all dependencies are installed: `npm install`

**Problem:** Connection timeout
- **Solution:** Ensure MongoDB is running and accessible at the configured URI.

## Best Practices

1. **Always backup production data** before running migrations
2. **Test migrations** in a staging environment first
3. **Use seed script only** in development/testing environments
4. **Review migration logs** to ensure all data was updated correctly
5. **Verify indexes** after migration to ensure query performance

## Related Documentation

- [Internship Verification Workflow Requirements](../../.kiro/specs/internship-verification-workflow/requirements.md)
- [Internship Verification Workflow Design](../../.kiro/specs/internship-verification-workflow/design.md)
- [Implementation Tasks](../../.kiro/specs/internship-verification-workflow/tasks.md)

## Support

For issues or questions:
1. Check the migration logs for specific error messages
2. Verify MongoDB connection and permissions
3. Review the model definitions in `backend/src/models/`
4. Check existing migration scripts for reference patterns
