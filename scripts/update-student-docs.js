/**
 * Script to update student endpoints documentation in openapi.mjs
 * This replaces the minimal student documentation with comprehensive versions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, '../src/docs/openapi.mjs');

// Read the current openapi.mjs file
let content = fs.readFileSync(openapiPath, 'utf8');

// Find the student section start and end
const studentSectionStart = content.indexOf('// Student Routes');
const companySectionStart = content.indexOf('// Company Routes');

if (studentSectionStart === -1 || companySectionStart === -1) {
  console.error('Could not find student or company section markers');
  process.exit(1);
}

// Extract everything before and after the student section
const beforeStudent = content.substring(0, studentSectionStart);
const afterStudent = content.substring(companySectionStart);

// Create comprehensive student documentation
const comprehensiveStudentDocs = `// ==================== Student Routes ====================
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
    // All student endpoints require Bearer authentication
    
    // Dashboard and Profile (Requirements: 2.1)
    "/students/dashboard": {
      get: {
        summary: "Get student dashboard with mentor info and active internships",
        description: "Retrieve comprehensive dashboard data including assigned mentor details, application statuses, active internships, readiness score, and recent notifications. This is the main landing page data for students.",
        tags: ["Students", "Students - Dashboard"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard data retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Dashboard data retrieved successfully",
                  data: {
                    student: {
                      studentId: "STU-2024001",
                      profile: { name: "Rahul Sharma", department: "Computer Science", year: 3 },
                      readinessScore: 75,
                      credits: { earned: 12, approved: 8, pending: 4 }
                    },
                    mentor: {
                      mentorId: "MEN-2024001",
                      profile: { name: "Dr. Anjali Verma", department: "Computer Science" }
                    },
                    activeInternships: [],
                    recentApplications: []
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    
    "/students/profile": {
      get: {
        summary: "Get complete student profile with credits and internship history",
        description: "Retrieve the authenticated student's complete profile including personal information, skills, readiness score, credit summary, completed internships, certifications, and badges.",
        tags: ["Students", "Students - Dashboard"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Student profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            student: { $ref: "#/components/schemas/Student" }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },

    `;

console.log('Updating student documentation...');
console.log(`Student section starts at: ${studentSectionStart}`);
console.log(`Company section starts at: ${companySectionStart}`);
console.log(`Replacing ${companySectionStart - studentSectionStart} characters`);

// Combine the parts
const newContent = beforeStudent + comprehensiveStudentDocs + afterStudent;

// Write back to file
fs.writeFileSync(openapiPath, newContent, 'utf8');

console.log('✓ Student documentation updated successfully');
console.log('Note: This is a partial update. Full documentation should be added incrementally.');
