# Credit Request Availability Indicator

## Overview

This feature implements logic to show credit request availability indicators for completed internships and prevents credit requests for non-completed internships.

## Requirements

- **Requirement 1.5**: Credit request option should be visible only for completed internships
- **Requirement 2.1**: Students should be able to request credit transfer for completed internships

## Implementation

### Backend Changes

#### 1. Validation in Credit Service

Added validation in `creditService.createCreditRequest()` to ensure credit requests can only be created for completed internships:

```javascript
// Validate internship is marked as completed
if (completion.status !== 'completed') {
  throw new Error("Credit request can only be created for completed internships");
}
```

#### 2. Enhanced Student Applications Endpoint

Updated `getMyApplications()` in `studentController.js` to include credit request availability information:

```javascript
// Get completion records for all applications
const completions = await InternshipCompletion.find({
  studentId: student._id,
  internshipId: { $in: applications.map(app => app.internshipId?._id).filter(Boolean) }
}).lean();

// Create a map of internshipId to completion data
const completionMap = new Map();
completions.forEach(completion => {
  completionMap.set(completion.internshipId.toString(), {
    isCompleted: completion.status === 'completed',
    creditRequestAvailable: completion.status === 'completed' && !completion.creditRequest?.requested,
    creditRequestStatus: completion.creditRequest?.status,
    creditRequestId: completion.creditRequest?.requestId,
    completionId: completion._id
  });
});
```

#### 3. New Endpoint for Completed Internships

Added new endpoint `GET /api/students/internships/completed` to fetch completed internships with credit request status:

```javascript
export const getCompletedInternshipsWithCreditStatus = async (req, res, next) => {
  // Find all completed internships for this student
  const query = {
    studentId: student._id,
    status: 'completed'
  };
  
  const completions = await InternshipCompletion.find(query)
    .populate('internshipId')
    .populate('companyId')
    .sort({ completionDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Enhance with credit request availability
  const enhancedCompletions = completions.map(completion => ({
    ...completion,
    creditRequestAvailable: !completion.creditRequest?.requested,
    canRequestCredit: !completion.creditRequest?.requested,
    creditRequestStatus: completion.creditRequest?.status || null,
    creditRequestId: completion.creditRequest?.requestId || null
  }));
};
```

### Frontend Changes

#### 1. CreditRequestButton Component

The `CreditRequestButton` component already implements the availability logic:

```typescript
// Check if internship is completed
const isCompleted = internshipCompletion.status === 'completed';

// Check if credit request already exists
const hasExistingRequest = internshipCompletion.creditRequest?.requested;

if (!isCompleted) {
  return (
    <Button variant="secondary" size="sm" disabled title="Complete the internship first">
      <Award size={16} className="mr-1" />
      Request Credits
    </Button>
  );
}
```

#### 2. ApplicationTable Component

Updated to show credit request availability indicators:

```typescript
{(row as any).creditRequest && (
  <div className="flex items-center gap-1 text-xs">
    {(row as any).creditRequest.creditRequestAvailable ? (
      <>
        <Award size={12} className="text-blue-600" />
        <span className="text-blue-600">Credits Available</span>
      </>
    ) : (row as any).creditRequest.creditRequestStatus ? (
      <>
        <CheckCircle size={12} className="text-green-600" />
        <span className="text-green-600">Request: {(row as any).creditRequest.creditRequestStatus.replace('_', ' ')}</span>
      </>
    ) : null}
  </div>
)}
```

#### 3. API Client

Added new method to fetch completed internships:

```typescript
getCompletedInternshipsWithCreditStatus: async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get(`/students/internships/completed?page=${page}&limit=${limit}`);
  return response.data;
}
```

## API Endpoints

### GET /api/students/applications

Returns student applications with credit request availability information.

**Response Enhancement:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "...",
        "internshipId": {...},
        "status": "accepted",
        "creditRequest": {
          "isCompleted": true,
          "creditRequestAvailable": true,
          "creditRequestStatus": null,
          "creditRequestId": null,
          "completionId": "..."
        }
      }
    ]
  }
}
```

### GET /api/students/internships/completed

Returns completed internships with credit request status.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "...",
        "internshipId": {...},
        "status": "completed",
        "creditRequestAvailable": true,
        "canRequestCredit": true,
        "creditRequestStatus": null,
        "creditRequestId": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

## Validation Rules

1. **Completion Status Check**: Credit requests can only be created for internships with `status === 'completed'`
2. **Duplicate Prevention**: Cannot create a credit request if `creditRequest.requested === true`
3. **Button State**: 
   - Disabled if internship not completed
   - Disabled if credit request already exists
   - Enabled only for completed internships without existing requests

## Testing

### Unit Tests

Created comprehensive unit tests in `backend/tests/unit/services/creditRequestAvailability.test.js`:

1. **Validation Tests**:
   - ✓ Should allow credit request for completed internship
   - ✓ Should reject credit request for non-completed internship
   - ✓ Should reject credit request for issued status internship
   - ✓ Should prevent duplicate credit requests

2. **Availability Indicator Tests**:
   - ✓ Should show credit request available for completed internship without request
   - ✓ Should show credit request not available for completed internship with existing request
   - ✓ Should show credit request not available for non-completed internship

All tests passing ✓

## UI Indicators

### Application List
- **Blue Award Icon**: "Credits Available" - Internship completed, no request yet
- **Green Check Icon**: "Request: [status]" - Credit request exists with current status

### Credit Request Button States
- **Disabled (Gray)**: "Request Credits" - Internship not completed
- **Disabled (Green)**: "Request Submitted" - Credit request already exists
- **Enabled (Blue)**: "Request Credits" - Ready to create request

## Error Messages

- `"Credit request can only be created for completed internships"` - Attempting to create request for non-completed internship
- `"Credit request already exists for this internship"` - Attempting to create duplicate request

## Future Enhancements

1. Add real-time updates when internship completion status changes
2. Add notification when internship becomes eligible for credit request
3. Add bulk credit request creation for multiple completed internships
4. Add analytics on credit request availability and conversion rates
