# Approval Workflow Service Implementation

## Overview

The `ApprovalWorkflowService` manages the two-stage approval process for internship postings:
1. **Admin Verification** - Ensures internship legitimacy and platform compliance
2. **Mentor Approval** - Ensures academic and departmental suitability

## Implementation Details

### Location
`backend/src/services/approvalWorkflowService.js`

### Key Methods

#### 1. `adminApprove(internshipId, adminId, comments)`
- **Purpose**: Admin approves an internship posting
- **Requirements**: 2.2, 2.4
- **Behavior**:
  - Validates internship is in `pending_admin_verification` status
  - Transitions status to `admin_approved`
  - Records admin review details (reviewer, timestamp, comments)
  - Notifies all mentors in the relevant department
- **Returns**: Updated internship document

#### 2. `adminReject(internshipId, adminId, reasons)`
- **Purpose**: Admin rejects an internship posting
- **Requirements**: 2.3
- **Behavior**:
  - Validates internship is in `pending_admin_verification` status
  - Requires at least one rejection reason
  - Transitions status to `admin_rejected`
  - Records admin review details with rejection reasons
  - Notifies the company with rejection reasons
- **Returns**: Updated internship document

#### 3. `mentorApprove(internshipId, mentorId, comments)`
- **Purpose**: Mentor approves an internship for their department
- **Requirements**: 3.2, 3.4
- **Behavior**:
  - Validates internship is in `admin_approved` status
  - Validates mentor's department matches internship department
  - Transitions status to `open_for_applications` (visible to students)
  - Records mentor approval details (mentor ID, timestamp, comments, department)
  - Notifies the company that internship is now live
- **Returns**: Updated internship document

#### 4. `mentorReject(internshipId, mentorId, reasons)`
- **Purpose**: Mentor rejects an internship for their department
- **Requirements**: 3.3
- **Behavior**:
  - Validates internship is in `admin_approved` status
  - Validates mentor's department matches internship department
  - Requires rejection reason
  - Transitions status to `mentor_rejected`
  - Records mentor rejection details
  - Notifies both admin and company of rejection
- **Returns**: Updated internship document

#### 5. `validateApprovalPermission(userId, role, internshipId, action)`
- **Purpose**: Validates if a user has permission to perform an approval action
- **Requirements**: 3.5
- **Behavior**:
  - For admins: Validates admin is active and internship is in correct state
  - For mentors: Validates mentor is active, internship is in correct state, and department matches
  - Returns authorization result with user details
- **Returns**: Validation result object

## State Transitions

### Admin Approval Flow
```
pending_admin_verification → admin_approved (via adminApprove)
pending_admin_verification → admin_rejected (via adminReject)
```

### Mentor Approval Flow
```
admin_approved → open_for_applications (via mentorApprove)
admin_approved → mentor_rejected (via mentorReject)
```

## Notification Strategy

### Admin Approval
- **Recipients**: All mentors in the internship's department
- **Priority**: High
- **Message**: Notifies mentors that an internship requires their approval

### Admin Rejection
- **Recipients**: Company that posted the internship
- **Priority**: High
- **Message**: Includes rejection reasons

### Mentor Approval
- **Recipients**: Company that posted the internship
- **Priority**: High
- **Message**: Notifies company that internship is now live and visible to students

### Mentor Rejection
- **Recipients**: Company and all active admins
- **Priority**: High (company), Medium (admins)
- **Message**: Includes rejection reason

## Error Handling

The service implements comprehensive error handling:
- **Validation Errors**: Invalid status, missing fields, unauthorized access
- **Not Found Errors**: Internship, admin, or mentor not found
- **Business Logic Errors**: Department mismatch, inactive accounts
- **Notification Failures**: Logged but don't block the approval/rejection process

## Integration Points

### Dependencies
- `InternshipStateMachine`: For state transition validation and execution
- `NotificationService`: For sending notifications to stakeholders
- `Internship Model`: For internship data persistence
- `Admin Model`: For admin details
- `Mentor Model`: For mentor details and department validation
- `Company Model`: For company notification details

### Usage Example

```javascript
import { approvalWorkflowService } from './services/approvalWorkflowService.js';

// Admin approves internship
const internship = await approvalWorkflowService.adminApprove(
  'INT-123',
  adminMongoId,
  'Looks good, approved for mentor review'
);

// Mentor approves internship
const approvedInternship = await approvalWorkflowService.mentorApprove(
  'INT-123',
  mentorMongoId,
  'Suitable for our department students'
);

// Validate permission before action
const validation = await approvalWorkflowService.validateApprovalPermission(
  mentorMongoId,
  'mentor',
  'INT-123',
  'approve'
);
```

## Testing Considerations

The service should be tested for:
1. Valid approval/rejection flows
2. Invalid state transitions
3. Department mismatch scenarios
4. Permission validation for different roles
5. Notification delivery (with mocked notification service)
6. Audit trail creation
7. Error handling for missing entities

## Requirements Coverage

- ✅ **Requirement 2.2**: Admin approval with state transition and mentor notifications
- ✅ **Requirement 2.3**: Admin rejection with state transition and company notification
- ✅ **Requirement 2.4**: Mentor notification on admin approval
- ✅ **Requirement 3.2**: Mentor approval with state transition and student visibility
- ✅ **Requirement 3.3**: Mentor rejection with multi-party notifications
- ✅ **Requirement 3.4**: Mentor approval data persistence
- ✅ **Requirement 3.5**: Multi-mentor department authorization

## Next Steps

1. Implement controller endpoints that use this service
2. Add integration tests for the approval workflow
3. Implement property-based tests for the approval logic (tasks 5.2-5.5)
4. Add API documentation for approval endpoints
