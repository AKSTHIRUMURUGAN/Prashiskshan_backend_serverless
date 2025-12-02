/**
 * Script to create test users for development
 * Creates sample student, admin, and mentor accounts
 */

import mongoose from "mongoose";
import Student from "../src/models/Student.js";
import Admin from "../src/models/Admin.js";
import Mentor from "../src/models/Mentor.js";
import Company from "../src/models/Company.js";
import { firebaseAdmin } from "../src/config/firebase.js";
import { logger } from "../src/utils/logger.js";
import config from "../src/config/index.js";

const generateId = (prefix) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

async function createTestUsers() {
  try {
    await mongoose.connect(config.mongo.uri);
    logger.info("Connected to database");

    // Test user data
    const testUsers = {
      student: {
        email: "student@test.com",
        password: "Test@123456",
        profile: {
          name: "Test Student",
          department: "Computer Science",
          year: 3,
          college: "Test College",
          phone: "1234567890",
        },
      },
      admin: {
        email: "admin@test.com",
        password: "Admin@123456",
        name: "Test Admin",
        role: "admin",
      },
      mentor: {
        email: "mentor@test.com",
        password: "Mentor@123456",
        profile: {
          name: "Test Mentor",
          department: "Computer Science",
        },
      },
      company: {
        email: "company@test.com",
        password: "Company@123456",
        companyName: "Test Company Ltd",
        website: "https://testcompany.com",
        phone: "9876543210",
        address: "123 Test Street, Test City, Test Country",
        documents: {
          cinNumber: "U12345AB2020PTC123456",
        },
        pointOfContact: {
          name: "Test Contact Person",
          email: "contact@testcompany.com",
          phone: "9876543210",
        },
        about: "A test company for development and testing purposes.",
      },
    };

    // Create Student
    logger.info("Creating test student...");
    try {
      // Check if student already exists
      const existingStudent = await Student.findOne({ email: testUsers.student.email });
      if (existingStudent) {
        logger.info("Test student already exists");
      } else {
        // Create Firebase user
        let firebaseStudent;
        try {
          firebaseStudent = await firebaseAdmin.auth().getUserByEmail(testUsers.student.email);
          logger.info("Firebase student user already exists");
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            firebaseStudent = await firebaseAdmin.auth().createUser({
              email: testUsers.student.email,
              password: testUsers.student.password,
              displayName: testUsers.student.profile.name,
              emailVerified: true, // Auto-verify for test accounts
            });
            logger.info("Created Firebase student user");
          } else {
            throw error;
          }
        }

        // Create MongoDB student
        const student = new Student({
          studentId: generateId("STD"),
          firebaseUid: firebaseStudent.uid,
          email: testUsers.student.email,
          profile: testUsers.student.profile,
        });
        await student.save();
        logger.info(`✅ Test student created: ${testUsers.student.email} / ${testUsers.student.password}`);
      }
    } catch (error) {
      logger.error("Failed to create test student:", error.message);
    }

    // Create Admin
    logger.info("Creating test admin...");
    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email: testUsers.admin.email });
      if (existingAdmin) {
        logger.info("Test admin already exists");
      } else {
        // Create Firebase user
        let firebaseAdminUser;
        try {
          firebaseAdminUser = await firebaseAdmin.auth().getUserByEmail(testUsers.admin.email);
          logger.info("Firebase admin user already exists");
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            firebaseAdminUser = await firebaseAdmin.auth().createUser({
              email: testUsers.admin.email,
              password: testUsers.admin.password,
              displayName: testUsers.admin.name,
              emailVerified: true, // Auto-verify for test accounts
            });
            logger.info("Created Firebase admin user");
          } else {
            throw error;
          }
        }

        // Create MongoDB admin
        const admin = new Admin({
          adminId: generateId("ADM"),
          firebaseUid: firebaseAdminUser.uid,
          email: testUsers.admin.email,
          name: testUsers.admin.name,
          role: testUsers.admin.role,
        });
        await admin.save();
        logger.info(`✅ Test admin created: ${testUsers.admin.email} / ${testUsers.admin.password}`);
      }
    } catch (error) {
      logger.error("Failed to create test admin:", error.message);
    }

    // Create Mentor
    logger.info("Creating test mentor...");
    try {
      // Check if mentor already exists
      const existingMentor = await Mentor.findOne({ email: testUsers.mentor.email });
      if (existingMentor) {
        logger.info("Test mentor already exists");
      } else {
        // Create Firebase user
        let firebaseMentor;
        try {
          firebaseMentor = await firebaseAdmin.auth().getUserByEmail(testUsers.mentor.email);
          logger.info("Firebase mentor user already exists");
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            firebaseMentor = await firebaseAdmin.auth().createUser({
              email: testUsers.mentor.email,
              password: testUsers.mentor.password,
              displayName: testUsers.mentor.profile.name,
              emailVerified: true, // Auto-verify for test accounts
            });
            logger.info("Created Firebase mentor user");
          } else {
            throw error;
          }
        }

        // Create MongoDB mentor
        const mentor = new Mentor({
          mentorId: generateId("MEN"),
          firebaseUid: firebaseMentor.uid,
          email: testUsers.mentor.email,
          profile: testUsers.mentor.profile,
        });
        await mentor.save();
        logger.info(`✅ Test mentor created: ${testUsers.mentor.email} / ${testUsers.mentor.password}`);
      }
    } catch (error) {
      logger.error("Failed to create test mentor:", error.message);
    }

    // Create Company
    logger.info("Creating test company...");
    try {
      // Check if company already exists
      const existingCompany = await Company.findOne({ email: testUsers.company.email });
      if (existingCompany) {
        logger.info("Test company already exists");
      } else {
        // Create Firebase user
        let firebaseCompany;
        try {
          firebaseCompany = await firebaseAdmin.auth().getUserByEmail(testUsers.company.email);
          logger.info("Firebase company user already exists");
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            firebaseCompany = await firebaseAdmin.auth().createUser({
              email: testUsers.company.email,
              password: testUsers.company.password,
              displayName: testUsers.company.companyName,
              emailVerified: true, // Auto-verify for test accounts
            });
            logger.info("Created Firebase company user");
          } else {
            throw error;
          }
        }

        // Create MongoDB company
        const company = new Company({
          companyId: generateId("COM"),
          firebaseUid: firebaseCompany.uid,
          email: testUsers.company.email,
          companyName: testUsers.company.companyName,
          website: testUsers.company.website,
          phone: testUsers.company.phone,
          address: testUsers.company.address,
          documents: testUsers.company.documents,
          pointOfContact: testUsers.company.pointOfContact,
          about: testUsers.company.about,
          status: "verified", // Auto-verify for test accounts
        });
        await company.save();
        logger.info(`✅ Test company created: ${testUsers.company.email} / ${testUsers.company.password}`);
      }
    } catch (error) {
      logger.error("Failed to create test company:", error.message);
    }

    console.log("\n=== TEST USERS CREATED ===\n");
    console.log("Student:");
    console.log(`  Email: ${testUsers.student.email}`);
    console.log(`  Password: ${testUsers.student.password}`);
    console.log("");
    console.log("Admin:");
    console.log(`  Email: ${testUsers.admin.email}`);
    console.log(`  Password: ${testUsers.admin.password}`);
    console.log("");
    console.log("Mentor:");
    console.log(`  Email: ${testUsers.mentor.email}`);
    console.log(`  Password: ${testUsers.mentor.password}`);
    console.log("");
    console.log("Company:");
    console.log(`  Email: ${testUsers.company.email}`);
    console.log(`  Password: ${testUsers.company.password}`);
    console.log(`  Status: verified (ready to use)`);
    console.log("\nYou can now login with these credentials!");

    process.exit(0);
  } catch (error) {
    logger.error("Script failed:", error);
    process.exit(1);
  }
}

createTestUsers();
