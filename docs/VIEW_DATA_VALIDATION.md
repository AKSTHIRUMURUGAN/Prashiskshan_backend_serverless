# View Data Completeness Validation

## Overview

This document describes the view data completeness validation system implemented for the Credit Transfer System. The validation ensures that API responses include all required fields for different user roles (student, mentor, admin).

**Requirements**: 3.2, 5.2, 8.2, 10.1, 11.1, 11.2, 12.1

## Purpose

The view data validation system ensures that:
- Student views include all necessary information for tracking credit requests
- Mentor views include logbook, report, and evaluation data for quality review
- Admin views include compliance data and mentor approval status for final approval

## Implementation

### Validation Utilities

Location: `backend/src/utils/viewDataValidation.js`

The module provides three main validation functions:

#### 1. `validateStudentView(creditRequest)`

Validates that a credit request object includes all required fields for student view:

**Required Fields:**
- `creditRequestId` - Unique identifier
- `status` - Current status
- `requestedAt` - Submission timestamp
- `lastUpdatedAt` - Last update timestamp
- `calculatedCredits` - Credits to be awarded
- `internshipDurationWeeks` - Duration for NEP compliance
- `submissionHistory` - History of submissions and reviews

**Conditional Fields:**
- `mentorReview.feedback` or `adminReview.feedback` - Required when status is rejected
- `certificate.certificateUrl` - Required when status is completed or credits_added

**Example:**
```javascript
import { validateStudentView } from '../utils/viewDataValidation.js';

const creditRequest = await CreditRequest.findOne({ creditRequestId: 'CR-123' });
const validation = validateStudentView(creditRequest);

if (!validation.valid) {
  console.warn('Missing fields:', validation.missingFields);
}
```

#### 2. `validateMentorView(creditRequest)`

Validates that a credit request includes all data needed for mentor review:

**Required Fields:**
- `creditRequestId` - Unique identifier
- `studentId` - Student reference
- `internshipId` - Internship reference
- `status` - Current status
- `requestedAt` - Submission timestamp
- `calculatedCredits` - Credits to be awarded
- `internshipDurationWeeks` - Duration

**Required Populated Fields:**
- `studentId.profile` - Student profile information
- `studentId.email` - Student email
- `internshipId.title` - Internship title
- `internshipCompletionId.logbook` - Student logbook entries
- `internshipCompletionId.finalReport` - Final report
- `internshipCompletionId.companyCompletion.evaluationScore` - Company evaluation

**Example:**
```javascript
import { validateMentorView } from '../utils/viewDataValidation.js';

const creditRequest = await CreditRequest.findOne({ creditRequestId: 'CR-123' })
  .populate('studentId')
  .populate('internshipId')
  .populate('internshipCompletionId');

const validation = validateMentorView(creditRequest);

if (!validation.valid) {
  console.error('Incomplete mentor view data:', validation.missingFields);
}
```

#### 3. `validateAdminView(creditRequest)`

Validates that a credit request includes all data needed for admin approval:

**Required Fields:**
- `creditRequestId` - Unique identifier
- `studentId` - Student reference
- `internshipId` - Internship reference
- `mentorId` - Mentor reference
- `status` - Current status
- `requestedAt` - Submission timestamp
- `calculatedCredits` - Credits to be awarded
- `internshipDurationWeeks` - Duration for NEP compliance
- `mentorReview` - Mentor review object

**Mentor Review Requirements:**
- `mentorReview.decision` - Must be present
- `mentorReview.feedback` - Required if decision is 'rejected'

**Example:**
```javascript
import { validateAdminView } from '../utils/viewDataValidation.js';

const creditRequest = await CreditRequest.findOne({ creditRequestId: 'CR-123' });
const validation = validateAdminView(creditRequest);

if (!validation.valid) {
  console.error('Incomplete admin view data:', validation.missingFields);
}
```

## API Endpoint Integration

### Student Endpoints

**GET /api/students/:studentId/credit-requests/:requestId**

Returns complete credit request details with all required student view fields.

**Required Populations:**
- None (all required fields are in the base CreditRequest model)

