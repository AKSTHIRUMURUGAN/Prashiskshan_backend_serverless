/**
 * Test script for student bulk import functionality
 * This script tests the enhanced student import feature
 */

import { generateSecurePassword, validatePasswordStrength } from "./src/utils/passwordGenerator.js";
import { validateStudentRecord } from "./src/services/studentImportService.js";

console.log("=== Testing Student Import Functionality ===\n");

// Test 1: Password Generation
console.log("Test 1: Password Generation");
const password = generateSecurePassword();
console.log(`Generated password: ${password}`);
console.log(`Password length: ${password.length}`);
console.log(`Password is valid: ${validatePasswordStrength(password)}`);
console.log("");

// Test 2: Password Validation
console.log("Test 2: Password Validation");
const testPasswords = [
  { pwd: "short", expected: false },
  { pwd: "NoSpecialChar123", expected: false },
  { pwd: "nouppercasechar123!", expected: false },
  { pwd: "NOLOWERCASECHAR123!", expected: false },
  { pwd: "NoNumbers!@#", expected: false },
  { pwd: "ValidPass123!", expected: true },
];

testPasswords.forEach(({ pwd, expected }) => {
  const result = validatePasswordStrength(pwd);
  const status = result === expected ? "✓" : "✗";
  console.log(`${status} "${pwd}" -> ${result} (expected: ${expected})`);
});
console.log("");

// Test 3: Student Record Validation
console.log("Test 3: Student Record Validation");

const validRecord = {
  email: "student@example.com",
  name: "John Doe",
  department: "Computer Science",
  year: 3,
  college: "Example College",
};

const invalidRecords = [
  { email: "invalid-email", name: "John", department: "CS", year: 3, college: "College" },
  { email: "test@test.com", name: "", department: "CS", year: 3, college: "College" },
  { email: "test@test.com", name: "John", department: "", year: 3, college: "College" },
  { email: "test@test.com", name: "John", department: "CS", year: 10, college: "College" },
  { email: "test@test.com", name: "John", department: "CS", year: 3, college: "" },
];

console.log("Valid record:");
const validResult = validateStudentRecord(validRecord);
console.log(`  Valid: ${validResult.valid}`);
console.log(`  Errors: ${validResult.errors.join(", ") || "None"}`);
console.log("");

console.log("Invalid records:");
invalidRecords.forEach((record, index) => {
  const result = validateStudentRecord(record);
  console.log(`  Record ${index + 1}:`);
  console.log(`    Valid: ${result.valid}`);
  console.log(`    Errors: ${result.errors.join(", ")}`);
});
console.log("");

console.log("=== All Tests Completed ===");
