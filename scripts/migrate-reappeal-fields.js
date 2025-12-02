import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../src/models/Company.js';

dotenv.config();

/**
 * Migration script for adding reappeal fields to Company model
 * 
 * This script:
 * 1. Ensures the Company model includes the new reappeal status in the enum
 * 2. Adds indexes for efficient querying of reappeal status
 * 3. Optionally initializes blockInfo for existing blocked companies
 * 
 * Note: MongoDB is schema-less, so new fields (blockInfo, reappeal) will be
 * added automatically when documents are updated. This script is mainly for
 * ensuring indexes and optionally backfilling data.
 */

async function migrateReappealFields() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    // Check if there are any blocked companies without blockInfo
    const blockedCompaniesWithoutBlockInfo = await Company.countDocuments({
      status: 'blocked',
      blockInfo: { $exists: false }
    });

    console.log(`Found ${blockedCompaniesWithoutBlockInfo} blocked companies without blockInfo`);

    if (blockedCompaniesWithoutBlockInfo > 0) {
      console.log('Initializing blockInfo for blocked companies...');
      
      // Update blocked companies to have blockInfo if they don't already
      const result = await Company.updateMany(
        {
          status: 'blocked',
          blockInfo: { $exists: false }
        },
        {
          $set: {
            blockInfo: {
              reason: 'Blocked (reason not recorded)',
              blockedBy: 'system',
              blockedAt: new Date()
            }
          }
        }
      );

      console.log(`Updated ${result.modifiedCount} companies with blockInfo`);
    }

    // Ensure indexes are created
    console.log('Ensuring indexes...');
    await Company.collection.createIndex({ 'reappeal.submittedAt': -1 });
    await Company.collection.createIndex({ status: 1, 'reappeal.submittedAt': -1 });
    console.log('Indexes created successfully');

    // Display statistics
    const stats = {
      total: await Company.countDocuments(),
      blocked: await Company.countDocuments({ status: 'blocked' }),
      reappeal: await Company.countDocuments({ status: 'reappeal' }),
      withBlockInfo: await Company.countDocuments({ blockInfo: { $exists: true } }),
      withReappeal: await Company.countDocuments({ reappeal: { $exists: true } })
    };

    console.log('\nMigration Statistics:');
    console.log('---------------------');
    console.log(`Total companies: ${stats.total}`);
    console.log(`Blocked companies: ${stats.blocked}`);
    console.log(`Companies with reappeal status: ${stats.reappeal}`);
    console.log(`Companies with blockInfo: ${stats.withBlockInfo}`);
    console.log(`Companies with reappeal data: ${stats.withReappeal}`);

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migrateReappealFields();
