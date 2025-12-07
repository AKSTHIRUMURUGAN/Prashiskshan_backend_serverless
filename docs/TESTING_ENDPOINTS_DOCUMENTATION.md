# Testing Endpoints Documentation Summary

## Overview
This document summarizes the comprehensive documentation added for all testing and utility endpoints in the Prashiskshan API.

## Documented Endpoints

### 1. Health Check Endpoint
- **Path**: `GET /api/health`
- **Description**: Returns API health status and server uptime
- **Authentication**: None (publicly accessible)
- **Use Case**: Monitoring and load balancer health checks
- **Response**: Server uptime in seconds

### 2. Email Service Test
- **Path**: `POST /api/tests/email`
- **Description**: Send a test email to verify email service configuration
- **Authentication**: Admin only (Bearer token required)
- **Use Case**: Test email templates and delivery before sending to real users
- **Supported Templates**: welcome, application_received, application_approved, application_rejected, logbook_approved, logbook_revision, completion_certificate
- **Request Example**:
  ```json
  {
    "to": "test@example.com",
    "subject": "Test Email from Prashiskshan",
    "template": "welcome",
    "data": {
      "name": "Rahul Sharma",
      "link": "https://prashiskshan.edu/dashboard"
    }
  }
  ```

### 3. S3/R2 Storage Test
- **Path**: `POST /api/tests/s3`
- **Description**: Upload a test file to S3/R2 storage
- **Authentication**: Admin only (Bearer token required)
- **Use Case**: Test file upload functionality and storage credentials
- **Content Type**: multipart/form-data
- **Parameters**: 
  - `file` (required): File to upload
  - `folder` (optional): Folder path in bucket

### 4. Queue Service Test
- **Path**: `POST /api/tests/queue`
- **Description**: Add a test job to the specified queue
- **Authentication**: Admin only (Bearer token required)
- **Use Case**: Test background job processing and Redis connectivity
- **Supported Queues**: email, sms, logbook, report, notification, completion, ai
- **Request Example**:
  ```json
  {
    "queueName": "email",
    "data": {
      "to": "test@example.com",
      "template": "welcome"
    }
  }
  ```

### 5. Gemini AI Test
- **Path**: `POST /api/tests/gemini`
- **Description**: Send a test prompt to Gemini AI
- **Authentication**: Admin only (Bearer token required)
- **Use Case**: Test AI text generation and API credentials
- **Models**: 
  - `flash`: Fast responses
  - `pro`: Higher quality responses
- **Request Example**:
  ```json
  {
    "prompt": "Write a brief summary about the importance of internships in education",
    "model": "flash"
  }
  ```

### 6. Service Status Check
- **Path**: `GET /api/tests/status`
- **Description**: Check configuration status of all test services
- **Authentication**: Admin only (Bearer token required)
- **Use Case**: Quickly verify which services are properly configured
- **Returns**: Configuration status for email, S3, queue, and Gemini services

### 7. Firebase Debug Endpoint
- **Path**: `GET /api/debug/firebase`
- **Description**: Get detailed Firebase configuration and connection status
- **Authentication**: None (for debugging purposes)
- **Use Case**: Debug authentication issues
- **Returns**: Firebase initialization status, credentials info, and connection test results

### 8. Clear Firebase Users (Non-production)
- **Path**: `DELETE /api/test/firebase-users`
- **Description**: Delete all Firebase authentication users
- **Authentication**: None (disabled in production)
- **Use Case**: Clean up test data in development/staging
- **Returns**: Count of deleted users

### 9. Clear MongoDB Data (Non-production)
- **Path**: `DELETE /api/test/mongo-data`
- **Description**: Delete all data from MongoDB collections
- **Authentication**: None (disabled in production)
- **Use Case**: Clean up test data in development/staging
- **Returns**: Count of deleted documents per collection

## Documentation Features

### Complete Schema Definitions
All testing endpoints have complete schema definitions including:
- `TestEmailRequest`: Email test request body
- `TestS3UploadRequest`: File upload request body
- `TestQueueJobRequest`: Queue job request body
- `TestGeminiRequest`: AI prompt request body
- `TestServicesStatusResponse`: Service status response
- `HealthCheckResponse`: Health check response
- `FirebaseDebugResponse`: Firebase debug response

### Realistic Examples
All endpoints include:
- ✅ Request body examples with realistic Indian context data
- ✅ Success response examples (200 status)
- ✅ Error response examples (400, 401, 403, 500 status codes)
- ✅ Detailed descriptions explaining use cases

### Proper Tagging
All endpoints are tagged with:
- ✅ "Testing" tag for easy navigation in Swagger UI
- ✅ Consistent organization with other API endpoints

### Error Handling Documentation
All authenticated endpoints document:
- ✅ 400 Bad Request (missing/invalid parameters)
- ✅ 401 Unauthorized (invalid/missing token)
- ✅ 403 Forbidden (admin access required)
- ✅ 500 Internal Server Error (service failures)

## Requirements Coverage

This implementation satisfies all requirements from the specification:

- ✅ **Requirement 6.1**: Health check endpoint documented
- ✅ **Requirement 6.2**: Email service test endpoint documented
- ✅ **Requirement 6.3**: S3/R2 storage test endpoint documented
- ✅ **Requirement 6.4**: Gemini AI test endpoint documented
- ✅ **Requirement 6.5**: Queue test endpoint documented
- ✅ **Requirement 6.6**: Service status endpoint documented
- ✅ **Requirement 6.7**: All probe endpoints documented

## Verification

A verification script has been created at `backend/scripts/verify-testing-endpoints.js` that checks:
1. All required endpoints exist
2. All endpoints have the "Testing" tag
3. All endpoints have detailed descriptions
4. POST endpoints have request body examples or schemas
5. All endpoints have response examples
6. Authenticated endpoints have error response documentation
7. All required schemas exist

Run verification:
```bash
node backend/scripts/verify-testing-endpoints.js
```

## Swagger UI Access

The documented testing endpoints can be viewed and tested at:
- Development: `http://localhost:5000/api/docs`
- Production: `https://api.prashiskshan.edu/api/docs`

Navigate to the "Testing" tag in Swagger UI to see all testing endpoints grouped together.

## Next Steps

To use these endpoints:
1. Start the server: `npm start`
2. Open Swagger UI: `http://localhost:5000/api/docs`
3. For authenticated endpoints, click "Authorize" and enter your admin Bearer token
4. Navigate to the "Testing" section
5. Try out the endpoints using the "Try it out" button

## Notes

- Most testing endpoints require admin authentication for security
- Non-production cleanup endpoints are automatically disabled in production
- All endpoints return consistent JSON responses following the API standard
- Error responses include detailed error codes and messages for debugging
