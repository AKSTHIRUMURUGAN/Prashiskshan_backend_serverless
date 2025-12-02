import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditRequest from '../src/models/CreditRequest.js';
import InternshipCompletion from '../src/models/InternshipCompletion.js';
import Student from '../src/models/Student.js';

dotenv.config();

/**
 * Migration script for Credit Transfer System
 * 
 * This script:
 * 1. Creates CreditRequest collection with all required indexes
 * 2. Ensures InternshipCompletion model has creditRequest and companyCompletion fields
 * 3. Ensures Student model has credits.history field
 * 4. Validates all indexes are properly created
 * 
 * Note: MongoDB is schema-less, so new fields will be added automatically
 * when documents are updated. This script ensures indexes and validates schema.
 */

async function migrateCreditTransferSystem() {
  try {
    console.log('='.repeat(60));
    console.log('Credit Transfer System Migration');
    console.log('='.repeat(60));
    console.log('\nConnecting to MongoDB...');
    console.log(`Database: ${process.env.MONGODB_URI?.split('@')[1] || 'Unknown'}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected successfully\n');

    // Step 1: Ensure CreditRequest collection exists
    console.log('Step 1: Setting up CreditRequest collection');
    console.log('-'.repeat(60));
    
    const creditRequestCollections = await mongoose.connection.db.listCollections({ name: 'creditrequests' }).toArray();
    
    if (creditRequestCollections.length === 0) {
      console.log('Creating CreditRequest collection...');
      await mongoose.connection.db.createCollection('creditrequests');
      console.log('✓ CreditRequest collection created');
    } else {
      console.log('✓ CreditRequest collection already exists');
    }

    // Create indexes for CreditRequest
    console.log('\nCreating CreditRequest indexes...');
    const creditRequestIndexes = [
      { key: { creditRequestId: 1 }, options: { unique: true, name: 'creditRequestId_unique' } },
      { key: { studentId: 1 }, options: { name: 'studentId_index' } },
      { key: { internshipCompletionId: 1 }, options: { unique: true, name: 'internshipCompletionId_unique' } },
      { key: { mentorId: 1 }, options: { name: 'mentorId_index' } },
      { key: { status: 1 }, options: { name: 'status_index' } },
      { key: { studentId: 1, status: 1 }, options: { name: 'studentId_status_compound' } },
      { key: { mentorId: 1, status: 1 }, options: { name: 'mentorId_status_compound' } },
      { key: { status: 1, requestedAt: 1 }, options: { name: 'status_requestedAt_compound' } },
    ];

    for (const indexDef of creditRequestIndexes) {
      try {
        await CreditRequest.collection.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Created index: ${indexDef.options.name}`);
      } catch (error) {
        if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠ Index already exists: ${indexDef.options.name}`);
        } else {
          throw error;
        }
      }
    }

    const creditRequestCount = await CreditRequest.countDocuments();
    console.log(`\n✓ CreditRequest collection ready (${creditRequestCount} documents)`);

    // Step 2: Verify InternshipCompletion extensions
    console.log('\n\nStep 2: Verifying InternshipCompletion extensions');
    console.log('-'.repeat(60));
    
    const completionsWithCreditRequest = await InternshipCompletion.countDocuments({
      'creditRequest': { $exists: true }
    });
    
    const completionsWithCompanyCompletion = await InternshipCompletion.countDocuments({
      'companyCompletion': { $exists: true }
    });

    const totalCompletions = await InternshipCompletion.countDocuments();
    
    console.log(`Total InternshipCompletion documents: ${totalCompletions}`);
    console.log(`  - With creditRequest field: ${completionsWithCreditRequest}`);
    console.log(`  - With companyCompletion field: ${completionsWithCompanyCompletion}`);
    
    // Initialize creditRequest field for existing completions if needed
    if (totalCompletions > 0 && completionsWithCreditRequest === 0) {
      console.log('\nInitializing creditRequest field for existing completions...');
      const result = await InternshipCompletion.updateMany(
        { creditRequest: { $exists: false } },
        {
          $set: {
            creditRequest: {
              requested: false
            }
          }
        }
      );
      console.log(`✓ Updated ${result.modifiedCount} InternshipCompletion documents`);
    } else {
      console.log('✓ InternshipCompletion documents are up to date');
    }

    // Step 3: Verify Student model extensions
    console.log('\n\nStep 3: Verifying Student model extensions');
    console.log('-'.repeat(60));
    
    const studentsWithCredits = await Student.countDocuments({
      'credits': { $exists: true }
    });
    
    const studentsWithCreditHistory = await Student.countDocuments({
      'credits.history': { $exists: true }
    });

    const totalStudents = await Student.countDocuments();
    
    console.log(`Total Student documents: ${totalStudents}`);
    console.log(`  - With credits field: ${studentsWithCredits}`);
    console.log(`  - With credits.history field: ${studentsWithCreditHistory}`);
    
    // Initialize credits field for existing students if needed
    if (totalStudents > 0 && studentsWithCredits === 0) {
      console.log('\nInitializing credits field for existing students...');
      const result = await Student.updateMany(
        { credits: { $exists: false } },
        {
          $set: {
            credits: {
              earned: 0,
              approved: 0,
              pending: 0,
              history: []
            }
          }
        }
      );
      console.log(`✓ Updated ${result.modifiedCount} Student documents`);
    } else if (totalStudents > 0 && studentsWithCreditHistory < studentsWithCredits) {
      console.log('\nInitializing credits.history field for students...');
      const result = await Student.updateMany(
        { 
          credits: { $exists: true },
          'credits.history': { $exists: false }
        },
        {
          $set: {
            'credits.history': []
          }
        }
      );
      console.log(`✓ Updated ${result.modifiedCount} Student documents`);
    } else {
      console.log('✓ Student documents are up to date');
    }

    // Step 4: Validate all indexes
    console.log('\n\nStep 4: Validating indexes');
    console.log('-'.repeat(60));
    
    const creditRequestIndexList = await CreditRequest.collection.indexes();
    console.log(`\nCreditRequest indexes (${creditRequestIndexList.length}):`);
    creditRequestIndexList.forEach(index => {
      const keys = Object.keys(index.key).join(', ');
      console.log(`  - ${index.name}: {${keys}}`);
    });

    const completionIndexList = await InternshipCompletion.collection.indexes();
    console.log(`\nInternshipCompletion indexes (${completionIndexList.length}):`);
    completionIndexList.forEach(index => {
      const keys = Object.keys(index.key).join(', ');
      console.log(`  - ${index.name}: {${keys}}`);
    });

    const studentIndexList = await Student.collection.indexes();
    console.log(`\nStudent indexes (${studentIndexList.length}):`);
    studentIndexList.forEach(index => {
      const keys = Object.keys(index.key).join(', ');
      console.log(`  - ${index.name}: {${keys}}`);
    });

    // Final statistics
    console.log('\n\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    
    const stats = {
      creditRequests: await CreditRequest.countDocuments(),
      completions: await InternshipCompletion.countDocuments(),
      students: await Student.countDocuments(),
      pendingCreditRequests: await CreditRequest.countDocuments({ 
        status: { $in: ['pending_mentor_review', 'pending_admin_review'] }
      }),
      completedCreditRequests: await CreditRequest.countDocuments({ status: 'completed' }),
    };

    console.log(`\nCollection Statistics:`);
    console.log(`  - CreditRequests: ${stats.creditRequests}`);
    console.log(`    • Pending: ${stats.pendingCreditRequests}`);
    console.log(`    • Completed: ${stats.completedCreditRequests}`);
    console.log(`  - InternshipCompletions: ${stats.completions}`);
    console.log(`  - Students: ${stats.students}`);

    console.log('\n✓ Migration completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('Migration failed!');
    console.error('='.repeat(60));
    console.error('\nError details:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run migration
console.log('\nStarting Credit Transfer System migration...\n');
migrateCreditTransferSystem();
