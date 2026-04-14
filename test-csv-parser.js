/**
 * Test script for CSV parser
 */

import fs from "fs";
import { parseStudentFile, isValidFileType, generateCSVTemplate } from "./src/services/csvParserService.js";

console.log("=== Testing CSV Parser ===\n");

// Test 1: Generate template
console.log("Test 1: Generate CSV Template");
const template = generateCSVTemplate();
console.log("Template generated:");
console.log(template);
console.log("");

// Test 2: Validate file types
console.log("Test 2: File Type Validation");
const fileTypes = [
  { type: "text/csv", expected: true },
  { type: "application/vnd.ms-excel", expected: true },
  { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", expected: true },
  { type: "application/pdf", expected: false },
  { type: "image/png", expected: false },
];

fileTypes.forEach(({ type, expected }) => {
  const result = isValidFileType(type);
  const status = result === expected ? "✓" : "✗";
  console.log(`${status} ${type} -> ${result} (expected: ${expected})`);
});
console.log("");

// Test 3: Parse CSV file
console.log("Test 3: Parse CSV File");
try {
  const csvBuffer = fs.readFileSync("./examples/student-import-template.csv");
  const students = parseStudentFile(csvBuffer, "text/csv");
  
  console.log(`Parsed ${students.length} students:`);
  students.forEach((student, index) => {
    console.log(`\nStudent ${index + 1}:`);
    console.log(`  Email: ${student.email}`);
    console.log(`  Name: ${student.name}`);
    console.log(`  Department: ${student.department}`);
    console.log(`  Year: ${student.year}`);
    console.log(`  College: ${student.college}`);
    console.log(`  Roll Number: ${student.rollNumber || "N/A"}`);
    console.log(`  Skills: ${student.skills || "N/A"}`);
  });
} catch (error) {
  console.error("Error parsing CSV:", error.message);
}

console.log("\n=== All Tests Completed ===");
