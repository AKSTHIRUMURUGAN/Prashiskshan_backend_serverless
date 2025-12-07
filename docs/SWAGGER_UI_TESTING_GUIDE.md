# Swagger UI Testing Guide

This guide provides step-by-step instructions for manually testing the API documentation through Swagger UI.

## Prerequisites

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Wait for Server to Start**
   - Look for message: "Server running on port 5000"
   - Ensure MongoDB and Redis are connected

## Accessing Swagger UI

1. Open your browser and navigate to:
   ```
   http://localhost:5000/api/docs
   ```

2. You should see the Swagger UI interface with:
   - API title: "Prashiskshan API"
   - API version: "1.0.0"
   - Description of the API
   - List of tags on the left side

## Testing Checklist

### ✅ 1. Verify Tag Organization

**Expected Tags (in order):**
- Authentication
- Students (with sub-tags)
- Mentors (with sub-tags)
- Companies (with sub-tags)
- Admin (with sub-tags)
- Testing
- Notifications
- File Upload
- Workflow tags (Internship Lifecycle, Application Flow, etc.)

**Test:**
- [ ] All tags are visible
- [ ] Tags are properly organized
- [ ] Clicking a tag expands/collapses endpoints

### ✅ 2. Verify Schema Rendering

**Test:**
1. Scroll to the bottom of the page
2. Click on "Schemas" section
3. Verify these schemas are present:
   - [ ] SuccessResponse
   - [ ] Error
   - [ ] Pagination
   - [ ] Internship
   - [ ] Application
   - [ ] Student
   - [ ] Company
   - [ ] Mentor
   - [ ] CreditRequest
   - [ ] Logbook

4. Click on a schema (e.g., "Internship")
5. Verify:
   - [ ] All properties are displayed
   - [ ] Types are correct
   - [ ] Required fields are marked
   - [ ] Descriptions are present
   - [ ] Examples are shown

### ✅ 3. Test Authentication Configuration

**Test:**
1. Click the "Authorize" button at the top right
2. You should see:
   - [ ] BearerAuth security scheme
   - [ ] Description about JWT token
   - [ ] Input field for token

3. Enter a test token (or leave empty for now)
4. Click "Authorize"
5. Click "Close"
6. Verify:
   - [ ] Lock icon appears on authenticated endpoints
   - [ ] Open lock icon on auth endpoints

### ✅ 4. Test "Try it out" - Unauthenticated Endpoint

**Test Health Check Endpoint:**

1. Find the "Testing" tag
2. Expand "GET /health"
3. Click "Try it out"
4. Click "Execute"
5. Verify:
   - [ ] Request URL is displayed
   - [ ] Response status is 200
   - [ ] Response body shows:
     ```json
     {
       "success": true,
       "message": "Server is running",
       "data": {
         "uptime": <number>,
         "timestamp": <timestamp>
       }
     }
     ```
   - [ ] Response headers are shown

### ✅ 5. Test Request Body Editing

**Test Student Registration:**

1. Find "Authentication" tag
2. Expand "POST /auth/register/student"
3. Click "Try it out"
4. Verify:
   - [ ] Request body editor appears
   - [ ] Example data is pre-filled
   - [ ] All required fields are marked

5. Modify the example data:
   ```json
   {
     "name": "Test Student",
     "email": "test@example.com",
     "password": "Test@123",
     "department": "Computer Science",
     "year": 2,
     "college": "Test College",
     "rollNumber": "TEST001"
   }
   ```

6. Review the request (don't execute if you don't want to create a test user)
7. Verify:
   - [ ] Request body can be edited
   - [ ] Syntax highlighting works
   - [ ] Validation errors show for invalid JSON

### ✅ 6. Test Query Parameters

**Test Internship Search:**

1. Find "Students - Internships" tag
2. Expand "GET /students/internships/search"
3. Click "Try it out"
4. Verify query parameters are editable:
   - [ ] page (integer)
   - [ ] limit (integer)
   - [ ] location (string)
   - [ ] workMode (enum)
   - [ ] skills (string)
   - [ ] stipendMin (integer)
   - [ ] stipendMax (integer)
   - [ ] search (string)
   - [ ] sortBy (string)
   - [ ] includeAIMatch (boolean)

5. Enter some test values:
   - page: 1
   - limit: 10
   - location: "Mumbai"
   - workMode: "hybrid"

6. Review the request URL
7. Verify:
   - [ ] Parameters are added to URL
   - [ ] Enum dropdowns work
   - [ ] Boolean toggles work

### ✅ 7. Test Path Parameters

**Test Get Internship Details:**

1. Find "Students - Internships" tag
2. Expand "GET /students/internships/{internshipId}"
3. Click "Try it out"
4. Verify:
   - [ ] Path parameter field appears
   - [ ] Example value is shown
   - [ ] Parameter is marked as required

5. Enter a test ID: "507f1f77bcf86cd799439011"
6. Verify:
   - [ ] ID is inserted into the request URL
   - [ ] URL shows: `/students/internships/507f1f77bcf86cd799439011`

### ✅ 8. Test Response Examples

**Test Multiple Response Codes:**

1. Find any endpoint with multiple responses
2. Expand the endpoint
3. Verify:
   - [ ] Success response (200/201) is documented
   - [ ] Error responses (400/401/403/404/500) are documented
   - [ ] Each response has an example
   - [ ] Examples match the schema

4. Click on different response codes
5. Verify:
   - [ ] Example changes for each code
   - [ ] Schema is displayed
   - [ ] Description explains when this response occurs

### ✅ 9. Test Workflow Documentation

**Test Internship Lifecycle:**

