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
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
            details: {
              type: "object",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 100,
            },
            pages: {
              type: "integer",
              example: 10,
            },
          },
        },
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

