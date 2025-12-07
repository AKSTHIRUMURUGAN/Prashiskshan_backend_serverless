import swaggerJsdoc from "swagger-jsdoc";
import config from "./index.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Prashiskshan API Documentation",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for Prashiskshan - NEP 2020 compliant internship management platform. This API supports student internship management, company operations, mentor oversight, and administrative functions.",
      contact: {
        name: "Prashiskshan Support",
        email: "support@prashiskshan.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: config.app.apiUrl || "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.prashiskshan.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Firebase ID Token obtained from authentication",
        },
      },
      schemas: {
        // Common Response Schemas
        SuccessResponse: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: {
              type: "boolean",
              example: true,
              description: "Indicates if the request was successful",
            },
            message: {
              type: "string",
              example: "Operation completed successfully",
              description: "Human-readable success message",
            },
            data: {
              type: "object",
              description: "Response payload containing the requested data",
            },
          },
          description: "Standard success response format",
        },
        Error: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: {
              type: "boolean",
              example: false,
              description: "Always false for error responses",
            },
            message: {
              type: "string",
              example: "An error occurred",
              description: "Human-readable error message",
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR",
                  description: "Machine-readable error code",
                },
                details: {
                  type: "object",
                  description: "Additional error details and context",
                },
              },
            },
            requestId: {
              type: "string",
              example: "req_1234567890",
              description: "Unique request identifier for debugging",
            },
          },
          description: "Standard error response format",
        },
        Pagination: {
          type: "object",
          required: ["currentPage", "totalPages", "totalItems", "itemsPerPage"],
          properties: {
            currentPage: {
              type: "integer",
              example: 1,
              minimum: 1,
              description: "Current page number",
            },
            totalPages: {
              type: "integer",
              example: 10,
              minimum: 0,
              description: "Total number of pages",
            },
            totalItems: {
              type: "integer",
              example: 95,
              minimum: 0,
              description: "Total number of items across all pages",
            },
            itemsPerPage: {
              type: "integer",
              example: 10,
              minimum: 1,
              description: "Number of items per page",
            },
            hasNextPage: {
              type: "boolean",
              example: true,
              description: "Whether there is a next page",
            },
            hasPrevPage: {
              type: "boolean",
              example: false,
              description: "Whether there is a previous page",
            },
          },
          description: "Pagination metadata for list responses",
        },

        // Status Enum Schemas
        InternshipStatus: {
          type: "string",
          enum: [
            "draft",
            "pending_admin_verification",
            "admin_approved",
            "admin_rejected",
            "mentor_rejected",
            "open_for_applications",
            "closed",
            "cancelled",
          ],
          description:
            "Internship lifecycle status. Flow: draft → pending_admin_verification → admin_approved → open_for_applications → closed. Rejection paths: admin_rejected, mentor_rejected",
        },
        ApplicationStatus: {
          type: "string",
          enum: [
            "pending",
            "mentor_approved",
            "shortlisted",
            "accepted",
            "rejected",
            "withdrawn",
          ],
          description:
            "Application workflow status. Flow: pending → mentor_approved → shortlisted → accepted/rejected. Students can withdraw at any time.",
        },
        CreditRequestStatus: {
          type: "string",
          enum: [
            "pending",
            "mentor_reviewing",
            "mentor_approved",
            "mentor_rejected",
            "admin_reviewing",
            "admin_approved",
            "admin_rejected",
            "completed",
          ],
          description:
            "Credit transfer workflow status. Flow: pending → mentor_reviewing → mentor_approved → admin_reviewing → admin_approved → completed. Rejection paths: mentor_rejected, admin_rejected",
        },
        LogbookStatus: {
          type: "string",
          enum: [
            "submitted",
            "mentor_reviewing",
            "company_reviewing",
            "approved",
            "revision_requested",
            "rejected",
          ],
          description:
            "Logbook review workflow status. Flow: submitted → mentor_reviewing → approved. Mentor can request revision.",
        },
        CompanyVerificationStatus: {
          type: "string",
          enum: [
            "pending_verification",
            "verified",
            "rejected",
            "suspended",
            "blocked",
          ],
          description:
            "Company verification workflow status. Flow: pending_verification → verified. Admin can suspend or block verified companies.",
        },

        // Entity Schemas
        Student: {
          type: "object",
          properties: {
            studentId: {
              type: "string",
              example: "STD-2024001",
            },
            firebaseUid: {
              type: "string",
              example: "firebase-uid-123",
            },
            email: {
              type: "string",
              format: "email",
              example: "student@university.edu",
            },
            profile: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  example: "John Doe",
                },
                department: {
                  type: "string",
                  example: "Computer Science",
                },
                year: {
                  type: "integer",
                  example: 3,
                },
                college: {
                  type: "string",
                  example: "University Name",
                },
                rollNumber: {
                  type: "string",
                  example: "CS2024001",
                },
                phone: {
                  type: "string",
                  example: "+919876543210",
                },
                bio: {
                  type: "string",
                  example: "Passionate about software development",
                },
                skills: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["JavaScript", "Node.js", "React"],
                },
                interests: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["Web Development", "AI"],
                },
              },
            },
            credits: {
              type: "number",
              example: 12.5,
            },
            totalHours: {
              type: "number",
              example: 500,
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended", "deleted"],
              example: "active",
            },
          },
        },
        Company: {
          type: "object",
          properties: {
            companyId: {
              type: "string",
              example: "COM-2024001",
            },
            firebaseUid: {
              type: "string",
              example: "firebase-uid-456",
            },
            companyName: {
              type: "string",
              example: "Tech Solutions Inc",
            },
            email: {
              type: "string",
              format: "email",
              example: "contact@techsolutions.com",
            },
            website: {
              type: "string",
              format: "uri",
              example: "https://techsolutions.com",
            },
            phone: {
              type: "string",
              example: "+919876543210",
            },
            address: {
              type: "string",
              example: "123 Business Park, Mumbai",
            },
            status: {
              type: "string",
              enum: ["pending", "verified", "rejected", "suspended"],
              example: "verified",
            },
            documents: {
              type: "object",
              properties: {
                cinNumber: {
                  type: "string",
                  example: "U72900MH2024PTC123456",
                },
                gstCertificate: {
                  type: "string",
                  format: "uri",
                },
              },
            },
          },
        },
        Mentor: {
          type: "object",
          properties: {
            mentorId: {
              type: "string",
              example: "MEN-2024001",
            },
            firebaseUid: {
              type: "string",
              example: "firebase-uid-789",
            },
            email: {
              type: "string",
              format: "email",
              example: "mentor@university.edu",
            },
            profile: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  example: "Dr. Jane Smith",
                },
                department: {
                  type: "string",
                  example: "Computer Science",
                },
                designation: {
                  type: "string",
                  example: "Associate Professor",
                },
                expertiseAreas: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["Web Development", "Database Systems"],
                },
              },
            },
          },
        },
        Internship: {
          type: "object",
          properties: {
            internshipId: {
              type: "string",
              example: "INT-2024001",
            },
            companyId: {
              type: "string",
              example: "COM-2024001",
            },
            title: {
              type: "string",
              example: "Full Stack Development Intern",
            },
            description: {
              type: "string",
              example: "Join our dynamic team as a full stack development intern...",
            },
            department: {
              type: "string",
              example: "Computer Science",
            },
            requiredSkills: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["JavaScript", "Node.js", "React"],
            },
            optionalSkills: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["TypeScript", "Docker"],
            },
            duration: {
              type: "string",
              example: "6 months",
            },
            stipend: {
              type: "number",
              example: 20000,
            },
            location: {
              type: "string",
              example: "Bangalore",
            },
            workMode: {
              type: "string",
              enum: ["remote", "onsite", "hybrid"],
              example: "hybrid",
            },
            status: {
              type: "string",
              enum: ["draft", "pending_admin_verification", "admin_approved", "admin_rejected", "mentor_rejected", "open_for_applications", "closed", "cancelled"],
              example: "open_for_applications",
              description: "Internship workflow status",
            },
            slots: {
              type: "integer",
              example: 5,
            },
            slotsRemaining: {
              type: "integer",
              example: 3,
              description: "Available slots after acceptances",
            },
            appliedCount: {
              type: "integer",
              example: 15,
              description: "Total applications received",
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2024-06-01",
            },
            applicationDeadline: {
              type: "string",
              format: "date-time",
              example: "2024-05-15T23:59:59Z",
            },
            responsibilities: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Develop features", "Write tests"],
            },
            learningOpportunities: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Mentorship", "Code reviews"],
            },
            eligibilityRequirements: {
              type: "object",
              properties: {
                minYear: {
                  type: "integer",
                  example: 2,
                },
                minReadinessScore: {
                  type: "number",
                  example: 60,
                },
                requiredModules: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
            },
            adminReview: {
              type: "object",
              properties: {
                reviewedBy: {
                  type: "string",
                  example: "ADM-001",
                },
                reviewedAt: {
                  type: "string",
                  format: "date-time",
                },
                decision: {
                  type: "string",
                  enum: ["approved", "rejected"],
                },
                comments: {
                  type: "string",
                },
                reasons: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              description: "Admin verification details",
            },
            mentorApproval: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["pending", "approved", "rejected"],
                  default: "pending",
                },
                mentorId: {
                  type: "string",
                  example: "MEN-001",
                },
                approvedAt: {
                  type: "string",
                  format: "date-time",
                },
                comments: {
                  type: "string",
                },
                department: {
                  type: "string",
                },
              },
              description: "Mentor approval details",
            },
            aiTags: {
              type: "object",
              properties: {
                primarySkills: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["JavaScript", "React", "Node.js"],
                },
                difficulty: {
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"],
                  example: "intermediate",
                },
                careerPath: {
                  type: "string",
                  example: "Software Engineering",
                },
                industryFit: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["Technology", "Startups"],
                },
                learningIntensity: {
                  type: "string",
                  example: "moderate",
                },
                technicalDepth: {
                  type: "string",
                  example: "moderate",
                },
                generatedAt: {
                  type: "string",
                  format: "date-time",
                },
              },
              description: "AI-generated tags from Gemini API",
            },
            auditTrail: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: {
                    type: "string",
                    format: "date-time",
                  },
                  actor: {
                    type: "string",
                  },
                  actorRole: {
                    type: "string",
                  },
                  action: {
                    type: "string",
                  },
                  fromStatus: {
                    type: "string",
                  },
                  toStatus: {
                    type: "string",
                  },
                  reason: {
                    type: "string",
                  },
                },
              },
              description: "Complete audit trail of status changes",
            },
            postedBy: {
              type: "string",
              example: "COM-2024001",
            },
            postedAt: {
              type: "string",
              format: "date-time",
            },
            closedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Application: {
          type: "object",
          properties: {
            applicationId: {
              type: "string",
              example: "APP-2024001",
            },
            studentId: {
              type: "string",
              example: "STD-2024001",
            },
            internshipId: {
              type: "string",
              example: "INT-2024001",
            },
            coverLetter: {
              type: "string",
              example: "I am writing to express my interest...",
            },
            resumeUrl: {
              type: "string",
              format: "uri",
              example: "https://storage.example.com/resumes/resume.pdf",
            },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected", "shortlisted", "withdrawn"],
              example: "pending",
            },
            appliedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
            },
          },
        },
        Logbook: {
          type: "object",
          properties: {
            logbookId: {
              type: "string",
              example: "LOG-2024001",
            },
            studentId: {
              type: "string",
              example: "STD-2024001",
            },
            internshipId: {
              type: "string",
              example: "INT-2024001",
            },
            weekNumber: {
              type: "integer",
              example: 1,
            },
            hoursWorked: {
              type: "number",
              example: 40,
            },
            activities: {
              type: "string",
              example: "This week I worked on...",
            },
            tasksCompleted: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Implemented user authentication", "Fixed bugs"],
            },
            status: {
              type: "string",
              enum: ["pending", "approved", "revision_requested"],
              example: "pending",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and profile management",
      },
      {
        name: "Students",
        description: "Student-specific endpoints for internships, applications, and learning",
      },
      {
        name: "Companies",
        description: "Company-specific endpoints for internships and intern management",
      },
      {
        name: "Mentors",
        description: "Mentor-specific endpoints for application and logbook review",
      },
      {
        name: "Admin",
        description: "Administrative endpoints for system management",
      },
      {
        name: "Testing",
        description: "Test endpoints for external services (Email, S3, Queue, Gemini)",
      },
      {
        name: "Internship Verification",
        description: "Admin internship verification workflow endpoints",
      },
      {
        name: "Internship Approval",
        description: "Mentor internship approval workflow endpoints",
      },
      {
        name: "Internships",
        description: "Internship management endpoints",
      },
      {
        name: "Applications",
        description: "Application management endpoints",
      },
      {
        name: "Analytics",
        description: "Analytics and reporting endpoints",
      },
      {
        name: "Student Management",
        description: "Mentor student management endpoints",
      },
      {
        name: "Dashboard",
        description: "Dashboard endpoints for all user roles",
      },
    ],
  },
  apis: [
    "./src/routes/*.js",
    "./src/docs/swagger.yaml",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;

