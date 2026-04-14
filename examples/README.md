# Student Import Examples

This folder contains example CSV files for the student bulk import feature.

## Files

### 1. `student-import-template.csv`
Basic template with 2 sample records showing the format.
- **Use this**: As a starting point for your imports
- **Contains**: All columns (required + optional)

### 2. `student-import-example-minimal.csv`
Minimal example with only required fields.
- **Use this**: When you only have basic student information
- **Contains**: email, name, department, year, college

### 3. `student-import-example-full.csv`
Complete example with all fields populated.
- **Use this**: As a reference for full data imports
- **Contains**: All fields including optional ones

## How to Use

1. **Download** one of these files
2. **Open** in Excel, Google Sheets, or any spreadsheet software
3. **Replace** sample data with your actual student data
4. **Save** as CSV or Excel format
5. **Upload** via the admin import endpoint

## Column Reference

### Required Columns ✅
- `email` - Student email address
- `name` - Full name
- `department` - Department name
- `year` - Year of study (1-5)
- `college` - College name

### Optional Columns ⭕
- `rollNumber` - Student roll/registration number
- `phone` - Contact phone number
- `bio` - Student biography
- `skills` - Comma-separated skills (e.g., "JavaScript,Python")
- `interests` - Comma-separated interests (e.g., "Web Dev,AI")

## Tips

- Column headers are case-insensitive
- Column order doesn't matter
- Leave optional fields blank if not needed
- Use quotes around values with commas
- Maximum file size: 5MB
- Recommended batch size: Up to 1000 students

## Need Help?

See the documentation in `backend/docs/`:
- `QUICK_START_CSV_IMPORT.md` - Quick start guide
- `CSV_EXCEL_FORMAT_GUIDE.md` - Detailed format specifications
- `STUDENT_BULK_IMPORT_GUIDE.md` - Complete API documentation
