import admin from "firebase-admin";
import config from "./index.js";
import { logger } from "../utils/logger.js";

const isTestEnv = process.env.NODE_ENV === "test";

if (!admin.apps.length) {
  try {
    // In test environment, try to use emulator or skip if credentials are invalid
    if (isTestEnv && process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // Use Firebase Emulator
      admin.initializeApp({
        projectId: config.firebase.projectId,
      });
      logger.info("Firebase Admin initialized with emulator");
    } else {
      // Check if we have valid credentials
      const hasValidCredentials =
        config.firebase.projectId &&
        config.firebase.privateKey &&
        config.firebase.privateKey !== "-----BEGIN PRIVATE KEY-----\nMOCK_KEY_FOR_TESTING\n-----END PRIVATE KEY-----\n" &&
        config.firebase.clientEmail;

      if (hasValidCredentials) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail,
          }),
        });
        logger.info("Firebase Admin initialized");
      } else if (isTestEnv) {
        // In test mode, initialize with minimal config (will fail on actual API calls but allows initialization)
        try {
          admin.initializeApp({
            projectId: config.firebase.projectId,
          });
          logger.warn("Firebase Admin initialized in test mode without credentials");
        } catch (testError) {
          logger.warn("Firebase Admin initialization skipped in test mode:", testError.message);
        }
      } else {
        throw new Error("Firebase credentials are required in non-test environment");
      }
    }
  } catch (error) {
    if (isTestEnv) {
      logger.warn("Firebase initialization failed in test mode:", error.message);
      // Don't throw in test mode, allow tests to continue
    } else {
      logger.error("Firebase initialization failed", error);
      throw error;
    }
  }
}

export const firebaseAdmin = admin;

export const verifyToken = async (idToken) => {
  try {
    // In test mode, handle mock tokens
    if (isTestEnv && idToken && typeof idToken === "string" && idToken.startsWith("mock-custom-token-")) {
      const uid = idToken.replace("mock-custom-token-", "");
      // Try to look up user in database to get email
      try {
        const mongoose = (await import("mongoose")).default;
        const Student = (await import("../models/Student.js")).default;
        const Mentor = (await import("../models/Mentor.js")).default;
        const Admin = (await import("../models/Admin.js")).default;
        const Company = (await import("../models/Company.js")).default;

        const [student, mentor, admin, company] = await Promise.all([
          Student.findOne({ firebaseUid: uid }),
          Mentor.findOne({ firebaseUid: uid }),
          Admin.findOne({ firebaseUid: uid }),
          Company.findOne({ firebaseUid: uid }),
        ]);

        const user = student || mentor || admin || company;
        if (user) {
          return {
            uid,
            email: user.email || `test-${uid}@test.com`,
            email_verified: true,
          };
        }
      } catch (dbError) {
        // If DB lookup fails, return mock data
        logger.warn("Could not lookup user in test mode:", dbError.message);
      }
      // Fallback: return mock data with UID
      return {
        uid,
        email: `test-${uid}@test.com`,
        email_verified: true,
      };
    }
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    // In test mode, if token verification fails and it looks like a mock token, handle it
    if (isTestEnv && idToken && typeof idToken === "string" && idToken.includes("mock")) {
      logger.warn("Using mock token in test mode after verification failure:", idToken);
      const uid = idToken.replace("mock-custom-token-", "").split("-")[0] || "mock-uid";
      return {
        uid,
        email: `test-${uid}@test.com`,
        email_verified: true,
      };
    }
    logger.error("Firebase token verification failed", error);
    throw error;
  }
};

