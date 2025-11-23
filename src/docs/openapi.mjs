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
          internshipId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          department: { type: "string" },
          requiredSkills: { type: "array", items: { type: "string" } },
          stipend: { type: "number" },
          location: { type: "string" },
          workMode: { type: "string", enum: ["remote", "onsite", "hybrid"] },
          status: { type: "string" },
          applicationDeadline: { type: "string", format: "date-time" },
          eligibilityRequirements: {
            type: "object",
            properties: {
              minYear: { type: "integer" },
              minReadinessScore: { type: "number" },
            },
          },
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
    "/students/dashboard": { get: { summary: "Get dashboard", tags: ["Students"], responses: { 200: { description: "Dashboard data" } } } },
    "/students/internships": { get: { summary: "Browse internships", tags: ["Students"], responses: { 200: { description: "List of internships", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Internship" } } } } } } } },
    "/students/internships/recommended": { get: { summary: "Get recommendations", tags: ["Students"], responses: { 200: { description: "Recommended internships" } } } },
    "/students/applications": {
      get: { summary: "Get my applications", tags: ["Students"], responses: { 200: { description: "List", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Application" } } } } } } },
      post: { summary: "Apply to internship", tags: ["Students"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/InternshipApplicationRequest" } } } }, responses: { 201: { description: "Applied" } } }
    },
    "/students/applications/{applicationId}": { delete: { summary: "Withdraw application", tags: ["Students"], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Withdrawn" } } } },
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
    "/companies/dashboard": { get: { summary: "Get dashboard", tags: ["Companies"], responses: { 200: { description: "Dashboard" } } } },
    "/companies/profile": {
      get: { summary: "Get profile", tags: ["Companies"], responses: { 200: { description: "Profile", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } } } },
      patch: { summary: "Update profile", tags: ["Companies"], responses: { 200: { description: "Updated" } } }
    },
    "/companies/internships": {
      get: { summary: "Get internships", tags: ["Companies"], responses: { 200: { description: "List" } } },
      post: { summary: "Create internship", tags: ["Companies"], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Internship" } } } }, responses: { 201: { description: "Created" } } }
    },
    "/companies/internships/{internshipId}": {
      put: { summary: "Update internship", tags: ["Companies"], parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
      delete: { summary: "Delete internship", tags: ["Companies"], parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } }
    },
    "/companies/internships/{internshipId}/complete": { post: { summary: "Complete internship", tags: ["Companies"], parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Completed" } } } },
    "/companies/internships/{internshipId}/applicants": { get: { summary: "Get applicants", tags: ["Companies"], parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Applicants" } } } },
    "/companies/applications/review": { post: { summary: "Review application", tags: ["Companies"], responses: { 200: { description: "Reviewed" } } } },
    "/companies/applications/shortlist": { post: { summary: "Shortlist candidate", tags: ["Companies"], responses: { 200: { description: "Shortlisted" } } } },
    "/companies/applications/reject": { post: { summary: "Reject candidate", tags: ["Companies"], responses: { 200: { description: "Rejected" } } } },
    "/companies/interns/progress": { get: { summary: "Intern progress", tags: ["Companies"], responses: { 200: { description: "Progress" } } } },
    "/companies/logbooks/{logbookId}/feedback": { post: { summary: "Logbook feedback", tags: ["Companies"], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Feedback saved" } } } },
    "/companies/events": { post: { summary: "Create event", tags: ["Companies"], responses: { 201: { description: "Created" } } } },
    "/companies/challenges": { post: { summary: "Create challenge", tags: ["Companies"], responses: { 201: { description: "Created" } } } },

    // Mentor Routes
    "/mentors/dashboard": { get: { summary: "Get dashboard", tags: ["Mentors"], responses: { 200: { description: "Dashboard" } } } },
    "/mentors/applications/pending": { get: { summary: "Pending applications", tags: ["Mentors"], responses: { 200: { description: "List" } } } },
    "/mentors/applications/{applicationId}": { get: { summary: "Application details", tags: ["Mentors"], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details" } } } },
    "/mentors/applications/{applicationId}/approve": { post: { summary: "Approve application", tags: ["Mentors"], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Approved" } } } },
    "/mentors/applications/{applicationId}/reject": { post: { summary: "Reject application", tags: ["Mentors"], parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Rejected" } } } },
    "/mentors/logbooks/pending": { get: { summary: "Pending logbooks", tags: ["Mentors"], responses: { 200: { description: "List" } } } },
    "/mentors/logbooks/{logbookId}": { get: { summary: "Logbook details", tags: ["Mentors"], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details" } } } },
    "/mentors/logbooks/{logbookId}/approve": { post: { summary: "Approve logbook", tags: ["Mentors"], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Approved" } } } },
    "/mentors/logbooks/{logbookId}/revision": { post: { summary: "Request revision", tags: ["Mentors"], parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Requested" } } } },
    "/mentors/skill-gaps": { get: { summary: "Skill gap analysis", tags: ["Mentors"], responses: { 200: { description: "Analysis" } } } },
    "/mentors/department/performance": { get: { summary: "Department performance", tags: ["Mentors"], responses: { 200: { description: "Performance" } } } },
    "/mentors/interventions": {
      get: { summary: "Get interventions", tags: ["Mentors"], responses: { 200: { description: "List" } } },
      post: { summary: "Create intervention", tags: ["Mentors"], responses: { 201: { description: "Created" } } }
    },
    "/mentors/students/{studentId}/progress": { get: { summary: "Student progress", tags: ["Mentors"], parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Progress" } } } },

    // Admin Routes
    "/admins/dashboard": { get: { summary: "Get dashboard", tags: ["Admin"], responses: { 200: { description: "Dashboard" } } } },
    "/admins/companies/pending": { get: { summary: "Pending companies", tags: ["Admin"], responses: { 200: { description: "List" } } } },
    "/admins/companies/{companyId}": { get: { summary: "Company details", tags: ["Admin"], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Details" } } } },
    "/admins/companies/{companyId}/verify": { post: { summary: "Verify company", tags: ["Admin"], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Verified" } } } },
    "/admins/companies/{companyId}/reject": { post: { summary: "Reject company", tags: ["Admin"], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Rejected" } } } },
    "/admins/companies/{companyId}/suspend": { post: { summary: "Suspend company", tags: ["Admin"], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Suspended" } } } },
    "/admins/students/import": { post: { summary: "Bulk import students", tags: ["Admin"], responses: { 202: { description: "Accepted" } } } },
    "/admins/students/import/{jobId}": { get: { summary: "Import status", tags: ["Admin"], parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status" } } } },
    "/admins/mentors/assign": { post: { summary: "Assign mentor", tags: ["Admin"], responses: { 200: { description: "Assigned" } } } },
    "/admins/credits/process": { post: { summary: "Process credits", tags: ["Admin"], responses: { 202: { description: "Processing" } } } },
    "/admins/reports/system": { post: { summary: "System report", tags: ["Admin"], responses: { 202: { description: "Generating" } } } },
    "/admins/analytics/system": { get: { summary: "System analytics", tags: ["Admin"], responses: { 200: { description: "Analytics" } } } },
    "/admins/analytics/college": { get: { summary: "College analytics", tags: ["Admin"], responses: { 200: { description: "Analytics" } } } },
    "/admins/system/health": { get: { summary: "System health", tags: ["Admin"], responses: { 200: { description: "Health" } } } },
    "/admins/ai/usage": { get: { summary: "AI usage", tags: ["Admin"], responses: { 200: { description: "Usage" } } } },

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