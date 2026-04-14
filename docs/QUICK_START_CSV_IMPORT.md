# Quick Start: CSV/Excel Student Import

## 3 Simple Steps

### Step 1: Download Template
```bash
GET /api/admins/students/import/template
```
Or click "Download Template" button in admin panel.

### Step 2: Fill in Student Data

Open the template in Excel or Google Sheets and fill in your student data:

```
┌──────────────────────────┬──────────────┬────────────────────┬──────┬─────────────────┐
│ email                    │ name         │ department         │ year │ college         │
├──────────────────────────┼──────────────┼────────────────────┼──────┼─────────────────┤
│ student1@university.edu  │ John Doe     │ Computer Science   │ 3    │ Tech University │
│ student2@university.edu  │ Jane Smith   │ Electrical Eng     │ 2    │ Tech University │
│ student3@university.edu  │ Bob Johnson  │ Mechanical Eng     │ 4    │ Tech University │
└──────────────────────────┴──────────────┴────────────────────┴──────┴─────────────────┘
```

**Required columns:**
- ✅ email
- ✅ name
- ✅ department
- ✅ year (1-5)
- ✅ college

**Optional columns:**
- rollNumber
- phone
- bio
- skills (comma-separated)
- interests (comma-separated)

### Step 3: Upload File
```bash
POST /api/admins/students/import
Content-Type: multipart/form-data
Form field: file
```

## Complete Example

### Minimal CSV (Required Fields Only)
```csv
email,name,department,year,college
john.doe@university.edu,John Doe,Computer Science,3,Tech University
jane.smith@university.edu,Jane Smith,Electrical Engineering,2,Tech University
```

### Full CSV (All Fields)
```csv
email,name,department,year,college,rollNumber,phone,bio,skills,interests
john.doe@university.edu,John Doe,Computer Science,3,Tech University,CS2021001,1234567890,Passionate developer,"JavaScript,Python,React","Web Dev,AI"
jane.smith@university.edu,Jane Smith,Electrical Engineering,2,Tech University,EE2022001,0987654321,Enthusiastic learner,"C++,MATLAB","Robotics,IoT"
```

## Important Notes

### ✅ DO:
- Use valid email addresses
- Set year between 1-5
- Quote values with commas: `"JavaScript,Python"`
- Leave optional fields blank if not needed
- Save as .csv, .xls, or .xlsx

### ❌ DON'T:
- Use invalid email formats
- Leave required fields empty
- Use year values outside 1-5
- Exceed 5MB file size
- Upload more than 1000 students at once

## Testing Your File

1. Start with 2-3 test records
2. Upload and check for errors
3. Fix any validation issues
4. Upload full file once validated

## What Happens After Upload?

1. **File is parsed** - System extracts student data
2. **Records are validated** - Each student is checked
3. **Accounts are created** - Firebase + MongoDB
4. **Passwords are generated** - Secure random passwords
5. **Credentials are stored** - Available for download
6. **Job completes** - Download credentials CSV

## Download Credentials

After import completes:
```bash
GET /api/admins/students/import/{jobId}/credentials
```

You'll get a CSV with:
```csv
Email,Password,Student ID,Firebase UID
student1@university.edu,SecurePass123!,STD-ABC123,firebase-uid-123
student2@university.edu,AnotherPass456!,STD-DEF456,firebase-uid-456
```

## Need Help?

- See `CSV_EXCEL_FORMAT_GUIDE.md` for detailed format specifications
- See `STUDENT_BULK_IMPORT_GUIDE.md` for complete API documentation
- Check example files in `backend/examples/` folder

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admins/students/import/template` | GET | Download CSV template |
| `/api/admins/students/import` | POST | Upload CSV/Excel or JSON |
| `/api/admins/students/import/:jobId` | GET | Check import status |
| `/api/admins/students/import/:jobId/credentials` | GET | Download credentials |

---

**That's it!** Download template → Fill data → Upload → Get credentials
