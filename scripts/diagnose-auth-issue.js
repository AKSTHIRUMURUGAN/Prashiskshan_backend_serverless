/**
 * Diagnostic script to identify authentication issues
 * Checks for mismatches between Firebase and database records
 */

import mongoose from "mongoose";
import Student from "../src/models/Student.js";
import Admin from "../src/models/Admin.js";
import Mentor from "../src/models/Mentor.js";
import Company from "../src/models/Company.js";
import { firebaseAdmin } from "../src/config/firebase.js";
import { logger } from "../src/utils/logger.js";
import config from "../src/config/index.js";

async function diagnoseAuthIssues() {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.info("Connected to database");

    const issues = {
      studentsWithoutFirebaseUid: [],
      adminsWithoutFirebaseUid: [],
      mentorsWithoutFirebaseUid: [],
      companiesWithoutFirebaseUid: [],
      studentsWithInvalidFirebaseUid: [],
      adminsWithInvalidFirebaseUid: [],
      mentorsWithInvalidFirebaseUid: [],
      companiesWithInvalidFirebaseUid: [],
    };

    // Check Students
    logger.info("Checking students...");
    const students = await Student.find({}).lean();
    for (const student of students) {
      if (!student.firebaseUid) {
        issues.studentsWithoutFirebaseUid.push({
          email: student.email,
          studentId: student.studentId,
        });
      } else {
        try {
          await firebaseAdmin.auth().getUser(student.firebaseUid);
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            issues.studentsWithInvalidFirebaseUid.push({
              email: student.email,
              studentId: student.studentId,
              firebaseUid: student.firebaseUid,
            });
          }
        }
      }
    }

    // Check Admins
    logger.info("Checking admins...");
    const admins = await Admin.find({}).lean();
    for (const admin of admins) {
      if (!admin.firebaseUid) {
        issues.adminsWithoutFirebaseUid.push({
          email: admin.email,
          adminId: admin.adminId,
        });
      } else {
        try {
          await firebaseAdmin.auth().getUser(admin.firebaseUid);
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            issues.adminsWithInvalidFirebaseUid.push({
              email: admin.email,
              adminId: admin.adminId,
              firebaseUid: admin.firebaseUid,
            });
          }
        }
      }
    }

    // Check Mentors
    logger.info("Checking mentors...");
    const mentors = await Mentor.find({}).lean();
    for (const mentor of mentors) {
      if (!mentor.firebaseUid) {
        issues.mentorsWithoutFirebaseUid.push({
          email: mentor.email,
          mentorId: mentor.mentorId,
        });
      } else {
        try {
          await firebaseAdmin.auth().getUser(mentor.firebaseUid);
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            issues.mentorsWithInvalidFirebaseUid.push({
              email: mentor.email,
              mentorId: mentor.mentorId,
              firebaseUid: mentor.firebaseUid,
            });
          }
        }
      }
    }

    // Check Companies
    logger.info("Checking companies...");
    const companies = await Company.find({}).lean();
    for (const company of companies) {
      if (!company.firebaseUid) {
        issues.companiesWithoutFirebaseUid.push({
          email: company.email,
          companyId: company.companyId,
        });
      } else {
        try {
          await firebaseAdmin.auth().getUser(company.firebaseUid);
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            issues.companiesWithInvalidFirebaseUid.push({
              email: company.email,
              companyId: company.companyId,
              firebaseUid: company.firebaseUid,
            });
          }
        }
      }
    }

    // Print summary
    console.log("\n=== AUTHENTICATION DIAGNOSTIC REPORT ===\n");
    
    console.log("STUDENTS:");
    console.log(`  Total: ${students.length}`);
    console.log(`  Without firebaseUid: ${issues.studentsWithoutFirebaseUid.length}`);
    console.log(`  With invalid firebaseUid: ${issues.studentsWithInvalidFirebaseUid.length}`);
    if (issues.studentsWithoutFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.studentsWithoutFirebaseUid, null, 2));
    }
    if (issues.studentsWithInvalidFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.studentsWithInvalidFirebaseUid, null, 2));
    }

    console.log("\nADMINS:");
    console.log(`  Total: ${admins.length}`);
    console.log(`  Without firebaseUid: ${issues.adminsWithoutFirebaseUid.length}`);
    console.log(`  With invalid firebaseUid: ${issues.adminsWithInvalidFirebaseUid.length}`);
    if (issues.adminsWithoutFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.adminsWithoutFirebaseUid, null, 2));
    }
    if (issues.adminsWithInvalidFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.adminsWithInvalidFirebaseUid, null, 2));
    }

    console.log("\nMENTORS:");
    console.log(`  Total: ${mentors.length}`);
    console.log(`  Without firebaseUid: ${issues.mentorsWithoutFirebaseUid.length}`);
    console.log(`  With invalid firebaseUid: ${issues.mentorsWithInvalidFirebaseUid.length}`);
    if (issues.mentorsWithoutFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.mentorsWithoutFirebaseUid, null, 2));
    }
    if (issues.mentorsWithInvalidFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.mentorsWithInvalidFirebaseUid, null, 2));
    }

    console.log("\nCOMPANIES:");
    console.log(`  Total: ${companies.length}`);
    console.log(`  Without firebaseUid: ${issues.companiesWithoutFirebaseUid.length}`);
    console.log(`  With invalid firebaseUid: ${issues.companiesWithInvalidFirebaseUid.length}`);
    if (issues.companiesWithoutFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.companiesWithoutFirebaseUid, null, 2));
    }
    if (issues.companiesWithInvalidFirebaseUid.length > 0) {
      console.log("  Details:", JSON.stringify(issues.companiesWithInvalidFirebaseUid, null, 2));
    }

    const totalIssues = 
      issues.studentsWithoutFirebaseUid.length +
      issues.adminsWithoutFirebaseUid.length +
      issues.mentorsWithoutFirebaseUid.length +
      issues.companiesWithoutFirebaseUid.length +
      issues.studentsWithInvalidFirebaseUid.length +
      issues.adminsWithInvalidFirebaseUid.length +
      issues.mentorsWithInvalidFirebaseUid.length +
      issues.companiesWithInvalidFirebaseUid.length;

    console.log("\n=== SUMMARY ===");
    console.log(`Total issues found: ${totalIssues}`);
    
    if (totalIssues > 0) {
      console.log("\nRECOMMENDATION:");
      console.log("Run the fix-firebase-uid.js migration script to resolve these issues:");
      console.log("  node scripts/fix-firebase-uid.js");
    } else {
      console.log("\n✅ No authentication issues found!");
    }

    process.exit(0);
  } catch (error) {
    logger.error("Diagnostic failed:", error);
    process.exit(1);
  }
}

diagnoseAuthIssues();
