# Document Management Backend Implementation

## Overview
This document describes the backend changes made to support the Company Document Management feature.

## Changes Made

### 1. Company Model Update (`backend/src/models/Company.js`)

Added `additionalDocuments` array to the `documentSchema`:

```javascript
const documentSchema = new Schema(
  {
    gstCertificate: String,
    cinNumber: { type: String, required: true, unique: true },
    registrationCertificate: String,
    addressProof: String,
    additionalDocuments: [{
      id: String,
      label: String,
      url: String,
      uploadedAt: Date
    }]
  },
  { _id: false },
);
```

**Purpose**: Allows companies to upload up to 5 additional supporting documents beyond the 3 required documents.

### 2. Upload Route Update (`backend/src/routes/upload.js`)

Updated multer configuration to:
- Increase file size limit from 5MB to 10MB
- Add file type validation for documents (PDF, JPG, JPEG, PNG)

```javascript
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for documents
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
        }
    }
});
```

**Purpose**: Ensures only valid document types are uploaded and file sizes don't exceed 10MB.

### 3. Validation Middleware Update (`backend/src/middleware/validation.js`)

Added `companyProfileUpdate` validation rules:

```javascript
export const companyProfileUpdate = [
  body("companyName").optional().trim().isLength({ min: 2, max: 200 }),
  body("about").optional().trim().isLength({ max: 2000 }),
  body("phone").optional().matches(/^[6-9]\d{9}$/),
  body("website").optional().matches(/^https?:\/\/.+/i),
  body("documents.gstCertificate").optional().isURL(),
  body("documents.registrationCertificate").optional().isURL(),
  body("documents.addressProof").optional().isURL(),
  body("documents.additionalDocuments").optional().isArray({ max: 5 }),
  body("documents.additionalDocuments.*.id").optional().notEmpty(),
  body("documents.additionalDocuments.*.label").optional().trim().isLength({ min: 1, max: 100 }),
  body("documents.additionalDocuments.*.url").optional().isURL(),
  body("documents.additionalDocuments.*.uploadedAt").optional().isISO8601(),
];
```

**Purpose**: Validates company profile updates including document fields, ensuring data integrity.

### 4. Company Routes Update (`backend/src/routes/company.js`)

Updated the PATCH `/profile` route to include validation:

```javascript
router.patch("/profile", companyAuth, companyProfileUpdate, handleValidationErrors, asyncHandler(updateCompanyProfile));
```

**Purpose**: Applies validation middleware to company profile updates.

## API Endpoints

### Upload Document
**POST** `/api/upload`

**Request**:
- Content-Type: `multipart/form-data`
- Body: `file` (binary)
- Query: `provider` (optional, defaults to "r2")

**Response**:
```json
{
  "success": true,
  "data": {
    "provider": "r2",
    "key": "2024-12-01/uuid-filename.pdf",
    "url": "https://storage.example.com/2024-12-01/uuid-filename.pdf"
  },
  "message": "File uploaded successfully"
}
```

**Validation**:
- File size: Max 10MB
- File types: PDF, JPG, JPEG, PNG
- Returns 400 error for invalid files

### Update Company Profile
**PATCH** `/api/companies/profile`

**Request**:
```json
{
  "companyName": "Updated Company Name",
  "documents": {
    "gstCertificate": "https://storage.example.com/gst.pdf",
    "registrationCertificate": "https://storage.example.com/reg.pdf",
    "addressProof": "https://storage.example.com/address.pdf",
    "additionalDocuments": [
      {
        "id": "doc-1",
        "label": "Tax Certificate",
        "url": "https://storage.example.com/tax.pdf",
        "uploadedAt": "2024-12-01T10:00:00.000Z"
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated company object
  },
  "message": "Company profile updated"
}
```

**Validation**:
- All document URLs must be valid URLs
- Additional documents array max length: 5
- Document labels: 1-100 characters
- Upload dates must be valid ISO 8601 dates

## Requirements Satisfied

✅ **Requirement 1.4**: Document upload to S3 storage with URL saved to database
✅ **Requirement 2.3**: Support for additional documents with labels
✅ **Requirement 7.1**: File extension validation (pdf, jpg, jpeg, png)
✅ **Requirement 7.2**: File size validation (≤ 10MB)
✅ **Requirement 7.3**: Specific error messages for validation failures
✅ **Requirement 7.5**: Secure, unique filenames to prevent overwrites

## Testing

Unit tests have been created in:
- `backend/tests/unit/models/company-documents.test.js` - Tests for Company model schema
- `backend/tests/unit/routes/upload-validation.test.js` - Tests for upload validation

## Notes

- The existing `updateCompanyProfile` controller already supports the `documents` field in the allowed fields list
- The storage service already handles secure file uploads with unique filenames
- No changes were needed to the controller logic as it already accepts and updates the documents field
- The validation middleware ensures data integrity before the controller processes the request
