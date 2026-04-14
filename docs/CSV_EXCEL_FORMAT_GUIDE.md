# CSV/Excel Format Guide for Student Bulk Import

## Quick Start

1. **Download the template**: `GET /api/admins/students/import/template`
2. **Fill in student data** using Excel or any spreadsheet software
3. **Save as CSV or Excel** (.csv, .xls, .xlsx)
4. **Upload the file**: `POST /api/admins/students/import` with file in form data

## File Format Requirements

### Supported File Types
- ✅ CSV (.csv)
- ✅ Excel 97-2003 (.xls)
- ✅ Excel 2007+ (.xlsx)

### File Size Limit
- Maximum: 5MB per file
- Recommended: Up to 1000 students per file

## Column Specifications

### Required Columns

| Column | Type | Validation | Example |
|--------|------|------------|---------|
| **email** | String | Must be valid email format | student@example.com |
| **name** | String | Cannot be empty | John Doe |
| **department** | String | Cannot be empty | Computer Science |
| **year** | Number | Must be 1-5 | 3 |
| **college** | String | Cannot be empty | Example College |

### Optional Columns

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| **rollNumber** | String | Student roll/registration number | CS2021001 |
| **phone** | String | Contact phone number | 1234567890 |
| **bio** | String | Student biography/description | Passionate about coding |
| **skills** | String | Comma-separated list of skills | JavaScript,Python,React |
| **interests** | String | Comma-separated list of interests | Web Development,AI |

## CSV Format Examples

### Minimal Example (Required Fields Only)

```csv
email,name,department,year,college
student1@example.com,John Doe,Computer Science,3,Example College
student2@example.com,Jane Smith,Electrical Engineering,2,Example College
student3@example.com,Bob Johnson,Mechanical Engineering,4,Example College
```

### Complete Example (All Fields)

```csv
email,name,department,year,college,rollNumber,phone,bio,skills,interests
student1@example.com,John Doe,Computer Science,3,Example College,CS2021001,1234567890,Passionate about software development,"JavaScript,Python,React","Web Development,AI"
student2@example.com,Jane Smith,Electrical Engineering,2,Example College,EE2022001,0987654321,Enthusiastic learner,"C++,MATLAB","Robotics,IoT"
student3@example.com,Bob Johnson,Mechanical Engineering,4,Example College,ME2020001,5551234567,Interested in automation,"CAD,SolidWorks","Manufacturing,Design"
```

## Excel Format

### Creating in Excel

1. Open Microsoft Excel or Google Sheets
2. Create headers in the first row:
   ```
   | email | name | department | year | college | rollNumber | phone | bio | skills | interests |
   ```
3. Fill in student data in subsequent rows
4. Save as:
   - Excel: File → Save As → Excel Workbook (.xlsx)
   - CSV: File → Save As → CSV (Comma delimited) (.csv)

### Excel Screenshot Example

```
┌─────────────────────────┬──────────────┬────────────────────┬──────┬─────────────────┬────────────┬────────────┬──────────────────────────┬──────────────────────┬────────────────────┐
│ email                   │ name         │ department         │ year │ college         │ rollNumber │ phone      │ bio                      │ skills               │ interests          │
├─────────────────────────┼──────────────┼────────────────────┼──────┼─────────────────┼────────────┼────────────┼──────────────────────────┼──────────────────────┼────────────────────┤
│ student1@example.com    │ John Doe     │ Computer Science   │ 3    │ Example College │ CS2021001  │ 1234567890 │ Passionate about coding  │ JavaScript,Python    │ Web Dev,AI         │
│ student2@example.com    │ Jane Smith   │ Electrical Eng     │ 2    │ Example College │ EE2022001  │ 0987654321 │ Enthusiastic learner     │ C++,MATLAB           │ Robotics,IoT       │
│ student3@example.com    │ Bob Johnson  │ Mechanical Eng     │ 4    │ Example College │ ME2020001  │ 5551234567 │ Interested in automation │ CAD,SolidWorks       │ Manufacturing      │
└─────────────────────────┴──────────────┴────────────────────┴──────┴─────────────────┴────────────┴────────────┴──────────────────────────┴──────────────────────┴────────────────────┘
```

