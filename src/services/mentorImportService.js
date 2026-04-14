import Mentor from "../models/Mentor.js";
import { firebaseAdmin } from "../config/firebase.js";
import { generateSecurePassword } from "../utils/passwordGenerator.js";
import { logger } from "../utils/logger.js";

/**
 * Generates a unique mentor ID
 * @returns {string} Unique mentor ID in format MNT-{timestamp}-{random}
 */
function generateMentorId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MNT-${timestamp}-${random}`;
}

/**
 * Creates or retrieves a Firebase account for a mentor
 * @param {string} email - Mentor email
 * @param {string} name - Mentor name
 * @returns {Promise<{uid: string, password: string, isNew: boolean}>}
 */
async function createOrGetFirebaseAccount(email, name) {
  try {
    // Check if user already exists
    const existingUser = await firebaseAdmin.auth().getUserByEmail(email);
    logger.info("Firebase account already exists for mentor", { email, uid: existingUser.uid });
    return {
      uid: existingUser.uid,
      password: null, // Don't generate password for existing accounts
      isNew: false,
    };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Create new Firebase user
      const password = generateSecurePassword();
      const newUser = await firebaseAdmin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: true, // Auto-verify for bulk imports
      });
      
      // Set custom claims for mentor role
      await firebaseAdmin.auth().setCustomUserClaims(newUser.uid, { role: "mentor" });
      
      logger.info("Created new Firebase account for mentor", { email, uid: newUser.uid });
      return {
        uid: newUser.uid,
        password,
        isNew: true,
      };
    }
    throw error;
  }
}

/**
 * Creates or updates a MongoDB mentor document
 * @param {string} firebaseUid - Firebase user ID
 * @param {object} mentorData - Mentor profile data
 * @returns {Promise<{mentor: object, isNew: boolean}>}
 */
async function createOrUpdateMentorDocument(firebaseUid, mentorData) {
  const { 
    email, 
    name, 
    department, 
    designation, 
    phone, 
    bio, 
    specialization,
    yearsOfExperience 
  } = mentorData;
  
  // Check if mentor already exists
  const existingMentor = await Mentor.findOne({ email });
  
  if (existingMentor) {
    // Update existing mentor
    existingMentor.profile = {
      ...existingMentor.profile,
      name,
      department,
      designation,
      ...(phone && { phone }),
      ...(bio && { bio }),
      ...(specialization && { 
        specialization: Array.isArray(specialization) 
          ? specialization 
          : specialization.split(",").map(s => s.trim()) 
      }),
      ...(yearsOfExperience && { yearsOfExperience: parseInt(yearsOfExperience) }),
    };
    
    // Ensure status is active
    if (existingMentor.status !== "active") {
      existingMentor.status = "active";
    }
    
    await existingMentor.save();
    logger.info("Updated existing mentor", { email, mentorId: existingMentor.mentorId });
    
    return {
      mentor: existingMentor,
      isNew: false,
    };
  }
  
  // Create new mentor
  const mentorId = generateMentorId();
  const newMentor = new Mentor({
    mentorId,
    firebaseUid,
    email,
    status: "active", // Auto-activate bulk imported mentors
    profile: {
      name,
      department,
      designation,
      ...(phone && { phone }),
      ...(bio && { bio }),
      ...(specialization && { 
        specialization: Array.isArray(specialization) 
          ? specialization 
          : specialization.split(",").map(s => s.trim()) 
      }),
      ...(yearsOfExperience && { yearsOfExperience: parseInt(yearsOfExperience) }),
    },
    assignedStudents: [],
  });
  
  await newMentor.save();
  logger.info("Created new mentor", { email, mentorId });
  
  return {
    mentor: newMentor,
    isNew: true,
  };
}

/**
 * Process a single mentor record for bulk import
 * @param {object} record - Mentor data from CSV/Excel/JSON
 * @returns {Promise<object>} Result with success status and details
 */
export async function processMentorRecord(record) {
  try {
    // Validate required fields
    if (!record.email || !record.name || !record.department) {
      return {
        success: false,
        error: "Missing required fields: email, name, and department are required",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Create or get Firebase account
    const { uid, password, isNew: isNewFirebaseAccount } = await createOrGetFirebaseAccount(
      record.email,
      record.name
    );

    // Create or update MongoDB document
    const { mentor, isNew: isNewMentor } = await createOrUpdateMentorDocument(uid, record);

    return {
      success: true,
      email: record.email,
      mentorId: mentor.mentorId,
      firebaseUid: uid,
      password: isNewFirebaseAccount ? password : null, // Only return password for new accounts
      isNew: isNewMentor,
      action: isNewMentor ? "created" : "updated",
    };
  } catch (error) {
    logger.error("Error processing mentor record", { 
      email: record.email, 
      error: error.message 
    });
    
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Validate mentor data before processing
 * @param {object} record - Mentor data
 * @returns {object} Validation result
 */
export function validateMentorRecord(record) {
  const errors = [];

  if (!record.email) errors.push("Email is required");
  if (!record.name) errors.push("Name is required");
  if (!record.department) errors.push("Department is required");

  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    errors.push("Invalid email format");
  }

  if (record.yearsOfExperience && isNaN(parseInt(record.yearsOfExperience))) {
    errors.push("Years of experience must be a number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
