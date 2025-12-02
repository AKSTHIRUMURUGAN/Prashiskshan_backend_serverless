# Authentication Troubleshooting Guide

## Issue: "User profile not found" Error (404)

### Symptoms

- Users (especially students and admins) get 404 errors when trying to auto-login
- Error message: "User profile not found"
- Error occurs at `/api/auth/me` endpoint
- Companies work fine, but students and admins fail

### Root Cause

The `/auth/me` endpoint uses the `identifyUser` middleware which queries the database for user records by `firebaseUid`. When this field is missing or doesn't match the Firebase Authentication UID, the middleware cannot find the user profile and returns a 404 error.

This typically happens after:
- Database migrations or imports
- Manual database modifications
- Restoring from backups
- Data synchronization issues between Firebase and MongoDB

### How Authentication Works

1. **Frontend sends request** to `/api/auth/me` with Firebase ID token (in Authorization header or `id_token` cookie)
2. **`authenticate` middleware** verifies the Firebase token and extracts the `firebaseUid`
3. **`identifyUser` middleware** queries all user collections (Student, Mentor, Admin, Company) by `firebaseUid`
4. **If no match found**, returns 404 "User profile not found"
5. **If match found**, attaches user info to request and proceeds

### Diagnosis Steps

#### Step 1: Run the Diagnostic Script

```bash
cd backend
node scripts/diagnose-auth-issue.js
```

This script will:
- Check all user records in the database
- Identify users without `firebaseUid`
- Identify users with invalid `firebaseUid` (not matching Firebase)
- Provide a detailed report

#### Step 2: Review the Output

The diagnostic script will show:
```
=== AUTHENTICATION DIAGNOSTIC REPORT ===

STUDENTS:
  Total: 10
  Without firebaseUid: 3
  With invalid firebaseUid: 1
  Details: [...]

ADMINS:
  Total: 2
  Without firebaseUid: 2
  With invalid firebaseUid: 0
  Details: [...]

...
```

### Solution: Run the Fix Script

If the diagnostic script finds issues, run the fix script:

```bash
cd backend
node scripts/fix-firebase-uid.js
```

This script will:
1. Scan all user records (Students, Admins, Mentors, Companies)
2. Look up the corresponding Firebase user by email
3. Update the `firebaseUid` field to match Firebase Authentication
4. Log all changes and any errors

### Expected Output

```
Connected to database
Found 10 students to check
Fixed firebaseUid for student: student1@example.com
Fixed firebaseUid for student: student2@example.com
Found 2 admins to check
Fixed firebaseUid for admin: admin@example.com
Found 5 mentors to check
Migration complete!
Students fixed: 3/10
Admins fixed: 2/2
Mentors fixed: 0/5
```

### Verification

After running the fix script:

1. **Test login** for affected users
2. **Check browser console** for any remaining errors
3. **Verify in database** that `firebaseUid` fields are populated:
   ```javascript
   // In MongoDB shell or Compass
   db.students.find({ firebaseUid: { $exists: false } })
   db.admins.find({ firebaseUid: { $exists: false } })
   ```

### Manual Fix (If Needed)

If the automated script doesn't work, you can manually fix individual users:

1. **Get the Firebase UID** from Firebase Console or by having the user login
2. **Update the database record**:
   ```javascript
   // For a student
   db.students.updateOne(
     { email: "student@example.com" },
     { $set: { firebaseUid: "firebase-uid-here" } }
   )
   
   // For an admin
   db.admins.updateOne(
     { email: "admin@example.com" },
     { $set: { firebaseUid: "firebase-uid-here" } }
   )
   ```

### Prevention

To prevent this issue in the future:

1. **Always use registration endpoints** to create users (they automatically set `firebaseUid`)
2. **Backup before migrations** to allow rollback if needed
3. **Test in staging** before running migrations in production
4. **Run diagnostic script** after any database operations
5. **Monitor logs** for authentication errors

### Related Files

- **Middleware**: `backend/src/middleware/auth.js` (lines 54-92)
- **Auth Controller**: `backend/src/controllers/authController.js`
- **Auth Routes**: `backend/src/routes/auth.js`
- **Models**: 
  - `backend/src/models/Student.js`
  - `backend/src/models/Admin.js`
  - `backend/src/models/Mentor.js`
  - `backend/src/models/Company.js`

### Common Errors

#### "No Firebase user found for email"

**Cause**: User exists in database but not in Firebase Authentication

**Solution**: 
- Have the user register again through the registration endpoint
- Or manually create Firebase user and run fix script

#### "Firebase configuration error"

**Cause**: Firebase Admin SDK not properly configured

**Solution**:
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- Verify Firebase service account credentials
- Ensure Firebase project is properly set up

#### "Connection refused" or "Database connection error"

**Cause**: Cannot connect to MongoDB

**Solution**:
- Check `MONGODB_URI` in `.env` file
- Verify network connectivity
- Check MongoDB Atlas IP whitelist (if using Atlas)

### Support

If you continue to experience issues:

1. Check the backend logs for detailed error messages
2. Review the diagnostic script output
3. Verify Firebase and MongoDB configurations
4. Check that all environment variables are set correctly
5. Contact the development team with:
   - Diagnostic script output
   - Backend logs
   - Steps to reproduce the issue
