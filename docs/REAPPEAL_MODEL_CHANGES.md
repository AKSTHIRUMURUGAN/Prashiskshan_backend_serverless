# Company Model - Reappeal Fields Extension

## Overview
This document describes the changes made to the Company model to support the Company Block Reappeal System.

## Changes Made

### 1. Status Enum Extension
Added `"reappeal"` to the company status enum:
```javascript
status: {
  type: String,
  enum: ["pending_verification", "verified", "rejected", "suspended", "blocked", "reappeal"],
  default: "pending_verification",
  index: true,
}
```

### 2. Block Information Schema
Added `blockInfoSchema` to preserve block details when a company is blocked:
```javascript
const blockInfoSchema = new Schema(
  {
    reason: String,
    blockedBy: String,
    blockedAt: Date,
  },
  { _id: false },
);
```

### 3. Reappeal Schema
Added `reappealSchema` to store reappeal requests and history:
```javascript
const reappealSchema = new Schema(
  {
    message: {
      type: String,
      minlength: 10,
      maxlength: 2000,
    },
    attachment: String,
    submittedAt: Date,
    reviewedBy: String,
    reviewedAt: Date,
    reviewFeedback: String,
    rejectionReason: String,
    cooldownEndsAt: Date,
    history: [
      {
        message: String,
        attachment: String,
        submittedAt: Date,
        reviewedAt: Date,
        decision: { type: String, enum: ["approved", "rejected"] },
        reviewedBy: String,
        feedback: String,
      },
    ],
  },
  { _id: false },
);
```

### 4. Database Indexes
Added indexes for efficient querying:
```javascript
companySchema.index({ "reappeal.submittedAt": -1 });
companySchema.index({ status: 1, "reappeal.submittedAt": -1 });
```

## Migration

### Automatic Migration
MongoDB is schema-less, so the new fields will be added automatically when documents are updated. No manual migration is required for basic functionality.

### Optional Migration Script
A migration script is available at `backend/scripts/migrate-reappeal-fields.js` that:
- Initializes `blockInfo` for existing blocked companies
- Creates database indexes for optimal query performance
- Provides statistics on the migration

To run the migration:
```bash
cd backend
node scripts/migrate-reappeal-fields.js
```

## Validation Rules

### Message Validation
- Minimum length: 10 characters
- Maximum length: 2000 characters

### History Tracking
- Each reappeal decision (approved/rejected) is stored in the history array
- History includes: message, attachment, timestamps, decision, reviewer, and feedback

## Testing

### Unit Tests
Comprehensive unit tests are available at `backend/tests/unit/models/company-reappeal.test.js`:
- Status enum validation
- Block information storage
- Reappeal message validation (min/max length)
- Reappeal history tracking
- Attachment storage

All tests pass successfully.

### Backward Compatibility
Existing tests for the Company model continue to pass, ensuring backward compatibility.

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:
- **Requirement 5.1**: Reappeal status is distinct from pending and other statuses
- **Requirement 5.3**: Block information is preserved when transitioning to reappeal
- **Requirement 7.4**: Reappeal records include timestamps, company reference, and admin actions

## Next Steps

The following tasks remain to complete the reappeal system:
1. Implement reappeal submission backend endpoint
2. Implement admin reappeal management endpoints
3. Create frontend components for reappeal submission and management
4. Implement notification system
5. Add file upload integration for reappeal attachments