**Validation:**
```javascript
export const getCreditRequestDetails = async (req, res, next) => {
  try {
    const creditRequest = await creditService.getCreditRequestById(requestId);
    
    // Validate data completeness
    const validation = validateStudentView(creditRequest);
    if (!validation.valid) {
      logger.warn('Student view validation failed', {
        creditRequestId: creditRequest.creditRequestId,
        missingFields: validation.missingFields,
      });
    }
    
    res.json(apiSuccess({ creditRequest }, 'Credit request details retrieved'));
  } catch (error) {
    next(error);
  }
};
```

### Mentor Endpoints

**GET /api/mentors/:mentorId/credit-requests/:requestId**

Returns complete credit request details with logbook, report, and evaluation data.

**Required Populations:**
```javascript
const creditRequest = await CreditRequest.findOne({ creditRequestId })
  .populate('studentId', 'studentId email profile')
  .populate('internshipId', 'title company duration')
  .populate({
    path: 'internshipCompletionId',
    populate: [
      { path: 'logbook' },
      { path: 'finalReport' },
      { path: 'companyCompletion' },
    ],
  });
```

**Validation:**
```javascript
const validation = validateMentorView(creditRequest);
if (!validation.valid) {
  logger.warn('Mentor view validation failed', {
    creditRequestId: creditRequest.creditRequestId,
    missingFields: validation.missingFields,
  });
}
```

### Admin Endpoints

**GET /api/admin/credit-requests/:requestId**

Returns complete credit request details with mentor approval and compliance data.

**Required Populations:**
```javascript
const creditRequest = await CreditRequest.findOne({ creditRequestId })
  .populate('studentId', 'studentId email profile')
  .populate('internshipId', 'title company duration')
  .populate('mentorId', 'mentorId email profile')
  .populate('mentorReview.reviewedBy', 'mentorId profile');
```

**Validation:**
```javascript
const validation = validateAdminView(creditRequest);
if (!validation.valid) {
  logger.warn('Admin view validation failed', {
    creditRequestId: creditRequest.creditRequestId,
    missingFields: validation.missingFields,
  });
}
```

## Testing

### Unit Tests

Location: `backend/tests/unit/utils/viewDataValidation.test.js`

The unit tests verify:
- Complete data passes validation
- Missing required fields are detected
- Conditional fields are validated based on status
- Edge cases (null, undefined, empty arrays) are handled correctly

**Run tests:**
```bash
npm test -- viewDataValidation.test.js
```

### Integration Tests

Integration tests verify that actual API endpoints return complete data for each role.

**Test Coverage:**
- Student view includes all required fields
- Student view includes feedback for rejected requests
- Student view includes certificate for completed requests
- Mentor view includes logbook data
- Mentor view includes final report
- Mentor view includes company evaluation
- Admin view includes mentor approval status
- Admin view includes compliance data (NEP duration)
- Admin view includes mentor feedback for rejected requests

## Monitoring

### Logging

The validation functions log warnings when data is incomplete but do not fail requests. This allows monitoring of data completeness issues without breaking the API.

**Example log:**
```javascript
logger.warn('Student view validation failed', {
  creditRequestId: 'CR-123',
  missingFields: ['certificate.certificateUrl'],
  status: 'completed',
});
```

### Metrics

Consider tracking:
- Validation failure rate by role
- Most common missing fields
- Validation failures by endpoint

## Best Practices

1. **Always populate required fields** when querying credit requests for specific views
2. **Log validation failures** for monitoring and debugging
3. **Don't fail requests** on validation errors - log and continue
4. **Update validation rules** when adding new required fields to the API
5. **Run validation in development** to catch issues early

## Future Enhancements

1. **Automated validation middleware** - Add middleware to automatically validate responses
2. **Validation metrics dashboard** - Track validation failures over time
3. **Strict mode** - Option to fail requests on validation errors in development
4. **Custom validation rules** - Allow endpoints to specify additional required fields
5. **Performance optimization** - Cache validation results for frequently accessed data

## Related Documentation

- [Credit Transfer System Design](../.kiro/specs/credit-transfer-system/design.md)
- [Credit Transfer System Requirements](../.kiro/specs/credit-transfer-system/requirements.md)
- [API Documentation](./API.md)
