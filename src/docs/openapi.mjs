const openapi = {
  openapi: "3.0.0",
  info: {
    title: "Prashiskshan API",
    version: "0.1.0",
    description: "OpenAPI documentation for the Prashiskshan internship management backend.",
  },
  servers: [{ url: "/api", description: "Local API base (mounted under /api)" }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      // Auth Schemas
      LoginRequest: {
        type: "object",
        properties: {
          idToken: { type: "string", description: "Firebase ID Token" },
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      SendPasswordResetRequest: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["idToken", "newPassword"],
        properties: {
          idToken: { type: "string" },
          newPassword: { type: "string" },
        },
      },
      ExchangeTokenRequest: {
        type: "object",
        properties: { customToken: { type: "string" } },
      },
      StudentRegistration: {
        type: "object",
        required: ["email", "password", "profile"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          profile: {
            type: "object",
            required: ["name", "department", "year", "college"],
            properties: {
              name: { type: "string" },
              department: { type: "string" },
              year: { type: "integer", description: "Year of study (1-5)", minimum: 1, maximum: 5, example: 3 },
              college: { type: "string" },
              rollNumber: { type: "string" },
              phone: { type: "string" },
              bio: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
              interests: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      CompanyRegistration: {
        type: "object",
        required: ["email", "password", "companyName", "website", "phone", "address", "documents", "pointOfContact"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          companyName: { type: "string" },
          website: { type: "string", format: "uri" },
          phone: { type: "string" },
          address: { type: "string" },
          documents: {
            type: "object",
            required: ["cinNumber"],
            properties: {
              cinNumber: { type: "string" },
              gstNumber: { type: "string" },
              gstCertificate: { type: "string" },
              registrationCertificate: { type: "string" },
            },
          },
          pointOfContact: {
            type: "object",
            required: ["name", "email", "phone"],
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              phone: { type: "string" },
              designation: { type: "string" },
            },
          },
        },
      },
      MentorRegistration: {
        type: "object",
        required: ["email", "password", "profile"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          profile: {
            type: "object",
            required: ["name", "department"],
            properties: {
              name: { type: "string" },
              department: { type: "string" },
              designation: { type: "string" },
              phone: { type: "string" },
              expertiseAreas: { type: "array", items: { type: "string" } },
            },
          },
          preferences: { type: "object" },
        },
      },
      AdminRegistration: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          name: { type: "string" },
          role: { type: "string", default: "admin" },
          permissions: { type: "array", items: { type: "string" } },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          profile: { type: "object", description: "Fields to update in profile" },
          preferences: { type: "object", description: "Fields to update in preferences (Student only)" },
          phone: { type: "string", description: "Company phone" },
          address: { type: "string", description: "Company address" },
          website: { type: "string", description: "Company website" },
          pointOfContact: { type: "object", description: "Company POC" },
        },
      },

      // Student Action Schemas
      InternshipApplicationRequest: {
        type: "object",
        required: ["internshipId", "coverLetter"],
        properties: {
          internshipId: { type: "string" },
          coverLetter: { type: "string" },
          resumeUrl: { type: "string" },
        },
      },
      StartModuleRequest: {
        type: "object",
        required: ["moduleCode"],
        properties: { moduleCode: { type: "string" } },
      },
      CompleteModuleRequest: {
        type: "object",
        required: ["moduleCode"],
        properties: {
          moduleCode: { type: "string" },
          score: { type: "number" },
        },
      },
      StartInterviewRequest: {
        type: "object",
        required: ["domain"],
        properties: {
          domain: { type: "string" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
        },
      },
      SubmitInterviewAnswerRequest: {
        type: "object",
        required: ["sessionId", "answer"],
        properties: {
          sessionId: { type: "string" },
          answer: { type: "string" },
        },
      },
      EndInterviewRequest: {
        type: "object",
        required: ["sessionId"],
        properties: { sessionId: { type: "string" } },
      },
      LogbookSubmissionRequest: {
        type: "object",
        required: ["internshipId", "weekNumber", "startDate", "endDate", "hoursWorked", "activities"],
        properties: {
          internshipId: { type: "string" },
          weekNumber: { type: "integer" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          hoursWorked: { type: "number" },
          activities: { type: "string" },
          tasksCompleted: { type: "array", items: { type: "string" } },
          skillsUsed: { type: "array", items: { type: "string" } },
          challenges: { type: "string" },
          learnings: { type: "string" },
          attachments: { type: "array", items: { type: "string" } },
        },
      },
      ChatbotQueryRequest: {
        type: "object",
        required: ["prompt"],
        properties: { prompt: { type: "string" } },
      },

      // Entity Schemas
      Student: {
        type: "object",
        properties: {
          studentId: { type: "string" },
          email: { type: "string" },
          profile: {
            type: "object",
            properties: {
              name: { type: "string" },
              department: { type: "string" },
              year: { type: "integer", example: 3 },
              college: { type: "string" },
              profileImage: { type: "string" },
              resume: { type: "string" },
            },
          },
          readinessScore: { type: "number" },
          credits: {
            type: "object",
            properties: {
              earned: { type: "number" },
              approved: { type: "number" },
              pending: { type: "number" },
            },
          },
        },
      },
      Company: {
        type: "object",
        properties: {
          companyId: { type: "string" },
          companyName: { type: "string" },
          status: { type: "string", enum: ["pending_verification", "verified", "rejected", "suspended"] },
          stats: {
            type: "object",
            properties: {
              activeInternships: { type: "integer" },
              studentsHired: { type: "integer" },
            },
          },
        },
      },
      Internship: {
        type: "object",
        properties: {
          internshipId: { type: "string", example: "INT-2024001" },
          companyId: { type: "string", example: "COM-2024001" },
          title: { type: "string", example: "Full Stack Developer Intern" },
          description: { type: "string", example: "Work on exciting projects..." },
          department: { type: "string", example: "Computer Science" },
          requiredSkills: { type: "array", items: { type: "string" }, example: ["JavaScript", "React", "Node.js"] },
          optionalSkills: { type: "array", items: { type: "string" }, example: ["TypeScript", "Docker"] },
          duration: { type: "string", example: "6 months" },
          stipend: { type: "number", example: 15000 },
          location: { type: "string", example: "Mumbai" },
          workMode: { type: "string", enum: ["remote", "onsite", "hybrid"], example: "hybrid" },
          status: { 
            type: "string", 
            enum: ["draft", "pending_admin_verification", "admin_approved", "admin_rejected", "mentor_rejected", "open_for_applications", "closed", "cancelled"], 
            example: "open_for_applications",
            description: "Internship workflow status"
          },
          slots: { type: "integer", minimum: 1, maximum: 100, example: 5 },
          slotsRemaining: { type: "integer", example: 3, description: "Available slots after acceptances" },
          appliedCount: { type: "integer", example: 15, description: "Total applications received" },
          startDate: { type: "string", format: "date", example: "2024-06-01" },
          applicationDeadline: { type: "string", format: "date-time", example: "2024-05-15T23:59:59Z" },
          responsibilities: { type: "array", items: { type: "string" }, example: ["Develop features", "Write tests"] },
          learningOpportunities: { type: "array", items: { type: "string" }, example: ["Mentorship", "Code reviews"] },
          eligibilityRequirements: {
            type: "object",
            properties: {
              minYear: { type: "integer", example: 2 },
              minReadinessScore: { type: "number", example: 60 },
              requiredModules: { type: "array", items: { type: "string" } }
            },
          },
          adminReview: {
            type: "object",
            properties: {
              reviewedBy: { type: "string", example: "ADM-001" },
              reviewedAt: { type: "string", format: "date-time" },
              decision: { type: "string", enum: ["approved", "rejected"] },
              comments: { type: "string" },
              reasons: { type: "array", items: { type: "string" } }
            },
            description: "Admin verification details"
          },
          mentorApproval: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["pending", "approved", "rejected"], default: "pending" },
              mentorId: { type: "string", example: "MEN-001" },
              approvedAt: { type: "string", format: "date-time" },
              comments: { type: "string" },
              department: { type: "string" }
            },
            description: "Mentor approval details"
          },
          aiTags: {
            type: "object",
            properties: {
              primarySkills: { type: "array", items: { type: "string" }, example: ["JavaScript", "React", "Node.js"] },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"], example: "intermediate" },
              careerPath: { type: "string", example: "Software Engineering" },
              industryFit: { type: "array", items: { type: "string" }, example: ["Technology", "Startups"] },
              learningIntensity: { type: "string", example: "moderate" },
              technicalDepth: { type: "string", example: "moderate" },
              generatedAt: { type: "string", format: "date-time" }
            },
            description: "AI-generated tags from Gemini API"
          },
          auditTrail: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: { type: "string", format: "date-time" },
                actor: { type: "string" },
                actorRole: { type: "string" },
                action: { type: "string" },
                fromStatus: { type: "string" },
                toStatus: { type: "string" },
                reason: { type: "string" }
              }
            },
            description: "Complete audit trail of status changes"
          },
          postedBy: { type: "string", example: "COM-2024001" },
          postedAt: { type: "string", format: "date-time" },
          closedAt: { type: "string", format: "date-time" }
        },
      },
      Application: {
        type: "object",
        properties: {
          applicationId: { type: "string" },
          status: { type: "string", enum: ["pending", "mentor_approved", "shortlisted", "accepted", "rejected"] },
          coverLetter: { type: "string" },
          aiRanking: {
            type: "object",
            properties: {
              matchScore: { type: "number" },
              recommendation: { type: "string" },
            },
          },
        },
      },
      Logbook: {
        type: "object",
        properties: {
          logbookId: { type: "string" },
          weekNumber: { type: "integer" },
          hoursWorked: { type: "number" },
          activities: { type: "string" },
          status: { type: "string" },
          aiSummary: {
            type: "object",
            properties: {
              summary: { type: "string" },
              keySkillsDemonstrated: { type: "array", items: { type: "string" } },
            },
          },
        },
      },

      // Test Schemas
      TestEmailRequest: {
        type: "object",
        required: ["to", "subject", "template"],
        properties: {
          to: { type: "string", format: "email" },
          subject: { type: "string" },
          template: { type: "string" },
          data: { type: "object" },
        },
      },
      TestS3UploadRequest: {
        type: "object",
        required: ["file"],
        properties: {
          file: { type: "string", format: "binary" },
          folder: { type: "string" },
        },
      },
      TestQueueJobRequest: {
        type: "object",
        required: ["queueName"],
        properties: {
          queueName: { type: "string", enum: ["email", "sms", "logbook", "report", "notification", "completion", "ai"] },
          data: { type: "object" },
        },
      },
      TestGeminiRequest: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: { type: "string" },
          model: { type: "string", enum: ["flash", "pro"] },
        },
      },
    },
  },
  paths: {
    // Auth Routes
    "/auth/students/register": { post: { summary: "Register student", tags: ["Authentication"], security: [], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StudentRegistration" } } } }, responses: { 201: { description: "Created" } } } },
    "/auth/companies/register": { post: { summary: "Register company", tags: ["Authentication"], security: [], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CompanyRegistration" } } } }, responses: { 201: { description: "Created" } } } },
    "/auth/mentors/register": { post: { summary: "Register mentor", tags: ["Authentication"], security: [], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/MentorRegistration" } } } }, responses: { 201: { description: "Created" } } } },
    "/auth/admins/register": { post: { summary: "Register admin", tags: ["Authentication"], security: [], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/AdminRegistration" } } } }, responses: { 201: { description: "Created" } } } },
    "/auth/login": {
      post: {
        summary: "Login",
        tags: ["Authentication"],
        security: [],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user: { type: "object" },
                        idToken: { type: "string", description: "JWT Token for Bearer Auth" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
    },
    "/auth/me": { get: { summary: "Get profile", tags: ["Authentication"], responses: { 200: { description: "Profile" } } }, patch: { summary: "Update profile", tags: ["Authentication"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } } }, responses: { 200: { description: "Updated" } } } },
    "/auth/verify-email": { post: { summary: "Send verification", tags: ["Authentication"], responses: { 200: { description: "Sent" } } }, get: { summary: "Verify code", tags: ["Authentication"], security: [], parameters: [{ name: "oobCode", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Verified" } } } },
    "/auth/send-password-reset": { post: { summary: "Send reset email", tags: ["Authentication"], security: [], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/SendPasswordResetRequest" } } } }, responses: { 200: { description: "Sent" } } } },
    "/auth/password": { post: { summary: "Change password", tags: ["Authentication"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } } } }, responses: { 200: { description: "Changed" } } } },
    "/auth/exchange-cookie": { post: { summary: "Exchange cookie for token", tags: ["Authentication"], security: [], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ExchangeTokenRequest" } } } }, responses: { 200: { description: "Token exchanged" } } } },
    "/auth/profile/image": { post: { summary: "Upload profile image", tags: ["Authentication"], requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } }, responses: { 200: { description: "Uploaded" } } } },
    "/auth/profile/resume": { post: { summary: "Upload resume", tags: ["Authentication"], requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } }, responses: { 200: { description: "Uploaded" } } } },
    "/auth/account": { delete: { summary: "Delete account", tags: ["Authentication"], responses: { 204: { description: "Deleted" } } } },

    // Student Routes
    "/students/dashboard": { 
      get: { 
        summary: "Get student dashboard with mentor info", 
        description: "Get dashboard data including mentor details, application statuses, and active internships",
        tags: ["Students", "Dashboard"], 
        security: [{ BearerAuth: [] }], 
        responses: { 200: { description: "Dashboard data" } } 
      } 
    },
    "/students/profile": { 
      get: { 
        summary: "Get profile with credits and history", 
        description: "Get student profile including total credits, readiness score, and internship history",
        tags: ["Students"], 
        security: [{ BearerAuth: [] }], 
        responses: { 200: { description: "Student profile" } } 
      } 
    },
    
    // Student Internship Discovery (Requirements: 4.1, 4.2)
    "/students/internships": { 
      get: { 
        summary: "Browse available internships with AI match scores", 
        description: "Browse mentor-approved internships for student's department with optional AI match scoring",
        tags: ["Students", "Internships"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "location", in: "query", schema: { type: "string" }, description: "Filter by location" },
          { name: "workMode", in: "query", schema: { type: "string", enum: ["remote", "onsite", "hybrid"] } },
          { name: "skills", in: "query", schema: { type: "string" }, description: "Comma-separated skills" },
          { name: "minStipend", in: "query", schema: { type: "number" } },
          { name: "maxStipend", in: "query", schema: { type: "number" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "includeMatchScore", in: "query", schema: { type: "boolean" }, description: "Include AI match scores" }
        ],
        responses: { 
          200: { 
            description: "List of internships with optional match scores",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Internship" } } } } 
          } 
        } 
      } 
    },
    "/students/internships/recommended": { get: { summary: "Get AI recommendations", tags: ["Students", "Internships"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Recommended internships" } } } },
    "/students/internships/{internshipId}": { 
      get: { 
        summary: "Get internship details with match analysis", 
        description: "Get complete internship details with AI match score and analysis",
        tags: ["Students", "Internships"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Internship details with match analysis" } } 
      } 
    },
    "/students/internships/{internshipId}/apply": { 
      post: { 
        summary: "Apply to internship", 
        description: "Submit application to internship (creates notification for company)",
        tags: ["Students", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["coverLetter"],
                properties: {
                  coverLetter: { type: "string" },
                  resumeUrl: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 
          201: { description: "Application submitted" },
          400: { description: "Deadline passed or already applied" },
          409: { description: "Duplicate application" }
        } 
      } 
    },
    
    // Student Application Management (Requirements: 7.2)
    "/students/applications": {
      get: { 
        summary: "List my applications with status", 
        description: "Get all applications with current status and company feedback",
        tags: ["Students", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { 
          200: { 
            description: "List of applications",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Application" } } } } 
          } 
        } 
      }
    },
    "/students/applications/{applicationId}": { 
      get: { 
        summary: "Get application details", 
        description: "Get application details with status tracking",
        tags: ["Students", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Application details" } } 
      },
      delete: { 
        summary: "Withdraw application", 
        tags: ["Students", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], 
        responses: { 200: { description: "Withdrawn" } } 
      } 
    },
    "/students/modules/recommended": { get: { summary: "Get recommended modules", tags: ["Students"], responses: { 200: { description: "Modules" } } } },
    "/students/modules/start": { post: { summary: "Start module", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StartModuleRequest" } } } }, responses: { 200: { description: "Started" } } } },
    "/students/modules/complete": { post: { summary: "Complete module", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CompleteModuleRequest" } } } }, responses: { 200: { description: "Completed" } } } },
    "/students/interviews/start": { post: { summary: "Start interview", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StartInterviewRequest" } } } }, responses: { 201: { description: "Session started" } } } },
    "/students/interviews/answer": { post: { summary: "Submit answer", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitInterviewAnswerRequest" } } } }, responses: { 200: { description: "AI response" } } } },
    "/students/interviews/end": { post: { summary: "End interview", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/EndInterviewRequest" } } } }, responses: { 200: { description: "Ended" } } } },
    "/students/interviews/history": { get: { summary: "Interview history", tags: ["Students"], responses: { 200: { description: "History" } } } },
    "/students/logbooks": {
      get: { summary: "Get logbooks", tags: ["Students"], responses: { 200: { description: "List", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Logbook" } } } } } } },
      post: { summary: "Submit logbook", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/LogbookSubmissionRequest" } } } }, responses: { 201: { description: "Submitted" } } }
    },
    "/students/credits": { get: { summary: "Get credits", tags: ["Students"], responses: { 200: { description: "Credits summary" } } } },
    "/students/reports/nep": { post: { summary: "Generate NEP report", tags: ["Students"], responses: { 202: { description: "Generating" } } } },
    "/students/chatbot": { post: { summary: "Chatbot query", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ChatbotQueryRequest" } } } }, responses: { 200: { description: "Response" } } } },

    // Company Routes
    "/companies/dashboard": { get: { summary: "Get dashboard", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Dashboard" } } } },
    "/companies/profile": {
      get: { summary: "Get profile", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Profile", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } } } },
      patch: { summary: "Update profile", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Updated" } } }
    },
    
    // Company Internship Management (Requirements: 1.1, 1.2, 1.4, 1.5)
    "/companies/internships": {
      get: { 
        summary: "Get all company internships", 
        description: "Get all internships posted by the company with filtering",
        tags: ["Companies", "Internships"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { 200: { description: "List of internships" } } 
      },
      post: { 
        summary: "Create internship with AI tagging", 
        description: "Create new internship (status: pending_admin_verification). AI tags generated asynchronously.",
        tags: ["Companies", "Internships"], 
        security: [{ BearerAuth: [] }], 
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object",
                required: ["title", "description", "department", "duration", "requiredSkills", "startDate", "applicationDeadline", "slots"],
                properties: {
                  title: { type: "string", example: "Full Stack Developer Intern" },
                  description: { type: "string" },
                  department: { type: "string", example: "Computer Science" },
                  duration: { type: "string", example: "6 months" },
                  requiredSkills: { type: "array", items: { type: "string" }, example: ["JavaScript", "React", "Node.js"] },
                  optionalSkills: { type: "array", items: { type: "string" } },
                  startDate: { type: "string", format: "date" },
                  applicationDeadline: { type: "string", format: "date-time" },
                  slots: { type: "integer", minimum: 1 },
                  stipend: { type: "number" },
                  location: { type: "string" },
                  workMode: { type: "string", enum: ["remote", "onsite", "hybrid"] },
                  responsibilities: { type: "array", items: { type: "string" } },
                  learningOpportunities: { type: "array", items: { type: "string" } },
                  eligibilityRequirements: { 
                    type: "object",
                    properties: {
                      minYear: { type: "integer" },
                      minReadinessScore: { type: "number" }
                    }
                  }
                }
              } 
            } 
          } 
        },
        responses: { 
          201: { description: "Internship created" },
          400: { description: "Validation error" },
          403: { description: "Company not verified" }
        } 
      }
    },
    "/companies/internships/{internshipId}": {
      get: { 
        summary: "Get internship details", 
        tags: ["Companies", "Internships"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Internship details" } } 
      },
      patch: { 
        summary: "Update internship (resets to pending_admin_verification)", 
        description: "Update internship details. Status resets to pending_admin_verification for re-review.",
        tags: ["Companies", "Internships"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], 
        responses: { 200: { description: "Updated" } } 
      },
      delete: { 
        summary: "Cancel internship", 
        tags: ["Companies", "Internships"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], 
        responses: { 200: { description: "Cancelled" } } 
      }
    },
    "/companies/internships/{internshipId}/complete": { post: { summary: "Complete internship", tags: ["Companies"], security: [{ BearerAuth: [] }], parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Completed" } } } },
    
    // Company Application Management (Requirements: 5.2, 5.3)
    "/companies/internships/{internshipId}/applicants": { 
      get: { 
        summary: "Get applicants with filters", 
        description: "Get all applicants for an internship with filtering and pagination",
        tags: ["Companies", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "internshipId", in: "path", required: true, schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" },
          { name: "companyFeedbackStatus", in: "query", schema: { type: "string" }, description: "Filter by feedback status" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { 200: { description: "List of applicants" } } 
      } 
    },
    "/companies/applications/approve": { 
      post: { 
        summary: "Approve application", 
        description: "Approve application (decrements slots, notifies student)",
        tags: ["Companies", "Applications"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationId"],
                properties: {
                  applicationId: { type: "string" },
                  feedback: { type: "string" },
                  nextSteps: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: "Application approved" },
          400: { description: "No slots remaining" }
        } 
      } 
    },
    "/companies/applications/reject-single": { 
      post: { 
        summary: "Reject application", 
        description: "Reject application with optional feedback",
        tags: ["Companies", "Applications"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationId"],
                properties: {
                  applicationId: { type: "string" },
                  reason: { type: "string" },
                  feedback: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Application rejected" } } 
      } 
    },
    "/companies/applications/{applicationId}": { 
      get: { 
        summary: "Get application details", 
        tags: ["Companies", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Application details" } } 
      } 
    },
    "/companies/applications/review": { post: { summary: "Review application", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Reviewed" } } } },
    "/companies/applications/shortlist": { post: { summary: "Shortlist candidate", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Shortlisted" } } } },
    "/companies/applications/reject": { post: { summary: "Reject candidates (bulk)", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Rejected" } } } },
    "/companies/interns/progress": { get: { summary: "Intern progress", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Progress" } } } },
    "/companies/logbooks/{logbookId}/feedback": { post: { summary: "Logbook feedback", tags: ["Companies"], security: [{ BearerAuth: [] }], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Feedback saved" } } } },
    "/companies/events": { post: { summary: "Create event", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 201: { description: "Created" } } } },
    "/companies/challenges": { post: { summary: "Create challenge", tags: ["Companies"], security: [{ BearerAuth: [] }], responses: { 201: { description: "Created" } } } },
    
    // Company Analytics (Requirements: 9.1, 9.2, 9.3, 9.4, 9.5)
    "/companies/analytics": { 
      get: { 
        summary: "Get company analytics with date range", 
        description: "Get analytics including application funnel and completion metrics",
        tags: ["Companies", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date" }
        ],
        responses: { 200: { description: "Company analytics" } } 
      } 
    },
    "/companies/analytics/export": { 
      get: { 
        summary: "Export analytics report", 
        description: "Export analytics in CSV or PDF format",
        tags: ["Companies", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["csv", "pdf"], default: "csv" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: { 200: { description: "Analytics report file" } } 
      } 
    },
    "/companies/internships/{internshipId}/metrics": { 
      get: { 
        summary: "Get internship-specific metrics", 
        description: "Get detailed metrics for a specific internship",
        tags: ["Companies", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Internship metrics" } } 
      } 
    },

    // Mentor Routes
    "/mentors/dashboard": { get: { summary: "Get dashboard", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Dashboard" } } } },
    "/mentors/applications/pending": { get: { summary: "Pending applications", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 200: { description: "List" } } } },
    "/mentors/applications/{applicationId}": { get: { summary: "Application details", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details" } } } },
    "/mentors/applications/{applicationId}/approve": { post: { summary: "Approve application", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Approved" } } } },
    "/mentors/applications/{applicationId}/reject": { post: { summary: "Reject application", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Rejected" } } } },
    "/mentors/logbooks/pending": { get: { summary: "Pending logbooks", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 200: { description: "List" } } } },
    "/mentors/logbooks/{logbookId}": { get: { summary: "Logbook details", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details" } } } },
    "/mentors/logbooks/{logbookId}/approve": { post: { summary: "Approve logbook", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Approved" } } } },
    "/mentors/logbooks/{logbookId}/revision": { post: { summary: "Request revision", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Requested" } } } },
    "/mentors/skill-gaps": { get: { summary: "Skill gap analysis", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Analysis" } } } },
    "/mentors/department/performance": { get: { summary: "Department performance", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Performance" } } } },
    "/mentors/interventions": {
      get: { summary: "Get interventions", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 200: { description: "List" } } },
      post: { summary: "Create intervention", tags: ["Mentors"], security: [{ BearerAuth: [] }], responses: { 201: { description: "Created" } } }
    },
    "/mentors/students/{studentId}/progress": { get: { summary: "Student progress", tags: ["Mentors"], security: [{ BearerAuth: [] }], parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Progress" } } } },
    
    // Mentor Internship Approval Endpoints (Requirements: 3.1, 3.2, 3.3)
    "/mentors/internships/pending": { 
      get: { 
        summary: "List pending internships for mentor approval", 
        description: "Get admin-approved internships awaiting mentor approval for their department",
        tags: ["Mentors", "Internship Approval"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" },
          { name: "sortBy", in: "query", schema: { type: "string", default: "postedAt" }, description: "Sort field" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order" }
        ],
        responses: { 
          200: { 
            description: "List of pending internships",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { internships: { type: "array", items: { $ref: "#/components/schemas/Internship" } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } } }
          } 
        } 
      } 
    },
    "/mentors/internships/{internshipId}": { 
      get: { 
        summary: "Get internship details for review", 
        description: "Get complete internship details for mentor review",
        tags: ["Mentors", "Internship Approval"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID" }],
        responses: { 
          200: { description: "Internship details", content: { "application/json": { schema: { $ref: "#/components/schemas/Internship" } } } },
          404: { description: "Internship not found" }
        } 
      } 
    },
    "/mentors/internships/{internshipId}/approve": { 
      post: { 
        summary: "Approve internship for department", 
        description: "Approve internship making it visible to students (transitions to open_for_applications status)",
        tags: ["Mentors", "Internship Approval"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID" }],
        requestBody: { 
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                properties: { 
                  comments: { type: "string", description: "Optional approval comments" } 
                } 
              } 
            } 
          } 
        },
        responses: { 
          200: { description: "Internship approved" },
          400: { description: "Invalid state transition" },
          403: { description: "Department mismatch" },
          404: { description: "Internship not found" }
        } 
      } 
    },
    "/mentors/internships/{internshipId}/reject": { 
      post: { 
        summary: "Reject internship with reasons", 
        description: "Reject internship (transitions to mentor_rejected status)",
        tags: ["Mentors", "Internship Approval"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID" }],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                required: ["reasons"],
                properties: { 
                  reasons: { type: "string", description: "Rejection reasons" }
                } 
              } 
            } 
          } 
        },
        responses: { 
          200: { description: "Internship rejected" },
          400: { description: "Invalid state transition or missing reasons" },
          403: { description: "Department mismatch" },
          404: { description: "Internship not found" }
        } 
      } 
    },
    
    // Mentor Student Management Endpoints (Requirements: 8.2, 8.4, 8.5)
    "/mentors/students/list": { 
      get: { 
        summary: "List assigned students with filters", 
        description: "Get all students assigned to mentor with filtering by internship status, performance, and credit completion",
        tags: ["Mentors", "Student Management"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "sortBy", in: "query", schema: { type: "string", default: "profile.name" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
          { name: "internshipStatus", in: "query", schema: { type: "string", enum: ["active", "applied", "none"] }, description: "Filter by internship status" },
          { name: "performanceLevel", in: "query", schema: { type: "string", enum: ["high", "medium", "low"] }, description: "Filter by performance level" },
          { name: "creditCompletion", in: "query", schema: { type: "string", enum: ["completed", "in_progress", "not_started"] }, description: "Filter by credit completion" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name or roll number" }
        ],
        responses: { 
          200: { 
            description: "List of students",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { students: { type: "array", items: { $ref: "#/components/schemas/Student" } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } } }
          } 
        } 
      } 
    },
    "/mentors/students/{studentId}/details": { 
      get: { 
        summary: "Get student details with internship history", 
        description: "Get complete student profile including internship history and performance metrics",
        tags: ["Mentors", "Student Management"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID" }],
        responses: { 
          200: { description: "Student details", content: { "application/json": { schema: { $ref: "#/components/schemas/Student" } } } },
          404: { description: "Student not found" }
        } 
      } 
    },
    "/mentors/students/{studentId}/applications": { 
      get: { 
        summary: "Get student applications", 
        description: "Get all applications submitted by a student",
        tags: ["Mentors", "Student Management"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID" },
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { 
          200: { 
            description: "List of applications",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Application" } } } }
          } 
        } 
      } 
    },
    
    // Mentor Analytics Endpoints (Requirements: 8.1, 8.3)
    "/mentors/analytics": { 
      get: { 
        summary: "Get mentor-specific analytics", 
        description: "Get analytics for mentor including approval rates and student supervision metrics",
        tags: ["Mentors", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics" }
        ],
        responses: { 200: { description: "Mentor analytics" } } 
      } 
    },
    "/mentors/analytics/department": { 
      get: { 
        summary: "Get department analytics", 
        description: "Get analytics for mentor's department",
        tags: ["Mentors", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics" }
        ],
        responses: { 200: { description: "Department analytics" } } 
      } 
    },

    // Admin Routes
    "/admins/dashboard": { get: { summary: "Get dashboard", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Dashboard" } } } },
    "/admins/companies/pending": { get: { summary: "Pending companies", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "List" } } } },
    "/admins/companies/{companyId}": { get: { summary: "Company details", tags: ["Admin"], security: [{ BearerAuth: [] }], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details" } } } },
    "/admins/companies/{companyId}/verify": { post: { summary: "Verify company", tags: ["Admin"], security: [{ BearerAuth: [] }], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", required: ["comment"], properties: { comment: { type: "string" } } } } } }, responses: { 200: { description: "Verified" } } } },
    "/admins/companies/{companyId}/reject": { post: { summary: "Reject company", tags: ["Admin"], security: [{ BearerAuth: [] }], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Rejected" } } } },
    "/admins/companies/{companyId}/suspend": { post: { summary: "Suspend company", tags: ["Admin"], security: [{ BearerAuth: [] }], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Suspended" } } } },
    "/admins/students/import": { post: { summary: "Bulk import students", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 202: { description: "Accepted" } } } },
    "/admins/students/import/{jobId}": { get: { summary: "Import status", tags: ["Admin"], security: [{ BearerAuth: [] }], parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status" } } } },
    "/admins/mentors/assign": { post: { summary: "Assign mentor", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Assigned" } } } },
    "/admins/credits/process": { post: { summary: "Process credits", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 202: { description: "Processing" } } } },
    "/admins/reports/system": { post: { summary: "System report", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 202: { description: "Generating" } } } },
    "/admins/analytics/system": { get: { summary: "System analytics", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Analytics" } } } },
    "/admins/analytics/college": { get: { summary: "College analytics", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Analytics" } } } },
    "/admins/system/health": { get: { summary: "System health", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Health" } } } },
    "/admins/ai/usage": { get: { summary: "AI usage", tags: ["Admin"], security: [{ BearerAuth: [] }], responses: { 200: { description: "Usage" } } } },
    
    // Admin Internship Verification Endpoints (Requirements: 2.2, 2.3)
    "/admins/internships/pending": { 
      get: { 
        summary: "List pending internships for admin verification", 
        description: "Get all internships awaiting admin verification with filtering and pagination",
        tags: ["Admin", "Internship Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" },
          { name: "companyId", in: "query", schema: { type: "string" }, description: "Filter by company ID" },
          { name: "department", in: "query", schema: { type: "string" }, description: "Filter by department" },
          { name: "sortBy", in: "query", schema: { type: "string", default: "postedAt" }, description: "Sort field" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order" }
        ],
        responses: { 
          200: { 
            description: "List of pending internships",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { internships: { type: "array", items: { $ref: "#/components/schemas/Internship" } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } } }
          } 
        } 
      } 
    },
    "/admins/internships/{id}": { 
      get: { 
        summary: "Get internship details for verification", 
        description: "Get complete internship details including company history for admin review",
        tags: ["Admin", "Internship Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Internship ID" }],
        responses: { 
          200: { description: "Internship details", content: { "application/json": { schema: { $ref: "#/components/schemas/Internship" } } } },
          404: { description: "Internship not found" }
        } 
      } 
    },
    "/admins/internships/{id}/approve": { 
      post: { 
        summary: "Approve internship", 
        description: "Approve internship for mentor review (transitions to admin_approved status)",
        tags: ["Admin", "Internship Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Internship ID" }],
        requestBody: { 
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                properties: { 
                  comments: { type: "string", description: "Optional approval comments" } 
                } 
              } 
            } 
          } 
        },
        responses: { 
          200: { description: "Internship approved" },
          400: { description: "Invalid state transition" },
          404: { description: "Internship not found" }
        } 
      } 
    },
    "/admins/internships/{id}/reject": { 
      post: { 
        summary: "Reject internship", 
        description: "Reject internship with reasons (transitions to admin_rejected status)",
        tags: ["Admin", "Internship Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Internship ID" }],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                required: ["reasons"],
                properties: { 
                  reasons: { type: "string", description: "Rejection reasons" },
                  comments: { type: "string", description: "Additional comments" }
                } 
              } 
            } 
          } 
        },
        responses: { 
          200: { description: "Internship rejected" },
          400: { description: "Invalid state transition or missing reasons" },
          404: { description: "Internship not found" }
        } 
      } 
    },
    
    // Admin Analytics Endpoints (Requirements: 10.1, 10.2, 10.3, 10.4, 10.5)
    "/admins/analytics": { 
      get: { 
        summary: "Get system-wide analytics", 
        description: "Get comprehensive system analytics with date range filtering",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics" }
        ],
        responses: { 200: { description: "System analytics" } } 
      } 
    },
    "/admins/analytics/companies": { 
      get: { 
        summary: "Get company performance metrics", 
        description: "Get performance metrics for all companies with sorting and filtering",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["averageRating", "internshipsPosted", "applicationsReceived", "completionRate"] } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } }
        ],
        responses: { 200: { description: "Company performance metrics" } } 
      } 
    },
    "/admins/analytics/departments": { 
      get: { 
        summary: "Get department performance", 
        description: "Get performance metrics by department",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "department", in: "query", schema: { type: "string" }, description: "Specific department to analyze" },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: { 200: { description: "Department performance" } } 
      } 
    },
    "/admins/analytics/mentors": { 
      get: { 
        summary: "Get mentor performance", 
        description: "Get performance metrics for all mentors",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["approvalRate", "approvalsProcessed", "averageResponseTime", "studentsSupervised"] } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } }
        ],
        responses: { 200: { description: "Mentor performance metrics" } } 
      } 
    },
    "/admins/analytics/students": { 
      get: { 
        summary: "Get student performance", 
        description: "Get overall student performance metrics",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { 200: { description: "Student performance metrics" } } 
      } 
    },

    // Test Routes
    "/tests/email": {
      post: {
        summary: "Test email service",
        description: "Send a test email (Admin only)",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/TestEmailRequest" } } } },
        responses: { 200: { description: "Sent" } }
      }
    },
    "/tests/s3": {
      post: {
        summary: "Test S3 upload",
        description: "Upload test file (Admin only)",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/TestS3UploadRequest" } } } },
        responses: { 200: { description: "Uploaded" } }
      }
    },
    "/tests/queue": {
      post: {
        summary: "Test queue",
        description: "Enqueue test job (Admin only)",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/TestQueueJobRequest" } } } },
        responses: { 200: { description: "Enqueued" } }
      }
    },
    "/tests/gemini": {
      post: {
        summary: "Test Gemini AI",
        description: "Generate AI text (Admin only)",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/TestGeminiRequest" } } } },
        responses: { 200: { description: "Generated" } }
      }
    },
    "/tests/status": {
      get: {
        summary: "Test services status",
        description: "Check status of email, s3, queue, gemini (Admin only)",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Status" } }
      }
    },
    "/_tests": { get: { summary: "Integration probes", tags: ["Testing"], parameters: [{ name: "probe", in: "query", schema: { type: "boolean" } }], responses: { 200: { description: "Status" } } } },
    "/_tests/s3-upload": { post: { summary: "Probe S3 upload", tags: ["Testing"], requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } }, responses: { 200: { description: "Uploaded" } } } },
    "/_tests/send-email": { post: { summary: "Probe email", tags: ["Testing"], requestBody: { content: { "application/json": { schema: { type: "object" } } } }, responses: { 200: { description: "Sent" } } } },
    "/_tests/queues": { get: { summary: "Probe queues", tags: ["Testing"], responses: { 200: { description: "Queues" } } } },
    "/_tests/queues/{queueKey}/enqueue": { post: { summary: "Probe enqueue", tags: ["Testing"], parameters: [{ name: "queueKey", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Enqueued" } } } },
    "/_tests/queues/{queueKey}/jobs": { get: { summary: "Probe jobs", tags: ["Testing"], parameters: [{ name: "queueKey", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Jobs" } } } },
    "/_status": { get: { summary: "Server status", tags: ["Testing"], responses: { 200: { description: "Status" } } } }
  }
};

export default openapi;