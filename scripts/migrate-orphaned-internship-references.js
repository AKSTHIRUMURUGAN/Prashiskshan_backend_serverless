/**
 * Migration script for Orphaned Internship References feature
 * 
 * This script:
 * 1. Adds soft delete fields (isDeleted, deletedAt, deletedBy) to existing internships
 * 2. Identifies and caches data for existing orphaned references in applications
 * 3. Identifies and caches data for existing orphaned references in completions
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Internship from '../src/models/Internship.js';
import Application from '../src/models/Application.js';
import InternshipCompletion from '../src/models/InternshipCompletion.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

async function migrateOrphanedInternshipReferences() {
  try {
    console.log('='.repeat(60));
    console.log('Orphaned Internship References Migration');
    console.log('='.repeat(60));
    console.log('\nConnecting to MongoDB...');
    console.log(`Database: ${process.env.MONGODB_URI?.split('@')[1] || 'Unknown'}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected successfully\n');

    // Step 1: Add soft delete fields to existing internships
    console.log('Step 1: Adding soft delete fields to existing internships');
    console.log('-'.repeat(60));
    
    const internshipsWithoutSoftDelete = await Internship.countDocuments({
      isDeleted: { $exists: false }
    });
    
    if (internshipsWithoutSoftDelete > 0) {
      console.log(`Found ${internshipsWithoutSoftDelete} internships without soft delete fields`);
      console.log('Setting isDeleted: false for all existing internships...');
      
      const result = await Internship.updateMany(
        { isDeleted: { $exists: false } },
        {
          $set: {
            isDeleted: false
          }
        }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} internships with soft delete fields`);
    } else {
      console.log('✓ All internships already have soft delete fields');
    }

    // Verify soft delete fields
    const totalInternships = await Internship.countDocuments();
    const internshipsWithSoftDelete = await Internship.countDocuments({
      isDeleted: { $exists: true }
    });
    console.log(`\nVerification: ${internshipsWithSoftDelete}/${totalInternships} internships have soft delete fields`);

    // Step 2: Cache data for existing orphaned references in applications
    console.log('\n\nStep 2: Caching data for orphaned references in applications');
    console.log('-'.repeat(60));
    
    // Get all applications
    const allApplications = await Application.find({}).lean();
    console.log(`Found ${allApplications.length} total applications`);
    
    // Check which ones have orphaned references
    const orphanedApplications = [];
    for (const app of allApplications) {
      const internshipExists = await Internship.findById(app.internshipId);
      if (!internshipExists) {
        orphanedApplications.push(app);
      }
    }
    
    console.log(`Found ${orphanedApplications.length} applications with orphaned internship references`);
    
    if (orphanedApplications.length > 0) {
      console.log('Adding placeholder cached data to orphaned applications...');
      
      let updatedCount = 0;
      for (const app of orphanedApplications) {
        // Only update if cachedInternshipData doesn't exist
        if (!app.cachedInternshipData) {
          await Application.updateOne(
            { _id: app._id },
            {
              $set: {
                cachedInternshipData: {
                  title: 'Internship No Longer Available',
                  department: app.department || 'Unknown',
                  companyName: 'Unknown',
                  startDate: null,
                  endDate: null,
                  applicationDeadline: null
                }
              }
            }
          );
          updatedCount++;
        }
      }
      
      console.log(`✓ Updated ${updatedCount} applications with placeholder cached data`);
      
      // Log orphaned application IDs for reference
      if (orphanedApplications.length > 0) {
        logger.warn('Orphaned application references found during migration', {
          count: orphanedApplications.length,
          applicationIds: orphanedApplications.slice(0, 10).map(a => a.applicationId),
          note: orphanedApplications.length > 10 ? `... and ${orphanedApplications.length - 10} more` : ''
        });
      }
    } else {
      console.log('✓ No orphaned application references found');
    }

    // Step 3: Cache data for existing orphaned references in completions
    console.log('\n\nStep 3: Caching data for orphaned references in completions');
    console.log('-'.repeat(60));
    
    // Get all completions
    const allCompletions = await InternshipCompletion.find({}).lean();
    console.log(`Found ${allCompletions.length} total completions`);
    
    // Check which ones have orphaned references
    const orphanedCompletions = [];
    for (const completion of allCompletions) {
      const internshipExists = await Internship.findById(completion.internshipId);
      if (!internshipExists) {
        orphanedCompletions.push(completion);
      }
    }
    
    console.log(`Found ${orphanedCompletions.length} completions with orphaned internship references`);
    
    if (orphanedCompletions.length > 0) {
      console.log('Adding placeholder cached data to orphaned completions...');
      
      let updatedCount = 0;
      for (const completion of orphanedCompletions) {
        // Only update if cachedInternshipData doesn't exist
        if (!completion.cachedInternshipData) {
          await InternshipCompletion.updateOne(
            { _id: completion._id },
            {
              $set: {
                cachedInternshipData: {
                  title: 'Internship No Longer Available',
                  department: 'Unknown',
                  companyName: 'Unknown',
                  startDate: null,
                  endDate: null
                }
              }
            }
          );
          updatedCount++;
        }
      }
      
      console.log(`✓ Updated ${updatedCount} completions with placeholder cached data`);
      
      // Log orphaned completion IDs for reference
      if (orphanedCompletions.length > 0) {
        logger.warn('Orphaned completion references found during migration', {
          count: orphanedCompletions.length,
          completionIds: orphanedCompletions.slice(0, 10).map(c => c.completionId),
          note: orphanedCompletions.length > 10 ? `... and ${orphanedCompletions.length - 10} more` : ''
        });
      }
    } else {
      console.log('✓ No orphaned completion references found');
    }

    // Final statistics
    console.log('\n\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    
    const stats = {
      totalInternships: await Internship.countDocuments(),
      deletedInternships: await Internship.countDocuments({ isDeleted: true }),
      totalApplications: await Application.countDocuments(),
      applicationsWithCache: await Application.countDocuments({ 
        cachedInternshipData: { $exists: true } 
      }),
      totalCompletions: await InternshipCompletion.countDocuments(),
      completionsWithCache: await InternshipCompletion.countDocuments({ 
        cachedInternshipData: { $exists: true } 
      }),
      orphanedApplications: orphanedApplications.length,
      orphanedCompletions: orphanedCompletions.length
    };

    console.log(`\nCollection Statistics:`);
    console.log(`  - Internships: ${stats.totalInternships}`);
    console.log(`    • Soft deleted: ${stats.deletedInternships}`);
    console.log(`  - Applications: ${stats.totalApplications}`);
    console.log(`    • With cached data: ${stats.applicationsWithCache}`);
    console.log(`    • Orphaned references: ${stats.orphanedApplications}`);
    console.log(`  - Completions: ${stats.totalCompletions}`);
    console.log(`    • With cached data: ${stats.completionsWithCache}`);
    console.log(`    • Orphaned references: ${stats.orphanedCompletions}`);

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
console.log('\nStarting Orphaned Internship References migration...\n');
migrateOrphanedInternshipReferences();
