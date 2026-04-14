# Student Bulk Import Guide

## Overview

The Student Bulk Import feature allows administrators to efficiently onboard multiple students by uploading their information in bulk. The system creates Firebase authentication accounts and MongoDB profile records without sending welcome emails or requiring email verification.

## Features

- ✅ Creates Firebase authentication accounts with auto-verified emails
- ✅ Generates secure random passwords for each student
- ✅ Creates MongoDB student profile records
- ✅ Handles duplicate emails gracefully (updates existing records)
- ✅ Provides detailed import status and error reporting
- ✅ Exports credentials as CSV for distribution
- ✅ No welcome emails or verification emails sent

## API Endpoints

### 1. Download CSV Template

**GET** `/api/admins/students/import/template`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
Downloads a CSV template file with sample data that you can fill in.

### 2. Start Bulk Import

**POST** `/api/admins/students/import`

**Method 1: Upload CSV/Excel File**

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: CSV or Excel file (.csv, .xls, .xlsx)

**Method 2: Send JSON Data**

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "students": [
    {
      "email": "student1@example.com",
      "name": "John Doe",
      "department": "Computer Science",
      "year": 3,
      "college": "Example College",
      "rollNumber": "CS2021001",
      "phone": "1234567890",
      "bio": "Passionate about software development",
      "skills": "JavaScript,Python,React",
      "interests": "Web Development,AI"
    },
    {
      "email": "student2@example.com",
      "name": "Jane Smith",
      "department": "Electrical Engineering",
      "year": 2,
      "college": "Example College"
    }
  ]
}
```

**Required Fields:**
- `email` - Valid email address
- `name` - Student's full name
- `department` - Department name
- `year` - Year of study (1-5)
- `college` - College name

**Optional Fields:**
- `rollNumber` - Student roll number
- `phone` - Contact phone number
- `bio` - Student biography
- `skills` - Comma-separated list of skills
- `interests` - Comma-separated list of interests

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "IMPORT-1733718674000"
  },
  "message": "Import started"
}
```

### 3. Check Import Status

**GET** `/api/admins/students/import/:jobId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "total": 2,
    "processed": 2,
    "errors": [],
    "credentials": [
      {
        "email": "student1@example.com",
        "password": "SecurePass123!",
        "studentId": "STD-ABC123",
        "firebaseUid": "firebase-uid-123"
      }
    ],
    "startedAt": "2025-12-09T10:00:00Z",
    "completedAt": "2025-12-09T10:01:00Z"
  },
  "message": "Import job status"
}
```

**Status Values:**
- `processing` - Import is in progress
- `completed` - Import finished successfully
- `failed` - Import encountered critical errors

### 4. Download Credentials

**GET** `/api/admins/students/import/:jobId/credentials`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
CSV file download with columns:
- Email
- Password
- Student ID
- Firebase UID

## CSV/Excel File Format

### Column Headers (Required)

The CSV/Excel file must have these column headers (case-insensitive):

| Column | Required | Type | Description | Example |
|--------|----------|------|-------------|---------|
| email | ✅ Yes | String | Valid email address | student@example.com |
| name | ✅ Yes | String | Student's full name | John Doe |
| department | ✅ Yes | String | Department name | Computer Science |
| year | ✅ Yes | Number | Year of study (1-5) | 3 |
| college | ✅ Yes | String | College name | Example College |
| rollNumber | ❌ No | String | Student roll number | CS2021001 |
| phone | ❌ No | String | Contact phone | 1234567890 |
| bio | ❌ No | String | Student biography | Passionate student |
| skills | ❌ No | String | Comma-separated skills | JavaScript,Python,React |
| interests | ❌ No | String | Comma-separated interests | Web Dev,AI |

### Example CSV File

```csv
email,name,department,year,college,rollNumber,phone,bio,skills,interests
student@example.com,John Doe,Computer Science,3,Example College,CS2021001,1234567890,Passionate about software development,"JavaScript,Python,React","Web Development,AI"
student2@example.com,Jane Smith,Electrical Engineering,2,Example College,EE2022001,0987654321,Enthusiastic learner,"C++,MATLAB","Robotics,IoT"
```

**Notes:**
- Use quotes around values containing commas (like skills and interests)
- Empty optional fields can be left blank
- Column order doesn't matter as long as headers are present
- Both CSV (.csv) and Excel (.xls, .xlsx) formats are supported

## Usage Example

### Using cURL

```bash
# 1. Download template
curl http://localhost:5000/api/admins/students/import/template \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o template.csv

# 2. Upload CSV file
curl -X POST http://localhost:5000/api/admins/students/import \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@students.csv"

# Response: {"success":true,"data":{"jobId":"IMPORT-1733718674000"},"message":"Import started"}

# 3. Check status
curl http://localhost:5000/api/admins/students/import/IMPORT-1733718674000 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 4. Download credentials
curl http://localhost:5000/api/admins/students/import/IMPORT-1733718674000/credentials \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o credentials.csv
```

### Using JavaScript/Fetch