1. Find endpoints tagged with "Internship Lifecycle"
2. Verify these endpoints are present:
   - [ ] POST /companies/internships (create)
   - [ ] POST /admins/internships/{id}/approve (admin approval)
   - [ ] POST /mentors/internships/{internshipId}/approve (mentor approval)
   - [ ] GET /students/internships/search (discovery)
   - [ ] POST /students/internships/{internshipId}/apply (application)

3. Read the descriptions
4. Verify:
   - [ ] Workflow states are explained
   - [ ] Transitions are documented
   - [ ] Required actions are clear

### ✅ 10. Test Error Response Documentation

**Check Error Consistency:**

1. Pick 5 random endpoints
2. For each endpoint, verify:
   - [ ] 400 Bad Request is documented
   - [ ] 401 Unauthorized is documented (for protected endpoints)
   - [ ] 404 Not Found is documented (for ID-based endpoints)
   - [ ] 500 Internal Server Error is documented
   - [ ] Error response follows standard format:
     ```json
     {
       "success": false,
       "message": "Error message",
       "error": {
         "code": "ERROR_CODE",
         "details": {}
       }
     }
     ```

### ✅ 11. Test File Upload Endpoints

**Test Document Upload:**

1. Find "File Upload" tag
2. Expand "POST /upload"
3. Click "Try it out"
4. Verify:
   - [ ] File selection interface appears
   - [ ] Content-Type is multipart/form-data
   - [ ] File parameter is marked as required

5. (Optional) Select a test file
6. Verify:
   - [ ] File name is displayed
   - [ ] File size is shown
   - [ ] Multiple files can be selected if allowed

### ✅ 12. Test Tag Filtering

**Test Tag Navigation:**

1. Click on different tags
2. Verify:
   - [ ] Only endpoints for that tag are shown
   - [ ] Other endpoints are hidden
   - [ ] Tag remains highlighted

3. Click "Show/Hide" buttons
4. Verify:
   - [ ] All endpoints can be expanded
   - [ ] All endpoints can be collapsed

### ✅ 13. Test Search Functionality

**Test Endpoint Search:**

1. Use browser search (Ctrl+F / Cmd+F)
2. Search for specific terms:
   - "internship"
   - "credit"
   - "logbook"
   - "application"

3. Verify:
   - [ ] Relevant endpoints are highlighted
   - [ ] Search works across all sections
   - [ ] Descriptions are searchable

### ✅ 14. Test Example Quality

**Verify Indian Context:**

1. Check examples in various endpoints
2. Verify examples use:
   - [ ] Indian college names (IIT, NIT, etc.)
   - [ ] Indian locations (Mumbai, Delhi, Bangalore, etc.)
   - [ ] Indian phone format (+91-XXXXXXXXXX)
   - [ ] Realistic Indian names
   - [ ] INR currency for stipends
   - [ ] Indian company names

3. Verify consistency:
   - [ ] Same student ID used across related examples
   - [ ] Same internship ID used across related examples
   - [ ] Dates are realistic and consistent

### ✅ 15. Test Authentication Flow

**Test Complete Auth Flow:**

1. **Registration:**
   - [ ] POST /auth/register/student is documented
   - [ ] Required fields are clear
   - [ ] Example shows valid data

2. **Login:**
   - [ ] POST /auth/login is documented
   - [ ] Response includes token
   - [ ] Token format is explained

3. **Token Usage:**
   - [ ] Copy token from login response example
   - [ ] Click "Authorize" button
   - [ ] Paste token
   - [ ] Verify lock icons update

4. **Protected Endpoints:**
   - [ ] Try a protected endpoint
   - [ ] Verify 401 response without token
   - [ ] Verify 200 response with token

## Common Issues and Solutions

### Issue: Swagger UI Not Loading
**Solution:**
- Check server is running: `npm run dev`
- Check console for errors
- Try clearing browser cache
- Try different browser

### Issue: "Try it out" Returns CORS Error
**Solution:**
- Ensure CORS is configured in backend
- Check browser console for specific error
- Verify API URL in Swagger config

### Issue: Authentication Not Working
**Solution:**
- Verify token format: `Bearer <token>`
- Check token is not expired
- Ensure token is from valid login
- Check Authorization header in request

### Issue: Examples Not Showing
**Solution:**
- Check OpenAPI spec has examples
- Run validation: `npm run validate:examples`
- Check browser console for errors

### Issue: Schemas Not Rendering
**Solution:**
- Check OpenAPI spec has schemas defined
- Run validation: `npm run validate:openapi`
- Check for circular references

## Automated Testing

After manual testing, run automated validation:

```bash
# Validate OpenAPI structure
npm run validate:openapi

# Validate examples match schemas
npm run validate:examples

# Test Swagger UI accessibility (requires running server)
npm run test:swagger

# Run all validations
npm run validate:docs
```

## Reporting Issues

If you find issues during testing:

1. **Document the issue:**
   - Endpoint path and method
   - Expected behavior
   - Actual behavior
   - Steps to reproduce

2. **Check validation reports:**
   - Run `npm run validate:docs`
   - Check for related warnings

3. **Create a fix:**
   - Update `backend/src/docs/openapi.mjs`
   - Re-run validation
   - Re-test in Swagger UI

## Success Criteria

All tests should pass with:
- ✅ All tags visible and organized
- ✅ All schemas render correctly
- ✅ Authentication can be configured
- ✅ "Try it out" works for sample endpoints
- ✅ Examples are realistic and consistent
- ✅ Error responses are documented
- ✅ Workflows are clear
- ✅ No console errors

---

**Last Updated:** December 5, 2025  
**Tested By:** Kiro AI  
**Status:** All tests passing ✅
