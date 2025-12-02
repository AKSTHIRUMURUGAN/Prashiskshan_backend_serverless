# Database Migrations

This directory contains database migration scripts for the Prashiskshan backend.

## Available Migrations

### Credit Transfer System Migration

**Script:** `migrate-credit-transfer-system.js`

**Purpose:** Sets up the database schema for the Credit Transfer System feature, which enables students to request academic credit for completed internships through a multi-stage approval workflow.

**What it does:**

1. **Creates CreditRequest Collection**
   - Ensures the collection exists
   - Creates all required indexes for efficient querying:
     - `creditRequestId` (unique)
     - `studentId`, `mentorId`, `status` (individual indexes)
     - `internshipCompletionId` (unique)
     - Compound indexes for common query patterns

2. **Extends InternshipCompletion Model**
   - Adds `creditRequest` field for tracking credit request status
   - Adds `companyCompletion` field for company evaluation details
   - Initializes fields for existing documents if needed

3. **Extends Student Model**
   - Adds `credits` field with earned, approved, and pending credits
   - Adds `credits.history` array for tracking credit additions
   - Initializes fields for existing documents if needed

4. **Validates Indexes**
   - Lists all indexes for CreditRequest, InternshipCompletion, and Student collections
   - Provides statistics on collection sizes and migration status

**Usage:**

```bash
# Run the migration
npm run migrate:credit-transfer

# Or run directly with node
node ./scripts/migrate-credit-transfer-system.js
```

**Environment Requirements:**

- `MONGODB_URI` must be set in `.env` file
- MongoDB connection must be accessible
- Requires Node.js with ES modules support

**Safety:**

- ✅ Safe to run multiple times (idempotent)
- ✅ Does not delete or modify existing data
- ✅ Only adds new fields and indexes
- ✅ Provides detailed logging of all operations
- ✅ Validates operations before proceeding

**Output:**

The script provides detailed output including:
- Connection status
- Index creation status
- Document counts and statistics
- Migration summary

**Testing:**

To test the migration on a staging database:

1. Update `.env` to point to staging database:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prashiskshan-staging
   ```

2. Run the migration:
   ```bash
   npm run migrate:credit-transfer
   ```

3. Verify the output shows successful completion

4. Check the database to ensure:
   - CreditRequest collection exists
   - All indexes are created
   - Existing documents have new fields

**Rollback:**

Since this migration only adds fields and indexes (no data modification), rollback is not typically necessary. However, if needed:

1. Drop the CreditRequest collection:
   ```javascript
   db.creditrequests.drop()
   ```

2. Remove indexes from InternshipCompletion and Student collections if desired (optional)

3. Remove new fields from existing documents (optional):
   ```javascript
   db.internshipcompletions.updateMany({}, { $unset: { creditRequest: "", companyCompletion: "" } })
   db.students.updateMany({}, { $unset: { credits: "" } })
   ```

## Migration Best Practices

1. **Always backup before running migrations in production**
2. **Test migrations on staging environment first**
3. **Review migration output carefully**
4. **Keep migrations idempotent (safe to run multiple times)**
5. **Document any manual steps required**
6. **Version control all migration scripts**

## Creating New Migrations

When creating a new migration script:

1. Follow the naming convention: `migrate-{feature-name}.js`
2. Use the existing migration scripts as templates
3. Include comprehensive logging
4. Make migrations idempotent
5. Add error handling and rollback instructions
6. Update this README with migration details
7. Add npm script to `package.json`

## Troubleshooting

### Connection Issues

If you see connection errors:
- Verify `MONGODB_URI` is correct in `.env`
- Check network connectivity to MongoDB
- Ensure IP whitelist includes your IP (for MongoDB Atlas)

### Index Creation Failures

If index creation fails:
- Check if conflicting indexes exist
- Verify index names are unique
- Review MongoDB logs for details

### Permission Issues

If you see permission errors:
- Ensure database user has write permissions
- Verify user can create collections and indexes
- Check MongoDB user roles

## Support

For issues or questions about migrations:
1. Check the migration output logs
2. Review MongoDB logs
3. Consult the design document at `.kiro/specs/credit-transfer-system/design.md`
4. Contact the development team


### Firebase UID Fix Migration

**Script:** `fix-firebase-uid.js`

**Purpose:** Fixes missing or incorrect `firebaseUid` mappings for existing users in the database. This migration ensures all user records (Students, Admins, Mentors) have the correct Firebase UID that matches their Firebase Authentication account.

**When to use:**

- After database migrations or imports where firebaseUid might be missing
- When users encounter "User profile not found" errors during login
- After restoring from backups
- When firebaseUid fields are missing or incorrect

**What it does:**

1. **Scans all user collections**
   - Retrieves all Student records
   - Retrieves all Admin records
   - Retrieves all Mentor records

2. **Matches with Firebase Authentication**
   - Looks up Firebase user by email for each database record
   - Compares existing firebaseUid with Firebase Authentication UID
   - Updates records where firebaseUid is missing or incorrect

3. **Provides detailed logging**
   - Reports number of users checked
   - Reports number of users fixed
   - Warns about users without Firebase accounts
   - Logs any errors encountered

**Usage:**

```bash
# Run the migration
node ./scripts/fix-firebase-uid.js
```

**Environment Requirements:**

- `MONGODB_URI` must be set in `.env` file
- Firebase Admin SDK must be properly configured
- Firebase service account credentials must be available

**Safety:**

- ✅ Safe to run multiple times (idempotent)
- ✅ Only updates firebaseUid field
- ✅ Does not modify other user data
- ✅ Provides detailed logging of all operations
- ⚠️ Requires Firebase Admin access

**Output:**

The script provides detailed output including:
- Number of users checked in each collection
- Number of users fixed
- Warnings for users without Firebase accounts
- Any errors encountered during processing

**Common Issues:**

1. **"No Firebase user found for email"**
   - User exists in database but not in Firebase Authentication
   - May need to create Firebase account manually or through registration

2. **Firebase configuration errors**
   - Ensure Firebase service account is properly configured
   - Check FIREBASE_SERVICE_ACCOUNT_KEY environment variable

**Rollback:**

This migration only updates the firebaseUid field. If you need to rollback:

1. Restore from database backup taken before migration
2. Or manually update firebaseUid fields if you have the original values