## Important Notes

### Column Headers
- ✅ Column headers are **case-insensitive** (email, Email, EMAIL all work)
- ✅ Column order doesn't matter
- ✅ Extra columns are ignored
- ❌ Missing required columns will cause validation errors

### Data Formatting

#### Email
- Must be valid email format: `user@domain.com`
- Will be converted to lowercase
- Duplicates will update existing records

#### Year
- Must be a number between 1 and 5
- Represents year of study
- Examples: 1, 2, 3, 4, 5

#### Skills & Interests
- Use comma-separated values
- Will be parsed into an array
- Examples:
  - `JavaScript,Python,React`
  - `Web Development,AI,Machine Learning`

#### Text with Commas
- If your text contains commas, wrap it in quotes:
  ```csv
  "Hello, World",Normal Text,"Another, Text, With, Commas"
  ```

### Empty Fields
- Required fields cannot be empty
- Optional fields can be left blank
- Empty cells in CSV: `,,` or just skip the value
- Empty cells in Excel: Leave cell blank

## Common Mistakes to Avoid

### ❌ Wrong: Missing Required Fields
```csv
email,name,department
student@example.com,John Doe,Computer Science
```
**Error**: Missing `year` and `college` columns

### ❌ Wrong: Invalid Email Format
```csv
email,name,department,year,college
invalid-email,John Doe,Computer Science,3,Example College
```
**Error**: Email must be in format `user@domain.com`

### ❌ Wrong: Year Out of Range
```csv
email,name,department,year,college
student@example.com,John Doe,Computer Science,10,Example College
```
**Error**: Year must be between 1 and 5

### ❌ Wrong: Unquoted Commas in Skills
```csv
email,name,department,year,college,skills
student@example.com,John Doe,Computer Science,3,Example College,JavaScript,Python,React
```
**Error**: Commas in skills field break CSV parsing

### ✅ Correct: Quoted Commas
```csv
email,name,department,year,college,skills
student@example.com,John Doe,Computer Science,3,Example College,"JavaScript,Python,React"
```

## Validation Rules

The system validates each record before import:

1. **Email Validation**
   - Format: `user@domain.com`
   - Cannot be empty
   - Must be unique (duplicates update existing)

2. **Name Validation**
   - Cannot be empty
   - Must be a string

3. **Department Validation**
   - Cannot be empty
   - Must be a string

4. **Year Validation**
   - Must be a number
   - Must be between 1 and 5

5. **College Validation**
   - Cannot be empty
   - Must be a string

## Error Handling

### Invalid Records
- Invalid records are **skipped**
- Valid records are still processed
- Errors are logged in the job status

### Example Error Response
```json
{
  "errors": [
    {
      "record": {
        "email": "invalid-email",
        "name": "John Doe"
      },
      "error": "Invalid email format"
    },
    {
      "record": {
        "email": "student@example.com",
        "name": ""
      },
      "error": "Name is required"
    }
  ]
}
```

## Testing Your File

Before uploading a large file:

1. **Test with a small sample** (2-3 records)
2. **Check the job status** for any errors
3. **Review error messages** and fix issues
4. **Upload the full file** once validated

## Tips for Large Imports

1. **Split large files** into batches of 500-1000 students
2. **Test one batch first** to ensure format is correct
3. **Monitor progress** using the job status endpoint
4. **Download credentials** immediately after completion
5. **Keep a backup** of your original file

## Getting Help

If you encounter issues:

1. Check the error messages in the job status
2. Verify your file matches the template format
3. Ensure all required fields are present
4. Check for special characters or encoding issues
5. Try with a smaller sample file first

## Download Template

To get started quickly, download the pre-formatted template:

```bash
curl http://localhost:5000/api/admins/students/import/template \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o template.csv
```

Or visit: `GET /api/admins/students/import/template` in your browser (with authentication).
