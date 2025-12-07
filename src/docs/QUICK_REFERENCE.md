# OpenAPI Documentation Quick Reference

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Schemas | PascalCase | `StudentProfile`, `InternshipApplication` |
| Path Parameters | camelCase | `{studentId}`, `{internshipId}` |
| Query Parameters | camelCase | `page`, `sortBy`, `dateFrom` |
| Tags | Title Case + Hyphens | `Students - Applications` |
| Enum Values | snake_case | `pending_admin_verification` |

## Required Fields by Endpoint Type

### All Endpoints
- ✅ `summary` - Brief description
- ✅ `description` - Detailed explanation
- ✅ `tags` - At least one tag
- ✅ `responses` - At least 200 and one error

### Authentication Endpoints
- ✅ `security: []` - Empty array (no auth required)

### Protected Endpoints
- ✅ `security: [{ BearerAuth: [] }]`

### POST/PUT/PATCH Endpoints
- ✅ `requestBody` with schema
- ✅ Mark required fields in schema

### Endpoints with Parameters
- ✅ Each parameter needs `description` and `example`

## Example Data Standards

### Names
✅ Priya Sharma, Rahul Kumar, Anjali Patel
❌ John Doe, string, user123

### Emails
✅ priya.sharma@iitdelhi.ac.in
❌ user@example.com, test@test.com

### Phone Numbers
✅ +91-9876543210
❌ 1234567890, 555-1234

### Colleges
✅ Indian Institute of Technology Delhi, NIT Trichy
❌ University, College ABC

### Locations
✅ Mumbai, Maharashtra; Bangalore, Karnataka
❌ City, State; Location

### Companies
✅ Tata Consultancy Services, Infosys, Wipro
❌ Company Inc, ACME Corp

## Common Response Patterns

### Success Response
```javascript
{
  success: true,
  message: "Operation completed successfully",
  data: { /* actual data */ }
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error message",
  error: {
    code: "ERROR_CODE",
    details: { /* error details */ }
  }
}
```

### Paginated Response
```javascript
{
  success: true,
  message: "Data retrieved",
  data: {
    items: [ /* array of items */ ],
    pagination: {
      currentPage: 1,
      totalPages: 10,
      totalItems: 100,
      itemsPerPage: 10
    }
  }
}
```

## Workflow Status Values

### Internship Lifecycle
```
draft → pending_admin_verification → admin_approved → 
open_for_applications → closed
```

### Application Flow
```
pending → mentor_approved → shortlisted → accepted/rejected
```

### Credit Transfer Flow
```
pending → mentor_reviewing → mentor_approved → 
admin_reviewing → admin_approved → completed
```

### Company Verification
```
pending_verification → verified/rejected/suspended/blocked
```

## Validation Commands

```bash
# Validate spec structure
npm run validate:openapi

# Validate examples
npm run validate:examples

# Check route coverage
npm run validate:routes

# Run all validations
npm run validate:docs

# Test Swagger UI
npm run test:swagger
```

## Common HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists or state conflict |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server-side error |

## Tag Categories

### Primary Role Tags
- Authentication
- Students
- Mentors
- Companies
- Admin
- Testing

### Workflow Tags
- Internship Lifecycle
- Application Flow
- Credit Transfer Flow
- Logbook Flow
- Company Verification

### Feature Tags
- Analytics
- Notifications
- File Upload
- AI Services

## Schema Reference Format

```javascript
// Reference existing schema
{ $ref: "#/components/schemas/StudentProfile" }

// Extend schema
{
  allOf: [
    { $ref: "#/components/schemas/SuccessResponse" },
    {
      type: "object",
      properties: {
        data: { $ref: "#/components/schemas/Student" }
      }
    }
  ]
}
```

## Testing Checklist

Before committing:
- [ ] Spec validates without errors
- [ ] All examples match schemas
- [ ] All routes are documented
- [ ] Swagger UI renders correctly
- [ ] "Try it out" works for sample endpoints
- [ ] Authentication can be configured
- [ ] Error responses are documented
- [ ] Realistic examples with Indian context

## Common Mistakes to Avoid

❌ Using generic examples ("string", "123")
❌ Missing required fields in examples
❌ Forgetting security requirements
❌ Not documenting error responses
❌ Inconsistent naming conventions
❌ Missing parameter descriptions
❌ Incomplete workflow documentation
❌ Not testing in Swagger UI

## Quick Links

- Full Guide: [src/docs/README.md](README.md)
- OpenAPI Spec: [openapi.mjs](openapi.mjs)
- Swagger UI: http://localhost:5000/api/docs
- OpenAPI Docs: https://swagger.io/specification/

---

**Tip**: Print this page and keep it handy while updating documentation!
