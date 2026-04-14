import Student from "../models/Student.js";
import { firebaseAdmin } from "../config/firebase.js";
import { generateSecurePassword } from "../utils/passwordGenerator.js";
import { logger } from "../utils/logger.js";

/**
 * Generates a unique student ID
 * @returns {string} Unique student ID in format STD-{timestamp}-{random}
 */
function generateStudentId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `STD-${timestamp}-${random}`;
}

/**
 * Creates or retrieves a Firebase account for a student
 * @param {string} email - Student email
 * @param {string} name - Student name
 * @returns {Promise<{uid: string, password: string, isNew: boolean}>}
 */
async function createOrGetFirebaseAccount(email, name) {
  try {
    // Check if user already exists
    const existingUser = await firebaseAdmin.auth().getUserByEmail(email);
    logger.info("Firebase account already exists", { email, uid: existingUser.uid });
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
      
      logger.info("Created new Firebase account", { email, uid: newUser.uid });
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
 * Creates or updates a MongoDB student document
 * @param {string} firebaseUid - Firebase user ID
 * @param {object} studentData - Student profile data
 * @returns {Promise<{student: object, isNew: boolean}>}
 */
async function createOrUpdateStudentDocument(firebaseUid, studentData) {
  const { email, name, department, year, college, rollNumber, phone, bio, skills, interests } = studentData;
  
  // Check if student already exists
  const existingStudent = await Student.findOne({ email });
  
  if (existingStudent) {
    // Update existing student
    existingStudent.profile = {
      ...existingStudent.profile,
      name,
      department,
      year,
      college,
      ...(rollNumber && { rollNumber }),
      ...(phone && { phone }),
      ...(bio && { bio }),
      ...(skills && { skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()) }),
      ...(interests && { interests: Array.isArray(interests) ? interests : interests.split(",").map(s => s.trim()) }),
    };
    
    await existingStudent.save();
    logger.info("Updated existing student", { email, studentId: existingStudent.studentId });
    
    return {
      student: existingStudent,
      isNew: false,
    };
  }
  
  // Create new student
  const studentId = generateStudentId();
  const newStudent = new Student({
    studentId,
    firebaseUid,
    email,
    profile: {
      name,
      department,
      year,
      college,
      ...(rollNumber && { rollNumber }),
      ...(phone && { phone }),
      ...(bio && { bio }),
      ...(skills && { skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()) }),
      ...(interests && { interests: Array.isArray(interests) ? interests : interests.split(",").map(s => s.trim()) }),
    },
  });
  
  await newStudent.save();
  logger.info("Created new student", { email, studentId });
  
  return {
    student: newStudent,
    isNew: true,
  };
}

/**
 * Validates a student record
 * @param {object} record - Student record to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateStudentRecord(record) {
  const errors = [];
  
  if (!record.email || typeof record.email !== "string") {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    errors.push("Invalid email format");
  }
  
  if (!record.name || typeof record.name !== "string" || !record.name.trim()) {
    errors.push("Name is required");
  }
  
  if (!record.department || typeof record.department !== "string" || !record.department.trim()) {
    errors.push("Department is required");
  }
  
  if (!record.year || typeof record.year !== "number") {
    errors.push("Year is required and must be a number");
  } else if (record.year < 1 || record.year > 5) {
    errors.push("Year must be between 1 and 5");
  }
  
  if (!record.college || typeof record.college !== "string" || !record.college.trim()) {
    errors.push("College is required");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Processes a single student record for import
 * @param {object} record - Student record to process
 * @returns {Promise<{success: boolean, studentId?: string, email: string, password?: string, error?: string}>}
 */
export async function processStudentRecord(record) {
  try {
    // Validate record
    const validation = validateStudentRecord(record);
    if (!validation.valid) {
      return {
        success: false,
        email: record.email || "unknown",
        error: validation.errors.join(", "),
      };
    }
    
    // Create or get Firebase account
    const firebaseResult = await createOrGetFirebaseAccount(record.email, record.name);
    
    // Create or update MongoDB document
    const mongoResult = await createOrUpdateStudentDocument(firebaseResult.uid, record);
    
    return {
      success: true,
      studentId: mongoResult.student.studentId,
      email: record.email,
      password: firebaseResult.password, // Will be null for existing accounts
      firebaseUid: firebaseResult.uid,
      isNew: firebaseResult.isNew && mongoResult.isNew,
      isUpdate: !firebaseResult.isNew || !mongoResult.isNew,
    };
  } catch (error) {
    logger.error("Failed to process student record", {
      email: record.email,
      error: error.message,
      stack: error.stack,
    });
    
    return {
      success: false,
      email: record.email || "unknown",
      error: error.message,
    };
  }
}