```javascript
// 1. Download template
const templateResponse = await fetch('/api/admins/students/import/template', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const templateBlob = await templateResponse.blob();
// Save or open the template file

// 2. Upload CSV file
const formData = new FormData();
formData.append('file', fileInput.files[0]); // fileInput is an <input type="file">

const response = await fetch('/api/admins/students/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const { data } = await response.json();
const jobId = data.jobId;

// 2. Poll for status
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/admins/students/import/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  const { data } = await statusResponse.json();
  
  if (data.status === 'completed') {
    console.log('Import completed!');
    console.log(`Successful: ${data.credentials.length}`);
    console.log(`Failed: ${data.errors.length}`);
    return data;
  } else if (data.status === 'failed') {
    console.error('Import failed');
    return data;
  } else {
    console.log(`Progress: ${data.processed}/${data.total}`);
    setTimeout(checkStatus, 2000); // Check again in 2 seconds
  }
};

await checkStatus();

// 4. Download credentials
window.location.href = `/api/admins/students/import/${jobId}/credentials`;
```

### Using HTML Form

```html
<!DOCTYPE html>
<html>
<head>
  <title>Student Bulk Import</title>
</head>
<body>
  <h1>Student Bulk Import</h1>
  
  <!-- Download Template -->
  <div>
    <h2>Step 1: Download Template</h2>
    <a href="/api/admins/students/import/template" download>
      <button>Download CSV Template</button>
    </a>
  </div>
  
  <!-- Upload File -->
  <div>
    <h2>Step 2: Upload Filled CSV/Excel</h2>
    <form id="uploadForm" enctype="multipart/form-data">
      <input type="file" name="file" accept=".csv,.xls,.xlsx" required>
      <button type="submit">Upload & Import</button>
    </form>
    <div id="status"></div>
  </div>
  
  <script>
    const adminToken = 'YOUR_ADMIN_TOKEN'; // Get from login
    
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const statusDiv = document.getElementById('status');
      
      try {
        statusDiv.textContent = 'Uploading...';
        
        const response = await fetch('/api/admins/students/import', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          const jobId = result.data.jobId;
          statusDiv.textContent = `Import started! Job ID: ${jobId}`;
          
          // Poll for status
          const checkStatus = async () => {
            const statusResponse = await fetch(`/api/admins/students/import/${jobId}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            const statusData = await statusResponse.json();
            const job = statusData.data;
            
            if (job.status === 'completed') {
              statusDiv.innerHTML = `
                Import completed!<br>
                Total: ${job.total}<br>
                Successful: ${job.credentials.length}<br>
                Failed: ${job.errors.length}<br>
                <a href="/api/admins/students/import/${jobId}/credentials" download>
                  <button>Download Credentials</button>
                </a>
              `;
            } else if (job.status === 'failed') {
              statusDiv.textContent = 'Import failed!';
            } else {
              statusDiv.textContent = `Processing: ${job.processed}/${job.total}`;
              setTimeout(checkStatus, 2000);
            }
          };
          
          setTimeout(checkStatus, 2000);
        } else {
          statusDiv.textContent = `Error: ${result.message}`;
        }
      } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
      }
    });
  </script>
</body>
</html>
```

## Error Handling

### Validation Errors

If a student record has validation errors, it will be skipped and logged in the `errors` array:

```json
{
  "errors": [
    {
      "record": {
        "email": "invalid-email",
        "name": "John Doe"
      },
      "error": "Invalid email format"
    }
  ]
}
```

### Common Validation Errors

- `Email is required` - Missing email field
- `Invalid email format` - Email doesn't match pattern
- `Name is required` - Missing or empty name
- `Department is required` - Missing or empty department
- `Year is required and must be a number` - Missing or invalid year
- `Year must be between 1 and 5` - Year out of range
- `College is required` - Missing or empty college

### Duplicate Handling

When importing a student with an email that already exists:
- If Firebase account exists: Reuses existing Firebase UID
- If MongoDB record exists: Updates the existing record
- Password is NOT generated for existing accounts (only for new accounts)

## Security Considerations

1. **Admin Authentication Required**: All endpoints require admin authentication
2. **Secure Password Generation**: Passwords are generated using cryptographically secure random bytes
3. **Auto-Verified Emails**: Imported accounts have `emailVerified: true` to bypass verification
4. **No Email Notifications**: No welcome or verification emails are sent
5. **Credentials Protection**: Credentials are stored temporarily and should be downloaded promptly

## Best Practices

1. **Validate Data Before Import**: Ensure CSV/Excel data is clean before importing
2. **Download Credentials Immediately**: Download the credentials CSV as soon as import completes
3. **Secure Distribution**: Distribute credentials securely to students (e.g., via secure portal)
4. **Monitor Import Jobs**: Check status regularly for large imports
5. **Handle Errors**: Review error logs and fix invalid records before re-importing

## Limitations

- Import jobs are stored in memory and cleared after 24 hours
- Maximum recommended batch size: 1000 students per import
- Firebase rate limits apply (consider batching for very large imports)
- Credentials are only available for newly created accounts (not for updates)

## File Size Limits

- Maximum file size: 5MB
- Recommended batch size: Up to 1000 students per file
- For larger imports, split into multiple files

## Troubleshooting

### Import Stuck in "Processing"

- Check server logs for errors
- Verify database and Firebase connectivity
- Check if the async worker is running

### No Credentials Available

- Credentials are only generated for NEW accounts
- If all students already exist, no credentials will be generated
- Check the `errors` array for failed imports

### Firebase Errors

- Verify Firebase Admin SDK is properly configured
- Check Firebase project quotas and limits
- Ensure service account has proper permissions

## Support

For issues or questions, contact the system administrator or check the server logs at `backend/logs/`.
