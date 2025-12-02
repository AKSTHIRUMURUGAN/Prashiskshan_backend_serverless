# Database Migration Setup - Credit Transfer System

## Overview

This document describes the database migration setup for the Credit Transfer System feature. The migration ensures that all necessary collections, indexes, and schema extensions are properly configured in the MongoDB database.

## Migration Script

**Location:** `backend/scripts/migrate-credit-transfer-system.js`

**NPM Command:** `npm run migrate:credit-transfer`

## What Was Implemented

### 1. CreditRequest Collection Setup

The migration creates and configures the `creditrequests` collection with the following indexes:

#### Unique Indexes
- `creditRequestId` - Unique identifier for each credit request
- `internshipCompletionId` - Ensures one credit request per internship completion

#### Single Field Indexes
- `studentId` - For querying requests by student
- `mentorId` - For querying requests by mentor
- `status` - For filtering by request status

#### Compound Indexes
- `studentId + status` - Optimizes student dashboard queries
- `mentorId + status` - Optimizes mentor review queue queries
- `status + requestedAt` - Optimizes time-based status queries

### 2. InternshipCompletion Model Extensions

Added two new embedded document fields:

#### creditRequest Field
```javascript
{
  requested: Boolean,      // Whether credit has been requested
  requestId: ObjectId,     // Reference to CreditRequest
  requestedAt: Date,       // When request was created
  status: String          // Current status of request
}
```

#### companyCompletion Field
```javascript
{
  markedCompleteBy: String,      // Company user who marked complete
  markedCompleteAt: Date,        // Completion timestamp
  evaluationScore: Number,       // Company evaluation score
  evaluationComments: String     // Company feedback
}
```

### 3. Student Model Extensions

Added credits tracking field:

#### credits Field
```javascript
{
  earned: Number,          // Total credits earned (default: 0)
  approved: Number,        // Credits approved but not yet added (default: 0)
  pending: Number,         // Credits in review (default: 0)
  history: [{             // Array of credit additions
    creditRequestId: ObjectId,
    internshipId: ObjectId,
    creditsAdded: Number,
    addedAt: Date,
    certificateUrl: String
  }]
}
```

## Migration Features

### Idempotency
- Safe to run multiple times
- Checks for existing collections and indexes
- Only creates what doesn't exist
- Handles index conflicts gracefully

### Data Preservation
- Does not modify existing documents
- Only adds new fields when documents are updated
- Maintains all existing data integrity

### Comprehensive Logging
- Detailed step-by-step output
- Index creation status
- Document counts and statistics
- Migration summary

### Error Handling
- Graceful handling of existing indexes
- Clear error messages
- Proper connection cleanup
- Exit codes for automation

## Running the Migration

### Development Environment

```bash
cd backend
npm run migrate:credit-transfer
```

### Staging Environment

1. Update `.env` to point to staging database
2. Run migration:
   ```bash
   npm run migrate:credit-transfer
   ```
3. Verify output shows success
4. Check database for proper setup

### Production Environment

1. **BACKUP DATABASE FIRST**
2. Update `.env` to point to production database
3. Run migration during maintenance window:
   ```bash
   npm run migrate:credit-transfer
   ```
4. Verify all indexes created successfully
5. Monitor application logs for any issues

## Verification

After running the migration, verify:

### 1. Collections Exist
```javascript
// In MongoDB shell or Compass
show collections
// Should include: creditrequests, internshipcompletions, students
```

### 2. Indexes Created
```javascript
// Check CreditRequest indexes
db.creditrequests.getIndexes()
// Should show 10 indexes including compounds

// Check InternshipCompletion indexes
db.internshipcompletions.getIndexes()

// Check Student indexes
db.students.getIndexes()
```

### 3. Schema Extensions
```javascript
// Check a sample InternshipCompletion document
db.internshipcompletions.findOne()
// Should have creditRequest and companyCompletion fields

// Check a sample Student document
db.students.findOne()
// Should have credits field with history array
```

## Migration Output Example

```
============================================================
Credit Transfer System Migration
============================================================

Connecting to MongoDB...
Database: prashiskshan.uoyecwt.mongodb.net/prashiskshan
✓ Connected successfully

Step 1: Setting up CreditRequest collection
------------------------------------------------------------
✓ CreditRequest collection already exists

Creating CreditRequest indexes...
  ✓ Created index: creditRequestId_unique
  ✓ Created index: studentId_index
  ✓ Created index: internshipCompletionId_unique
  ✓ Created index: mentorId_index
  ✓ Created index: status_index
  ✓ Created index: studentId_status_compound
  ✓ Created index: mentorId_status_compound
  ✓ Created index: status_requestedAt_compound

✓ CreditRequest collection ready (0 documents)

[... additional steps ...]

============================================================
Migration Summary
============================================================

Collection Statistics:
  - CreditRequests: 0
    • Pending: 0
    • Completed: 0
  - InternshipCompletions: 0
  - Students: 0

✓ Migration completed successfully!
============================================================
```

## Troubleshooting

### Issue: Connection Timeout
**Solution:** Check MongoDB URI and network connectivity

### Issue: Index Already Exists
**Solution:** This is normal - migration is idempotent

### Issue: Permission Denied
**Solution:** Ensure database user has write permissions

### Issue: Duplicate Key Error
**Solution:** Check for existing data conflicts

## Related Documentation

- Design Document: `.kiro/specs/credit-transfer-system/design.md`
- Requirements: `.kiro/specs/credit-transfer-system/requirements.md`
- Migration README: `backend/scripts/README-MIGRATIONS.md`
- Models: `backend/src/models/CreditRequest.js`, `InternshipCompletion.js`, `Student.js`

## Next Steps

After successful migration:

1. ✅ Verify all indexes are created
2. ✅ Test credit request creation
3. ✅ Test mentor review workflow
4. ✅ Test admin approval workflow
5. ✅ Monitor query performance
6. ✅ Set up monitoring alerts

## Support

For issues or questions:
- Review migration logs
- Check MongoDB Atlas logs
- Consult design documentation
- Contact development team
