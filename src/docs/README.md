# API Documentation Maintenance Guide

This guide explains how to maintain and update the OpenAPI documentation for the Prashiskshan API.

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Updating Documentation](#updating-documentation)
4. [Naming Conventions](#naming-conventions)
5. [Example Quality Standards](#example-quality-standards)
6. [Workflow Documentation Requirements](#workflow-documentation-requirements)
7. [Validation and Testing](#validation-and-testing)
8. [Pre-Commit Validation](#pre-commit-validation)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

## Overview

The Prashiskshan API documentation is defined in `openapi.mjs` using the OpenAPI 3.0 specification. The documentation is served through Swagger UI at `/api/docs` and provides interactive testing capabilities for all endpoints.

**Key Principles:**
- Documentation must match actual implementation
- All endpoints must be documented before deployment
- Examples must use realistic, Indian-context data
- Schemas must be complete with required fields marked
- Workflows must be clearly explained with state transitions

## File Structure

```
backend/src/docs/
├── README.md                    # This file - maintenance guide
├── openapi.mjs                  # Main OpenAPI specification
├── openapi.json                 # Generated JSON spec (build artifact)
├── openapi-examples.json        # Reusable example data
└── swagger.yaml                 # Legacy YAML spec (deprecated)

backend/scripts/
├── build-openapi.mjs            # Builds JSON from openapi.mjs
├── validate-openapi-spec.js     # Validates OpenAPI structure
├── validate-schema-examples.js  # Validates examples match schemas
├── validate-route-coverage.js   # Checks all routes are documented
└── test-swagger-ui.js           # Tests Swagger UI rendering
```

## Updating Documentation

### When to Update

Update the OpenAPI documentation whenever you:
- Add a new endpoint
- Modify request/response schemas
- Change endpoint behavior
- Add or modify query parameters
- Update status codes or error responses
- Change authentication requirements
- Modify workflow state transitions

### Update Process

1. **Modify `openapi.mjs`** with your changes
2. **Run validation** to ensure spec is valid
3. **Test in Swagger UI** to verify rendering
4. **Update examples** if schemas changed
5. **Commit changes** (pre-commit hook will validate)

### Step-by-Step: Adding a New Endpoint

```javascript
// 1. Add the path entry in the paths section
paths: {
  "/students/profile": {
    get: {
      // 2. Add summary and description
      summary: "Get student profile",
      description: "Retrieves the complete profile for the authenticated student including credits, readiness score, and mentor information.",
      
      // 3. Add appropriate tags
      tags: ["Students", "Students - Profile"],
      
      // 4. Add security requirement (or empty array for public endpoints)
      security: [{ BearerAuth: [] }],
      
      // 5. Add parameters if needed
      parameters: [
        {
          name: "includeHistory",
          in: "query",
          description: "Include internship history in response",
          required: false,
          schema: { type: "boolean", default: false },
          example: true
        }
      ],
      
      // 6. Add responses with examples
      responses: {
        200: {
          description: "Student profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/StudentProfile" }
                    }
                  }
                ]
              },
              example: {
                success: true,
                message: "Profile retrieved successfully",
                data: {
                  studentId: "STU001",
                  name: "Priya Sharma",
                  email: "priya.sharma@college.edu",
                  // ... more fields
                }
              }
            }
          }
        },
        401: {
          description: "Unauthorized - Invalid or missing token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                message: "Authentication required",
                error: {
                  code: "UNAUTHORIZED",
                  details: { reason: "Invalid token" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Step-by-Step: Adding a New Schema

```javascript
// Add to components.schemas section
schemas: {
  StudentProfile: {
    type: "object",
    required: ["studentId", "name", "email", "department"],
    properties: {
      studentId: {
        type: "string",
        description: "Unique student identifier",
        example: "STU001"
      },
      name: {
        type: "string",
        description: "Full name of the student",
        example: "Priya Sharma"
      },
      email: {
        type: "string",
        format: "email",
        description: "Student email address",
        example: "priya.sharma@college.edu"
      },
      department: {
        type: "string",
        description: "Academic department",
        example: "Computer Science"
      },
      // ... more properties
    },
    description: "Complete student profile information"
  }
}
```

## Naming Conventions

### Schema Names

Use **PascalCase** for all schema names:

```javascript
✅ Good:
- StudentProfile
- InternshipApplication
- CreditRequest
- LogbookEntry
- CompanyVerificationStatus

❌ Bad:
- student_profile
- internshipapplication
- credit-request
```

### Path Parameters

Use **camelCase** for path parameters:

```javascript
✅ Good:
- {studentId}
- {internshipId}
- {applicationId}
- {creditRequestId}

❌ Bad:
- {student_id}
- {StudentId}
- {internship-id}
```

### Query Parameters

Use **camelCase** for query parameters:

```javascript
✅ Good:
- page
- limit
- sortBy
- sortOrder
- dateFrom
- dateTo
- includeHistory

❌ Bad:
- PageNumber
- sort_by
- date-from
```

### Tag Names

Use **Title Case** with hyphens for hierarchical tags:

```javascript
✅ Good:
- "Students"
- "Students - Dashboard"
- "Students - Applications"
- "Internship Lifecycle"
- "Credit Transfer Flow"

❌ Bad:
- "students"
- "Students/Dashboard"
- "students_applications"
```

### Enum Values

Use **snake_case** for enum values (matching database):

```javascript
✅ Good:
- "pending_admin_verification"
- "admin_approved"
- "open_for_applications"
- "mentor_rejected"

❌ Bad:
- "PendingAdminVerification"
- "adminApproved"
- "open-for-applications"
```

## Example Quality Standards

All examples must meet these quality standards:

### 1. Use Realistic Data

```javascript
✅ Good:
{
  name: "Priya Sharma",
  email: "priya.sharma@iitdelhi.ac.in",
  phone: "+91-9876543210",
  college: "Indian Institute of Technology Delhi",
  location: "New Delhi, Delhi",
  companyName: "Tata Consultancy Services"
}

❌ Bad:
{
  name: "string",
  email: "user@example.com",
  phone: "1234567890",
  college: "University",
  location: "City",
  companyName: "Company Inc"
}
```

### 2. Follow Indian Context

- **Names**: Use common Indian names (Priya, Rahul, Anjali, Arjun, etc.)
- **Colleges**: Use real Indian institutions (IIT Delhi, NIT Trichy, BITS Pilani, etc.)
- **Locations**: Use Indian cities and states (Mumbai, Maharashtra; Bangalore, Karnataka)
- **Phone Numbers**: Use +91 country code and 10-digit format
- **Companies**: Use well-known Indian companies (TCS, Infosys, Wipro, etc.)
- **Dates**: Use DD/MM/YYYY format in descriptions

### 3. Include All Required Fields

```javascript
✅ Good:
{
  title: "Full Stack Developer Intern",
  description: "Work on MERN stack projects...",
  department: "Computer Science",
  duration: 12,
  location: "Bangalore, Karnataka",
  workMode: "hybrid",
  stipend: 15000,
  slots: 5,
  startDate: "2024-06-01",
  applicationDeadline: "2024-05-15"
}

❌ Bad (missing required fields):
{
  title: "Intern",
  duration: 12
}
```

### 4. Show Typical Use Cases

Examples should represent common, real-world scenarios:

```javascript
✅ Good - Typical internship search:
{
  location: "Bangalore",
  workMode: "hybrid",
  skills: ["JavaScript", "React", "Node.js"],
  minStipend: 10000,
  page: 1,
  limit: 20
}

❌ Bad - Unrealistic search:
{
  location: "Antarctica",
  skills: ["COBOL", "Assembly"],
  minStipend: 1000000
}
```

### 5. Be Consistent Across Related Endpoints

Use the same example entities across related endpoints:

```javascript
// POST /internships - Create internship
{
  internshipId: "INT001",
  title: "Full Stack Developer Intern",
  // ...
}

// GET /internships/{internshipId} - Get internship details
// Use the same INT001 with same title

// PUT /internships/{internshipId} - Update internship
// Use INT001 again
```

## Workflow Documentation Requirements

When documenting workflows, include:

### 1. State Diagram

Include a visual representation of state transitions:

```javascript
description: `
Internship Lifecycle Workflow:

draft → pending_admin_verification → admin_approved → open_for_applications → closed
                                   ↓
                              admin_rejected
                                   
admin_approved → mentor_rejected

States:
- draft: Initial state when company creates internship
- pending_admin_verification: Submitted for admin review
- admin_approved: Admin approved, awaiting mentor approval
- admin_rejected: Admin rejected the internship
- mentor_rejected: Mentor rejected the internship
- open_for_applications: Active and accepting applications
- closed: No longer accepting applications
`
```

### 2. Status Values

List all possible status values with descriptions:

```javascript
enum: [
  "draft",                      // Initial creation state
  "pending_admin_verification", // Awaiting admin review
  "admin_approved",             // Admin approved, needs mentor approval
  "admin_rejected",             // Rejected by admin
  "mentor_rejected",            // Rejected by mentor
  "open_for_applications",      // Active and accepting applications
  "closed",                     // Completed or deadline passed
  "cancelled"                   // Cancelled by company
]
```

### 3. Transition Rules

Document what actions trigger transitions:

```javascript
description: `
Transition Rules:
- draft → pending_admin_verification: Company submits internship
- pending_admin_verification → admin_approved: Admin approves (POST /admins/internships/{id}/approve)
- pending_admin_verification → admin_rejected: Admin rejects (POST /admins/internships/{id}/reject)
- admin_approved → open_for_applications: Mentor approves (POST /mentors/internships/{id}/approve)
- admin_approved → mentor_rejected: Mentor rejects (POST /mentors/internships/{id}/reject)
- open_for_applications → closed: Deadline passes or company closes
`
```

### 4. Required Actions

Explain what must happen at each state:

```javascript
description: `
Required Actions by State:
- draft: Company must complete all required fields and submit
- pending_admin_verification: Admin must review and approve/reject
- admin_approved: Mentor must review and approve/reject
- open_for_applications: Students can apply, company can review applications
- closed: No new applications, company can complete internship
`
```

### 5. Error Cases

Document error conditions and handling:

```javascript
description: `
Error Cases:
- Cannot transition from closed back to open_for_applications
- Cannot approve if required documents are missing
- Cannot reject without providing a reason
- Cannot apply if slots are full
`
```

## Validation and Testing

### Available Validation Scripts

Run these scripts before committing changes:

```bash
# Validate OpenAPI spec structure
npm run validate:openapi

# Validate examples match schemas
npm run validate:examples

# Check all routes are documented
npm run validate:routes

# Generate detailed route coverage report
npm run validate:routes:report

# Test Swagger UI rendering
npm run test:swagger

# Run all validations
npm run validate:docs
```

### Validation Checklist

Before committing documentation changes:

- [ ] OpenAPI spec is valid (no syntax errors)
- [ ] All new endpoints are documented
- [ ] All schemas are complete with required fields
- [ ] All examples match their schemas
- [ ] All examples use realistic data
- [ ] All endpoints have appropriate tags
- [ ] All authenticated endpoints have security requirements
- [ ] All error responses are documented
- [ ] Swagger UI renders without errors
- [ ] "Try it out" functionality works for sample endpoints

### Manual Testing in Swagger UI

1. Start the server: `npm run dev`
2. Open Swagger UI: http://localhost:5000/api/docs
3. Test authentication:
   - Click "Authorize" button
   - Enter a valid JWT token
   - Verify token is applied to requests
4. Test an endpoint:
   - Expand an endpoint
   - Click "Try it out"
   - Modify parameters/body as needed
   - Click "Execute"
   - Verify response matches documentation
5. Test error cases:
   - Try invalid data
   - Verify error responses match documentation

## Pre-Commit Validation

### Setting Up the Pre-Commit Hook

A pre-commit hook automatically validates the OpenAPI spec before allowing commits:

```bash
# The hook is located at:
.git/hooks/pre-commit

# To install/update the hook:
cp backend/scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### What the Hook Validates

The pre-commit hook runs:
1. OpenAPI spec structure validation
2. Schema-example consistency check
3. Route coverage verification

If any validation fails, the commit is blocked and you must fix the issues.

### Bypassing the Hook (Not Recommended)

In rare cases where you need to commit without validation:

```bash
git commit --no-verify -m "Your message"
```

**Warning**: Only bypass validation if you're committing work-in-progress documentation that you plan to fix in a follow-up commit.

## Common Tasks

### Adding a New Role-Based Endpoint Group

1. Add new tag to tag list (if needed)
2. Create endpoints under appropriate path prefix
3. Add role-specific security requirements
4. Group with appropriate tags
5. Add workflow tags if applicable

### Updating a Schema

1. Locate schema in `components.schemas`
2. Modify properties as needed
3. Update `required` array if needed
4. Update all examples using this schema
5. Run `npm run validate:examples`

### Adding Query Parameters

1. Add to `parameters` array in endpoint
2. Include description and example
3. Mark as required or optional
4. Specify default value if applicable
5. Add to example requests

### Documenting a New Workflow

1. Create workflow description with state diagram
2. Define status enum with all values
3. Document transition rules
4. Add workflow tag to related endpoints
5. Include workflow in endpoint descriptions

### Adding Error Responses

1. Add response for appropriate status code (400, 401, 403, 404, 500)
2. Use Error schema reference
3. Provide realistic example
4. Include error code and details
5. Document when this error occurs

## Troubleshooting

### Swagger UI Not Loading

**Problem**: Swagger UI shows blank page or errors

**Solutions**:
- Check browser console for JavaScript errors
- Verify `openapi.mjs` exports valid object
- Run `npm run validate:openapi`
- Check server logs for errors
- Clear browser cache

### Schema Reference Not Found

**Problem**: `$ref` shows "Could not resolve reference"

**Solutions**:
- Verify schema exists in `components.schemas`
- Check spelling and capitalization
- Ensure path starts with `#/components/schemas/`
- Run `npm run validate:openapi`

### Example Doesn't Match Schema

**Problem**: Validation fails with schema mismatch

**Solutions**:
- Run `npm run validate:examples` for details
- Check required fields are present
- Verify data types match schema
- Check enum values are valid
- Ensure nested objects match structure

### Route Not Documented

**Problem**: `validate:routes` reports missing routes

**Solutions**:
- Add path entry in `openapi.mjs`
- Verify path matches Express route exactly
- Check HTTP method matches
- Include path parameters in correct format
- Run `npm run validate:routes:report` for details

### Authentication Not Working in Swagger UI

**Problem**: Requests return 401 even with token

**Solutions**:
- Verify token is valid and not expired
- Check token format: `Bearer {token}` (with space)
- Ensure endpoint has `security: [{ BearerAuth: [] }]`
- Verify BearerAuth is defined in securitySchemes
- Check server is accepting the token

### Examples Not Showing in Swagger UI

**Problem**: Examples don't appear in Swagger UI

**Solutions**:
- Verify example is in correct location (under content type)
- Check example is valid JSON
- Ensure example matches schema
- Try using `examples` (plural) instead of `example`
- Clear browser cache and reload

## Best Practices

1. **Document as you code**: Update documentation when implementing features
2. **Test interactively**: Use Swagger UI to verify documentation works
3. **Keep examples realistic**: Use Indian context and real-world scenarios
4. **Be consistent**: Follow naming conventions and patterns
5. **Validate frequently**: Run validation scripts during development
6. **Review workflows**: Ensure state transitions are clear and complete
7. **Document errors**: Include common error cases and responses
8. **Update version**: Increment API version for breaking changes
9. **Maintain changelog**: Document changes in API description
10. **Collaborate**: Review documentation changes with team

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Best Practices](https://swagger.io/blog/api-design/openapi-best-practices/)
- [JSON Schema Validation](https://json-schema.org/)

## Support

For questions or issues with API documentation:
- Check this guide first
- Review existing documentation patterns in `openapi.mjs`
- Run validation scripts to identify issues
- Consult the OpenAPI specification
- Ask the team for guidance on complex workflows

---

**Last Updated**: December 2024
**Maintained By**: Prashiskshan Development Team
