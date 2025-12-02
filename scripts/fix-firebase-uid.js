/**
 * Migration script to fix firebaseUid for students and admins
 * This script ensures all users have proper firebaseUid mapping
 */

import mongoose from "mongoose";
import Student from "../src/models/Student.js";
import Admin from "../src/models/Admin.js";
import Mentor from "../src/models/Mentor.js";
import { firebaseAdmin } from "../src/config/firebase.js";
import { logger } from "../src/utils/logger.js";
import config from "../src/config/index.js";

async function fixFirebaseUids() {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.info("Connected to database");

    // Get all students without firebaseUid or with invalid firebaseUid
    const students = await Student.find({}).lean();
    logger.info(`Found ${students.length} students to check`);

    let studentsFixed = 0;
    for (const student of students) {
      try {
        // Try to find Firebase user by email
        const firebaseUser = await firebaseAdmin.auth().getUserByEmail(student.email);
        
        // Check if firebaseUid needs updating
        if (!student.firebaseUid || student.firebaseUid !== firebaseUser.uid) {
          await Student.updateOne(
            { _id: student._id },
            { $set: { firebaseUid: firebaseUser.uid } }
          );
          logger.info(`Fixed firebaseUid for student: ${student.email}`);
          studentsFixed++;
        }
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          logger.warn(`No Firebase user found for student: ${student.email}`);
        } else {
          logger.error(`Error processing student ${student.email}:`, error.message);
        }
      }
    }

    // Get all admins without firebaseUid or with invalid firebaseUid
    const admins = await Admin.find({}).lean();
    logger.info(`Found ${admins.length} admins to check`);

    let adminsFixed = 0;
    for (const admin of admins) {
      try {
        // Try to find Firebase user by email
        const firebaseUser = await firebaseAdmin.auth().getUserByEmail(admin.email);
        
        // Check if firebaseUid needs updating
        if (!admin.firebaseUid || admin.firebaseUid !== firebaseUser.uid) {
          await Admin.updateOne(
            { _id: admin._id },
            { $set: { firebaseUid: firebaseUser.uid } }
          );
          logger.info(`Fixed firebaseUid for admin: ${admin.email}`);
          adminsFixed++;
        }
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          logger.warn(`No Firebase user found for admin: ${admin.email}`);
        } else {
          logger.error(`Error processing admin ${admin.email}:`, error.message);
        }
      }
    }

    // Get all mentors without firebaseUid or with invalid firebaseUid
    const mentors = await Mentor.find({}).lean();
    logger.info(`Found ${mentors.length} mentors to check`);

    let mentorsFixed = 0;
    for (const mentor of mentors) {
      try {
        // Try to find Firebase user by email
        const firebaseUser = await firebaseAdmin.auth().getUserByEmail(mentor.email);
        
        // Check if firebaseUid needs updating
        if (!mentor.firebaseUid || mentor.firebaseUid !== firebaseUser.uid) {
          await Mentor.updateOne(
            { _id: mentor._id },
            { $set: { firebaseUid: firebaseUser.uid } }
          );
          logger.info(`Fixed firebaseUid for mentor: ${mentor.email}`);
          mentorsFixed++;
        }
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          logger.warn(`No Firebase user found for mentor: ${mentor.email}`);
        } else {
          logger.error(`Error processing mentor ${mentor.email}:`, error.message);
        }
      }
    }

    logger.info("Migration complete!");
    logger.info(`Students fixed: ${studentsFixed}/${students.length}`);
    logger.info(`Admins fixed: ${adminsFixed}/${admins.length}`);
    logger.info(`Mentors fixed: ${mentorsFixed}/${mentors.length}`);

    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

fixFirebaseUids();
