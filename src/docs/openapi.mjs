/**
 * Prashiskshan API - OpenAPI 3.0 Specification
 * 
 * This file defines the complete API documentation for the Prashiskshan internship management system.
 * The documentation is served through Swagger UI at /api/docs
 * 
 * MAINTENANCE GUIDELINES:
 * 
 * 1. NAMING CONVENTIONS:
 *    - Schemas: PascalCase (StudentProfile, InternshipApplication)
 *    - Parameters: camelCase (studentId, sortBy, dateFrom)
 *    - Tags: Title Case with hyphens (Students - Applications)
 *    - Enums: snake_case (pending_admin_verification, admin_approved)
 * 
 * 2. EXAMPLE QUALITY:
 *    - Use realistic data (not "string" or "123")
 *    - Follow Indian context (IIT Delhi, Mumbai, +91 phone numbers)
 *    - Include all required fields
 *    - Be consistent across related endpoints
 * 
 * 3. WORKFLOW DOCUMENTATION:
 *    - Include state diagrams in descriptions
 *    - List all status values with explanations
 *    - Document transition rules and required actions
 *    - Explain error cases
 * 
 * 4. VALIDATION:
 *    - Run `npm run validate:docs` before committing
 *    - Test in Swagger UI at /api/docs
 *    - Ensure all routes are documented
 *    - Verify examples match schemas
 * 
 * 5. STRUCTURE:
 *    - Authentication endpoints: security: []
 *    - Protected endpoints: security: [{ BearerAuth: [] }]
 *    - All endpoints need: summary, description, tags, responses
 *    - All POST/PUT/PATCH need: requestBody with schema
 *    - All responses need: examples or schema
 * 
 * For complete guidelines, see: src/docs/README.md
 */

const openapi = {
  openapi: "3.0.0",
  info: {
    title: "Prashiskshan API",
    version: "1.1.0",
    description: "Comprehensive OpenAPI documentation for the Prashiskshan internship management system. This API enables students to discover and apply for internships, companies to post opportunities and manage applications, mentors to approve internships and supervise students, and administrators to verify companies and manage the system. Version 1.1.0 includes comprehensive documentation review, improved validation, and quality assurance.",
    contact: {
      name: "Prashiskshan Support",
      email: "support@prashiskshan.edu"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    { 
      url: "/api", 
      description: "Local development API (mounted under /api)" 
    },
    { 
      url: "https://api.prashiskshan.com/api", 
      description: "Production API" 
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: { 
        type: "http", 
        scheme: "bearer", 
        bearerFormat: "JWT",
        description: "JWT token obtained from /auth/login endpoint. Include in Authorization header as 'Bearer {token}'"
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
            description: "Indicates if the request was successful"
          },
          message: { 
            type: "string",
            example: "Operation completed successfully",
            description: "Human-readable success message"
          },
          data: { 
            type: "object",
            description: "Response payload containing the requested data"
          }
        },
        description: "Standard success response format"
      },
      Error: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { 
            type: "boolean", 
            example: false,
            description: "Always false for error responses"
          },
          message: { 
            type: "string",
            example: "An error occurred",
            description: "Human-readable error message"
          },
          error: {
            type: "object",
            properties: {
              code: { 
                type: "string",
                example: "VALIDATION_ERROR",
                description: "Machine-readable error code"
              },
              details: { 
                type: "object",
                description: "Additional error details and context"
              }
            }
          },
          requestId: { 
            type: "string",
            example: "req_1234567890",
            description: "Unique request identifier for debugging"
          }
        },
        description: "Standard error response format"
      },
      Pagination: {
        type: "object",
        required: ["currentPage", "totalPages", "totalItems", "itemsPerPage"],
        properties: {
          currentPage: { 
            type: "integer",
            example: 1,
            minimum: 1,
            description: "Current page number"
          },
          totalPages: { 
            type: "integer",
            example: 10,
            minimum: 0,
            description: "Total number of pages"
          },
          totalItems: { 
            type: "integer",
            example: 95,
            minimum: 0,
            description: "Total number of items across all pages"
          },
          itemsPerPage: { 
            type: "integer",
            example: 10,
            minimum: 1,
            description: "Number of items per page"
          },
          hasNextPage: { 
            type: "boolean",
            example: true,
            description: "Whether there is a next page"
          },
          hasPrevPage: { 
            type: "boolean",
            example: false,
            description: "Whether there is a previous page"
          }
        },
        description: "Pagination metadata for list responses"
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
          "cancelled"
        ],
        description: `Internship Lifecycle Workflow Status

**State Diagram:**
\`\`\`
draft → pending_admin_verification → admin_approved → open_for_applications → closed
                    ↓                        ↓
              admin_rejected           mentor_rejected
                                            
Any state → cancelled (by company)
\`\`\`

**Status Definitions:**
- **draft**: Initial state when company creates internship. Editable by company.
- **pending_admin_verification**: Submitted for admin review. Company cannot edit.
- **admin_approved**: Admin approved. Awaits mentor approval for department.
- **admin_rejected**: Admin rejected. Company can view rejection reasons and resubmit.
- **mentor_rejected**: Mentor rejected for their department. Internship not visible to students.
- **open_for_applications**: Mentor approved. Visible to students, accepting applications.
- **closed**: Application deadline passed or all slots filled. No new applications accepted.
- **cancelled**: Company cancelled the internship. All applicants notified.

**Transition Rules:**
1. draft → pending_admin_verification: Company submits internship
2. pending_admin_verification → admin_approved: Admin approves (requires valid documents, appropriate stipend, clear description)
3. pending_admin_verification → admin_rejected: Admin rejects (invalid details, policy violations)
4. admin_approved → mentor_rejected: Mentor rejects for their department
5. admin_approved → open_for_applications: Mentor approves for their department
6. open_for_applications → closed: Application deadline reached OR all slots filled
7. Any status → cancelled: Company cancels (cannot cancel if interns already accepted)

**Required Actions by Status:**
- **draft**: Company must complete all required fields and submit
- **pending_admin_verification**: Admin must review within 48 hours
- **admin_approved**: Mentor must review within 72 hours
- **admin_rejected**: Company must address rejection reasons and resubmit
- **mentor_rejected**: Company can appeal or modify for different department
- **open_for_applications**: Students can apply; company reviews applications
- **closed**: Company reviews final applications and makes hiring decisions
- **cancelled**: No further actions possible

**Error Cases:**
- Cannot transition to open_for_applications without mentor approval
- Cannot close internship with pending applications without resolution
- Cannot cancel internship with accepted interns (must complete instead)`
      },
      ApplicationStatus: {
        type: "string",
        enum: [
          "pending",
          "mentor_approved",
          "shortlisted",
          "accepted",
          "rejected",
          "withdrawn"
        ],
        description: `Application Flow Workflow Status

**State Diagram:**
\`\`\`
pending → mentor_approved → shortlisted → accepted
                                ↓            ↓
                            rejected     rejected
                            
Any active state → withdrawn (by student)
\`\`\`

**Status Definitions:**
- **pending**: Initial state when student applies. Awaiting mentor review.
- **mentor_approved**: Mentor approved student's application. Forwarded to company.
- **shortlisted**: Company shortlisted for interview. Student notified.
- **accepted**: Company accepted student. Slot allocated, internship begins.
- **rejected**: Application rejected by mentor or company. Student notified with feedback.
- **withdrawn**: Student withdrew application. Cannot be reversed.

**Transition Rules:**
1. pending → mentor_approved: Mentor approves (student meets eligibility, readiness score adequate)
2. pending → rejected: Mentor rejects (student not ready, missing prerequisites)
3. mentor_approved → shortlisted: Company shortlists for interview
4. mentor_approved → rejected: Company rejects without interview
5. shortlisted → accepted: Company accepts after interview (slot available)
6. shortlisted → rejected: Company rejects after interview
7. Any active status → withdrawn: Student withdraws application

**Required Actions by Status:**
- **pending**: Mentor must review within 48 hours
- **mentor_approved**: Company should review within 7 days
- **shortlisted**: Company schedules interview, student prepares
- **accepted**: Student confirms acceptance, company onboards
- **rejected**: Student can apply to other internships
- **withdrawn**: No further actions possible

**Eligibility Checks:**
- Student must meet minimum readiness score (if specified)
- Student must have completed required modules (if specified)
- Student must be in eligible year of study
- Student cannot have more than 3 active applications
- Student cannot apply to same internship twice

**Error Cases:**
- Cannot accept if all slots filled (must reject instead)
- Cannot shortlist if application already rejected
- Cannot withdraw after acceptance (must contact admin)
- Mentor cannot approve if student doesn't meet eligibility criteria`
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
          "completed"
        ],
        description: `Credit Transfer Flow Workflow Status

**State Diagram:**
\`\`\`
pending → mentor_reviewing → mentor_approved → admin_reviewing → admin_approved → completed
              ↓                                        ↓
        mentor_rejected                          admin_rejected
\`\`\`

**Status Definitions:**
- **pending**: Student submitted credit request. Awaiting mentor review.
- **mentor_reviewing**: Mentor actively reviewing logbooks and performance.
- **mentor_approved**: Mentor approved credit request. Forwarded to admin.
- **mentor_rejected**: Mentor rejected (insufficient hours, poor performance, incomplete logbooks).
- **admin_reviewing**: Admin actively reviewing for final approval.
- **admin_approved**: Admin approved. Credits will be added to student record.
- **admin_rejected**: Admin rejected (policy violations, documentation issues).
- **completed**: Credits successfully added to student's academic record.

**Transition Rules:**
1. pending → mentor_reviewing: Mentor starts review process
2. mentor_reviewing → mentor_approved: Mentor approves (all logbooks approved, hours met, performance satisfactory)
3. mentor_reviewing → mentor_rejected: Mentor rejects (criteria not met)
4. mentor_approved → admin_reviewing: Admin starts final review
5. admin_reviewing → admin_approved: Admin approves (documents valid, compliance met)
6. admin_reviewing → admin_rejected: Admin rejects (policy issues, invalid documents)
7. admin_approved → completed: Credits added to student record

**Required Actions by Status:**
- **pending**: System automatically moves to mentor_reviewing when mentor accesses
- **mentor_reviewing**: Mentor must review all logbooks, verify hours, assess performance
- **mentor_approved**: Admin must review within 5 business days
- **mentor_rejected**: Student can address issues and resubmit after 30 days
- **admin_reviewing**: Admin verifies documents, checks compliance, validates credit calculation
- **admin_approved**: System automatically adds credits and moves to completed
- **admin_rejected**: Student must address issues and resubmit
- **completed**: Credits reflected in student transcript

**Required Documents:**
- Completion certificate from company (mandatory)
- All weekly logbooks approved by mentor (mandatory)
- Company evaluation/feedback (mandatory)
- Final internship report (mandatory)
- Recommendation letter (optional, adds weight)

**Credit Calculation Rules:**
- Base credits = (Total hours worked / 40) rounded to nearest 0.5
- Maximum credits per internship = 8
- Minimum hours for credit eligibility = 160 hours (4 weeks)
- Performance multiplier: Excellent (1.0), Good (0.9), Satisfactory (0.8)
- Bonus credits for exceptional performance (up to +2, admin discretion)

**Error Cases:**
- Cannot approve if required documents missing
- Cannot approve if total hours < 160
- Cannot approve if any logbook rejected or pending
- Cannot resubmit rejected request within 30 days
- Cannot request credits for incomplete internship`
      },
      LogbookStatus: {
        type: "string",
        enum: [
          "submitted",
          "mentor_reviewing",
          "company_reviewing",
          "approved",
          "revision_requested",
          "rejected"
        ],
        description: `Logbook Flow Workflow Status

**State Diagram:**
\`\`\`
submitted → mentor_reviewing → approved
                ↓                  ↑
         revision_requested -------+
                ↓
            rejected

submitted → company_reviewing → (feedback added, returns to mentor flow)
\`\`\`

**Status Definitions:**
- **submitted**: Student submitted weekly logbook. Awaiting mentor review.
- **mentor_reviewing**: Mentor actively reviewing logbook entry.
- **company_reviewing**: Company providing feedback (parallel to mentor review).
- **approved**: Mentor approved logbook. Counts toward credit eligibility.
- **revision_requested**: Mentor requested revisions. Student must resubmit.
- **rejected**: Mentor rejected logbook (insufficient detail, fabricated hours, policy violations).

**Transition Rules:**
1. submitted → mentor_reviewing: Mentor starts review
2. submitted → company_reviewing: Company starts providing feedback (parallel process)
3. mentor_reviewing → approved: Mentor approves (adequate detail, reasonable hours, learning demonstrated)
4. mentor_reviewing → revision_requested: Mentor requests changes (insufficient detail, unclear activities)
5. mentor_reviewing → rejected: Mentor rejects (fabricated content, policy violations)
6. revision_requested → submitted: Student resubmits with revisions
7. company_reviewing → (feedback added): Company feedback added to logbook, doesn't change status

**Required Actions by Status:**
- **submitted**: Mentor should review within 7 days; company can provide feedback anytime
- **mentor_reviewing**: Mentor reviews activities, hours, learnings, challenges
- **company_reviewing**: Company rates performance, provides feedback, suggests improvements
- **approved**: No further action needed; counts toward credit eligibility
- **revision_requested**: Student must revise and resubmit within 7 days
- **rejected**: Student cannot resubmit; week not counted toward credits

**Submission Requirements:**
- Must be submitted within 7 days of week end date
- Minimum 10 hours worked per week (for credit eligibility)
- Maximum 60 hours per week (policy limit)
- Activities description minimum 100 characters
- At least 2 tasks completed
- At least 2 skills used

**Review Criteria:**
- **Hours verification**: Reasonable for tasks described, consistent with previous weeks
- **Activity detail**: Specific tasks, not generic descriptions
- **Learning demonstration**: Clear evidence of skill development
- **Challenge articulation**: Genuine challenges with resolution attempts
- **Professional tone**: Appropriate language and formatting

**AI Summary Generation:**
- Automatically generated after submission
- Analyzes activities, skills, challenges, learnings
- Provides productivity estimate and improvement suggestions
- Flags potential issues (hour discrepancies, generic content)
- Assists mentor in review process

**Error Cases:**
- Cannot submit logbook for future weeks
- Cannot submit duplicate logbook for same week
- Cannot submit if internship not in active status
- Cannot approve if hours exceed 60 per week
- Cannot approve if activities description too brief
- Late submissions (>7 days) flagged for mentor attention`
      },
      CompanyVerificationStatus: {
        type: "string",
        enum: [
          "pending_verification",
          "verified",
          "rejected",
          "suspended",
          "blocked"
        ],
        description: `Company Verification Workflow Status

**State Diagram:**
\`\`\`
pending_verification → verified → suspended → verified (after appeal)
         ↓                ↓            ↓
     rejected         blocked      blocked
                         ↓
                    (reappeal process)
\`\`\`

**Status Definitions:**
- **pending_verification**: Company registered, awaiting admin verification of documents.
- **verified**: Admin verified company. Can post internships and access full platform.
- **rejected**: Admin rejected verification (invalid documents, fraudulent information).
- **suspended**: Temporarily suspended (policy violations, complaints). Can appeal.
- **blocked**: Permanently blocked (serious violations, fraud, repeated issues). Can reappeal after cooldown.

**Transition Rules:**
1. pending_verification → verified: Admin approves (valid CIN, GST, documents authentic)
2. pending_verification → rejected: Admin rejects (invalid documents, suspicious information)
3. verified → suspended: Admin suspends (policy violations, student complaints, quality issues)
4. verified → blocked: Admin blocks (fraud, serious violations, legal issues)
5. suspended → verified: Admin lifts suspension after appeal review
6. suspended → blocked: Admin escalates to permanent block
7. blocked → verified: Admin approves reappeal (after cooldown period, issues resolved)

**Required Actions by Status:**
- **pending_verification**: Admin must review within 48 hours; AI verification runs automatically
- **verified**: Company can post internships, review applications, manage interns
- **rejected**: Company can correct documents and re-register after 30 days
- **suspended**: Company cannot post new internships; existing internships continue; can submit appeal
- **blocked**: All internships cancelled; cannot access platform; can submit reappeal after 90-day cooldown

**Verification Requirements:**
- **Mandatory Documents**:
  - Valid Corporate Identification Number (CIN)
  - GST Certificate (if applicable)
  - Company Registration Certificate
  - Address Proof
  - Point of Contact verification (email, phone)

- **AI Verification Checks**:
  - CIN validation against government database
  - GST number verification
  - Company name consistency across documents
  - Address verification
  - Website legitimacy check
  - Risk assessment (low/medium/high)

- **Admin Manual Review**:
  - Document authenticity
  - Business legitimacy
  - Previous platform history (if re-registering)
  - Compliance with platform policies

**Suspension Reasons:**
- Multiple student complaints about work conditions
- Internship quality issues (misleading descriptions, unpaid work)
- Late or non-payment of stipends
- Violation of platform policies
- Unresponsive to student/admin communications

**Blocking Reasons:**
- Fraudulent company information
- Serious legal violations
- Exploitation of students
- Repeated policy violations after suspension
- Criminal activity or harassment

**Appeal/Reappeal Process:**
- **Suspension Appeal**: Submit within 14 days, admin reviews within 7 days
- **Block Reappeal**: Submit after 90-day cooldown, requires evidence of issue resolution
- **Required**: Detailed explanation, supporting documents, corrective action plan
- **Review**: Admin evaluates, may request additional information
- **Decision**: Approve (restore access), Reject (maintain status), or Escalate (increase penalty)

**Error Cases:**
- Cannot verify without all mandatory documents
- Cannot post internships unless verified
- Cannot appeal suspension more than once per incident
- Cannot reappeal block within 90-day cooldown period
- Cannot re-register rejected company with same CIN within 30 days`
      },

      // Auth Schemas
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
        required: ["studentId", "firebaseUid", "email", "profile"],
        properties: {
          studentId: { 
            type: "string", 
            example: "STU-2024001",
            description: "Unique student identifier"
          },
          firebaseUid: { 
            type: "string",
            description: "Firebase authentication UID"
          },
          email: { 
            type: "string", 
            format: "email",
            example: "student@college.edu",
            description: "Student email address"
          },
          profile: {
            type: "object",
            required: ["name", "department", "year", "college"],
            properties: {
              name: { type: "string", example: "Rahul Sharma" },
              department: { type: "string", example: "Computer Science", description: "Academic department" },
              year: { type: "integer", minimum: 1, maximum: 5, example: 3, description: "Year of study" },
              college: { type: "string", example: "IIT Bombay" },
              rollNumber: { type: "string", example: "CS2021001" },
              phone: { type: "string", example: "+91-9876543210" },
              bio: { type: "string", example: "Passionate about web development and AI" },
              skills: { 
                type: "array", 
                items: { type: "string" },
                example: ["JavaScript", "React", "Python", "Machine Learning"]
              },
              interests: { 
                type: "array", 
                items: { type: "string" },
                example: ["Web Development", "AI/ML", "Cloud Computing"]
              },
              resume: { type: "string", description: "Resume file path" },
              resumeUrl: { type: "string", format: "uri", description: "R2 URL for resume" },
              profileImage: { type: "string", format: "uri", description: "Profile image URL" },
              profileImageFileId: { type: "string", description: "ImageKit file ID for deletion" }
            }
          },
          readinessScore: { 
            type: "number", 
            minimum: 0, 
            maximum: 100,
            example: 75,
            description: "Calculated readiness score based on profile completion, modules, interviews, and internships"
          },
          completedModules: { 
            type: "array", 
            items: { type: "string" },
            example: ["MOD-001", "MOD-002"],
            description: "List of completed learning module codes"
          },
          moduleProgress: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", example: "MOD-001" },
                status: { type: "string", enum: ["in_progress", "completed"], example: "completed" },
                startedAt: { type: "string", format: "date-time" },
                completedAt: { type: "string", format: "date-time" },
                score: { type: "number", example: 85 },
                metadata: { type: "object" }
              }
            },
            description: "Detailed progress for each module"
          },
          credits: {
            type: "object",
            properties: {
              earned: { type: "number", example: 12, description: "Total credits earned" },
              approved: { type: "number", example: 8, description: "Credits approved by admin" },
              pending: { type: "number", example: 4, description: "Credits pending approval" },
              history: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    creditRequestId: { type: "string" },
                    internshipId: { type: "string" },
                    creditsAdded: { type: "number" },
                    addedAt: { type: "string", format: "date-time" },
                    certificateUrl: { type: "string", format: "uri" }
                  }
                },
                description: "Credit history"
              }
            }
          },
          appliedInternships: { 
            type: "array", 
            items: { type: "string" },
            description: "Array of Application IDs"
          },
          completedInternships: { 
            type: "integer", 
            example: 2,
            description: "Number of completed internships"
          },
          certifications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", example: "Internship Completion" },
                companyName: { type: "string", example: "Tech Corp" },
                position: { type: "string", example: "Software Developer Intern" },
                certificateUrl: { type: "string", format: "uri" },
                recommendationLetterUrl: { type: "string", format: "uri" },
                creditsEarned: { type: "number", example: 4 },
                completedAt: { type: "string", format: "date-time" }
              }
            }
          },
          badges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", example: "Early Adopter" },
                icon: { type: "string" },
                description: { type: "string" },
                earnedAt: { type: "string", format: "date-time" }
              }
            }
          },
          interviewAttempts: { type: "integer", example: 5, description: "Number of mock interview attempts" },
          previousInternships: { type: "integer", example: 1, description: "Number of previous internships" },
          preferences: {
            type: "object",
            properties: {
              notificationChannels: {
                type: "object",
                properties: {
                  email: { type: "boolean", default: true },
                  sms: { type: "boolean", default: false },
                  whatsapp: { type: "boolean", default: false },
                  realtime: { type: "boolean", default: true }
                }
              },
              preferredLanguage: { type: "string", default: "en" }
            }
          },
          lastLoginAt: { type: "string", format: "date-time" },
          status: { 
            type: "string", 
            enum: ["active", "inactive", "deleted"],
            default: "active"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete student profile with credits, metrics, and internship history"
      },
      Company: {
        type: "object",
        required: ["companyId", "firebaseUid", "companyName", "website", "email", "phone", "address", "documents", "pointOfContact"],
        properties: {
          companyId: { 
            type: "string", 
            example: "COM-2024001",
            description: "Unique company identifier"
          },
          firebaseUid: { 
            type: "string",
            description: "Firebase authentication UID"
          },
          companyName: { 
            type: "string", 
            example: "Tech Innovations Pvt Ltd",
            description: "Registered company name"
          },
          about: { 
            type: "string",
            example: "Leading technology company specializing in AI and cloud solutions"
          },
          website: { 
            type: "string", 
            format: "uri",
            example: "https://techinnovations.com"
          },
          email: { 
            type: "string", 
            format: "email",
            example: "hr@techinnovations.com"
          },
          phone: { 
            type: "string",
            example: "+91-22-12345678"
          },
          address: { 
            type: "string",
            example: "123 Tech Park, Andheri East, Mumbai, Maharashtra 400069"
          },
          documents: {
            type: "object",
            required: ["cinNumber"],
            properties: {
              cinNumber: { 
                type: "string", 
                example: "U72900MH2015PTC123456",
                description: "Corporate Identification Number (required)"
              },
              gstCertificate: { type: "string", format: "uri", description: "GST certificate URL" },
              registrationCertificate: { type: "string", format: "uri", description: "Company registration certificate URL" },
              addressProof: { type: "string", format: "uri", description: "Address proof document URL" },
              additionalDocuments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    label: { type: "string", example: "ISO Certificate" },
                    url: { type: "string", format: "uri" },
                    uploadedAt: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          },
          pointOfContact: {
            type: "object",
            required: ["name", "email", "phone"],
            properties: {
              name: { type: "string", example: "Priya Patel" },
              designation: { type: "string", example: "HR Manager" },
              email: { type: "string", format: "email", example: "priya.patel@techinnovations.com" },
              phone: { type: "string", example: "+91-9876543210" }
            }
          },
          status: { 
            type: "string", 
            enum: ["pending_verification", "verified", "rejected", "suspended", "blocked", "reappeal"],
            default: "pending_verification",
            description: "Company verification status"
          },
          blockInfo: {
            type: "object",
            properties: {
              reason: { type: "string", example: "Multiple policy violations" },
              blockedBy: { type: "string", example: "ADM-001" },
              blockedAt: { type: "string", format: "date-time" }
            },
            description: "Information about company block (if blocked)"
          },
          reappeal: {
            type: "object",
            properties: {
              message: { type: "string", minLength: 10, maxLength: 2000 },
              attachment: { type: "string", format: "uri" },
              submittedAt: { type: "string", format: "date-time" },
              reviewedBy: { type: "string" },
              reviewedAt: { type: "string", format: "date-time" },
              reviewFeedback: { type: "string" },
              rejectionReason: { type: "string" },
              cooldownEndsAt: { type: "string", format: "date-time" },
              history: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    attachment: { type: "string", format: "uri" },
                    submittedAt: { type: "string", format: "date-time" },
                    reviewedAt: { type: "string", format: "date-time" },
                    decision: { type: "string", enum: ["approved", "rejected"] },
                    reviewedBy: { type: "string" },
                    feedback: { type: "string" }
                  }
                }
              }
            },
            description: "Reappeal information for blocked companies"
          },
          aiVerification: {
            type: "object",
            properties: {
              riskLevel: { type: "string", enum: ["low", "medium", "high"], example: "low" },
              confidence: { type: "number", example: 0.85 },
              findings: { type: "array", items: { type: "string" }, example: ["Valid CIN", "Active GST"] },
              concerns: { type: "array", items: { type: "string" }, example: [] },
              recommendation: { type: "string", example: "Approve" },
              analyzedAt: { type: "string", format: "date-time" }
            },
            description: "AI-powered verification analysis"
          },
          adminReview: {
            type: "object",
            properties: {
              reviewedBy: { type: "string", example: "ADM-001" },
              reviewedAt: { type: "string", format: "date-time" },
              comments: { type: "string" },
              decision: { type: "string", enum: ["approved", "rejected"] },
              reasons: { type: "array", items: { type: "string" } }
            },
            description: "Admin review details"
          },
          restrictions: { 
            type: "array", 
            items: { type: "string" },
            example: [],
            description: "List of restrictions applied to company"
          },
          colleges: { 
            type: "array", 
            items: { type: "string" },
            example: ["IIT Bombay", "IIT Delhi"],
            description: "List of colleges company can recruit from"
          },
          stats: {
            type: "object",
            properties: {
              totalInternshipsPosted: { type: "integer", example: 15 },
              activeInternships: { type: "integer", example: 3 },
              studentsHired: { type: "integer", example: 25 },
              avgRating: { type: "number", example: 4.5 }
            }
          },
          lastLoginAt: { type: "string", format: "date-time" },
          logoUrl: { type: "string", format: "uri" },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                date: { type: "string", format: "date-time" },
                targetDepartments: { type: "array", items: { type: "string" } },
                createdAt: { type: "string", format: "date-time" }
              }
            }
          },
          challenges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                challengeId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                rewards: { type: "string" },
                deadline: { type: "string", format: "date-time" },
                createdAt: { type: "string", format: "date-time" }
              }
            }
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete company profile with verification status and statistics"
      },
      Mentor: {
        type: "object",
        required: ["mentorId", "firebaseUid", "email", "profile"],
        properties: {
          mentorId: { 
            type: "string", 
            example: "MEN-2024001",
            description: "Unique mentor identifier"
          },
          firebaseUid: { 
            type: "string",
            description: "Firebase authentication UID"
          },
          email: { 
            type: "string", 
            format: "email",
            example: "mentor@college.edu"
          },
          profile: {
            type: "object",
            required: ["name", "department"],
            properties: {
              name: { type: "string", example: "Dr. Anjali Verma" },
              department: { type: "string", example: "Computer Science" },
              designation: { type: "string", example: "Associate Professor" },
              phone: { type: "string", example: "+91-9876543210" },
              bio: { type: "string", example: "Specializing in AI and Machine Learning with 15 years of experience" },
              expertiseAreas: { 
                type: "array", 
                items: { type: "string" },
                example: ["Machine Learning", "Data Science", "Cloud Computing"]
              },
              avatar: { type: "string", format: "uri" },
              avatarFileId: { type: "string", description: "ImageKit file ID for deletion" }
            }
          },
          assignedStudents: { 
            type: "array", 
            items: { type: "string" },
            description: "Array of Student IDs assigned to this mentor"
          },
          workload: {
            type: "object",
            properties: {
              maxStudents: { type: "integer", default: 30, example: 30 },
              current: { type: "integer", default: 0, example: 18 }
            },
            description: "Mentor workload tracking"
          },
          preferences: {
            type: "object",
            properties: {
              notifications: {
                type: "object",
                properties: {
                  email: { type: "boolean", default: true },
                  sms: { type: "boolean", default: false },
                  realtime: { type: "boolean", default: true }
                }
              }
            }
          },
          lastLoginAt: { type: "string", format: "date-time" },
          status: { 
            type: "string", 
            enum: ["active", "inactive", "suspended"],
            default: "active"
          },
          interventions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                interventionId: { type: "string" },
                title: { type: "string", example: "Skill Gap Workshop" },
                description: { type: "string" },
                targetStudents: { type: "array", items: { type: "string" } },
                modules: { type: "array", items: { type: "string" } },
                status: { type: "string", enum: ["planned", "active", "completed"] },
                metrics: {
                  type: "object",
                  properties: {
                    engagementRate: { type: "number" },
                    completionRate: { type: "number" }
                  }
                },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" }
              }
            },
            description: "Mentor-led interventions for student support"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete mentor profile with supervision metrics and expertise areas"
      },
      Notification: {
        type: "object",
        required: ["notificationId", "userId", "role", "type", "title", "message"],
        properties: {
          notificationId: {
            type: "string",
            example: "NOT-2024001",
            description: "Unique notification identifier"
          },
          userId: {
            type: "string",
            description: "MongoDB ObjectId of the user"
          },
          role: {
            type: "string",
            enum: ["student", "mentor", "admin", "company"],
            example: "student",
            description: "User role"
          },
          type: {
            type: "string",
            example: "application_status",
            description: "Notification type (e.g., application_status, internship_approved, credit_approved)"
          },
          title: {
            type: "string",
            example: "Application Accepted",
            description: "Notification title"
          },
          message: {
            type: "string",
            example: "Your application for Full Stack Developer Intern has been accepted by Tech Innovations Pvt Ltd",
            description: "Notification message"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            default: "low",
            example: "high",
            description: "Notification priority level"
          },
          actionUrl: {
            type: "string",
            example: "/student/applications/APP-2024001",
            description: "URL to navigate when notification is clicked"
          },
          read: {
            type: "boolean",
            default: false,
            example: false,
            description: "Whether notification has been read"
          },
          readAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp when notification was read"
          },
          deliveries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                channel: {
                  type: "string",
                  enum: ["email", "sms", "whatsapp", "push"],
                  example: "email"
                },
                status: {
                  type: "string",
                  enum: ["pending", "sent", "failed"],
                  example: "sent"
                },
                sentAt: {
                  type: "string",
                  format: "date-time"
                },
                metadata: {
                  type: "object"
                }
              }
            },
            description: "Delivery status across different channels"
          },
          metadata: {
            type: "object",
            description: "Additional notification metadata"
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Notification creation timestamp"
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Notification last update timestamp"
          }
        },
        description: "User notification with multi-channel delivery tracking"
      },
      Internship: {
        type: "object",
        required: ["internshipId", "companyId", "title", "description", "department", "requiredSkills", "duration", "workMode", "startDate", "applicationDeadline", "slots"],
        properties: {
          internshipId: { 
            type: "string", 
            example: "INT-2024001",
            description: "Unique internship identifier"
          },
          companyId: { 
            type: "string", 
            example: "COM-2024001",
            description: "Company ID that posted the internship"
          },
          title: { 
            type: "string", 
            example: "Full Stack Developer Intern",
            description: "Internship position title"
          },
          description: { 
            type: "string", 
            example: "Work on exciting web development projects using modern technologies. You'll collaborate with experienced developers and contribute to real-world applications.",
            description: "Detailed internship description"
          },
          department: { 
            type: "string", 
            example: "Computer Science",
            description: "Target academic department"
          },
          requiredSkills: { 
            type: "array", 
            items: { type: "string" }, 
            example: ["JavaScript", "React", "Node.js"],
            description: "Required technical skills"
          },
          optionalSkills: { 
            type: "array", 
            items: { type: "string" }, 
            example: ["TypeScript", "Docker", "AWS"],
            description: "Optional/preferred skills"
          },
          duration: { 
            type: "string", 
            example: "6 months",
            description: "Internship duration"
          },
          stipend: { 
            type: "number", 
            example: 15000,
            description: "Monthly stipend in INR"
          },
          location: { 
            type: "string", 
            example: "Mumbai, Maharashtra",
            description: "Internship location"
          },
          workMode: { 
            type: "string", 
            enum: ["remote", "onsite", "hybrid"], 
            example: "hybrid",
            description: "Work mode"
          },
          status: { 
            type: "string", 
            enum: ["draft", "pending_admin_verification", "pending_mentor_verification", "admin_approved", "admin_rejected", "mentor_rejected", "open_for_applications", "closed", "cancelled"], 
            example: "open_for_applications",
            description: "Internship workflow status. Flow: draft → pending_admin_verification → admin_approved → open_for_applications → closed"
          },
          slots: { 
            type: "integer", 
            minimum: 1, 
            maximum: 100, 
            example: 5,
            description: "Total available slots"
          },
          slotsRemaining: { 
            type: "integer", 
            example: 3, 
            description: "Available slots after acceptances"
          },
          appliedCount: { 
            type: "integer", 
            example: 15, 
            description: "Total applications received"
          },
          startDate: { 
            type: "string", 
            format: "date", 
            example: "2024-06-01",
            description: "Internship start date"
          },
          applicationDeadline: { 
            type: "string", 
            format: "date-time", 
            example: "2024-05-15T23:59:59Z",
            description: "Application deadline"
          },
          responsibilities: { 
            type: "array", 
            items: { type: "string" }, 
            example: ["Develop new features", "Write unit tests", "Participate in code reviews"],
            description: "Key responsibilities"
          },
          learningOpportunities: { 
            type: "array", 
            items: { type: "string" }, 
            example: ["Mentorship from senior developers", "Exposure to production systems", "Agile methodology"],
            description: "Learning opportunities"
          },
          eligibilityRequirements: {
            type: "object",
            properties: {
              minYear: { type: "integer", example: 2, description: "Minimum year of study" },
              minReadinessScore: { type: "number", example: 60, description: "Minimum readiness score" },
              requiredModules: { 
                type: "array", 
                items: { type: "string" },
                example: ["MOD-001", "MOD-002"],
                description: "Required completed modules"
              }
            },
            description: "Eligibility criteria for students"
          },
          adminReview: {
            type: "object",
            properties: {
              reviewedBy: { type: "string", example: "ADM-001" },
              reviewedAt: { type: "string", format: "date-time" },
              decision: { type: "string", enum: ["approved", "rejected"] },
              comments: { type: "string", example: "Internship meets all quality standards" },
              reasons: { 
                type: "array", 
                items: { type: "string" },
                example: ["Clear job description", "Appropriate stipend"]
              },
              editHistory: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    editedAt: { type: "string", format: "date-time" },
                    editedBy: { type: "string" },
                    changes: { type: "object" },
                    reason: { type: "string" }
                  }
                },
                description: "History of admin edits"
              }
            },
            description: "Admin verification details"
          },
          mentorApproval: {
            type: "object",
            properties: {
              status: { 
                type: "string", 
                enum: ["pending", "approved", "rejected"], 
                default: "pending",
                example: "approved"
              },
              mentorId: { type: "string", example: "MEN-001" },
              approvedAt: { type: "string", format: "date-time" },
              comments: { type: "string", example: "Suitable for our department students" },
              department: { type: "string", example: "Computer Science" }
            },
            description: "Mentor approval details"
          },
          departmentApprovals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                department: { type: "string", example: "Computer Science" },
                mentorId: { type: "string", example: "MEN-001" },
                approvedAt: { type: "string", format: "date-time" },
                comments: { type: "string" }
              }
            },
            description: "Multiple department approvals (for 'All' department internships)"
          },
          aiTags: {
            type: "object",
            properties: {
              primarySkills: { 
                type: "array", 
                items: { type: "string" }, 
                example: ["JavaScript", "React", "Node.js"],
                description: "AI-identified primary skills"
              },
              difficulty: { 
                type: "string", 
                enum: ["beginner", "intermediate", "advanced"], 
                example: "intermediate",
                description: "AI-assessed difficulty level"
              },
              careerPath: { 
                type: "string", 
                example: "Software Engineering",
                description: "Relevant career path"
              },
              industryFit: { 
                type: "array", 
                items: { type: "string" }, 
                example: ["Technology", "Startups", "Product Development"],
                description: "Industry categories"
              },
              learningIntensity: { 
                type: "string", 
                example: "moderate",
                description: "Learning intensity assessment"
              },
              technicalDepth: { 
                type: "string", 
                example: "moderate",
                description: "Technical depth assessment"
              },
              generatedAt: { type: "string", format: "date-time" }
            },
            description: "AI-generated tags from Gemini API for better matching"
          },
          auditTrail: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: { type: "string", format: "date-time" },
                actor: { type: "string", example: "ADM-001" },
                actorRole: { type: "string", example: "admin" },
                action: { type: "string", example: "status_change" },
                fromStatus: { type: "string", example: "pending_admin_verification" },
                toStatus: { type: "string", example: "admin_approved" },
                reason: { type: "string", example: "Meets all requirements" },
                metadata: { type: "object" }
              }
            },
            description: "Complete audit trail of all status changes and actions"
          },
          postedBy: { 
            type: "string", 
            example: "COM-2024001",
            description: "Company ID that posted the internship"
          },
          postedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when internship was posted"
          },
          closedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when internship was closed"
          },
          isDeleted: { 
            type: "boolean", 
            default: false,
            description: "Soft delete flag"
          },
          deletedAt: { type: "string", format: "date-time" },
          deletedBy: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete internship schema with workflow fields, AI tags, and audit trail"
      },
      Application: {
        type: "object",
        required: ["applicationId", "studentId", "internshipId", "companyId", "department", "coverLetter"],
        properties: {
          applicationId: { 
            type: "string", 
            example: "APP-2024001",
            description: "Unique application identifier"
          },
          studentId: { 
            type: "string", 
            example: "STU-2024001",
            description: "Student ID who applied"
          },
          internshipId: { 
            type: "string", 
            example: "INT-2024001",
            description: "Internship ID being applied to"
          },
          companyId: { 
            type: "string", 
            example: "COM-2024001",
            description: "Company ID offering the internship"
          },
          department: { 
            type: "string", 
            example: "Computer Science",
            description: "Department of the internship"
          },
          status: { 
            type: "string", 
            enum: ["pending", "mentor_approved", "mentor_rejected", "shortlisted", "rejected", "accepted", "withdrawn", "completed"],
            default: "pending",
            example: "shortlisted",
            description: "Application workflow status. Flow: pending → mentor_approved → shortlisted → accepted/rejected"
          },
          appliedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when application was submitted"
          },
          coverLetter: { 
            type: "string", 
            example: "I am excited to apply for this position because...",
            description: "Student's cover letter"
          },
          resumeUrl: { 
            type: "string", 
            format: "uri",
            description: "URL to student's resume"
          },
          mentorApproval: {
            type: "object",
            properties: {
              status: { 
                type: "string", 
                enum: ["pending", "approved", "rejected"], 
                default: "pending",
                example: "approved"
              },
              mentorId: { type: "string", example: "MEN-001" },
              approvedAt: { type: "string", format: "date-time" },
              comments: { type: "string", example: "Student is well-prepared for this role" },
              recommendedPreparation: { 
                type: "array", 
                items: { type: "string" },
                example: ["Review React documentation", "Practice coding interviews"],
                description: "Mentor's preparation recommendations"
              }
            },
            description: "Mentor approval details"
          },
          companyFeedback: {
            type: "object",
            properties: {
              status: { 
                type: "string", 
                enum: ["pending", "reviewing", "shortlisted", "rejected"], 
                default: "pending",
                example: "shortlisted"
              },
              reviewedAt: { type: "string", format: "date-time" },
              feedback: { type: "string", example: "Strong technical background" },
              rejectionReason: { type: "string" },
              nextSteps: { type: "string", example: "Schedule technical interview" },
              scheduledInterviewDate: { type: "string", format: "date-time" }
            },
            description: "Company feedback and review status"
          },
          aiRanking: {
            type: "object",
            properties: {
              matchScore: { 
                type: "number", 
                minimum: 0, 
                maximum: 100,
                example: 85,
                description: "AI-calculated match score (0-100)"
              },
              reasoning: { 
                type: "string", 
                example: "Strong skill match with required technologies",
                description: "AI reasoning for the score"
              },
              strengths: { 
                type: "array", 
                items: { type: "string" },
                example: ["Relevant coursework", "Strong technical skills", "Previous project experience"],
                description: "Identified strengths"
              },
              concerns: { 
                type: "array", 
                items: { type: "string" },
                example: ["Limited industry experience"],
                description: "Identified concerns"
              },
              recommendation: { 
                type: "string", 
                example: "Strongly recommend for interview",
                description: "AI recommendation"
              }
            },
            description: "AI-powered ranking and analysis"
          },
          interviewScore: { 
            type: "number", 
            example: 78,
            description: "Interview performance score"
          },
          timeline: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event: { type: "string", example: "Application submitted" },
                timestamp: { type: "string", format: "date-time" },
                performedBy: { type: "string", example: "STU-2024001" },
                notes: { type: "string" }
              }
            },
            description: "Application timeline events"
          },
          cachedInternshipData: {
            type: "object",
            properties: {
              title: { type: "string", example: "Full Stack Developer Intern" },
              department: { type: "string", example: "Computer Science" },
              companyName: { type: "string", example: "Tech Innovations Pvt Ltd" },
              startDate: { type: "string", format: "date" },
              endDate: { type: "string", format: "date" },
              applicationDeadline: { type: "string", format: "date-time" }
            },
            description: "Cached internship data for orphaned reference handling"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete application schema with status workflow and AI ranking"
      },
      Logbook: {
        type: "object",
        required: ["logbookId", "studentId", "internshipId", "companyId", "weekNumber", "startDate", "endDate", "hoursWorked", "activities"],
        properties: {
          logbookId: { 
            type: "string", 
            example: "LOG-2024001",
            description: "Unique logbook entry identifier"
          },
          studentId: { 
            type: "string", 
            example: "STU-2024001",
            description: "Student ID"
          },
          internshipId: { 
            type: "string", 
            example: "INT-2024001",
            description: "Internship ID"
          },
          companyId: { 
            type: "string", 
            example: "COM-2024001",
            description: "Company ID"
          },
          weekNumber: { 
            type: "integer", 
            minimum: 1,
            example: 3,
            description: "Week number of the internship"
          },
          startDate: { 
            type: "string", 
            format: "date",
            example: "2024-06-15",
            description: "Week start date"
          },
          endDate: { 
            type: "string", 
            format: "date",
            example: "2024-06-21",
            description: "Week end date"
          },
          hoursWorked: { 
            type: "number", 
            minimum: 0, 
            maximum: 60,
            example: 40,
            description: "Total hours worked during the week"
          },
          activities: { 
            type: "string", 
            example: "Worked on implementing user authentication module, participated in code reviews, and attended team meetings.",
            description: "Detailed description of weekly activities"
          },
          tasksCompleted: { 
            type: "array", 
            items: { type: "string" },
            example: ["Implemented login API", "Fixed authentication bugs", "Wrote unit tests"],
            description: "List of completed tasks"
          },
          skillsUsed: { 
            type: "array", 
            items: { type: "string" },
            example: ["JavaScript", "React", "Node.js", "JWT"],
            description: "Skills utilized during the week"
          },
          challenges: { 
            type: "string", 
            example: "Faced issues with JWT token expiration handling, resolved with mentor guidance.",
            description: "Challenges faced during the week"
          },
          learnings: { 
            type: "string", 
            example: "Learned about secure authentication practices and token management.",
            description: "Key learnings from the week"
          },
          attachments: { 
            type: "array", 
            items: { type: "string", format: "uri" },
            example: ["https://storage.example.com/screenshots/week3-1.png"],
            description: "URLs to supporting documents/screenshots"
          },
          aiSummary: {
            type: "object",
            properties: {
              summary: { 
                type: "string", 
                example: "Student demonstrated strong progress in authentication implementation with good problem-solving skills.",
                description: "AI-generated summary of the week"
              },
              keySkillsDemonstrated: { 
                type: "array", 
                items: { type: "string" },
                example: ["Backend Development", "Security", "Problem Solving"],
                description: "AI-identified key skills demonstrated"
              },
              learningOutcomes: { 
                type: "array", 
                items: { type: "string" },
                example: ["Authentication best practices", "JWT implementation"],
                description: "AI-identified learning outcomes"
              },
              hoursVerification: { 
                type: "boolean", 
                example: true,
                description: "AI verification of reported hours"
              },
              suggestedImprovements: { 
                type: "string", 
                example: "Consider exploring OAuth 2.0 for enhanced security.",
                description: "AI suggestions for improvement"
              },
              estimatedProductivity: { 
                type: "string", 
                enum: ["high", "medium", "low"],
                example: "high",
                description: "AI-estimated productivity level"
              }
            },
            description: "AI-generated summary and analysis"
          },
          aiProcessedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when AI processing completed"
          },
          mentorReview: {
            type: "object",
            properties: {
              status: { 
                type: "string", 
                enum: ["pending", "approved", "needs_revision", "rejected"],
                default: "pending",
                example: "approved",
                description: "Mentor review status"
              },
              reviewedBy: { type: "string", example: "MEN-001" },
              reviewedAt: { type: "string", format: "date-time" },
              comments: { type: "string", example: "Excellent progress this week!" },
              suggestions: { type: "string", example: "Try to document your code better" },
              creditsApproved: { type: "number", example: 0.5, description: "Credits approved for this week" }
            },
            description: "Mentor review details"
          },
          companyFeedback: {
            type: "object",
            properties: {
              rating: { type: "number", minimum: 1, maximum: 5, example: 4 },
              technicalPerformance: { type: "number", minimum: 1, maximum: 5, example: 4 },
              communication: { type: "number", minimum: 1, maximum: 5, example: 5 },
              initiative: { type: "number", minimum: 1, maximum: 5, example: 4 },
              comments: { type: "string", example: "Great work on the authentication module" },
              appreciation: { type: "string", example: "Excellent problem-solving skills" },
              improvements: { type: "string", example: "Could improve code documentation" },
              tasksForNextWeek: { 
                type: "array", 
                items: { type: "string" },
                example: ["Implement password reset", "Add email verification"],
                description: "Tasks assigned for next week"
              },
              providedAt: { type: "string", format: "date-time" }
            },
            description: "Company feedback and ratings"
          },
          status: { 
            type: "string", 
            enum: ["draft", "submitted", "pending_mentor_review", "pending_company_review", "approved", "needs_revision", "completed"],
            default: "draft",
            example: "approved",
            description: "Logbook review workflow status. Flow: draft → submitted → pending_mentor_review → approved"
          },
          submittedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when logbook was submitted"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete logbook schema with AI summary and review workflow"
      },
      CreditRequest: {
        type: "object",
        required: ["creditRequestId", "studentId", "internshipCompletionId", "internshipId", "mentorId", "requestedCredits", "calculatedCredits", "internshipDurationWeeks"],
        properties: {
          creditRequestId: { 
            type: "string", 
            example: "CR-2024001",
            description: "Unique credit request identifier"
          },
          studentId: { 
            type: "string", 
            example: "STU-2024001",
            description: "Student ID requesting credits"
          },
          internshipCompletionId: { 
            type: "string", 
            example: "IC-2024001",
            description: "Internship completion record ID"
          },
          internshipId: { 
            type: "string", 
            example: "INT-2024001",
            description: "Internship ID for which credits are requested"
          },
          mentorId: { 
            type: "string", 
            example: "MEN-001",
            description: "Assigned mentor ID for review"
          },
          requestedCredits: { 
            type: "number", 
            example: 4,
            description: "Number of credits requested by student"
          },
          calculatedCredits: { 
            type: "number", 
            example: 4,
            description: "System-calculated credits based on duration"
          },
          internshipDurationWeeks: { 
            type: "integer", 
            example: 24,
            description: "Duration of internship in weeks"
          },
          status: { 
            type: "string", 
            enum: [
              "pending_student_action",
              "pending_mentor_review",
              "mentor_approved",
              "mentor_rejected",
              "pending_admin_review",
              "admin_approved",
              "admin_rejected",
              "credits_added",
              "completed"
            ],
            default: "pending_mentor_review",
            example: "mentor_approved",
            description: "Credit transfer workflow status. Flow: pending_mentor_review → mentor_approved → pending_admin_review → admin_approved → credits_added → completed"
          },
          mentorReview: {
            type: "object",
            properties: {
              reviewedBy: { type: "string", example: "MEN-001" },
              reviewedAt: { type: "string", format: "date-time" },
              decision: { type: "string", enum: ["approved", "rejected"], example: "approved" },
              feedback: { type: "string", example: "Student has successfully completed all requirements" },
              qualityCriteria: {
                type: "object",
                properties: {
                  logbookComplete: { type: "boolean", default: false, example: true },
                  reportQuality: { type: "boolean", default: false, example: true },
                  learningOutcomes: { type: "boolean", default: false, example: true },
                  companyEvaluation: { type: "boolean", default: false, example: true }
                },
                description: "Quality criteria checklist"
              },
              criteriaFeedback: {
                type: "object",
                additionalProperties: { type: "string" },
                example: {
                  "logbookComplete": "All weekly entries submitted",
                  "reportQuality": "Comprehensive final report"
                },
                description: "Feedback for each quality criterion"
              }
            },
            description: "Mentor review details and quality assessment"
          },
          adminReview: {
            type: "object",
            properties: {
              reviewedBy: { type: "string", example: "ADM-001" },
              reviewedAt: { type: "string", format: "date-time" },
              decision: { type: "string", enum: ["approved", "rejected"], example: "approved" },
              feedback: { type: "string", example: "All compliance requirements met" },
              complianceChecks: {
                type: "object",
                properties: {
                  nepCompliant: { type: "boolean", default: false, example: true },
                  documentationComplete: { type: "boolean", default: false, example: true },
                  feesCleared: { type: "boolean", default: false, example: true },
                  departmentApproved: { type: "boolean", default: false, example: true }
                },
                description: "Compliance checklist"
              }
            },
            description: "Admin review details and compliance verification"
          },
          submissionHistory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                submittedAt: { type: "string", format: "date-time" },
                status: { type: "string" },
                reviewedBy: { type: "string" },
                reviewerModel: { type: "string", enum: ["Mentor", "Admin"] },
                reviewedAt: { type: "string", format: "date-time" },
                feedback: { type: "string" }
              }
            },
            description: "History of submissions and reviews (for resubmissions)"
          },
          certificate: {
            type: "object",
            properties: {
              certificateUrl: { type: "string", format: "uri", example: "https://storage.example.com/certificates/CR-2024001.pdf" },
              certificateId: { type: "string", example: "CERT-2024001" },
              generatedAt: { type: "string", format: "date-time" }
            },
            description: "Generated certificate details"
          },
          requestedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when credit was requested"
          },
          lastUpdatedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp of last update"
          },
          completedAt: { 
            type: "string", 
            format: "date-time",
            description: "Timestamp when credit transfer completed"
          },
          metadata: {
            type: "object",
            properties: {
              notificationsSent: { 
                type: "array", 
                items: { type: "string" },
                example: ["email_to_student", "email_to_mentor"],
                description: "List of notifications sent"
              },
              remindersSent: { 
                type: "integer", 
                default: 0,
                example: 2,
                description: "Number of reminders sent"
              },
              escalations: { 
                type: "integer", 
                default: 0,
                example: 0,
                description: "Number of escalations"
              }
            },
            description: "Metadata for tracking notifications and escalations"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        description: "Complete credit request schema with review workflow and compliance tracking"
      },

      // Test Schemas
      TestEmailRequest: {
        type: "object",
        required: ["to", "subject", "template"],
        properties: {
          to: { 
            type: "string", 
            format: "email",
            example: "test@example.com",
            description: "Recipient email address"
          },
          subject: { 
            type: "string",
            example: "Test Email from Prashiskshan",
            description: "Email subject line"
          },
          template: { 
            type: "string",
            enum: ["welcome", "application_received", "application_approved", "application_rejected", "logbook_approved", "logbook_revision", "completion_certificate"],
            example: "welcome",
            description: "Email template to use"
          },
          data: { 
            type: "object",
            example: {
              name: "Rahul Sharma",
              link: "https://prashiskshan.edu/dashboard"
            },
            description: "Template data variables"
          },
        },
        description: "Request body for testing email service"
      },
      TestS3UploadRequest: {
        type: "object",
        required: ["file"],
        properties: {
          file: { 
            type: "string", 
            format: "binary",
            description: "File to upload (multipart/form-data)"
          },
          folder: { 
            type: "string",
            example: "test",
            description: "Folder path in S3/R2 bucket"
          },
        },
        description: "Request body for testing S3/R2 storage service"
      },
      TestQueueJobRequest: {
        type: "object",
        required: ["queueName"],
        properties: {
          queueName: { 
            type: "string", 
            enum: ["email", "sms", "logbook", "report", "notification", "completion", "ai"],
            example: "email",
            description: "Name of the queue to test"
          },
          data: { 
            type: "object",
            example: {
              to: "test@example.com",
              template: "welcome"
            },
            description: "Job data payload"
          },
        },
        description: "Request body for testing queue service"
      },
      TestGeminiRequest: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: { 
            type: "string",
            example: "Write a brief summary about the importance of internships in education",
            description: "Text prompt for AI generation"
          },
          model: { 
            type: "string", 
            enum: ["flash", "pro"],
            default: "flash",
            example: "flash",
            description: "Gemini model to use (flash for speed, pro for quality)"
          },
        },
        description: "Request body for testing Gemini AI service"
      },
      TestServicesStatusResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true
          },
          message: {
            type: "string",
            example: "Test services status retrieved"
          },
          data: {
            type: "object",
            properties: {
              email: {
                type: "object",
                properties: {
                  configured: {
                    type: "boolean",
                    example: true,
                    description: "Whether email service is configured (Brevo or Mailgun)"
                  }
                }
              },
              s3: {
                type: "object",
                properties: {
                  configured: {
                    type: "boolean",
                    example: true,
                    description: "Whether S3/R2 storage is configured"
                  }
                }
              },
              queue: {
                type: "object",
                properties: {
                  connected: {
                    type: "boolean",
                    example: true,
                    description: "Whether Redis queue is connected"
                  }
                }
              },
              gemini: {
                type: "object",
                properties: {
                  configured: {
                    type: "boolean",
                    example: true,
                    description: "Whether Gemini AI is configured"
                  }
                }
              }
            }
          }
        },
        description: "Response showing status of all test services"
      },
      HealthCheckResponse: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: {
            type: "boolean",
            example: true,
            description: "Always true for successful health check"
          },
          message: {
            type: "string",
            example: "Prashiskshan API is healthy",
            description: "Health status message"
          },
          data: {
            type: "object",
            properties: {
              uptime: {
                type: "number",
                example: 12345.67,
                description: "Server uptime in seconds"
              }
            }
          }
        },
        description: "Health check response with server uptime"
      },
      FirebaseDebugResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true
          },
          message: {
            type: "string",
            example: "Firebase Debug Status"
          },
          data: {
            type: "object",
            properties: {
              initialized: {
                type: "boolean",
                example: true,
                description: "Whether Firebase Admin is initialized"
              },
              projectId: {
                type: "string",
                example: "prashiskshan-dev",
                description: "Firebase project ID"
              },
              clientEmail: {
                type: "string",
                example: "firebase-adminsdk@prashiskshan-dev.iam.gserviceaccount.com",
                description: "Service account email"
              },
              privateKeyValid: {
                type: "boolean",
                example: true,
                description: "Whether private key format is valid"
              },
              connectionTest: {
                type: "string",
                example: "Success",
                description: "Result of Firebase connection test"
              }
            }
          }
        },
        description: "Firebase configuration debug information"
      },
    },
  },
  paths: {
    // ==================== Authentication Routes ====================
    // All authentication endpoints have security: [] to allow unauthenticated access
    // except for profile management endpoints which require Bearer token
    
    // Registration Endpoints
    "/auth/students/register": {
      post: {
        summary: "Register a new student account",
        description: "Create a new student account with Firebase authentication. Requires email, password, and complete profile information including name, department, year, and college. Returns Firebase ID token for immediate authentication.",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentRegistration" },
              example: {
                email: "rahul.sharma@iitbombay.ac.in",
                password: "SecurePass123!",
                profile: {
                  name: "Rahul Sharma",
                  department: "Computer Science",
                  year: 3,
                  college: "IIT Bombay",
                  rollNumber: "CS2021001",
                  phone: "+91-9876543210",
                  bio: "Passionate about web development and AI",
                  skills: ["JavaScript", "React", "Python", "Machine Learning"],
                  interests: ["Web Development", "AI/ML", "Cloud Computing"]
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Student account created successfully",
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
                            user: { $ref: "#/components/schemas/Student" },
                            idToken: {
                              type: "string",
                              description: "Firebase ID token for Bearer authentication",
                              example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5..."
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Student registered successfully",
                  data: {
                    user: {
                      studentId: "STU-2024001",
                      email: "rahul.sharma@iitbombay.ac.in",
                      profile: {
                        name: "Rahul Sharma",
                        department: "Computer Science",
                        year: 3,
                        college: "IIT Bombay"
                      },
                      readinessScore: 0,
                      credits: { earned: 0, approved: 0, pending: 0 }
                    },
                    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5..."
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error - missing or invalid fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Validation failed",
                  error: {
                    code: "VALIDATION_ERROR",
                    details: {
                      email: "Invalid email format",
                      password: "Password must be at least 8 characters"
                    }
                  }
                }
              }
            }
          },
          409: {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Email already exists",
                  error: { code: "DUPLICATE_EMAIL" }
                }
              }
            }
          },
          500: {
            description: "Server error during registration",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/auth/companies/register": {
      post: {
        summary: "Register a new company account",
        description: "Create a new company account with Firebase authentication. Requires company details, documents (CIN number mandatory), and point of contact information. Company status will be 'pending_verification' until admin approval.",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CompanyRegistration" },
              example: {
                email: "hr@techinnovations.com",
                password: "SecurePass123!",
                companyName: "Tech Innovations Pvt Ltd",
                website: "https://techinnovations.com",
                phone: "+91-22-12345678",
                address: "123 Tech Park, Andheri East, Mumbai, Maharashtra 400069",
                documents: {
                  cinNumber: "U72900MH2015PTC123456",
                  gstNumber: "27AABCT1234F1Z5",
                  gstCertificate: "https://storage.example.com/gst-cert.pdf",
                  registrationCertificate: "https://storage.example.com/reg-cert.pdf"
                },
                pointOfContact: {
                  name: "Priya Patel",
                  email: "priya.patel@techinnovations.com",
                  phone: "+91-9876543210",
                  designation: "HR Manager"
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Company account created successfully",
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
                            user: { $ref: "#/components/schemas/Company" },
                            idToken: { type: "string", description: "Firebase ID token" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Company registered successfully. Pending admin verification.",
                  data: {
                    user: {
                      companyId: "COM-2024001",
                      companyName: "Tech Innovations Pvt Ltd",
                      email: "hr@techinnovations.com",
                      status: "pending_verification"
                    },
                    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5..."
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Validation failed",
                  error: {
                    code: "VALIDATION_ERROR",
                    details: {
                      cinNumber: "CIN number is required",
                      pointOfContact: "Point of contact details are required"
                    }
                  }
                }
              }
            }
          },
          409: {
            description: "Company already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/auth/mentors/register": {
      post: {
        summary: "Register a new mentor account",
        description: "Create a new mentor account with Firebase authentication. Requires email, password, and profile information including name and department. Mentors supervise students and approve internship applications.",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MentorRegistration" },
              example: {
                email: "anjali.verma@college.edu",
                password: "SecurePass123!",
                profile: {
                  name: "Dr. Anjali Verma",
                  department: "Computer Science",
                  designation: "Associate Professor",
                  phone: "+91-9876543210",
                  expertiseAreas: ["Machine Learning", "Data Science", "Cloud Computing"]
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Mentor account created successfully",
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
                            user: { $ref: "#/components/schemas/Mentor" },
                            idToken: { type: "string" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Mentor registered successfully",
                  data: {
                    user: {
                      mentorId: "MEN-2024001",
                      email: "anjali.verma@college.edu",
                      profile: {
                        name: "Dr. Anjali Verma",
                        department: "Computer Science",
                        designation: "Associate Professor"
                      },
                      workload: { maxStudents: 30, current: 0 }
                    },
                    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5..."
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          409: {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/auth/admins/register": {
      post: {
        summary: "Register a new admin account",
        description: "Create a new admin account with Firebase authentication. In production, requires super_admin privileges. Admins verify companies, approve internships, and manage the system.",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminRegistration" },
              example: {
                email: "admin@prashiskshan.edu",
                password: "SecurePass123!",
                name: "System Administrator",
                role: "admin",
                permissions: ["verify_companies", "approve_internships", "manage_credits"]
              }
            }
          }
        },
        responses: {
          201: {
            description: "Admin account created successfully",
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
                            user: {
                              type: "object",
                              properties: {
                                adminId: { type: "string" },
                                email: { type: "string" },
                                name: { type: "string" },
                                role: { type: "string" }
                              }
                            },
                            idToken: { type: "string" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Admin registered successfully",
                  data: {
                    user: {
                      adminId: "ADM-001",
                      email: "admin@prashiskshan.edu",
                      name: "System Administrator",
                      role: "admin"
                    },
                    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5..."
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          403: {
            description: "Unauthorized - requires super_admin in production",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Unauthorized to create admin accounts",
                  error: { code: "FORBIDDEN" }
                }
              }
            }
          }
        }
      }
    },
    
    // Login and Authentication
    "/auth/login": {
      post: {
        summary: "User login with Firebase authentication",
        description: "Authenticate user with Firebase ID token and retrieve complete user profile. Returns user data with role-specific information (Student, Company, Mentor, or Admin) and a fresh ID token for subsequent API calls.",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5...",
                email: "rahul.sharma@iitbombay.ac.in"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
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
                            user: {
                              oneOf: [
                                { $ref: "#/components/schemas/Student" },
                                { $ref: "#/components/schemas/Company" },
                                { $ref: "#/components/schemas/Mentor" },
                                {
                                  type: "object",
                                  description: "Admin user object"
                                }
                              ],
                              description: "User profile based on role"
                            },
                            role: {
                              type: "string",
                              enum: ["student", "company", "mentor", "admin"],
                              description: "User role"
                            },
                            idToken: {
                              type: "string",
                              description: "Fresh Firebase ID token for Bearer authentication"
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Login successful",
                  data: {
                    user: {
                      studentId: "STU-2024001",
                      email: "rahul.sharma@iitbombay.ac.in",
                      profile: {
                        name: "Rahul Sharma",
                        department: "Computer Science",
                        year: 3,
                        college: "IIT Bombay"
                      },
                      readinessScore: 75,
                      credits: { earned: 12, approved: 8, pending: 4 }
                    },
                    role: "student",
                    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5..."
                  }
                }
              }
            }
          },
          401: {
            description: "Invalid credentials or token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid authentication token",
                  error: { code: "UNAUTHORIZED" }
                }
              }
            }
          },
          404: {
            description: "User not found in database",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "User not found",
                  error: { code: "USER_NOT_FOUND" }
                }
              }
            }
          },
          429: {
            description: "Too many login attempts - rate limited",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Too many requests. Please try again later.",
                  error: { code: "RATE_LIMIT_EXCEEDED" }
                }
              }
            }
          }
        }
      }
    },
    
    // Password Management
    "/auth/send-password-reset": {
      post: {
        summary: "Send password reset email",
        description: "Send a password reset link to the user's email address. The link contains a one-time code for resetting the password through Firebase.",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendPasswordResetRequest" },
              example: {
                email: "rahul.sharma@iitbombay.ac.in"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Password reset email sent successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  success: true,
                  message: "Password reset email sent successfully"
                }
              }
            }
          },
          400: {
            description: "Invalid email format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          404: {
            description: "Email not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "No user found with this email",
                  error: { code: "USER_NOT_FOUND" }
                }
              }
            }
          },
          429: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/auth/password": {
      post: {
        summary: "Change user password",
        description: "Change the authenticated user's password. Requires re-authentication with current credentials for security.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
              example: {
                idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5...",
                newPassword: "NewSecurePass123!"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Password changed successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  success: true,
                  message: "Password changed successfully"
                }
              }
            }
          },
          400: {
            description: "Invalid password format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Password must be at least 8 characters",
                  error: { code: "INVALID_PASSWORD" }
                }
              }
            }
          },
          401: {
            description: "Invalid authentication token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          429: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    
    // Email Verification
    "/auth/verify-email": {
      post: {
        summary: "Send email verification link",
        description: "Send an email verification link to the authenticated user's email address. Required for certain features and account security.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Verification email sent successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  success: true,
                  message: "Verification email sent successfully"
                }
              }
            }
          },
          400: {
            description: "Email already verified",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Email is already verified",
                  error: { code: "ALREADY_VERIFIED" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      get: {
        summary: "Verify email with code",
        description: "Verify user's email address using the verification code from the email link. This endpoint is typically called from the email link.",
        tags: ["Authentication"],
        security: [],
        parameters: [
          {
            name: "oobCode",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "One-time verification code from email link",
            example: "ABC123XYZ789"
          }
        ],
        responses: {
          200: {
            description: "Email verified successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  success: true,
                  message: "Email verified successfully"
                }
              }
            }
          },
          400: {
            description: "Invalid or expired verification code",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid or expired verification code",
                  error: { code: "INVALID_CODE" }
                }
              }
            }
          }
        }
      }
    },
    
    // Profile Management
    "/auth/me": {
      get: {
        summary: "Get current user profile",
        description: "Retrieve the authenticated user's complete profile information including role-specific data (credits for students, verification status for companies, workload for mentors).",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "User profile retrieved successfully",
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
                            user: {
                              oneOf: [
                                { $ref: "#/components/schemas/Student" },
                                { $ref: "#/components/schemas/Company" },
                                { $ref: "#/components/schemas/Mentor" }
                              ]
                            },
                            role: {
                              type: "string",
                              enum: ["student", "company", "mentor", "admin"]
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Profile retrieved successfully",
                  data: {
                    user: {
                      studentId: "STU-2024001",
                      email: "rahul.sharma@iitbombay.ac.in",
                      profile: {
                        name: "Rahul Sharma",
                        department: "Computer Science",
                        year: 3,
                        college: "IIT Bombay",
                        skills: ["JavaScript", "React", "Python"]
                      },
                      readinessScore: 75,
                      credits: { earned: 12, approved: 8, pending: 4 }
                    },
                    role: "student"
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized - invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      patch: {
        summary: "Update user profile",
        description: "Update the authenticated user's profile information. Fields that can be updated vary by role: students can update profile and preferences, companies can update contact info and documents, mentors can update expertise areas.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
              examples: {
                student: {
                  summary: "Student profile update",
                  value: {
                    profile: {
                      bio: "Updated bio - passionate about AI and cloud computing",
                      skills: ["JavaScript", "React", "Python", "AWS", "Docker"],
                      interests: ["Web Development", "AI/ML", "DevOps"]
                    },
                    preferences: {
                      notificationChannels: {
                        email: true,
                        sms: false,
                        whatsapp: true
                      }
                    }
                  }
                },
                company: {
                  summary: "Company profile update",
                  value: {
                    phone: "+91-22-87654321",
                    address: "456 New Tech Park, Powai, Mumbai, Maharashtra 400076",
                    pointOfContact: {
                      name: "Amit Kumar",
                      email: "amit.kumar@techinnovations.com",
                      phone: "+91-9123456789",
                      designation: "Senior HR Manager"
                    }
                  }
                },
                mentor: {
                  summary: "Mentor profile update",
                  value: {
                    profile: {
                      bio: "Updated expertise in AI/ML and cloud technologies",
                      expertiseAreas: ["Machine Learning", "Deep Learning", "Cloud Computing", "DevOps"]
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Profile updated successfully",
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
                            user: {
                              oneOf: [
                                { $ref: "#/components/schemas/Student" },
                                { $ref: "#/components/schemas/Company" },
                                { $ref: "#/components/schemas/Mentor" }
                              ]
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Profile updated successfully",
                  data: {
                    user: {
                      studentId: "STU-2024001",
                      profile: {
                        name: "Rahul Sharma",
                        bio: "Updated bio - passionate about AI and cloud computing",
                        skills: ["JavaScript", "React", "Python", "AWS", "Docker"]
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    
    // File Uploads
    "/auth/profile/image": {
      post: {
        summary: "Upload profile image",
        description: "Upload a profile image for the authenticated user. Supports JPEG, PNG formats. Maximum file size: 5MB. Image is uploaded to ImageKit and URL is stored in user profile.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Image file (JPEG, PNG) - max 5MB"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Profile image uploaded successfully",
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
                            profileImage: {
                              type: "string",
                              format: "uri",
                              description: "URL of uploaded profile image",
                              example: "https://ik.imagekit.io/prashiskshan/profiles/STU-2024001.jpg"
                            },
                            profileImageFileId: {
                              type: "string",
                              description: "ImageKit file ID for deletion",
                              example: "abc123xyz789"
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Profile image uploaded successfully",
                  data: {
                    profileImage: "https://ik.imagekit.io/prashiskshan/profiles/STU-2024001.jpg",
                    profileImageFileId: "abc123xyz789"
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid file format or size",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "File size exceeds 5MB limit",
                  error: { code: "FILE_TOO_LARGE" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          429: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/auth/profile/resume": {
      post: {
        summary: "Upload resume (students only)",
        description: "Upload a resume document for student profile. Supports PDF, DOC, DOCX formats. Maximum file size: 10MB. Resume is uploaded to R2 storage and URL is stored in student profile.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Resume file (PDF, DOC, DOCX) - max 10MB"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Resume uploaded successfully",
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
                            resume: {
                              type: "string",
                              description: "Resume file path",
                              example: "resumes/STU-2024001-resume.pdf"
                            },
                            resumeUrl: {
                              type: "string",
                              format: "uri",
                              description: "Public URL of uploaded resume",
                              example: "https://pub-abc123.r2.dev/resumes/STU-2024001-resume.pdf"
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Resume uploaded successfully",
                  data: {
                    resume: "resumes/STU-2024001-resume.pdf",
                    resumeUrl: "https://pub-abc123.r2.dev/resumes/STU-2024001-resume.pdf"
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid file format or size",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Only PDF, DOC, and DOCX files are allowed",
                  error: { code: "INVALID_FILE_TYPE" }
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          403: {
            description: "Forbidden - only students can upload resumes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Only students can upload resumes",
                  error: { code: "FORBIDDEN" }
                }
              }
            }
          },
          429: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    
    // Account Management
    "/auth/account": {
      delete: {
        summary: "Delete user account",
        description: "Soft delete the authenticated user's account. Account is marked as deleted but data is retained for compliance. User will be logged out and cannot access the system.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Account deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  success: true,
                  message: "Account deleted successfully"
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Server error during account deletion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // ==================== Student Routes ====================
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
    // All student endpoints require Bearer authentication
    
    // Dashboard and Profile (Requirements: 2.1)
    "/students/dashboard": { 
      get: { 
        summary: "Get student dashboard with mentor info and active internships", 
        description: "Retrieve comprehensive dashboard data including assigned mentor details, application statuses, active internships, readiness score, recent notifications, and upcoming deadlines. This is the main landing page data for students after login.",
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
                    recentApplications: [],
                    upcomingDeadlines: []
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/profile": { 
      get: { 
        summary: "Get complete student profile with credits and internship history", 
        description: "Retrieve the authenticated student's complete profile including personal information, skills, interests, readiness score, credit summary with history, completed internships, certifications, badges, and module progress.",
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
                },
                example: {
                  success: true,
                  message: "Profile retrieved successfully",
                  data: {
                    student: {
                      studentId: "STU-2024001",
                      email: "rahul.sharma@iitbombay.ac.in",
                      profile: {
                        name: "Rahul Sharma",
                        department: "Computer Science",
                        year: 3,
                        college: "IIT Bombay",
                        skills: ["JavaScript", "React", "Python"],
                        resumeUrl: "https://storage.example.com/resumes/STU-2024001.pdf"
                      },
                      readinessScore: 75,
                      credits: { earned: 12, approved: 8, pending: 4 },
                      completedInternships: 2
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Internship Discovery (Requirements: 2.2)
    "/students/internships": { 
      get: { 
        summary: "Browse available internships with filtering and AI match scores", 
        description: "Browse mentor-approved internships for the student's department with comprehensive filtering options (location, work mode, skills, stipend range, search query). Optionally include AI-powered match scores that analyze student profile compatibility with each internship.",
        tags: ["Students", "Students - Internships", "Internship Lifecycle", "AI Services"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number for pagination", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Number of items per page", example: 20 },
          { name: "location", in: "query", schema: { type: "string" }, description: "Filter by location (city or state)", example: "Mumbai, Maharashtra" },
          { name: "workMode", in: "query", schema: { type: "string", enum: ["remote", "onsite", "hybrid"] }, description: "Filter by work mode", example: "hybrid" },
          { name: "skills", in: "query", schema: { type: "string" }, description: "Comma-separated list of required skills", example: "JavaScript,React,Node.js" },
          { name: "minStipend", in: "query", schema: { type: "number", minimum: 0 }, description: "Minimum monthly stipend in INR", example: 10000 },
          { name: "maxStipend", in: "query", schema: { type: "number", minimum: 0 }, description: "Maximum monthly stipend in INR", example: 25000 },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search query for title, description, or company name", example: "full stack developer" },
          { name: "includeMatchScore", in: "query", schema: { type: "boolean", default: false }, description: "Include AI-powered match scores (requires additional processing)", example: true }
        ],
        responses: { 
          200: { 
            description: "List of internships retrieved successfully",
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
                            internships: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Internship" }
                            },
                            pagination: { $ref: "#/components/schemas/Pagination" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Internships retrieved successfully",
                  data: {
                    internships: [
                      {
                        internshipId: "INT-2024001",
                        title: "Full Stack Developer Intern",
                        companyId: "COM-2024001",
                        department: "Computer Science",
                        requiredSkills: ["JavaScript", "React", "Node.js"],
                        duration: "6 months",
                        stipend: 15000,
                        location: "Mumbai, Maharashtra",
                        workMode: "hybrid",
                        status: "open_for_applications",
                        slots: 5,
                        slotsRemaining: 3,
                        applicationDeadline: "2024-05-15T23:59:59Z",
                        matchScore: 85
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 5,
                      totalItems: 95,
                      itemsPerPage: 20,
                      hasNextPage: true,
                      hasPrevPage: false
                    }
                  }
                }
              } 
            } 
          },
          400: { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/internships/recommended": { 
      get: { 
        summary: "Get AI-recommended internships based on student profile", 
        description: "Retrieve personalized internship recommendations using AI analysis of student's skills, interests, completed modules, and career goals. Recommendations are ranked by match score and relevance.",
        tags: ["Students", "Students - Internships", "AI Services"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 50 }, description: "Number of recommendations to return", example: 10 }
        ],
        responses: { 
          200: { 
            description: "Recommended internships retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Recommendations generated successfully",
                  data: {
                    recommendations: [
                      {
                        internship: {
                          internshipId: "INT-2024001",
                          title: "Full Stack Developer Intern",
                          companyId: "COM-2024001",
                          requiredSkills: ["JavaScript", "React", "Node.js"],
                          stipend: 15000,
                          location: "Mumbai, Maharashtra"
                        },
                        matchScore: 92,
                        reasoning: "Excellent match based on your JavaScript and React skills",
                        strengths: ["Strong skill alignment", "Career path fit"]
                      }
                    ]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          429: { description: "Rate limit exceeded for AI features", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/internships/completed": {
      get: {
        summary: "Get completed internships with credit request availability",
        description: "Retrieve list of completed internships with information about credit request eligibility and status. Shows which internships are eligible for credit requests and which already have pending or approved requests.",
        tags: ["Students", "Students - Internships", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Completed internships retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Completed internships retrieved successfully",
                  data: {
                    completedInternships: [
                      {
                        internshipCompletionId: "IC-2024001",
                        internshipId: "INT-2023050",
                        title: "Software Developer Intern",
                        companyName: "Tech Corp",
                        startDate: "2023-06-01",
                        endDate: "2023-12-01",
                        durationWeeks: 24,
                        canRequestCredits: true,
                        creditRequestStatus: "none",
                        creditRequestId: null
                      }
                    ]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/internships/{internshipId}": { 
      get: { 
        summary: "Get detailed internship information with AI match analysis", 
        description: "Retrieve complete internship details including company information, requirements, responsibilities, learning opportunities, and AI-powered match analysis showing how well the student's profile aligns with the internship requirements.",
        tags: ["Students", "Students - Internships", "Internship Lifecycle", "AI Services"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024001" }],
        responses: { 
          200: { 
            description: "Internship details retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship details retrieved successfully",
                  data: {
                    internship: {
                      internshipId: "INT-2024001",
                      title: "Full Stack Developer Intern",
                      description: "Work on exciting web development projects",
                      department: "Computer Science",
                      requiredSkills: ["JavaScript", "React", "Node.js"],
                      duration: "6 months",
                      stipend: 15000,
                      location: "Mumbai, Maharashtra",
                      workMode: "hybrid",
                      status: "open_for_applications",
                      slots: 5,
                      slotsRemaining: 3,
                      startDate: "2024-06-01",
                      applicationDeadline: "2024-05-15T23:59:59Z"
                    },
                    company: {
                      companyId: "COM-2024001",
                      companyName: "Tech Innovations Pvt Ltd",
                      about: "Leading technology company",
                      website: "https://techinnovations.com"
                    },
                    matchAnalysis: {
                      matchScore: 85,
                      skillsMatch: {
                        matched: ["JavaScript", "React"],
                        missing: ["Node.js"]
                      },
                      strengths: ["Strong frontend skills", "Relevant coursework"],
                      recommendations: ["Complete Node.js module before applying"],
                      eligibility: {
                        isEligible: true,
                        reasons: ["Meets year requirement", "Sufficient readiness score"]
                      }
                    },
                    hasApplied: false
                  }
                }
              }
            }
          },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/internships/{internshipId}/apply": { 
      post: { 
        summary: "Apply to an internship", 
        description: "Submit an application to an internship with cover letter and optional resume. Creates notifications for the company and mentor. Validates eligibility, deadline, and duplicate applications.",
        tags: ["Students", "Students - Applications", "Application Flow", "Internship Lifecycle"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID to apply to", example: "INT-2024001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InternshipApplicationRequest" },
              example: {
                internshipId: "INT-2024001",
                coverLetter: "I am excited to apply for this Full Stack Developer position because I have strong experience with React and JavaScript from my coursework and personal projects. I am eager to learn Node.js and contribute to your team.",
                resumeUrl: "https://storage.example.com/resumes/STU-2024001.pdf"
              }
            }
          }
        },
        responses: { 
          201: { 
            description: "Application submitted successfully",
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
                            application: { $ref: "#/components/schemas/Application" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Application submitted successfully",
                  data: {
                    application: {
                      applicationId: "APP-2024015",
                      studentId: "STU-2024001",
                      internshipId: "INT-2024001",
                      status: "pending",
                      appliedAt: "2024-01-20T14:30:00Z"
                    }
                  }
                }
              }
            }
          },
          400: { 
            description: "Invalid request - deadline passed, already applied, or validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Application deadline has passed", error: { code: "DEADLINE_PASSED" } } } }
          },
          403: { 
            description: "Not eligible - doesn't meet requirements",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "You do not meet the eligibility requirements", error: { code: "NOT_ELIGIBLE" } } } }
          },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { 
            description: "Duplicate application - already applied to this internship",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "You have already applied to this internship", error: { code: "DUPLICATE_APPLICATION" } } } }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Application Management (Requirements: 2.3)
    "/students/applications": {
      get: { 
        summary: "List all student applications with status and feedback", 
        description: "Retrieve paginated list of all applications submitted by the student with current status, company feedback, mentor approval status, and timeline. Supports filtering by application status.",
        tags: ["Students", "Students - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "mentor_approved", "shortlisted", "accepted", "rejected", "withdrawn"] }, description: "Filter by application status", example: "pending" },
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Items per page", example: 20 }
        ],
        responses: { 
          200: { 
            description: "Applications retrieved successfully",
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
                            applications: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Application" }
                            },
                            pagination: { $ref: "#/components/schemas/Pagination" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Applications retrieved successfully",
                  data: {
                    applications: [
                      {
                        applicationId: "APP-2024015",
                        internshipId: "INT-2024001",
                        status: "shortlisted",
                        appliedAt: "2024-01-20T14:30:00Z",
                        mentorApproval: {
                          status: "approved",
                          comments: "Strong candidate"
                        },
                        companyFeedback: {
                          status: "shortlisted",
                          feedback: "Impressive background"
                        },
                        cachedInternshipData: {
                          title: "Full Stack Developer Intern",
                          companyName: "Tech Innovations Pvt Ltd"
                        }
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 2,
                      totalItems: 25,
                      itemsPerPage: 20
                    }
                  }
                }
              } 
            } 
          },
          400: { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },
    "/students/applications/{applicationId}": { 
      get: { 
        summary: "Get detailed application information with complete timeline", 
        description: "Retrieve complete application details including internship information, mentor approval status, company feedback, AI ranking analysis, and full timeline of all events and status changes.",
        tags: ["Students", "Students - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID", example: "APP-2024015" }],
        responses: { 
          200: { 
            description: "Application details retrieved successfully",
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
                            application: { $ref: "#/components/schemas/Application" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Application details retrieved successfully",
                  data: {
                    application: {
                      applicationId: "APP-2024015",
                      internshipId: "INT-2024001",
                      status: "shortlisted",
                      appliedAt: "2024-01-20T14:30:00Z",
                      coverLetter: "I am excited to apply...",
                      mentorApproval: {
                        status: "approved",
                        comments: "Strong candidate with good technical skills"
                      },
                      companyFeedback: {
                        status: "shortlisted",
                        feedback: "Impressive background",
                        nextSteps: "Schedule technical interview"
                      },
                      aiRanking: {
                        matchScore: 85,
                        strengths: ["Relevant coursework", "Strong technical skills"]
                      },
                      timeline: [
                        {
                          event: "Application submitted",
                          timestamp: "2024-01-20T14:30:00Z"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          404: { description: "Application not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      },
      delete: { 
        summary: "Withdraw an application", 
        description: "Withdraw a submitted application. Only allowed if application is in 'pending', 'mentor_approved', or 'shortlisted' status. Cannot withdraw after acceptance or rejection.",
        tags: ["Students", "Students - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID to withdraw", example: "APP-2024015" }], 
        responses: { 
          200: { 
            description: "Application withdrawn successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  success: true,
                  message: "Application withdrawn successfully",
                  data: {
                    applicationId: "APP-2024015",
                    status: "withdrawn"
                  }
                }
              }
            }
          },
          400: { 
            description: "Cannot withdraw - application in final status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Cannot withdraw application in current status", error: { code: "INVALID_STATUS" } } } }
          },
          404: { description: "Application not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    // Learning Modules (Requirements: 2.6)
    "/students/modules/recommended": { 
      get: { 
        summary: "Get recommended learning modules based on profile and goals", 
        description: "Retrieve personalized learning module recommendations based on student's current skills, completed modules, career interests, and skill gaps identified from internship applications.",
        tags: ["Students", "Students - Learning"], 
        security: [{ BearerAuth: [] }],
        responses: { 
          200: { 
            description: "Recommended modules retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Recommended modules retrieved successfully",
                  data: {
                    modules: [
                      {
                        code: "MOD-003",
                        title: "Advanced Node.js Development",
                        description: "Learn advanced Node.js concepts",
                        duration: "4 weeks",
                        difficulty: "intermediate",
                        skills: ["Node.js", "Backend Development"],
                        recommendationReason: "This module addresses the Node.js skill gap identified in your recent applications"
                      }
                    ]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/modules/start": { 
      post: { 
        summary: "Start a learning module", 
        description: "Begin a learning module and track progress. Updates student's module progress and readiness score.",
        tags: ["Students", "Students - Learning"], 
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StartModuleRequest" }, example: { moduleCode: "MOD-003" } } } }, 
        responses: { 
          200: { 
            description: "Module started successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Module started successfully",
                  data: {
                    moduleCode: "MOD-003",
                    status: "in_progress",
                    startedAt: "2024-01-20T10:00:00Z"
                  }
                }
              }
            }
          },
          400: { description: "Module already started or completed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Module not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/modules/complete": { 
      post: { 
        summary: "Complete a learning module", 
        description: "Mark a learning module as completed with optional score. Updates student's completed modules list and recalculates readiness score.",
        tags: ["Students", "Students - Learning"], 
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CompleteModuleRequest" }, example: { moduleCode: "MOD-003", score: 85 } } } }, 
        responses: { 
          200: { 
            description: "Module completed successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Module completed successfully",
                  data: {
                    moduleCode: "MOD-003",
                    status: "completed",
                    score: 85,
                    completedAt: "2024-02-15T16:00:00Z",
                    newReadinessScore: 78
                  }
                }
              }
            }
          },
          400: { description: "Module not started or already completed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Module not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    // Interview Practice (Requirements: 2.6)
    "/students/interviews/start": { 
      post: { 
        summary: "Start AI-powered mock interview session", 
        description: "Begin an AI-powered mock interview practice session. Specify domain (e.g., 'web development', 'data science') and difficulty level. AI generates relevant technical questions.",
        tags: ["Students", "Students - Interview Practice", "AI Services"], 
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StartInterviewRequest" }, example: { domain: "web development", difficulty: "intermediate" } } } }, 
        responses: { 
          201: { 
            description: "Interview session started successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Interview session started",
                  data: {
                    sessionId: "IS-2024001",
                    domain: "web development",
                    difficulty: "intermediate",
                    firstQuestion: "Can you explain the difference between var, let, and const in JavaScript?",
                    startedAt: "2024-01-20T14:00:00Z"
                  }
                }
              }
            }
          },
          400: { description: "Invalid domain or difficulty", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          429: { description: "Rate limit exceeded for AI features", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/interviews/answer": { 
      post: { 
        summary: "Submit answer to interview question", 
        description: "Submit an answer to the current interview question. AI evaluates the answer and provides feedback, then generates the next question or concludes the interview.",
        tags: ["Students", "Students - Interview Practice", "AI Services"], 
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitInterviewAnswerRequest" }, example: { sessionId: "IS-2024001", answer: "var is function-scoped and can be redeclared, let is block-scoped and cannot be redeclared, and const is also block-scoped but cannot be reassigned." } } } }, 
        responses: { 
          200: { 
            description: "Answer evaluated successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Answer evaluated",
                  data: {
                    feedback: "Good answer! You correctly identified the key differences.",
                    score: 8,
                    nextQuestion: "What is the event loop in JavaScript?",
                    isComplete: false
                  }
                }
              }
            }
          },
          404: { description: "Session not found or expired", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          429: { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/interviews/end": { 
      post: { 
        summary: "End interview session and get final report", 
        description: "End the current interview session and receive a comprehensive performance report with overall score, strengths, areas for improvement, and recommendations.",
        tags: ["Students", "Students - Interview Practice", "AI Services"], 
        security: [{ BearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/EndInterviewRequest" }, example: { sessionId: "IS-2024001" } } } }, 
        responses: { 
          200: { 
            description: "Interview session ended successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Interview session completed",
                  data: {
                    sessionId: "IS-2024001",
                    overallScore: 7.5,
                    questionsAnswered: 5,
                    strengths: ["Good understanding of JavaScript fundamentals"],
                    areasForImprovement: ["Async programming concepts"],
                    recommendations: ["Study promises and async/await"],
                    duration: "25 minutes"
                  }
                }
              }
            }
          },
          404: { description: "Session not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/interviews/history": { 
      get: { 
        summary: "Get interview practice history", 
        description: "Retrieve history of all completed interview practice sessions with scores, domains, and performance trends over time.",
        tags: ["Students", "Students - Interview Practice"], 
        security: [{ BearerAuth: [] }],
        responses: { 
          200: { 
            description: "Interview history retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Interview history retrieved successfully",
                  data: {
                    sessions: [
                      {
                        sessionId: "IS-2024001",
                        domain: "web development",
                        difficulty: "intermediate",
                        overallScore: 7.5,
                        questionsAnswered: 5,
                        completedAt: "2024-01-20T14:30:00Z"
                      }
                    ],
                    totalAttempts: 5,
                    averageScore: 7.2
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    // Logbook Management (Requirements: 2.4)
    "/students/logbooks": {
      post: { 
        summary: "Submit weekly logbook entry", 
        description: "Submit a logbook entry for a specific week of an active internship. Includes activities, tasks completed, skills used, challenges, learnings, and optional attachments. AI automatically generates a summary and analysis.",
        tags: ["Students", "Students - Logbooks", "Logbook Flow"], 
        security: [{ BearerAuth: [] }],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { $ref: "#/components/schemas/LogbookSubmissionRequest" },
              example: {
                internshipId: "INT-2024001",
                weekNumber: 3,
                startDate: "2024-06-15",
                endDate: "2024-06-21",
                hoursWorked: 40,
                activities: "Worked on implementing user authentication module, participated in code reviews.",
                tasksCompleted: ["Implemented login API", "Fixed authentication bugs"],
                skillsUsed: ["JavaScript", "React", "Node.js"],
                challenges: "Faced issues with JWT token expiration handling.",
                learnings: "Learned about secure authentication practices."
              }
            } 
          } 
        }, 
        responses: { 
          201: { 
            description: "Logbook submitted successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Logbook submitted successfully",
                  data: {
                    logbook: {
                      logbookId: "LOG-2024015",
                      weekNumber: 3,
                      status: "submitted",
                      submittedAt: "2024-06-22T10:00:00Z",
                      aiSummary: {
                        summary: "Student demonstrated strong progress in authentication implementation",
                        keySkillsDemonstrated: ["Backend Development", "Security"]
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Validation error or duplicate week", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Internship not found or not active", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      },
      get: { 
        summary: "Get all logbook entries for student", 
        description: "Retrieve all logbook entries submitted by the student across all internships, with mentor and company feedback, AI summaries, and review status.",
        tags: ["Students", "Students - Logbooks", "Logbook Flow"], 
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "internshipId", in: "query", schema: { type: "string" }, description: "Filter by specific internship", example: "INT-2024001" },
          { name: "status", in: "query", schema: { type: "string", enum: ["draft", "submitted", "pending_mentor_review", "approved", "needs_revision"] }, description: "Filter by review status", example: "approved" }
        ],
        responses: { 
          200: { 
            description: "Logbooks retrieved successfully", 
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
                            logbooks: {
                              type: "array", 
                              items: { $ref: "#/components/schemas/Logbook" }
                            }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  message: "Logbooks retrieved successfully",
                  data: {
                    logbooks: [
                      {
                        logbookId: "LOG-2024015",
                        internshipId: "INT-2024001",
                        weekNumber: 3,
                        hoursWorked: 40,
                        status: "approved",
                        submittedAt: "2024-06-22T10:00:00Z",
                        mentorReview: {
                          status: "approved",
                          comments: "Excellent progress this week!"
                        }
                      }
                    ]
                  }
                }
              } 
            } 
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },
    
    // Credit Management (Requirements: 2.5)
    "/students/credits": { 
      get: { 
        summary: "Get credits summary with breakdown", 
        description: "Retrieve comprehensive credits summary including earned, approved, and pending credits with detailed history of all credit transactions.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }],
        responses: { 
          200: { 
            description: "Credits summary retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Credits summary retrieved successfully",
                  data: {
                    earned: 12,
                    approved: 8,
                    pending: 4,
                    history: [
                      {
                        creditRequestId: "CR-2024001",
                        internshipId: "INT-2023050",
                        creditsAdded: 4,
                        addedAt: "2023-12-15T10:00:00Z"
                      }
                    ]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Reports and Chatbot (Requirements: 2.7)
    "/students/reports/nep": { 
      post: { 
        summary: "Generate NEP (National Education Policy) compliance report", 
        description: "Generate a comprehensive NEP compliance report showing credits earned, internship experiences, skills developed, and learning outcomes. Report generation is asynchronous.",
        tags: ["Students", "Students - Reports"], 
        security: [{ BearerAuth: [] }],
        responses: { 
          202: { 
            description: "Report generation started",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Report generation started",
                  data: {
                    reportId: "REP-2024001",
                    status: "generating",
                    estimatedTime: "2-3 minutes"
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/students/chatbot": { 
      post: { 
        summary: "Query AI chatbot for guidance and support", 
        description: "Ask the AI chatbot questions about internships, applications, career guidance, skill development, or general queries. The chatbot provides personalized responses based on student profile and context.",
        tags: ["Students", "Students - Chatbot", "AI Services"], 
        security: [{ BearerAuth: [] }],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { $ref: "#/components/schemas/ChatbotQueryRequest" },
              example: {
                prompt: "What skills should I focus on to improve my chances for web development internships?"
              }
            } 
          } 
        }, 
        responses: { 
          200: { 
            description: "Chatbot response generated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Response generated",
                  data: {
                    response: "Based on your profile and the current internship market, I recommend focusing on: 1) Advanced React concepts like hooks and context API, 2) Backend development with Node.js and Express, 3) Database management with MongoDB or PostgreSQL. These skills are highly sought after in web development roles.",
                    suggestions: ["Complete the Advanced React module", "Practice building full-stack projects"],
                    relatedInternships: ["INT-2024001", "INT-2024005"]
                  }
                }
              }
            }
          },
          429: { description: "Rate limit exceeded for AI features", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Credit Request Management (Requirements: 2.5)
    "/students/{studentId}/credit-requests": {
      post: {
        summary: "Create a new credit request for completed internship",
        description: "Submit a credit transfer request for a completed internship. Requires completion certificate, logbook summary, company evaluation, and final report. System calculates credits based on internship duration.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                internshipCompletionId: "IC-2024001",
                requestedCredits: 4,
                documents: {
                  completionCertificate: "https://storage.example.com/certificates/IC-2024001.pdf",
                  logbookSummary: "https://storage.example.com/logbooks/summary-IC-2024001.pdf",
                  companyEvaluation: "https://storage.example.com/evaluations/IC-2024001.pdf",
                  finalReport: "https://storage.example.com/reports/IC-2024001.pdf"
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Credit request created successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Credit request submitted successfully",
                  data: {
                    creditRequest: {
                      creditRequestId: "CR-2024015",
                      studentId: "STU-2024001",
                      internshipCompletionId: "IC-2024001",
                      requestedCredits: 4,
                      calculatedCredits: 4,
                      status: "pending_mentor_review",
                      createdAt: "2024-01-20T10:00:00Z"
                    }
                  }
                }
              }
            }
          },
          400: { description: "Validation error or duplicate request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Internship completion not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      },
      get: {
        summary: "Get all credit requests for student",
        description: "Retrieve paginated list of all credit requests submitted by the student with current status, review progress, and feedback. Supports filtering by status and date range.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" },
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status", example: "pending_mentor_review" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: {
          200: {
            description: "Credit requests retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Credit requests retrieved successfully",
                  data: {
                    creditRequests: [
                      {
                        creditRequestId: "CR-2024015",
                        internshipId: "INT-2023050",
                        requestedCredits: 4,
                        status: "mentor_approved",
                        createdAt: "2024-01-20T10:00:00Z",
                        mentorReview: {
                          status: "approved",
                          reviewedAt: "2024-01-22T14:00:00Z"
                        }
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 1,
                      totalItems: 3
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/{studentId}/credit-requests/{requestId}": {
      get: {
        summary: "Get detailed credit request information",
        description: "Retrieve complete credit request details including documents, review history, mentor and admin feedback, and current status in the approval workflow.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit request ID", example: "CR-2024015" }
        ],
        responses: {
          200: {
            description: "Credit request details retrieved successfully",
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
                            creditRequest: { $ref: "#/components/schemas/CreditRequest" }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          404: { description: "Credit request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/{studentId}/credit-requests/{requestId}/resubmit": {
      put: {
        summary: "Resubmit a rejected credit request with corrections",
        description: "Resubmit a credit request that was rejected by mentor or admin. Allows updating documents and addressing feedback. Can only resubmit requests in rejected status.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit request ID", example: "CR-2024015" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                documents: {
                  completionCertificate: "https://storage.example.com/certificates/updated.pdf"
                },
                resubmissionNotes: "Updated completion certificate with correct dates"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Credit request resubmitted successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Credit request resubmitted successfully",
                  data: {
                    creditRequestId: "CR-2024015",
                    status: "pending_mentor_review",
                    resubmittedAt: "2024-01-25T10:00:00Z"
                  }
                }
              }
            }
          },
          400: { description: "Cannot resubmit - not in rejected status", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Credit request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/{studentId}/credit-requests/{requestId}/status": {
      get: {
        summary: "Get real-time status of credit request",
        description: "Get the current status of a credit request with real-time updates on review progress, current reviewer, and estimated completion time.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit request ID", example: "CR-2024015" }
        ],
        responses: {
          200: {
            description: "Status retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Status retrieved successfully",
                  data: {
                    creditRequestId: "CR-2024015",
                    status: "pending_admin_review",
                    currentReviewer: "ADM-001",
                    reviewerName: "System Administrator",
                    submittedAt: "2024-01-20T10:00:00Z",
                    lastUpdatedAt: "2024-01-22T14:00:00Z",
                    estimatedCompletionDays: 3
                  }
                }
              }
            }
          },
          404: { description: "Credit request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/{studentId}/credit-requests/{requestId}/reminder": {
      post: {
        summary: "Send reminder to current reviewer",
        description: "Send a polite reminder notification to the current reviewer (mentor or admin) about the pending credit request. Rate limited to prevent spam.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit request ID", example: "CR-2024015" }
        ],
        responses: {
          200: {
            description: "Reminder sent successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Reminder sent to reviewer",
                  data: {
                    sentTo: "MEN-001",
                    sentAt: "2024-01-25T10:00:00Z"
                  }
                }
              }
            }
          },
          429: { description: "Rate limit exceeded - can only send reminder once per 24 hours", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Credit request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/{studentId}/credits/history": {
      get: {
        summary: "Get complete credit history for student",
        description: "Retrieve complete history of all credit transactions including approved requests, credits added, certificates issued, and timeline of credit accumulation.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" }
        ],
        responses: {
          200: {
            description: "Credit history retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Credit history retrieved successfully",
                  data: {
                    totalCredits: 12,
                    history: [
                      {
                        creditRequestId: "CR-2024001",
                        internshipId: "INT-2023050",
                        creditsAdded: 4,
                        addedAt: "2023-12-15T10:00:00Z",
                        certificateUrl: "https://storage.example.com/certificates/CR-2024001.pdf"
                      }
                    ]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/students/{studentId}/credits/certificate/{requestId}": {
      get: {
        summary: "Download credit transfer certificate",
        description: "Download the official credit transfer certificate for an approved credit request. Certificate includes student details, internship information, credits awarded, and official signatures.",
        tags: ["Students", "Students - Credits", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit request ID", example: "CR-2024001" }
        ],
        responses: {
          200: {
            description: "Certificate download initiated",
            content: {
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary"
                }
              }
            }
          },
          404: { description: "Certificate not found or request not approved", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },

    // Company Routes (Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8)
    "/companies/dashboard": { 
      get: { 
        summary: "Get company dashboard overview", 
        description: "Retrieve comprehensive dashboard data including active internships, application statistics, intern progress, pending reviews, and recent activity. Provides complete overview of company's internship program status.",
        tags: ["Companies", "Companies - Dashboard"], 
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
                    stats: { activeInternships: 5, totalApplications: 127, pendingReview: 23, activeInterns: 12, completedInternships: 8 },
                    recentApplications: [{ applicationId: "APP-2024050", studentName: "Rahul Sharma", internshipTitle: "Full Stack Developer Intern", appliedAt: "2024-02-15T10:30:00Z", status: "pending" }],
                    upcomingDeadlines: [{ internshipId: "INT-2024010", title: "Backend Developer Intern", applicationDeadline: "2024-03-01T23:59:59Z", daysRemaining: 5 }]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/profile": {
      get: { 
        summary: "Get company profile", 
        description: "Retrieve complete company profile including verification status, documents, point of contact, statistics, and reappeal information if applicable.",
        tags: ["Companies", "Companies - Profile"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "Profile retrieved successfully", 
            content: { 
              "application/json": { 
                schema: { 
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "object", properties: { company: { $ref: "#/components/schemas/Company" } } } } }
                  ]
                },
                example: {
                  success: true,
                  message: "Profile retrieved successfully",
                  data: {
                    company: {
                      companyId: "COM-2024001",
                      companyName: "Tech Innovations Pvt Ltd",
                      email: "hr@techinnovations.com",
                      status: "verified",
                      stats: { totalInternshipsPosted: 15, activeInternships: 3, studentsHired: 25, avgRating: 4.5 }
                    }
                  }
                }
              } 
            } 
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      },
      patch: { 
        summary: "Update company profile", 
        description: "Update company profile information including contact details, point of contact, and address. Verified companies can update most fields without re-verification.",
        tags: ["Companies", "Companies - Profile"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string", example: "+91-22-87654321" },
                  address: { type: "string", example: "456 New Tech Park, Powai, Mumbai, Maharashtra 400076" },
                  website: { type: "string", format: "uri", example: "https://techinnovations.com" },
                  about: { type: "string" },
                  pointOfContact: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "Amit Kumar" },
                      email: { type: "string", format: "email", example: "amit.kumar@techinnovations.com" },
                      phone: { type: "string", example: "+91-9123456789" },
                      designation: { type: "string", example: "Senior HR Manager" }
                    }
                  }
                }
              },
              example: {
                phone: "+91-22-87654321",
                address: "456 New Tech Park, Powai, Mumbai, Maharashtra 400076",
                pointOfContact: { name: "Amit Kumar", email: "amit.kumar@techinnovations.com", phone: "+91-9123456789", designation: "Senior HR Manager" }
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Profile updated successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Profile updated successfully",
                  data: { company: { companyId: "COM-2024001", phone: "+91-22-87654321" } }
                }
              }
            }
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },
    
    // Company Internship Management (Requirements: 3.1, 3.2)
    "/companies/internships": {
      get: { 
        summary: "Get all company internships", 
        description: "Retrieve paginated list of all internships posted by the company with filtering by status. Includes application counts, slot availability, and current workflow status.",
        tags: ["Companies", "Companies - Internships", "Internship Lifecycle"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["draft", "pending_admin_verification", "admin_approved", "admin_rejected", "mentor_rejected", "open_for_applications", "closed", "cancelled"] }, description: "Filter by internship status", example: "open_for_applications" },
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Items per page", example: 20 },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["postedAt", "applicationDeadline", "startDate", "appliedCount"], default: "postedAt" }, description: "Sort field", example: "postedAt" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: { 
          200: { 
            description: "Internships retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internships retrieved successfully",
                  data: {
                    internships: [
                      {
                        internshipId: "INT-2024050",
                        title: "Full Stack Developer Intern",
                        status: "open_for_applications",
                        slots: 5,
                        slotsRemaining: 3,
                        appliedCount: 45,
                        shortlistedCount: 8,
                        acceptedCount: 2,
                        applicationDeadline: "2024-05-15T23:59:59Z",
                        startDate: "2024-06-01",
                        postedAt: "2024-02-15T10:00:00Z"
                      }
                    ],
                    pagination: { currentPage: 1, totalPages: 3, totalItems: 15, itemsPerPage: 20 }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      },
      post: { 
        summary: "Post new internship with AI tagging", 
        description: "Create a new internship posting. The internship is created with status 'pending_admin_verification' and requires admin approval before mentor review. AI automatically generates tags for skills, difficulty, career path, and industry fit asynchronously. Only verified companies can post internships.",
        tags: ["Companies", "Companies - Internships", "Internship Lifecycle", "AI Services"], 
        security: [{ BearerAuth: [] }], 
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object",
                required: ["title", "description", "department", "duration", "requiredSkills", "startDate", "applicationDeadline", "slots"],
                properties: {
                  title: { type: "string", minLength: 10, maxLength: 200, example: "Full Stack Developer Intern" },
                  description: { type: "string", minLength: 100, maxLength: 5000, example: "Join our dynamic team to work on cutting-edge web applications using React, Node.js, and MongoDB..." },
                  department: { type: "string", example: "Computer Science" },
                  duration: { type: "string", example: "6 months" },
                  requiredSkills: { type: "array", items: { type: "string" }, minItems: 1, example: ["JavaScript", "React", "Node.js", "MongoDB"] },
                  optionalSkills: { type: "array", items: { type: "string" }, example: ["TypeScript", "Docker", "AWS"] },
                  startDate: { type: "string", format: "date", example: "2024-06-01" },
                  applicationDeadline: { type: "string", format: "date-time", example: "2024-05-15T23:59:59Z" },
                  slots: { type: "integer", minimum: 1, maximum: 50, example: 5 },
                  stipend: { type: "number", minimum: 0, example: 15000 },
                  location: { type: "string", example: "Mumbai, Maharashtra" },
                  workMode: { type: "string", enum: ["remote", "onsite", "hybrid"], example: "hybrid" },
                  responsibilities: { type: "array", items: { type: "string" }, example: ["Develop and maintain web applications", "Participate in code reviews", "Collaborate with cross-functional teams"] },
                  learningOpportunities: { type: "array", items: { type: "string" }, example: ["Hands-on experience with modern web technologies", "Mentorship from senior developers"] },
                  eligibilityRequirements: { 
                    type: "object",
                    properties: {
                      minYear: { type: "integer", minimum: 1, maximum: 5, example: 2 },
                      maxYear: { type: "integer", minimum: 1, maximum: 5, example: 4 },
                      minReadinessScore: { type: "number", minimum: 0, maximum: 100, example: 60 },
                      requiredDepartments: { type: "array", items: { type: "string" }, example: ["Computer Science", "Information Technology"] }
                    }
                  }
                }
              },
              example: {
                title: "Full Stack Developer Intern",
                description: "Join our dynamic team to work on cutting-edge web applications using React, Node.js, and MongoDB. You'll collaborate with experienced developers and contribute to real-world projects.",
                department: "Computer Science",
                duration: "6 months",
                requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
                optionalSkills: ["TypeScript", "Docker", "AWS"],
                startDate: "2024-06-01",
                applicationDeadline: "2024-05-15T23:59:59Z",
                slots: 5,
                stipend: 15000,
                location: "Mumbai, Maharashtra",
                workMode: "hybrid",
                responsibilities: ["Develop and maintain web applications", "Participate in code reviews"],
                learningOpportunities: ["Hands-on experience with modern web technologies"],
                eligibilityRequirements: { minYear: 2, maxYear: 4, minReadinessScore: 60 }
              }
            } 
          } 
        },
        responses: { 
          201: { 
            description: "Internship created successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship created successfully. Pending admin verification.",
                  data: {
                    internship: {
                      internshipId: "INT-2024050",
                      title: "Full Stack Developer Intern",
                      status: "pending_admin_verification",
                      companyId: "COM-2024001",
                      slots: 5,
                      slotsRemaining: 5,
                      postedAt: "2024-02-15T10:00:00Z",
                      aiTagging: { status: "processing", message: "AI tags will be generated shortly" }
                    }
                  }
                }
              }
            }
          },
          400: { 
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Validation failed",
                  error: {
                    code: "VALIDATION_ERROR",
                    details: { title: "Title must be at least 10 characters", applicationDeadline: "Application deadline must be before start date" }
                  }
                }
              }
            }
          },
          403: { 
            description: "Company not verified or blocked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Only verified companies can post internships",
                  error: { code: "COMPANY_NOT_VERIFIED" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },
    "/companies/internships/{internshipId}": {
      get: { 
        summary: "Get internship details", 
        description: "Retrieve complete details of a specific internship including AI tags, application statistics, workflow status, and audit trail.",
        tags: ["Companies", "Companies - Internships", "Internship Lifecycle"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024050" }],
        responses: { 
          200: { 
            description: "Internship details retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    internship: {
                      internshipId: "INT-2024050",
                      title: "Full Stack Developer Intern",
                      status: "open_for_applications",
                      slots: 5,
                      slotsRemaining: 3,
                      appliedCount: 45,
                      aiTags: { primarySkills: ["Web Development", "Full Stack"], difficulty: "intermediate" },
                      adminReview: { status: "approved", reviewedBy: "ADM-001", reviewedAt: "2024-02-16T14:00:00Z" },
                      mentorApproval: { status: "approved", approvedBy: "MEN-2024001", approvedAt: "2024-02-17T10:00:00Z" }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      },
      patch: { 
        summary: "Update internship details", 
        description: "Update internship information. If the internship is already approved, updating it will reset status to 'pending_admin_verification' for re-review. Only internships in draft, pending, or rejected status can be freely updated.",
        tags: ["Companies", "Companies - Internships", "Internship Lifecycle"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024050" }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  requiredSkills: { type: "array", items: { type: "string" } },
                  optionalSkills: { type: "array", items: { type: "string" } },
                  stipend: { type: "number" },
                  location: { type: "string" },
                  workMode: { type: "string", enum: ["remote", "onsite", "hybrid"] }
                }
              },
              example: { stipend: 18000, workMode: "remote", optionalSkills: ["TypeScript", "Docker", "AWS", "GraphQL"] }
            }
          }
        },
        responses: { 
          200: { 
            description: "Internship updated successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship updated successfully. Status reset to pending_admin_verification.",
                  data: { internship: { internshipId: "INT-2024050", status: "pending_admin_verification", updatedAt: "2024-02-20T15:00:00Z" } }
                }
              }
            }
          },
          400: { description: "Cannot update - internship is closed or cancelled", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      },
      delete: { 
        summary: "Cancel internship", 
        description: "Cancel an internship posting. Sets status to 'cancelled'. Notifies all applicants. Cannot cancel internships with accepted interns.",
        tags: ["Companies", "Companies - Internships", "Internship Lifecycle"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024050" }],
        responses: { 
          200: { 
            description: "Internship cancelled successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship cancelled successfully. All applicants have been notified.",
                  data: { internshipId: "INT-2024050", status: "cancelled", cancelledAt: "2024-02-20T16:00:00Z", notifiedApplicants: 45 }
                }
              }
            }
          },
          400: { 
            description: "Cannot cancel - has accepted interns",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "Cannot cancel internship with accepted interns", error: { code: "HAS_ACCEPTED_INTERNS" } }
              }
            }
          },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },
    "/companies/internships/{internshipId}/complete": { 
      post: { 
        summary: "Mark internship as complete", 
        description: "Mark an internship as complete. This closes the internship and triggers completion workflow for all accepted interns.",
        tags: ["Companies", "Companies - Internships", "Internship Lifecycle"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024050" }],
        responses: { 
          200: { 
            description: "Internship marked as complete",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship marked as complete",
                  data: { internshipId: "INT-2024050", status: "closed", completedAt: "2024-08-01T10:00:00Z", completedInterns: 5 }
                }
              }
            }
          },
          400: { description: "Internship not in valid state for completion", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/internships/{internshipId}/metrics": { 
      get: { 
        summary: "Get internship-specific metrics", 
        description: "Get detailed metrics for a specific internship including application funnel, acceptance rate, and intern performance.",
        tags: ["Companies", "Companies - Analytics", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024050" }],
        responses: { 
          200: { 
            description: "Internship metrics retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    metrics: {
                      internshipId: "INT-2024050",
                      title: "Full Stack Developer Intern",
                      applicationFunnel: { applied: 45, shortlisted: 8, accepted: 5, rejected: 32 },
                      acceptanceRate: 11.1,
                      averageMatchScore: 72.5,
                      topSkills: ["JavaScript", "React", "Node.js"],
                      internPerformance: { averageLogbookScore: 8.5, completionRate: 100 }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Company Application Management (Requirements: 3.3, 3.4)
    "/companies/applications": {
      get: {
        summary: "Get all company applications",
        description: "Retrieve paginated list of all applications across all company internships with filtering by internship and status.",
        tags: ["Companies", "Companies - Applications", "Application Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "internshipId", in: "query", schema: { type: "string" }, description: "Filter by internship ID", example: "INT-2024050" },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "mentor_approved", "shortlisted", "accepted", "rejected", "withdrawn"] }, description: "Filter by application status", example: "pending" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: {
          200: {
            description: "Applications retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    applications: [
                      {
                        applicationId: "APP-2024050",
                        studentId: "STU-2024001",
                        studentName: "Rahul Sharma",
                        internshipId: "INT-2024050",
                        internshipTitle: "Full Stack Developer Intern",
                        status: "pending",
                        appliedAt: "2024-02-15T10:30:00Z",
                        matchScore: 85
                      }
                    ],
                    pagination: { currentPage: 1, totalPages: 7, totalItems: 127 }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/companies/internships/{internshipId}/applicants": { 
      get: { 
        summary: "Get applicants for specific internship with filters", 
        description: "Get all applicants for a specific internship with advanced filtering by status, feedback status, and search. Includes AI match scores and student profiles.",
        tags: ["Companies", "Companies - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "internshipId", in: "path", required: true, schema: { type: "string" }, description: "Internship ID", example: "INT-2024050" },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "mentor_approved", "shortlisted", "accepted", "rejected"] }, description: "Filter by application status", example: "pending" },
          { name: "companyFeedbackStatus", in: "query", schema: { type: "string", enum: ["pending", "reviewed", "shortlisted", "accepted", "rejected"] }, description: "Filter by company feedback status", example: "pending" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by student name or email", example: "Rahul" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: { 
          200: { 
            description: "Applicants retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    applicants: [
                      {
                        applicationId: "APP-2024050",
                        student: {
                          studentId: "STU-2024001",
                          name: "Rahul Sharma",
                          email: "rahul.sharma@iitbombay.ac.in",
                          department: "Computer Science",
                          year: 3,
                          readinessScore: 75,
                          skills: ["JavaScript", "React", "Python"]
                        },
                        coverLetter: "I am excited to apply...",
                        resumeUrl: "https://storage.example.com/resumes/STU-2024001.pdf",
                        status: "pending",
                        matchScore: 85,
                        appliedAt: "2024-02-15T10:30:00Z"
                      }
                    ],
                    pagination: { currentPage: 1, totalPages: 3, totalItems: 45 }
                  }
                }
              }
            }
          },
          404: { description: "Internship not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
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
        responses: { 
          200: { 
            description: "Application rejected successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Application rejected successfully",
                  data: {
                    applicationId: "APP-2024050",
                    status: "rejected",
                    rejectedAt: "2024-01-15T14:30:00Z"
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid application state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Cannot reject application in current state",
                  error: { code: "INVALID_STATE" }
                }
              }
            }
          },
          404: {
            description: "Application not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Application not found",
                  error: { code: "NOT_FOUND" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/applications/{applicationId}": { 
      get: { 
        summary: "Get application details", 
        description: "Retrieve complete details for a specific application including student profile, cover letter, resume, and application timeline",
        tags: ["Companies", "Applications"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID", example: "APP-2024050" }
        ],
        responses: { 
          200: { 
            description: "Application details retrieved successfully",
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
                            application: { $ref: "#/components/schemas/Application" }
                          }
                        }
                      }
                    }
                  ]
                },
                example: {
                  success: true,
                  data: {
                    application: {
                      applicationId: "APP-2024050",
                      studentId: "STU-2024001",
                      internshipId: "INT-2024050",
                      status: "shortlisted",
                      appliedAt: "2024-01-10T10:00:00Z",
                      student: {
                        name: "Rahul Sharma",
                        email: "rahul.sharma@iitbombay.ac.in",
                        department: "Computer Science",
                        year: 3,
                        college: "IIT Bombay",
                        readinessScore: 75,
                        skills: ["JavaScript", "React", "Python"]
                      },
                      coverLetter: "I am excited to apply for this position...",
                      resumeUrl: "https://storage.example.com/resumes/rahul-sharma.pdf",
                      matchScore: 85,
                      timeline: [
                        { status: "pending", timestamp: "2024-01-10T10:00:00Z" },
                        { status: "mentor_approved", timestamp: "2024-01-11T14:00:00Z" },
                        { status: "shortlisted", timestamp: "2024-01-12T16:00:00Z" }
                      ]
                    }
                  }
                }
              }
            }
          },
          404: {
            description: "Application not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Application not found",
                  error: { code: "NOT_FOUND" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/applications/review": { 
      post: { 
        summary: "Review applications (bulk)", 
        description: "Review multiple applications at once with feedback. Used for initial screening.",
        tags: ["Companies", "Companies - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationIds"],
                properties: {
                  applicationIds: { type: "array", items: { type: "string" } },
                  feedback: { type: "string" }
                }
              },
              example: {
                applicationIds: ["APP-2024050", "APP-2024051"],
                feedback: "Applications reviewed for initial screening"
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Applications reviewed successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "2 applications reviewed successfully",
                  data: { reviewedCount: 2 }
                }
              }
            }
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/applications/shortlist": { 
      post: { 
        summary: "Shortlist candidates (bulk)", 
        description: "Shortlist multiple candidates for further consideration. Updates application status to 'shortlisted'.",
        tags: ["Companies", "Companies - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationIds"],
                properties: {
                  applicationIds: { type: "array", items: { type: "string" } }
                }
              },
              example: {
                applicationIds: ["APP-2024050", "APP-2024051", "APP-2024052"]
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Candidates shortlisted successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "3 candidates shortlisted successfully",
                  data: { shortlistedCount: 3 }
                }
              }
            }
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/applications/reject": { 
      post: { 
        summary: "Reject candidates (bulk)", 
        description: "Reject multiple candidates at once with optional feedback. Notifies all rejected candidates.",
        tags: ["Companies", "Companies - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationIds"],
                properties: {
                  applicationIds: { type: "array", items: { type: "string" } },
                  reason: { type: "string" },
                  feedback: { type: "string" }
                }
              },
              example: {
                applicationIds: ["APP-2024053", "APP-2024054"],
                reason: "Skills do not match requirements",
                feedback: "Thank you for your interest. We encourage you to apply for future opportunities."
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Candidates rejected successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "2 candidates rejected successfully. Notifications sent.",
                  data: { rejectedCount: 2 }
                }
              }
            }
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Company Intern Management (Requirements: 3.5)
    "/companies/interns": {
      get: {
        summary: "Get active interns",
        description: "Retrieve list of all active interns across company internships with their progress and logbook status.",
        tags: ["Companies", "Companies - Interns"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "internshipId", in: "query", schema: { type: "string" }, description: "Filter by internship ID" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: {
            description: "Active interns retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    interns: [
                      {
                        studentId: "STU-2024001",
                        name: "Rahul Sharma",
                        internshipId: "INT-2024050",
                        internshipTitle: "Full Stack Developer Intern",
                        startDate: "2024-06-01",
                        logbooksSubmitted: 8,
                        logbooksPending: 2,
                        overallProgress: 80
                      }
                    ],
                    pagination: { currentPage: 1, totalPages: 1, totalItems: 12 }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/companies/interns/progress": { 
      get: { 
        summary: "Get detailed intern progress", 
        description: "Get detailed progress information for all active interns including logbook submissions, attendance, and performance metrics.",
        tags: ["Companies", "Companies - Interns"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "Intern progress retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    progress: [
                      {
                        studentId: "STU-2024001",
                        name: "Rahul Sharma",
                        internshipTitle: "Full Stack Developer Intern",
                        weeklyProgress: [
                          { week: 1, logbookSubmitted: true, hoursWorked: 40, status: "approved" },
                          { week: 2, logbookSubmitted: true, hoursWorked: 38, status: "approved" }
                        ],
                        totalHoursWorked: 320,
                        averageWeeklyHours: 40,
                        completionPercentage: 80
                      }
                    ]
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/interns/{studentId}/logbooks": {
      get: {
        summary: "Get intern logbooks",
        description: "Retrieve all logbook entries for a specific intern with their submission status and company feedback.",
        tags: ["Companies", "Companies - Interns", "Logbook Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024001" }
        ],
        responses: {
          200: {
            description: "Logbooks retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    logbooks: [
                      {
                        logbookId: "LOG-2024001",
                        weekNumber: 1,
                        startDate: "2024-06-01",
                        endDate: "2024-06-07",
                        hoursWorked: 40,
                        activities: "Worked on user authentication module",
                        status: "approved",
                        companyFeedback: "Great progress!",
                        submittedAt: "2024-06-08T10:00:00Z"
                      }
                    ]
                  }
                }
              }
            }
          },
          404: { description: "Student not found or not an intern", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/companies/interns/{applicationId}/complete": {
      post: {
        summary: "Mark intern's internship as complete",
        description: "Mark a specific intern's internship as complete. Triggers completion workflow and credit request process.",
        tags: ["Companies", "Companies - Interns", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID", example: "APP-2024050" }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  completionNotes: { type: "string" },
                  performanceRating: { type: "number", minimum: 0, maximum: 10 }
                }
              },
              example: {
                completionNotes: "Excellent performance throughout the internship",
                performanceRating: 9
              }
            }
          }
        },
        responses: {
          200: {
            description: "Internship marked as complete",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship marked as complete for student",
                  data: {
                    completionId: "IC-2024001",
                    studentId: "STU-2024001",
                    completedAt: "2024-08-01T10:00:00Z"
                  }
                }
              }
            }
          },
          400: { description: "Cannot complete - requirements not met", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Application not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/companies/logbooks/{logbookId}/feedback": { 
      post: { 
        summary: "Provide logbook feedback", 
        description: "Provide feedback on a student's logbook entry. Company feedback is visible to student and mentor.",
        tags: ["Companies", "Companies - Interns", "Logbook Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [{ name: "logbookId", in: "path", required: true, schema: { type: "string" }, description: "Logbook ID", example: "LOG-2024001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["feedback"],
                properties: {
                  feedback: { type: "string", minLength: 10, maxLength: 1000 },
                  rating: { type: "number", minimum: 0, maximum: 10 }
                }
              },
              example: {
                feedback: "Great progress this week! Keep up the good work on the authentication module.",
                rating: 8.5
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Feedback saved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Feedback saved successfully",
                  data: { logbookId: "LOG-2024001", feedbackProvidedAt: "2024-06-09T14:00:00Z" }
                }
              }
            }
          },
          404: { description: "Logbook not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/events": { 
      post: { 
        summary: "Create company event", 
        description: "Create an event for students (e.g., tech talks, workshops, hiring drives). Events are visible to students from specified departments.",
        tags: ["Companies"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "date"],
                properties: {
                  title: { type: "string", description: "Event title", example: "Tech Talk: Future of AI in Healthcare" },
                  description: { type: "string", description: "Event description", example: "Join us for an insightful session on how AI is transforming healthcare. Industry experts will share real-world applications and career opportunities." },
                  date: { type: "string", format: "date-time", description: "Event date and time", example: "2024-02-15T14:00:00Z" },
                  targetDepartments: { type: "array", items: { type: "string" }, description: "Target departments", example: ["Computer Science", "Electronics", "Biomedical Engineering"] }
                }
              },
              example: {
                title: "Tech Talk: Future of AI in Healthcare",
                description: "Join us for an insightful session on how AI is transforming healthcare. Industry experts will share real-world applications and career opportunities.",
                date: "2024-02-15T14:00:00Z",
                targetDepartments: ["Computer Science", "Electronics", "Biomedical Engineering"]
              }
            }
          }
        },
        responses: { 
          201: { 
            description: "Event created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Event created successfully",
                  data: {
                    eventId: "EVT-2024001",
                    title: "Tech Talk: Future of AI in Healthcare",
                    date: "2024-02-15T14:00:00Z",
                    createdAt: "2024-01-15T10:00:00Z"
                  }
                }
              }
            }
          },
          400: { 
            description: "Validation error", 
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Validation failed",
                  error: {
                    code: "VALIDATION_ERROR",
                    details: {
                      date: "Event date must be in the future"
                    }
                  }
                }
              } 
            } 
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/challenges": { 
      post: { 
        summary: "Create coding challenge", 
        description: "Create a coding challenge for students to participate in. Challenges can include rewards like internship opportunities, prizes, or certificates.",
        tags: ["Companies"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "deadline"],
                properties: {
                  title: { type: "string", description: "Challenge title", example: "Full Stack Development Challenge" },
                  description: { type: "string", description: "Challenge description and requirements", example: "Build a complete e-commerce application with React frontend and Node.js backend. Must include authentication, product catalog, shopping cart, and payment integration." },
                  rewards: { type: "string", description: "Rewards for winners", example: "Top 3 winners get direct internship offers. All participants receive certificates." },
                  deadline: { type: "string", format: "date-time", description: "Submission deadline", example: "2024-03-01T23:59:59Z" }
                }
              },
              example: {
                title: "Full Stack Development Challenge",
                description: "Build a complete e-commerce application with React frontend and Node.js backend. Must include authentication, product catalog, shopping cart, and payment integration.",
                rewards: "Top 3 winners get direct internship offers. All participants receive certificates.",
                deadline: "2024-03-01T23:59:59Z"
              }
            }
          }
        },
        responses: { 
          201: { 
            description: "Challenge created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Challenge created successfully",
                  data: {
                    challengeId: "CHL-2024001",
                    title: "Full Stack Development Challenge",
                    deadline: "2024-03-01T23:59:59Z",
                    createdAt: "2024-01-15T10:00:00Z"
                  }
                }
              }
            }
          },
          400: { 
            description: "Validation error", 
            content: { 
              "application/json": { 
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Validation failed",
                  error: {
                    code: "VALIDATION_ERROR",
                    details: {
                      deadline: "Deadline must be at least 7 days in the future"
                    }
                  }
                }
              } 
            } 
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Company Analytics (Requirements: 3.6)
    "/companies/analytics": { 
      get: { 
        summary: "Get company analytics with date range filtering", 
        description: "Get comprehensive analytics including application funnel, acceptance rates, intern performance, completion metrics, and trends over time. Supports date range filtering for custom reporting periods.",
        tags: ["Companies", "Companies - Analytics", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics period (YYYY-MM-DD)", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics period (YYYY-MM-DD)", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Company analytics retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    analytics: {
                      period: { from: "2024-01-01", to: "2024-12-31" },
                      internships: {
                        total: 15,
                        active: 3,
                        completed: 8,
                        cancelled: 1
                      },
                      applications: {
                        total: 450,
                        pending: 23,
                        shortlisted: 45,
                        accepted: 35,
                        rejected: 347,
                        conversionRate: 7.8
                      },
                      interns: {
                        active: 12,
                        completed: 28,
                        averageCompletionRate: 93.3,
                        averagePerformanceRating: 8.2
                      },
                      trends: {
                        applicationsPerMonth: [45, 52, 38, 41, 55, 48, 42, 39, 44, 51, 47, 48],
                        acceptanceRatePerMonth: [8.9, 7.7, 7.9, 7.3, 7.3, 8.3, 7.1, 7.7, 6.8, 7.8, 8.5, 8.3]
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid date range", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/companies/analytics/export": { 
      get: { 
        summary: "Export analytics report", 
        description: "Export company analytics report in CSV or PDF format. Includes all metrics from the analytics endpoint formatted for download and sharing.",
        tags: ["Companies", "Companies - Analytics", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "format", in: "query", required: true, schema: { type: "string", enum: ["csv", "pdf"], default: "csv" }, description: "Export format", example: "csv" },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics period", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics period", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Analytics report file generated successfully",
            content: {
              "application/csv": {
                schema: { type: "string", format: "binary" }
              },
              "application/pdf": {
                schema: { type: "string", format: "binary" }
              }
            }
          },
          400: { description: "Invalid parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    
    // Company Reappeal (Requirements: 3.7)
    "/companies/reappeal": {
      post: {
        summary: "Submit reappeal request for blocked company",
        description: "Submit a reappeal request if company is blocked. Requires detailed explanation and optional supporting documents. Subject to cooldown period and rate limiting.",
        tags: ["Companies", "Companies - Reappeal", "Company Verification"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", minLength: 10, maxLength: 2000, description: "Reappeal message explaining why the company should be unblocked" },
                  attachment: { type: "string", format: "binary", description: "Optional supporting document (PDF, JPG, PNG, max 10MB)" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Reappeal submitted successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Reappeal submitted successfully. Admin will review within 5-7 business days.",
                  data: {
                    reappealId: "RA-2024001",
                    submittedAt: "2024-02-20T10:00:00Z",
                    status: "pending_review"
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error or invalid status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Only blocked companies can submit reappeal",
                  error: { code: "INVALID_STATUS" }
                }
              }
            }
          },
          403: {
            description: "Cooldown period active",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Cannot submit reappeal during cooldown period",
                  error: { code: "COOLDOWN_ACTIVE", details: { cooldownEndsAt: "2024-03-01T00:00:00Z" } }
                }
              }
            }
          },
          429: {
            description: "Too many reappeal attempts",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/companies/reappeal/status": {
      get: {
        summary: "Get reappeal status for blocked company",
        description: "Retrieve current reappeal status including submission history, review progress, and cooldown information.",
        tags: ["Companies", "Companies - Reappeal", "Company Verification"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Reappeal status retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    currentStatus: "pending_review",
                    reappeal: {
                      message: "We have addressed all compliance issues...",
                      submittedAt: "2024-02-20T10:00:00Z",
                      reviewedBy: null,
                      reviewedAt: null
                    },
                    cooldownEndsAt: null,
                    canSubmitNewReappeal: false,
                    history: [
                      {
                        submittedAt: "2024-01-15T10:00:00Z",
                        reviewedAt: "2024-01-20T14:00:00Z",
                        decision: "rejected",
                        feedback: "Insufficient evidence of compliance improvements"
                      }
                    ]
                  }
                }
              }
            }
          },
          404: {
            description: "No reappeal found or company not blocked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    
    // Company Completion Management (Requirements: 3.8)
    "/companies/completions/{completionId}/mark-complete": {
      put: {
        summary: "Mark internship completion as complete",
        description: "Mark an internship completion as complete by providing evaluation score and comments. This finalizes the completion process and enables credit request.",
        tags: ["Companies", "Companies - Completions", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "completionId", in: "path", required: true, schema: { type: "string" }, description: "Completion ID", example: "IC-2024001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["evaluationScore", "evaluationComments"],
                properties: {
                  evaluationScore: { type: "number", minimum: 0, maximum: 10, description: "Company evaluation score (0-10)" },
                  evaluationComments: { type: "string", minLength: 10, maxLength: 1000, description: "Company evaluation comments" }
                }
              },
              example: {
                evaluationScore: 9,
                evaluationComments: "Excellent performance throughout the internship. Demonstrated strong technical skills and great teamwork."
              }
            }
          }
        },
        responses: {
          200: {
            description: "Internship completion marked as complete",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Internship completion marked as complete",
                  data: {
                    completionId: "IC-2024001",
                    status: "completed",
                    evaluationScore: 9,
                    completedAt: "2024-08-15T10:00:00Z"
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error or milestones not met",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Cannot mark as complete - not all logbooks approved",
                  error: { code: "MILESTONES_NOT_MET" }
                }
              }
            }
          },
          404: { description: "Completion not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/companies/completions/completed": {
      get: {
        summary: "Get list of completed internships",
        description: "Retrieve paginated list of all completed internships with student information and completion details.",
        tags: ["Companies", "Companies - Completions", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Items per page", example: 10 }
        ],
        responses: {
          200: {
            description: "List of completed internships retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    completions: [
                      {
                        completionId: "IC-2024001",
                        studentId: "STU-2024001",
                        studentName: "Rahul Sharma",
                        internshipId: "INT-2024050",
                        internshipTitle: "Full Stack Developer Intern",
                        startDate: "2024-06-01",
                        endDate: "2024-08-01",
                        evaluationScore: 9,
                        completedAt: "2024-08-15T10:00:00Z"
                      }
                    ],
                    pagination: { currentPage: 1, totalPages: 3, totalItems: 28 }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },

    // ==================== MENTOR ROUTES ====================
    // Mentor Dashboard and Overview (Requirements: 4.1, 4.5)
    "/mentors/dashboard": { 
      get: { 
        summary: "Get mentor dashboard with overview metrics", 
        description: "Retrieve mentor dashboard showing pending approvals, supervised students, and key metrics including approval rates and response times",
        tags: ["Mentors", "Mentors - Dashboard"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "Dashboard data with metrics and pending items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        pendingInternships: { type: "integer", example: 5, description: "Count of internships awaiting approval" },
                        pendingApplications: { type: "integer", example: 12, description: "Count of applications awaiting review" },
                        pendingLogbooks: { type: "integer", example: 8, description: "Count of logbooks awaiting review" },
                        pendingCreditRequests: { type: "integer", example: 3, description: "Count of credit requests awaiting review" },
                        assignedStudents: { type: "integer", example: 25, description: "Total students assigned to mentor" },
                        activeInternships: { type: "integer", example: 18, description: "Students currently in internships" },
                        metrics: {
                          type: "object",
                          properties: {
                            approvalRate: { type: "number", example: 0.92, description: "Percentage of approvals vs rejections" },
                            averageResponseTime: { type: "number", example: 2.5, description: "Average response time in days" },
                            studentsSupervised: { type: "integer", example: 45, description: "Total students supervised" }
                          }
                        }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Successful dashboard retrieval",
                    value: {
                      success: true,
                      data: {
                        pendingInternships: 5,
                        pendingApplications: 12,
                        pendingLogbooks: 8,
                        pendingCreditRequests: 3,
                        assignedStudents: 25,
                        activeInternships: 18,
                        metrics: {
                          approvalRate: 0.92,
                          averageResponseTime: 2.5,
                          studentsSupervised: 45
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { 
            description: "Unauthorized - Invalid or missing token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          },
          403: { 
            description: "Forbidden - Not a mentor",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
          }
        } 
      } 
    },

    "/mentors/students": { 
      get: { 
        summary: "Get list of assigned students (legacy endpoint)", 
        description: "Retrieve all students assigned to the mentor. Use /mentors/students/list for advanced filtering.",
        tags: ["Mentors", "Mentors - Student Management"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "List of assigned students",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Student" }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },
    
    // Application Review Endpoints (Requirements: 4.1, 4.2)
    "/mentors/applications/pending": { 
      get: { 
        summary: "Get pending applications for review", 
        description: "Retrieve all applications from assigned students that are pending mentor approval. Applications must be reviewed before companies can shortlist candidates.",
        tags: ["Mentors", "Mentors - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number for pagination" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Number of items per page" },
          { name: "sortBy", in: "query", schema: { type: "string", default: "appliedAt", enum: ["appliedAt", "studentName", "internshipTitle"] }, description: "Field to sort by" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order" }
        ],
        responses: { 
          200: { 
            description: "List of pending applications",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        applications: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Application" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Pending applications list",
                    value: {
                      success: true,
                      data: {
                        applications: [
                          {
                            applicationId: "APP-2024-001",
                            studentId: "STU-2024-001",
                            studentName: "Rahul Sharma",
                            internshipId: "INT-2024-001",
                            internshipTitle: "Full Stack Development Intern",
                            companyName: "Tech Solutions Pvt Ltd",
                            status: "pending",
                            appliedAt: "2024-12-01T10:30:00Z",
                            coverLetter: "I am excited to apply for this position...",
                            matchScore: 0.85
                          }
                        ],
                        pagination: {
                          currentPage: 1,
                          totalPages: 3,
                          totalItems: 12,
                          itemsPerPage: 20,
                          hasNextPage: true,
                          hasPrevPage: false
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/applications/{applicationId}": { 
      get: { 
        summary: "Get application details for review", 
        description: "Retrieve complete application details including student profile, internship information, and AI match analysis",
        tags: ["Mentors", "Mentors - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID", example: "APP-2024-001" }
        ],
        responses: { 
          200: { 
            description: "Application details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Application" },
                examples: {
                  success: {
                    summary: "Complete application details",
                    value: {
                      applicationId: "APP-2024-001",
                      studentId: "STU-2024-001",
                      internshipId: "INT-2024-001",
                      status: "pending",
                      coverLetter: "I am excited to apply for this Full Stack Development position...",
                      resumeUrl: "https://storage.example.com/resumes/rahul-sharma.pdf",
                      appliedAt: "2024-12-01T10:30:00Z",
                      student: {
                        name: "Rahul Sharma",
                        email: "rahul.sharma@college.edu",
                        department: "Computer Science",
                        year: 3,
                        skills: ["React", "Node.js", "MongoDB", "Express"],
                        readinessScore: 0.82
                      },
                      internship: {
                        title: "Full Stack Development Intern",
                        company: "Tech Solutions Pvt Ltd",
                        department: "Computer Science",
                        duration: 12,
                        stipend: 15000,
                        requiredSkills: ["React", "Node.js", "REST APIs"]
                      },
                      aiAnalysis: {
                        matchScore: 0.85,
                        skillsMatch: ["React", "Node.js"],
                        skillsGap: ["Docker", "AWS"],
                        recommendation: "Strong candidate with relevant skills"
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Application not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/applications/{applicationId}/approve": { 
      post: { 
        summary: "Approve student application", 
        description: "Approve application allowing it to proceed to company review (transitions status from 'pending' to 'mentor_approved')",
        tags: ["Mentors", "Mentors - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID", example: "APP-2024-001" }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  feedback: { type: "string", description: "Optional feedback for student", example: "Good application. Make sure to highlight your project experience in the interview." }
                }
              },
              examples: {
                withFeedback: {
                  summary: "Approval with feedback",
                  value: {
                    feedback: "Excellent application. Your skills align well with the internship requirements."
                  }
                },
                withoutFeedback: {
                  summary: "Approval without feedback",
                  value: {}
                }
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Application approved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Application approved successfully" },
                    data: {
                      type: "object",
                      properties: {
                        applicationId: { type: "string", example: "APP-2024-001" },
                        status: { type: "string", example: "mentor_approved" },
                        approvedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid state transition", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Application not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/applications/{applicationId}/reject": { 
      post: { 
        summary: "Reject student application", 
        description: "Reject application with feedback (transitions status to 'rejected'). Student will be notified with the rejection reason.",
        tags: ["Mentors", "Mentors - Applications", "Application Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "applicationId", in: "path", required: true, schema: { type: "string" }, description: "Application ID", example: "APP-2024-001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: { type: "string", description: "Reason for rejection", example: "Skills do not match internship requirements. Please complete the recommended courses before applying." }
                }
              },
              examples: {
                skillGap: {
                  summary: "Rejection due to skill gap",
                  value: {
                    reason: "Your current skill set does not align with the internship requirements. I recommend completing courses in React and Node.js before applying."
                  }
                },
                readiness: {
                  summary: "Rejection due to readiness",
                  value: {
                    reason: "Please improve your readiness score by completing more learning modules before applying for internships."
                  }
                }
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Application rejected successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Application rejected" },
                    data: {
                      type: "object",
                      properties: {
                        applicationId: { type: "string", example: "APP-2024-001" },
                        status: { type: "string", example: "rejected" },
                        rejectedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Missing rejection reason", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Application not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    // Logbook Review Endpoints (Requirements: 4.3)
    "/mentors/logbooks/pending": { 
      get: { 
        summary: "Get pending logbooks for review", 
        description: "Retrieve all logbook entries from supervised students that are pending mentor review",
        tags: ["Mentors", "Mentors - Logbooks", "Logbook Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" },
          { name: "studentId", in: "query", schema: { type: "string" }, description: "Filter by student ID" },
          { name: "internshipId", in: "query", schema: { type: "string" }, description: "Filter by internship ID" }
        ],
        responses: { 
          200: { 
            description: "List of pending logbooks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        logbooks: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Logbook" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },

    "/mentors/logbooks/{logbookId}": { 
      get: { 
        summary: "Get logbook details for review", 
        description: "Retrieve complete logbook entry with activities, learnings, and AI-generated summary",
        tags: ["Mentors", "Mentors - Logbooks", "Logbook Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "logbookId", in: "path", required: true, schema: { type: "string" }, description: "Logbook ID", example: "LOG-2024-001" }
        ],
        responses: { 
          200: { 
            description: "Logbook details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Logbook" },
                examples: {
                  success: {
                    summary: "Complete logbook entry",
                    value: {
                      logbookId: "LOG-2024-001",
                      studentId: "STU-2024-001",
                      internshipId: "INT-2024-001",
                      weekNumber: 3,
                      startDate: "2024-11-18",
                      endDate: "2024-11-24",
                      hoursWorked: 40,
                      activities: "Developed REST API endpoints for user authentication. Implemented JWT token validation. Wrote unit tests for authentication service.",
                      tasksCompleted: ["User login API", "Token refresh endpoint", "Password reset flow"],
                      skillsUsed: ["Node.js", "Express", "JWT", "MongoDB"],
                      challenges: "Faced issues with token expiration handling",
                      learnings: "Learned about JWT best practices and secure token storage",
                      status: "submitted",
                      aiSummary: {
                        summary: "Strong progress on authentication module with good testing practices",
                        keySkillsDemonstrated: ["Backend Development", "API Design", "Security"],
                        progressIndicators: ["On track", "Good code quality"]
                      },
                      submittedAt: "2024-11-25T18:00:00Z"
                    }
                  }
                }
              }
            }
          },
          404: { description: "Logbook not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/logbooks/{logbookId}/approve": { 
      post: { 
        summary: "Approve logbook entry", 
        description: "Approve logbook entry (transitions status to 'approved'). Student can proceed with next week's entry.",
        tags: ["Mentors", "Mentors - Logbooks", "Logbook Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "logbookId", in: "path", required: true, schema: { type: "string" }, description: "Logbook ID", example: "LOG-2024-001" }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  feedback: { type: "string", description: "Optional feedback for student", example: "Excellent progress this week. Keep up the good work!" }
                }
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Logbook approved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Logbook approved" },
                    data: {
                      type: "object",
                      properties: {
                        logbookId: { type: "string", example: "LOG-2024-001" },
                        status: { type: "string", example: "approved" }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Logbook not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/logbooks/{logbookId}/revision": { 
      post: { 
        summary: "Request logbook revision", 
        description: "Request revision of logbook entry with specific feedback (transitions status to 'revision_requested'). Student must resubmit with improvements.",
        tags: ["Mentors", "Mentors - Logbooks", "Logbook Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "logbookId", in: "path", required: true, schema: { type: "string" }, description: "Logbook ID", example: "LOG-2024-001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["feedback"],
                properties: {
                  feedback: { type: "string", description: "Specific feedback on what needs improvement", example: "Please provide more details about the challenges faced and how you resolved them. Also include specific code examples." }
                }
              },
              examples: {
                insufficientDetail: {
                  summary: "Request more detail",
                  value: {
                    feedback: "Please provide more details about your activities. Include specific tasks completed and technologies used."
                  }
                },
                missingLearnings: {
                  summary: "Request learning reflection",
                  value: {
                    feedback: "Please elaborate on what you learned this week and how it relates to your coursework."
                  }
                }
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Revision requested successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Revision requested" },
                    data: {
                      type: "object",
                      properties: {
                        logbookId: { type: "string", example: "LOG-2024-001" },
                        status: { type: "string", example: "revision_requested" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Missing feedback", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Logbook not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    // Mentor Internship Approval Endpoints (Requirements: 4.1)
    "/mentors/internships/pending": { 
      get: { 
        summary: "List pending internships for mentor approval", 
        description: "Get admin-approved internships awaiting mentor approval for their department",
        tags: ["Mentors", "Internship Approval", "Internship Lifecycle"], 
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
        tags: ["Mentors", "Internship Approval", "Internship Lifecycle"], 
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
        tags: ["Mentors", "Internship Approval", "Internship Lifecycle"], 
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
        tags: ["Mentors", "Internship Approval", "Internship Lifecycle"], 
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
        description: "Get analytics for mentor including approval rates, student supervision metrics, and performance trends over time",
        tags: ["Mentors", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Mentor analytics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        period: {
                          type: "object",
                          properties: {
                            from: { type: "string", format: "date", example: "2024-01-01" },
                            to: { type: "string", format: "date", example: "2024-12-31" }
                          }
                        },
                        studentsSupervised: { type: "integer", example: 18 },
                        internshipsApproved: { type: "integer", example: 45 },
                        internshipsRejected: { type: "integer", example: 8 },
                        approvalRate: { type: "number", example: 0.849, description: "Percentage of internships approved" },
                        averageResponseTime: { type: "number", example: 1.8, description: "Average response time in days" },
                        logbooksReviewed: { type: "integer", example: 156 },
                        creditRequestsReviewed: { type: "integer", example: 12 },
                        studentPerformance: {
                          type: "object",
                          properties: {
                            averageReadinessScore: { type: "number", example: 78.5 },
                            placementRate: { type: "number", example: 0.83 },
                            averageCreditsEarned: { type: "number", example: 6.5 }
                          }
                        },
                        trends: {
                          type: "object",
                          properties: {
                            approvalsPerMonth: { type: "array", items: { type: "integer" }, example: [4, 5, 3, 4, 6, 5, 4, 3, 4, 5, 4, 3] },
                            responseTimePerMonth: { type: "array", items: { type: "number" }, example: [2.1, 1.9, 1.7, 1.8, 1.6, 1.9, 1.8, 1.7, 1.9, 1.8, 1.7, 1.8] }
                          }
                        }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    period: { from: "2024-01-01", to: "2024-12-31" },
                    studentsSupervised: 18,
                    internshipsApproved: 45,
                    internshipsRejected: 8,
                    approvalRate: 0.849,
                    averageResponseTime: 1.8,
                    logbooksReviewed: 156,
                    creditRequestsReviewed: 12,
                    studentPerformance: {
                      averageReadinessScore: 78.5,
                      placementRate: 0.83,
                      averageCreditsEarned: 6.5
                    },
                    trends: {
                      approvalsPerMonth: [4, 5, 3, 4, 6, 5, 4, 3, 4, 5, 4, 3],
                      responseTimePerMonth: [2.1, 1.9, 1.7, 1.8, 1.6, 1.9, 1.8, 1.7, 1.9, 1.8, 1.7, 1.8]
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid date range",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid date range: dateFrom must be before dateTo",
                  error: { code: "INVALID_DATE_RANGE" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/mentors/analytics/department": { 
      get: { 
        summary: "Get department-wide analytics", 
        description: "Retrieve analytics for the mentor's entire department including placement rates, internship completion, and student readiness metrics",
        tags: ["Mentors", "Mentors - Analytics", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Department analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        department: { type: "string", example: "Computer Science" },
                        studentsPlaced: { type: "integer", example: 102 },
                        averageStipend: { type: "number", example: 12500 },
                        topCompanies: { type: "array", items: { type: "string" }, example: ["Tech Solutions", "Analytics Corp", "Cloud Systems"] },
                        internshipCompletionRate: { type: "number", example: 0.92 }
                      }
                    }
                  }
                }
              }
            }
          } 
        } 
      } 
    },

    
    // Credit Request Review Endpoints (Requirements: 4.4)
    "/mentors/credits/pending": { 
      get: { 
        summary: "Get pending credit requests (legacy endpoint)", 
        description: "Retrieve credit requests awaiting mentor review. Use /:mentorId/credit-requests/pending for new implementation.",
        tags: ["Mentors", "Mentors - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "List of pending credit requests",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CreditRequest" }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },

    "/mentors/credits/{requestId}/decide": { 
      post: { 
        summary: "Approve or reject credit request (legacy endpoint)", 
        description: "Make decision on credit request. Use /:mentorId/credit-requests/:requestId/review for new implementation.",
        tags: ["Mentors", "Mentors - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit Request ID" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["approve", "reject"], description: "Approval decision" },
                  feedback: { type: "string", description: "Feedback for student" }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: "Decision recorded" },
          400: { description: "Invalid decision", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/{mentorId}/credit-requests/pending": { 
      get: { 
        summary: "Get pending credit requests for mentor review", 
        description: "Retrieve all credit requests from supervised students that are pending mentor review with pagination and filtering",
        tags: ["Mentors", "Mentors - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "mentorId", in: "path", required: true, schema: { type: "string" }, description: "Mentor ID", example: "MEN-2024-001" },
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Items per page" },
          { name: "sortBy", in: "query", schema: { type: "string", default: "requestedAt", enum: ["requestedAt", "status", "studentId"] }, description: "Sort field" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order" }
        ],
        responses: { 
          200: { 
            description: "List of pending credit requests",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        creditRequests: {
                          type: "array",
                          items: { $ref: "#/components/schemas/CreditRequest" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Pending credit requests",
                    value: {
                      success: true,
                      data: {
                        creditRequests: [
                          {
                            requestId: "CR-2024-001",
                            studentId: "STU-2024-001",
                            studentName: "Priya Patel",
                            internshipId: "INT-2024-001",
                            internshipTitle: "Data Science Intern at Analytics Corp",
                            creditsRequested: 12,
                            status: "pending",
                            requestedAt: "2024-12-01T10:00:00Z",
                            documents: {
                              completionCertificate: "https://storage.example.com/certificates/cert-001.pdf",
                              logbookSummary: "https://storage.example.com/logbooks/summary-001.pdf",
                              companyEvaluation: "https://storage.example.com/evaluations/eval-001.pdf",
                              finalReport: "https://storage.example.com/reports/report-001.pdf"
                            }
                          }
                        ],
                        pagination: {
                          currentPage: 1,
                          totalPages: 1,
                          totalItems: 3,
                          itemsPerPage: 20,
                          hasNextPage: false,
                          hasPrevPage: false
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden - Not authorized to view these requests", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/{mentorId}/credit-requests/{requestId}": { 
      get: { 
        summary: "Get credit request details for review", 
        description: "Retrieve complete credit request details including all documents, internship completion data, and student performance metrics",
        tags: ["Mentors", "Mentors - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "mentorId", in: "path", required: true, schema: { type: "string" }, description: "Mentor ID", example: "MEN-2024-001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit Request ID", example: "CR-2024-001" }
        ],
        responses: { 
          200: { 
            description: "Credit request details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreditRequest" },
                examples: {
                  success: {
                    summary: "Complete credit request details",
                    value: {
                      requestId: "CR-2024-001",
                      studentId: "STU-2024-001",
                      internshipId: "INT-2024-001",
                      creditsRequested: 12,
                      status: "mentor_reviewing",
                      requestedAt: "2024-12-01T10:00:00Z",
                      student: {
                        name: "Priya Patel",
                        email: "priya.patel@college.edu",
                        department: "Computer Science",
                        rollNumber: "CS2021001"
                      },
                      internship: {
                        title: "Data Science Intern",
                        company: "Analytics Corp",
                        duration: 12,
                        completedAt: "2024-11-30T00:00:00Z"
                      },
                      documents: {
                        completionCertificate: "https://storage.example.com/certificates/cert-001.pdf",
                        logbookSummary: "https://storage.example.com/logbooks/summary-001.pdf",
                        companyEvaluation: "https://storage.example.com/evaluations/eval-001.pdf",
                        finalReport: "https://storage.example.com/reports/report-001.pdf"
                      },
                      performanceMetrics: {
                        logbooksSubmitted: 12,
                        logbooksApproved: 12,
                        averageRating: 4.5,
                        attendanceRate: 0.98
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Credit request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/{mentorId}/credit-requests/{requestId}/review": { 
      post: { 
        summary: "Submit mentor review for credit request", 
        description: "Approve or reject credit request with detailed feedback and quality criteria assessment. Approved requests proceed to admin review.",
        tags: ["Mentors", "Mentors - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "mentorId", in: "path", required: true, schema: { type: "string" }, description: "Mentor ID", example: "MEN-2024-001" },
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit Request ID", example: "CR-2024-001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { 
                    type: "string", 
                    enum: ["approved", "rejected"], 
                    description: "Review decision" 
                  },
                  feedback: { 
                    type: "string", 
                    description: "Detailed feedback (required when rejecting)",
                    example: "All logbooks are complete and demonstrate strong learning outcomes. Company evaluation is excellent."
                  },
                  qualityCriteria: {
                    type: "object",
                    description: "Quality assessment criteria",
                    properties: {
                      logbookComplete: { type: "boolean", description: "All logbooks submitted and approved" },
                      reportQuality: { type: "boolean", description: "Final report meets quality standards" },
                      learningOutcomes: { type: "boolean", description: "Learning outcomes achieved" },
                      companyEvaluation: { type: "boolean", description: "Company evaluation is positive" }
                    }
                  }
                }
              },
              examples: {
                approval: {
                  summary: "Approve credit request",
                  value: {
                    decision: "approved",
                    feedback: "Excellent internship completion. All requirements met with high quality work.",
                    qualityCriteria: {
                      logbookComplete: true,
                      reportQuality: true,
                      learningOutcomes: true,
                      companyEvaluation: true
                    }
                  }
                },
                rejection: {
                  summary: "Reject credit request",
                  value: {
                    decision: "rejected",
                    feedback: "Logbook entries are incomplete. Please ensure all 12 weeks are documented with sufficient detail.",
                    qualityCriteria: {
                      logbookComplete: false,
                      reportQuality: true,
                      learningOutcomes: true,
                      companyEvaluation: true
                    }
                  }
                }
              }
            }
          }
        },
        responses: { 
          200: { 
            description: "Review submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Credit request review submitted" },
                    data: {
                      type: "object",
                      properties: {
                        requestId: { type: "string", example: "CR-2024-001" },
                        status: { type: "string", example: "mentor_approved" },
                        reviewedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid review data or missing required feedback", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Credit request not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    "/mentors/{mentorId}/credit-requests/history": { 
      get: { 
        summary: "Get mentor's credit review history", 
        description: "Retrieve all credit requests reviewed by the mentor with filtering by status and date range",
        tags: ["Mentors", "Mentors - Credits", "Credit Transfer Flow"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "mentorId", in: "path", required: true, schema: { type: "string" }, description: "Mentor ID", example: "MEN-2024-001" },
          { name: "status", in: "query", schema: { type: "string", enum: ["mentor_approved", "mentor_rejected", "admin_approved", "admin_rejected", "completed"] }, description: "Filter by status" },
          { name: "dateRange", in: "query", schema: { type: "string" }, description: "Date range filter (startDate,endDate)", example: "2024-01-01,2024-12-31" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" }
        ],
        responses: { 
          200: { 
            description: "Review history",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        reviews: {
                          type: "array",
                          items: { $ref: "#/components/schemas/CreditRequest" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },

    "/mentors/{mentorId}/credit-requests/analytics": { 
      get: { 
        summary: "Get mentor credit review analytics", 
        description: "Retrieve analytics on mentor's credit review performance including approval rates, average review time, and trends",
        tags: ["Mentors", "Mentors - Credits", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "mentorId", in: "path", required: true, schema: { type: "string" }, description: "Mentor ID", example: "MEN-2024-001" },
          { name: "dateRange", in: "query", schema: { type: "string" }, description: "Date range filter (startDate,endDate)", example: "2024-01-01,2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Credit review analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalReviewed: { type: "integer", example: 45, description: "Total credit requests reviewed" },
                        approved: { type: "integer", example: 38, description: "Number approved" },
                        rejected: { type: "integer", example: 7, description: "Number rejected" },
                        approvalRate: { type: "number", example: 0.84, description: "Approval rate percentage" },
                        averageReviewTime: { type: "number", example: 3.2, description: "Average review time in days" },
                        pendingCount: { type: "integer", example: 5, description: "Currently pending reviews" }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Credit review analytics",
                    value: {
                      success: true,
                      data: {
                        totalReviewed: 45,
                        approved: 38,
                        rejected: 7,
                        approvalRate: 0.84,
                        averageReviewTime: 3.2,
                        pendingCount: 5
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },

    // Intervention and Skill Gap Analysis Endpoints (Requirements: 4.5, 4.6)
    "/mentors/interventions": {
      get: { 
        summary: "Get all interventions created by mentor", 
        description: "Retrieve list of all interventions (workshops, skill development programs) created by the mentor",
        tags: ["Mentors", "Mentors - Interventions"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["planned", "active", "completed"] }, description: "Filter by status" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" }
        ],
        responses: { 
          200: { 
            description: "List of interventions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          interventionId: { type: "string", example: "INT-2024-001" },
                          title: { type: "string", example: "React Fundamentals Workshop" },
                          description: { type: "string", example: "Intensive workshop covering React basics for students with skill gaps" },
                          targetStudents: { type: "array", items: { type: "string" }, example: ["STU-2024-001", "STU-2024-002"] },
                          modules: { type: "array", items: { type: "string" }, example: ["React Basics", "Component Lifecycle", "State Management"] },
                          status: { type: "string", enum: ["planned", "active", "completed"], example: "active" },
                          metrics: {
                            type: "object",
                            properties: {
                              engagementRate: { type: "number", example: 0.85 },
                              completionRate: { type: "number", example: 0.72 }
                            }
                          },
                          createdAt: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      },
      post: { 
        summary: "Create new intervention", 
        description: "Create a new intervention program to address skill gaps or support struggling students",
        tags: ["Mentors", "Mentors - Interventions"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "targetStudents", "modules"],
                properties: {
                  title: { type: "string", example: "React Fundamentals Workshop" },
                  description: { type: "string", example: "Intensive workshop covering React basics" },
                  targetStudents: { type: "array", items: { type: "string" }, example: ["STU-2024-001", "STU-2024-002"] },
                  modules: { type: "array", items: { type: "string" }, example: ["React Basics", "Component Lifecycle"] }
                }
              },
              examples: {
                skillGapWorkshop: {
                  summary: "Skill gap workshop",
                  value: {
                    title: "Full Stack Development Bootcamp",
                    description: "Comprehensive bootcamp for students lacking full stack skills",
                    targetStudents: ["STU-2024-001", "STU-2024-002", "STU-2024-003"],
                    modules: ["HTML/CSS", "JavaScript", "React", "Node.js", "MongoDB"]
                  }
                }
              }
            }
          }
        },
        responses: { 
          201: { 
            description: "Intervention created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Intervention created" },
                    data: {
                      type: "object",
                      properties: {
                        interventionId: { type: "string", example: "INT-2024-001" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid intervention data", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },

    "/mentors/skill-gaps": { 
      get: { 
        summary: "Get skill gap analysis for supervised students", 
        description: "Retrieve AI-powered skill gap analysis showing which students need additional support and in which areas",
        tags: ["Mentors", "Mentors - Analytics", "AI Services"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "department", in: "query", schema: { type: "string" }, description: "Filter by department" },
          { name: "severity", in: "query", schema: { type: "string", enum: ["high", "medium", "low"] }, description: "Filter by gap severity" }
        ],
        responses: { 
          200: { 
            description: "Skill gap analysis",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        overallGaps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              skill: { type: "string", example: "React" },
                              studentsAffected: { type: "integer", example: 8 },
                              severity: { type: "string", enum: ["high", "medium", "low"], example: "high" }
                            }
                          }
                        },
                        studentGaps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              studentId: { type: "string", example: "STU-2024-001" },
                              studentName: { type: "string", example: "Rahul Sharma" },
                              gaps: { type: "array", items: { type: "string" }, example: ["React", "Node.js"] },
                              recommendedActions: { type: "array", items: { type: "string" }, example: ["Complete React course", "Join Full Stack workshop"] }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Skill gap analysis results",
                    value: {
                      success: true,
                      data: {
                        overallGaps: [
                          { skill: "React", studentsAffected: 8, severity: "high" },
                          { skill: "Node.js", studentsAffected: 5, severity: "medium" }
                        ],
                        studentGaps: [
                          {
                            studentId: "STU-2024-001",
                            studentName: "Rahul Sharma",
                            gaps: ["React", "Node.js"],
                            recommendedActions: ["Complete React Fundamentals course", "Join Full Stack workshop"]
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },

    "/mentors/department/performance": { 
      get: { 
        summary: "Get department performance metrics", 
        description: "Retrieve performance metrics for the mentor's department including placement rates, average internship completion, and student readiness",
        tags: ["Mentors", "Mentors - Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Department performance metrics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        department: { type: "string", example: "Computer Science" },
                        totalStudents: { type: "integer", example: 120 },
                        activeInternships: { type: "integer", example: 45 },
                        completedInternships: { type: "integer", example: 78 },
                        placementRate: { type: "number", example: 0.85, description: "Percentage of students placed" },
                        averageReadinessScore: { type: "number", example: 0.78 },
                        creditsAwarded: { type: "integer", example: 936 },
                        topSkills: { type: "array", items: { type: "string" }, example: ["React", "Node.js", "Python", "Machine Learning"] }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Department performance",
                    value: {
                      success: true,
                      data: {
                        department: "Computer Science",
                        totalStudents: 120,
                        activeInternships: 45,
                        completedInternships: 78,
                        placementRate: 0.85,
                        averageReadinessScore: 0.78,
                        creditsAwarded: 936,
                        topSkills: ["React", "Node.js", "Python", "Machine Learning"]
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },

    "/mentors/students/{studentId}/progress": { 
      get: { 
        summary: "Get detailed student progress tracking", 
        description: "Retrieve comprehensive progress tracking for a specific student including internship performance, logbook submissions, and skill development",
        tags: ["Mentors", "Mentors - Student Management"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "studentId", in: "path", required: true, schema: { type: "string" }, description: "Student ID", example: "STU-2024-001" }
        ],
        responses: { 
          200: { 
            description: "Student progress details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        studentId: { type: "string", example: "STU-2024-001" },
                        studentName: { type: "string", example: "Rahul Sharma" },
                        currentInternship: {
                          type: "object",
                          properties: {
                            internshipId: { type: "string" },
                            title: { type: "string" },
                            company: { type: "string" },
                            startDate: { type: "string", format: "date" },
                            progress: { type: "number", example: 0.65, description: "Completion percentage" }
                          }
                        },
                        logbookStatus: {
                          type: "object",
                          properties: {
                            submitted: { type: "integer", example: 8 },
                            approved: { type: "integer", example: 7 },
                            pending: { type: "integer", example: 1 },
                            revisionRequested: { type: "integer", example: 0 }
                          }
                        },
                        skillsDeveloped: { type: "array", items: { type: "string" }, example: ["React", "Node.js", "MongoDB"] },
                        readinessScore: { type: "number", example: 0.82 },
                        creditsEarned: { type: "integer", example: 12 },
                        alerts: { type: "array", items: { type: "string" }, example: ["Logbook submission overdue"] }
                      }
                    }
                  }
                },
                examples: {
                  success: {
                    summary: "Student progress tracking",
                    value: {
                      success: true,
                      data: {
                        studentId: "STU-2024-001",
                        studentName: "Rahul Sharma",
                        currentInternship: {
                          internshipId: "INT-2024-001",
                          title: "Full Stack Development Intern",
                          company: "Tech Solutions Pvt Ltd",
                          startDate: "2024-09-01",
                          progress: 0.65
                        },
                        logbookStatus: {
                          submitted: 8,
                          approved: 7,
                          pending: 1,
                          revisionRequested: 0
                        },
                        skillsDeveloped: ["React", "Node.js", "MongoDB", "Express"],
                        readinessScore: 0.82,
                        creditsEarned: 12,
                        alerts: []
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Student not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },


    // ==================== ADMIN ROUTES ====================
    
    // Admin Dashboard
    "/admins/dashboard": { 
      get: { 
        summary: "Get admin dashboard overview", 
        description: "Get comprehensive dashboard with system statistics, pending verifications, and recent activities",
        tags: ["Admin"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "Dashboard data with system overview",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        stats: {
                          type: "object",
                          properties: {
                            totalStudents: { type: "integer", example: 1250 },
                            totalCompanies: { type: "integer", example: 85 },
                            totalMentors: { type: "integer", example: 45 },
                            activeInternships: { type: "integer", example: 120 },
                            pendingVerifications: { type: "integer", example: 12 },
                            pendingCreditRequests: { type: "integer", example: 28 }
                          }
                        },
                        recentActivities: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: { type: "string", example: "company_verification" },
                              description: { type: "string", example: "Tech Corp verified" },
                              timestamp: { type: "string", format: "date-time" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized - Invalid or missing token" },
          403: { description: "Forbidden - Admin access required" }
        } 
      } 
    },
    
    // Company Verification Endpoints
    "/admins/companies/pending": { 
      get: { 
        summary: "Get pending company verifications", 
        description: "List all companies awaiting verification with filtering and pagination",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Items per page", example: 20 },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "companyName"], default: "createdAt" }, description: "Sort field", example: "createdAt" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: { 
          200: { 
            description: "List of pending companies",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        companies: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Company" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Admin access required" }
        } 
      } 
    },
    "/admins/companies": { 
      get: { 
        summary: "Get all companies with filtering", 
        description: "List all companies with status filtering, search, and pagination",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending_verification", "verified", "rejected", "suspended", "blocked", "reappeal"] }, description: "Filter by verification status", example: "verified" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by company name or email", example: "Tech" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: { 
          200: { 
            description: "List of companies",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        companies: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Company" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },
    "/admins/companies/{companyId}": { 
      get: { 
        summary: "Get company details", 
        description: "Get complete company profile including verification documents and history",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        responses: { 
          200: { 
            description: "Company details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Company" }
                  }
                }
              }
            }
          },
          404: { description: "Company not found" }
        } 
      } 
    },
    "/admins/companies/{companyId}/verify": { 
      post: { 
        summary: "Verify company", 
        description: "Approve company verification (transitions status from pending_verification to verified)",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        requestBody: { 
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                properties: { 
                  comments: { type: "string", description: "Optional verification comments", example: "All documents verified successfully" } 
                } 
              },
              example: {
                comments: "All documents verified. Company meets all requirements."
              }
            } 
          } 
        },
        responses: { 
          200: { 
            description: "Company verified successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Company verified successfully" },
                    data: { $ref: "#/components/schemas/Company" }
                  }
                }
              }
            }
          },
          400: { description: "Invalid state transition" },
          404: { description: "Company not found" }
        } 
      } 
    },
    "/admins/companies/{companyId}/reject": { 
      post: { 
        summary: "Reject company verification", 
        description: "Reject company verification with reasons (transitions status to rejected)",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                required: ["reason"],
                properties: { 
                  reason: { type: "string", description: "Rejection reason", example: "Invalid CIN number" },
                  comments: { type: "string", description: "Additional comments", example: "Please provide valid CIN certificate" }
                } 
              },
              example: {
                reason: "Invalid CIN number",
                comments: "The CIN number provided does not match MCA records. Please verify and resubmit."
              }
            } 
          } 
        },
        responses: { 
          200: { 
            description: "Company rejected",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Company verification rejected" }
                  }
                }
              }
            }
          },
          400: { description: "Missing rejection reason" },
          404: { description: "Company not found" }
        } 
      } 
    },
    "/admins/companies/{companyId}/block": { 
      post: { 
        summary: "Block company", 
        description: "Block company for policy violations (prevents all activities)",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                required: ["reason"],
                properties: { 
                  reason: { type: "string", description: "Block reason", example: "Multiple policy violations" },
                  comments: { type: "string", description: "Additional details", example: "Repeated fake internship postings" }
                } 
              },
              example: {
                reason: "Multiple policy violations",
                comments: "Company has posted fake internships multiple times despite warnings."
              }
            } 
          } 
        },
        responses: { 
          200: { 
            description: "Company blocked",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Company blocked successfully" }
                  }
                }
              }
            }
          },
          400: { description: "Missing block reason" },
          404: { description: "Company not found" }
        } 
      } 
    },
    "/admins/companies/{companyId}/suspend": { 
      post: { 
        summary: "Suspend company", 
        description: "Temporarily suspend company (can be reversed)",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                required: ["reason"],
                properties: { 
                  reason: { type: "string", description: "Suspension reason", example: "Under investigation" },
                  duration: { type: "integer", description: "Suspension duration in days", example: 30 },
                  comments: { type: "string", description: "Additional details" }
                } 
              },
              example: {
                reason: "Under investigation for reported issues",
                duration: 30,
                comments: "Temporary suspension pending investigation of student complaints."
              }
            } 
          } 
        },
        responses: { 
          200: { 
            description: "Company suspended",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Company suspended successfully" }
                  }
                }
              }
            }
          },
          400: { description: "Missing suspension reason" },
          404: { description: "Company not found" }
        } 
      } 
    },
    
    // Reappeal Endpoints
    "/admins/reappeals": { 
      get: { 
        summary: "Get all reappeal requests", 
        description: "List all reappeal requests from blocked companies with filtering",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "approved", "rejected"] }, description: "Filter by reappeal status", example: "pending" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: { 
          200: { 
            description: "List of reappeal requests",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        reappeals: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              companyId: { type: "string", example: "COM-2024001" },
                              companyName: { type: "string", example: "Tech Corp" },
                              message: { type: "string", example: "We have addressed all policy violations..." },
                              attachment: { type: "string", format: "uri" },
                              submittedAt: { type: "string", format: "date-time" },
                              blockReason: { type: "string", example: "Policy violations" }
                            }
                          }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      } 
    },
    "/admins/reappeals/{companyId}/approve": { 
      post: { 
        summary: "Approve reappeal request", 
        description: "Approve company reappeal and restore verified status",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        requestBody: { 
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                properties: { 
                  feedback: { type: "string", description: "Approval feedback", example: "Reappeal approved. Company can resume operations." } 
                } 
              },
              example: {
                feedback: "After review, we are satisfied with the corrective measures taken. Reappeal approved."
              }
            } 
          } 
        },
        responses: { 
          200: { 
            description: "Reappeal approved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reappeal approved successfully" }
                  }
                }
              }
            }
          },
          404: { description: "Company or reappeal not found" }
        } 
      } 
    },
    "/admins/reappeals/{companyId}/reject": { 
      post: { 
        summary: "Reject reappeal request", 
        description: "Reject company reappeal with feedback",
        tags: ["Admin", "Admin - Company Verification"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "companyId", in: "path", required: true, schema: { type: "string" }, description: "Company ID", example: "COM-2024001" }
        ],
        requestBody: { 
          required: true,
          content: { 
            "application/json": { 
              schema: { 
                type: "object", 
                required: ["reason"],
                properties: { 
                  reason: { type: "string", description: "Rejection reason", example: "Insufficient evidence of corrective measures" },
                  feedback: { type: "string", description: "Detailed feedback", example: "Please provide more documentation" }
                } 
              },
              example: {
                reason: "Insufficient evidence of corrective measures",
                feedback: "The reappeal does not adequately address the original policy violations. Please provide detailed evidence of corrective actions taken."
              }
            } 
          } 
        },
        responses: { 
          200: { 
            description: "Reappeal rejected",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reappeal rejected" }
                  }
                }
              }
            }
          },
          400: { description: "Missing rejection reason" },
          404: { description: "Company or reappeal not found" }
        } 
      } 
    },
    
    // Credit Request Management Endpoints
    "/admins/credit-requests/pending": {
      get: {
        summary: "Get pending credit requests for admin approval",
        description: "List all credit requests awaiting admin review with filtering and pagination",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 },
          { name: "status", in: "query", schema: { type: "string", enum: ["mentor_approved", "admin_reviewing"] }, description: "Filter by status", example: "mentor_approved" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["requestedAt", "status", "mentorId", "studentId"], default: "requestedAt" }, description: "Sort field", example: "requestedAt" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: {
          200: {
            description: "List of pending credit requests",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        creditRequests: {
                          type: "array",
                          items: { $ref: "#/components/schemas/CreditRequest" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/{requestId}": {
      get: {
        summary: "Get credit request details for admin review",
        description: "Get complete credit request details including documents and review history",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit Request ID", example: "CR-2024001" }
        ],
        responses: {
          200: {
            description: "Credit request details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/CreditRequest" }
                  }
                }
              }
            }
          },
          404: { description: "Credit request not found" }
        }
      }
    },
    "/admins/credit-requests/{requestId}/review": {
      post: {
        summary: "Submit admin review (approve/reject)",
        description: "Submit admin review decision for credit request",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit Request ID", example: "CR-2024001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["approve", "reject"], description: "Admin decision", example: "approve" },
                  comments: { type: "string", description: "Review comments", example: "All documents verified. Credits approved." },
                  creditsApproved: { type: "number", description: "Number of credits to approve (if different from requested)", example: 4 }
                }
              },
              example: {
                decision: "approve",
                comments: "All documents verified. Internship completion confirmed.",
                creditsApproved: 4
              }
            }
          }
        },
        responses: {
          200: {
            description: "Review submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Credit request approved" }
                  }
                }
              }
            }
          },
          400: { description: "Invalid decision or missing required fields" },
          404: { description: "Credit request not found" }
        }
      }
    },
    "/admins/credit-requests/{requestId}/resolve": {
      post: {
        summary: "Resolve administrative hold on credit request",
        description: "Resolve any administrative holds or issues on credit request",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "requestId", in: "path", required: true, schema: { type: "string" }, description: "Credit Request ID", example: "CR-2024001" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["resolution"],
                properties: {
                  resolution: { type: "string", description: "Resolution details", example: "Issue resolved. Documents verified." },
                  action: { type: "string", enum: ["continue", "reject"], description: "Action to take", example: "continue" }
                }
              },
              example: {
                resolution: "Document verification completed. Proceeding with approval.",
                action: "continue"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Hold resolved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Administrative hold resolved" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/analytics": {
      get: {
        summary: "Get system-wide credit transfer analytics",
        description: "Get comprehensive analytics for credit transfer system with date range filtering",
        tags: ["Admin", "Admin - Credit Management", "Admin - Analytics", "Analytics", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date", example: "2024-12-31" }
        ],
        responses: {
          200: {
            description: "Credit transfer analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalRequests: { type: "integer", example: 450 },
                        approved: { type: "integer", example: 380 },
                        rejected: { type: "integer", example: 45 },
                        pending: { type: "integer", example: 25 },
                        averageProcessingTime: { type: "number", example: 5.2, description: "In days" },
                        totalCreditsApproved: { type: "number", example: 1520 },
                        byDepartment: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              department: { type: "string", example: "Computer Science" },
                              requests: { type: "integer", example: 120 },
                              approved: { type: "integer", example: 105 },
                              creditsApproved: { type: "number", example: 420 }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/export": {
      get: {
        summary: "Export credit transfer report (CSV/JSON)",
        description: "Export credit transfer data in CSV or JSON format",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["csv", "json"], default: "csv" }, description: "Export format", example: "csv" },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date", example: "2024-12-31" },
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" }
        ],
        responses: {
          200: {
            description: "Export file",
            content: {
              "text/csv": {
                schema: { type: "string", format: "binary" }
              },
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CreditRequest" }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/bottlenecks": {
      get: {
        summary: "Get approval pipeline bottleneck analysis",
        description: "Analyze credit request approval pipeline for bottlenecks and delays",
        tags: ["Admin", "Admin - Credit Management", "Admin - Analytics", "Analytics", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Bottleneck analysis",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        mentorReviewBottlenecks: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              mentorId: { type: "string", example: "MEN-2024001" },
                              mentorName: { type: "string", example: "Dr. Anjali Verma" },
                              pendingRequests: { type: "integer", example: 15 },
                              averageReviewTime: { type: "number", example: 7.5, description: "In days" }
                            }
                          }
                        },
                        adminReviewBottlenecks: {
                          type: "object",
                          properties: {
                            pendingRequests: { type: "integer", example: 25 },
                            averageWaitTime: { type: "number", example: 3.2, description: "In days" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/overdue": {
      get: {
        summary: "Get all overdue credit requests",
        description: "List credit requests that are overdue for review",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: {
          200: {
            description: "List of overdue credit requests",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        overdueRequests: {
                          type: "array",
                          items: { $ref: "#/components/schemas/CreditRequest" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/reminders/stats": {
      get: {
        summary: "Get reminder statistics for overdue credit requests",
        description: "Get statistics about reminder notifications sent for overdue credit requests",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Reminder statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalRemindersSent: { type: "integer", example: 145 },
                        lastReminderSentAt: { type: "string", format: "date-time" },
                        overdueRequests: { type: "integer", example: 18 },
                        remindersPending: { type: "integer", example: 5 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/reminders/send": {
      post: {
        summary: "Manually trigger sending reminders for overdue credit requests",
        description: "Send reminder notifications to mentors/admins for overdue credit requests",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Reminders sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reminders sent successfully" },
                    data: {
                      type: "object",
                      properties: {
                        remindersSent: { type: "integer", example: 12 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/credit-requests/reminders/schedule": {
      post: {
        summary: "Schedule automatic reminder job",
        description: "Schedule automatic reminder notifications for overdue credit requests",
        tags: ["Admin", "Admin - Credit Management", "Credit Transfer Flow"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  frequency: { type: "string", enum: ["daily", "weekly"], description: "Reminder frequency", example: "daily" },
                  time: { type: "string", description: "Time to send reminders (HH:MM format)", example: "09:00" }
                }
              },
              example: {
                frequency: "daily",
                time: "09:00"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Reminder job scheduled",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reminder job scheduled successfully" }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    // Student and Mentor Management Endpoints
    "/admins/students/import": {
      post: {
        summary: "Bulk import students",
        description: "Import multiple students from CSV file",
        tags: ["Admin", "Admin - Student Management"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "CSV file with student data" }
                }
              }
            }
          }
        },
        responses: {
          202: {
            description: "Import job accepted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Import job started" },
                    data: {
                      type: "object",
                      properties: {
                        jobId: { type: "string", example: "job_1234567890" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid file format" }
        }
      }
    },
    "/admins/students/import/{jobId}": {
      get: {
        summary: "Get import job status",
        description: "Check the status of a bulk import job",
        tags: ["Admin", "Admin - Student Management"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "Import job ID", example: "job_1234567890" }
        ],
        responses: {
          200: {
            description: "Job status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        jobId: { type: "string", example: "job_1234567890" },
                        status: { type: "string", enum: ["pending", "processing", "completed", "failed"], example: "completed" },
                        progress: { type: "integer", example: 100, description: "Progress percentage" },
                        totalRecords: { type: "integer", example: 150 },
                        processedRecords: { type: "integer", example: 150 },
                        successfulRecords: { type: "integer", example: 145 },
                        failedRecords: { type: "integer", example: 5 },
                        errors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              row: { type: "integer", example: 23 },
                              error: { type: "string", example: "Invalid email format" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: "Job not found" }
        }
      }
    },
    "/admins/mentors/assign": {
      post: {
        summary: "Assign mentor to students",
        description: "Assign a mentor to one or more students",
        tags: ["Admin", "Admin - Mentor Management"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mentorId", "studentIds"],
                properties: {
                  mentorId: { type: "string", description: "Mentor ID", example: "MEN-2024001" },
                  studentIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of student IDs",
                    example: ["STU-2024001", "STU-2024002", "STU-2024003"]
                  }
                }
              },
              example: {
                mentorId: "MEN-2024001",
                studentIds: ["STU-2024001", "STU-2024002", "STU-2024003"]
              }
            }
          }
        },
        responses: {
          200: {
            description: "Mentor assigned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Mentor assigned to 3 students" },
                    data: {
                      type: "object",
                      properties: {
                        assignedCount: { type: "integer", example: 3 }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid mentor or student IDs" },
          404: { description: "Mentor or students not found" }
        }
      }
    },
    
    // System Reports and Analytics
    "/admins/reports/system": {
      post: {
        summary: "Generate system report",
        description: "Generate comprehensive system report with specified parameters",
        tags: ["Admin", "Admin - System"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reportType: { type: "string", enum: ["internships", "students", "companies", "credits", "comprehensive"], description: "Type of report", example: "comprehensive" },
                  dateFrom: { type: "string", format: "date", example: "2024-01-01" },
                  dateTo: { type: "string", format: "date", example: "2024-12-31" },
                  format: { type: "string", enum: ["pdf", "csv", "json"], default: "pdf", example: "pdf" }
                }
              },
              example: {
                reportType: "comprehensive",
                dateFrom: "2024-01-01",
                dateTo: "2024-12-31",
                format: "pdf"
              }
            }
          }
        },
        responses: {
          202: {
            description: "Report generation started",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Report generation started" },
                    data: {
                      type: "object",
                      properties: {
                        reportId: { type: "string", example: "report_1234567890" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/system/health": {
      get: {
        summary: "Get system health status",
        description: "Get health status of all system components and external services",
        tags: ["Admin", "Admin - System"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "System health status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", enum: ["healthy", "degraded", "down"], example: "healthy" },
                        uptime: { type: "number", example: 99.98, description: "Uptime percentage" },
                        services: {
                          type: "object",
                          properties: {
                            database: { type: "string", enum: ["up", "down"], example: "up" },
                            redis: { type: "string", enum: ["up", "down"], example: "up" },
                            email: { type: "string", enum: ["up", "down"], example: "up" },
                            storage: { type: "string", enum: ["up", "down"], example: "up" },
                            ai: { type: "string", enum: ["up", "down"], example: "up" },
                            queue: { type: "string", enum: ["up", "down"], example: "up" }
                          }
                        },
                        metrics: {
                          type: "object",
                          properties: {
                            activeUsers: { type: "integer", example: 245 },
                            requestsPerMinute: { type: "number", example: 1250.5 },
                            averageResponseTime: { type: "number", example: 125.3, description: "In milliseconds" },
                            errorRate: { type: "number", example: 0.02, description: "Percentage" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/ai/usage": {
      get: {
        summary: "Get AI usage statistics",
        description: "Get statistics about AI service usage across the system",
        tags: ["Admin", "Admin - System"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date", example: "2024-12-31" }
        ],
        responses: {
          200: {
            description: "AI usage statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalRequests: { type: "integer", example: 15420 },
                        successfulRequests: { type: "integer", example: 15280 },
                        failedRequests: { type: "integer", example: 140 },
                        averageResponseTime: { type: "number", example: 1250.5, description: "In milliseconds" },
                        byFeature: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              feature: { type: "string", example: "Internship Tagging" },
                              requests: { type: "integer", example: 5420 },
                              tokensUsed: { type: "integer", example: 1250000 }
                            }
                          }
                        },
                        costEstimate: { type: "number", example: 125.50, description: "Estimated cost in USD" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    // Admin Internship Management and Verification Endpoints
    "/admins/internships": {
      get: {
        summary: "Get all internships with filtering",
        description: "List all internships with status filtering (legacy endpoint, use /admins/internships/list for advanced filtering)",
        tags: ["Admin", "Admin - Internship Verification", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/InternshipStatus" }, description: "Filter by status", example: "pending_admin_verification" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 }
        ],
        responses: {
          200: {
            description: "List of internships",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        internships: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Internship" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/internships/list": {
      get: {
        summary: "List internships with advanced filtering and pagination",
        description: "Get internships with comprehensive filtering options including status, work mode, department, date range, and search",
        tags: ["Admin", "Admin - Internship Verification", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Items per page", example: 20 },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by title or company name", example: "Software Developer" },
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/InternshipStatus" }, description: "Filter by status", example: "pending_admin_verification" },
          { name: "workMode", in: "query", schema: { type: "string", enum: ["remote", "onsite", "hybrid"] }, description: "Filter by work mode", example: "remote" },
          { name: "department", in: "query", schema: { type: "string" }, description: "Filter by department", example: "Computer Science" },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Filter by start date from", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "Filter by start date to", example: "2024-12-31" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["postedAt", "startDate", "applicationDeadline", "title"], default: "postedAt" }, description: "Sort field", example: "postedAt" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: {
          200: {
            description: "List of internships with pagination",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        internships: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Internship" }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/internships/bulk-approve": {
      post: {
        summary: "Bulk approve internships",
        description: "Approve multiple internships at once (transitions to admin_approved status)",
        tags: ["Admin", "Admin - Internship Verification", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["internshipIds"],
                properties: {
                  internshipIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of internship IDs to approve",
                    example: ["INT-2024001", "INT-2024002", "INT-2024003"]
                  },
                  comments: { type: "string", description: "Optional approval comments", example: "Bulk approval for verified companies" }
                }
              },
              example: {
                internshipIds: ["INT-2024001", "INT-2024002", "INT-2024003"],
                comments: "All internships verified and approved"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Bulk approval completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "3 internships approved successfully" },
                    data: {
                      type: "object",
                      properties: {
                        approvedCount: { type: "integer", example: 3 },
                        failedCount: { type: "integer", example: 0 },
                        errors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              internshipId: { type: "string" },
                              error: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Invalid internship IDs or bulk operation size exceeded" }
        }
      }
    },
    "/admins/internships/bulk-reject": {
      post: {
        summary: "Bulk reject internships",
        description: "Reject multiple internships at once with reasons",
        tags: ["Admin", "Admin - Internship Verification", "Internship Lifecycle"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["internshipIds", "reason"],
                properties: {
                  internshipIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of internship IDs to reject",
                    example: ["INT-2024004", "INT-2024005"]
                  },
                  reason: { type: "string", description: "Rejection reason", example: "Incomplete information" },
                  comments: { type: "string", description: "Additional comments", example: "Please provide complete job descriptions" }
                }
              },
              example: {
                internshipIds: ["INT-2024004", "INT-2024005"],
                reason: "Incomplete information",
                comments: "Job descriptions do not meet minimum requirements"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Bulk rejection completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "2 internships rejected successfully" },
                    data: {
                      type: "object",
                      properties: {
                        rejectedCount: { type: "integer", example: 2 },
                        failedCount: { type: "integer", example: 0 }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Missing rejection reason or invalid internship IDs" }
        }
      }
    },
    "/admins/internships/analytics": {
      get: {
        summary: "Get internship analytics",
        description: "Get comprehensive analytics for internships with date range filtering",
        tags: ["Admin", "Admin - Internship Verification", "Admin - Analytics", "Analytics"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date", example: "2024-12-31" }
        ],
        responses: {
          200: {
            description: "Internship analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalInternships: { type: "integer", example: 450 },
                        byStatus: {
                          type: "object",
                          properties: {
                            pending_admin_verification: { type: "integer", example: 25 },
                            admin_approved: { type: "integer", example: 180 },
                            open_for_applications: { type: "integer", example: 120 },
                            closed: { type: "integer", example: 95 },
                            admin_rejected: { type: "integer", example: 30 }
                          }
                        },
                        byDepartment: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              department: { type: "string", example: "Computer Science" },
                              count: { type: "integer", example: 180 }
                            }
                          }
                        },
                        byWorkMode: {
                          type: "object",
                          properties: {
                            remote: { type: "integer", example: 200 },
                            onsite: { type: "integer", example: 150 },
                            hybrid: { type: "integer", example: 100 }
                          }
                        },
                        averageApplications: { type: "number", example: 25.5 },
                        averageApprovalTime: { type: "number", example: 2.3, description: "In days" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admins/internships/pending": { 
      get: { 
        summary: "List pending internships for admin verification", 
        description: "Get all internships awaiting admin verification with filtering and pagination",
        tags: ["Admin", "Internship Verification", "Internship Lifecycle"], 
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
        tags: ["Admin", "Internship Verification", "Internship Lifecycle"], 
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
        tags: ["Admin", "Internship Verification", "Internship Lifecycle"], 
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
        tags: ["Admin", "Internship Verification", "Internship Lifecycle"], 
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
        description: "Get comprehensive system analytics including users, internships, applications, and credits with date range filtering",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date for analytics", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date for analytics", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "System analytics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        period: {
                          type: "object",
                          properties: {
                            from: { type: "string", format: "date", example: "2024-01-01" },
                            to: { type: "string", format: "date", example: "2024-12-31" }
                          }
                        },
                        users: {
                          type: "object",
                          properties: {
                            totalStudents: { type: "integer", example: 1250 },
                            totalCompanies: { type: "integer", example: 85 },
                            totalMentors: { type: "integer", example: 42 },
                            activeStudents: { type: "integer", example: 980 },
                            verifiedCompanies: { type: "integer", example: 72 },
                            newRegistrations: { type: "integer", example: 145 }
                          }
                        },
                        internships: {
                          type: "object",
                          properties: {
                            total: { type: "integer", example: 450 },
                            active: { type: "integer", example: 120 },
                            completed: { type: "integer", example: 285 },
                            averageApplications: { type: "number", example: 25.5 }
                          }
                        },
                        applications: {
                          type: "object",
                          properties: {
                            total: { type: "integer", example: 11475 },
                            accepted: { type: "integer", example: 892 },
                            rejected: { type: "integer", example: 8234 },
                            pending: { type: "integer", example: 2349 },
                            acceptanceRate: { type: "number", example: 0.078 }
                          }
                        },
                        credits: {
                          type: "object",
                          properties: {
                            totalRequests: { type: "integer", example: 245 },
                            approved: { type: "integer", example: 198 },
                            pending: { type: "integer", example: 32 },
                            rejected: { type: "integer", example: 15 },
                            totalCreditsAwarded: { type: "integer", example: 1584 },
                            averageCreditsPerStudent: { type: "number", example: 8.0 }
                          }
                        },
                        trends: {
                          type: "object",
                          properties: {
                            internshipsPerMonth: { type: "array", items: { type: "integer" }, example: [35, 42, 38, 40, 45, 48, 42, 39, 44, 51, 47, 29] },
                            applicationsPerMonth: { type: "array", items: { type: "integer" }, example: [890, 1050, 945, 980, 1125, 1200, 1050, 975, 1100, 1275, 1175, 710] },
                            placementRate: { type: "number", example: 0.85 }
                          }
                        }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    period: { from: "2024-01-01", to: "2024-12-31" },
                    users: {
                      totalStudents: 1250,
                      totalCompanies: 85,
                      totalMentors: 42,
                      activeStudents: 980,
                      verifiedCompanies: 72,
                      newRegistrations: 145
                    },
                    internships: {
                      total: 450,
                      active: 120,
                      completed: 285,
                      averageApplications: 25.5
                    },
                    applications: {
                      total: 11475,
                      accepted: 892,
                      rejected: 8234,
                      pending: 2349,
                      acceptanceRate: 0.078
                    },
                    credits: {
                      totalRequests: 245,
                      approved: 198,
                      pending: 32,
                      rejected: 15,
                      totalCreditsAwarded: 1584,
                      averageCreditsPerStudent: 8.0
                    },
                    trends: {
                      internshipsPerMonth: [35, 42, 38, 40, 45, 48, 42, 39, 44, 51, 47, 29],
                      applicationsPerMonth: [890, 1050, 945, 980, 1125, 1200, 1050, 975, 1100, 1275, 1175, 710],
                      placementRate: 0.85
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid date range",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid date range",
                  error: { code: "INVALID_DATE_RANGE" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden - Admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/admins/analytics/companies": { 
      get: { 
        summary: "Get company performance metrics", 
        description: "Get performance metrics for all companies with sorting and filtering. Includes internship posting activity, application metrics, and completion rates.",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["averageRating", "internshipsPosted", "applicationsReceived", "completionRate"] }, description: "Sort field", example: "averageRating" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: { 
          200: { 
            description: "Company performance metrics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        companies: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              companyId: { type: "string", example: "COM-2024001" },
                              companyName: { type: "string", example: "Tech Innovations Pvt Ltd" },
                              internshipsPosted: { type: "integer", example: 15 },
                              activeInternships: { type: "integer", example: 3 },
                              applicationsReceived: { type: "integer", example: 450 },
                              studentsHired: { type: "integer", example: 25 },
                              completionRate: { type: "number", example: 0.92 },
                              averageRating: { type: "number", example: 4.5 },
                              status: { type: "string", example: "verified" }
                            }
                          }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    companies: [
                      {
                        companyId: "COM-2024001",
                        companyName: "Tech Innovations Pvt Ltd",
                        internshipsPosted: 15,
                        activeInternships: 3,
                        applicationsReceived: 450,
                        studentsHired: 25,
                        completionRate: 0.92,
                        averageRating: 4.5,
                        status: "verified"
                      },
                      {
                        companyId: "COM-2024002",
                        companyName: "Digital Solutions India",
                        internshipsPosted: 12,
                        activeInternships: 2,
                        applicationsReceived: 380,
                        studentsHired: 20,
                        completionRate: 0.88,
                        averageRating: 4.3,
                        status: "verified"
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 5,
                      totalItems: 85,
                      itemsPerPage: 20,
                      hasNextPage: true,
                      hasPrevPage: false
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid sortBy parameter",
                  error: { code: "INVALID_PARAMETER" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden - Admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/admins/analytics/departments": { 
      get: { 
        summary: "Get department performance", 
        description: "Get performance metrics by department including student placement rates, internship completion, and credit awards",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "department", in: "query", schema: { type: "string" }, description: "Specific department to analyze", example: "Computer Science" },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Start date", example: "2024-01-01" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "End date", example: "2024-12-31" }
        ],
        responses: { 
          200: { 
            description: "Department performance metrics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        departments: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              department: { type: "string", example: "Computer Science" },
                              totalStudents: { type: "integer", example: 450 },
                              activeInternships: { type: "integer", example: 85 },
                              completedInternships: { type: "integer", example: 180 },
                              placementRate: { type: "number", example: 0.85 },
                              averageReadinessScore: { type: "number", example: 78.5 },
                              creditsAwarded: { type: "integer", example: 1440 },
                              averageCreditsPerStudent: { type: "number", example: 8.0 },
                              topSkills: { type: "array", items: { type: "string" }, example: ["JavaScript", "Python", "React", "Machine Learning"] }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    departments: [
                      {
                        department: "Computer Science",
                        totalStudents: 450,
                        activeInternships: 85,
                        completedInternships: 180,
                        placementRate: 0.85,
                        averageReadinessScore: 78.5,
                        creditsAwarded: 1440,
                        averageCreditsPerStudent: 8.0,
                        topSkills: ["JavaScript", "Python", "React", "Machine Learning"]
                      },
                      {
                        department: "Electronics",
                        totalStudents: 320,
                        activeInternships: 55,
                        completedInternships: 120,
                        placementRate: 0.78,
                        averageReadinessScore: 72.3,
                        creditsAwarded: 960,
                        averageCreditsPerStudent: 7.5,
                        topSkills: ["Embedded Systems", "Circuit Design", "IoT", "VLSI"]
                      }
                    ]
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid date range",
                  error: { code: "INVALID_DATE_RANGE" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden - Admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/admins/analytics/mentors": { 
      get: { 
        summary: "Get mentor performance", 
        description: "Get performance metrics for all mentors including approval rates, response times, and student supervision statistics",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["approvalRate", "approvalsProcessed", "averageResponseTime", "studentsSupervised"] }, description: "Sort field", example: "approvalRate" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: { 
          200: { 
            description: "Mentor performance metrics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        mentors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              mentorId: { type: "string", example: "MEN-2024001" },
                              name: { type: "string", example: "Dr. Anjali Verma" },
                              department: { type: "string", example: "Computer Science" },
                              studentsSupervised: { type: "integer", example: 18 },
                              approvalsProcessed: { type: "integer", example: 45 },
                              approvalRate: { type: "number", example: 0.849 },
                              averageResponseTime: { type: "number", example: 1.8, description: "In days" },
                              logbooksReviewed: { type: "integer", example: 156 },
                              creditRequestsReviewed: { type: "integer", example: 12 }
                            }
                          }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    mentors: [
                      {
                        mentorId: "MEN-2024001",
                        name: "Dr. Anjali Verma",
                        department: "Computer Science",
                        studentsSupervised: 18,
                        approvalsProcessed: 45,
                        approvalRate: 0.849,
                        averageResponseTime: 1.8,
                        logbooksReviewed: 156,
                        creditRequestsReviewed: 12
                      },
                      {
                        mentorId: "MEN-2024002",
                        name: "Prof. Rajesh Kumar",
                        department: "Electronics",
                        studentsSupervised: 22,
                        approvalsProcessed: 52,
                        approvalRate: 0.865,
                        averageResponseTime: 1.5,
                        logbooksReviewed: 198,
                        creditRequestsReviewed: 15
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 3,
                      totalItems: 42,
                      itemsPerPage: 20,
                      hasNextPage: true,
                      hasPrevPage: false
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid sortBy parameter",
                  error: { code: "INVALID_PARAMETER" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden - Admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },
    "/admins/analytics/students": { 
      get: { 
        summary: "Get student performance", 
        description: "Get overall student performance metrics including readiness scores, internship completion, and credit awards",
        tags: ["Admin", "Analytics"], 
        security: [{ BearerAuth: [] }], 
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number", example: 1 },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page", example: 20 },
          { name: "department", in: "query", schema: { type: "string" }, description: "Filter by department", example: "Computer Science" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["readinessScore", "creditsEarned", "completedInternships"] }, description: "Sort field", example: "readinessScore" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order", example: "desc" }
        ],
        responses: { 
          200: { 
            description: "Student performance metrics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        students: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              studentId: { type: "string", example: "STU-2024001" },
                              name: { type: "string", example: "Rahul Sharma" },
                              department: { type: "string", example: "Computer Science" },
                              year: { type: "integer", example: 3 },
                              readinessScore: { type: "number", example: 85 },
                              completedInternships: { type: "integer", example: 2 },
                              creditsEarned: { type: "number", example: 12 },
                              activeApplications: { type: "integer", example: 1 },
                              topSkills: { type: "array", items: { type: "string" }, example: ["JavaScript", "React", "Python"] }
                            }
                          }
                        },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                        summary: {
                          type: "object",
                          properties: {
                            totalStudents: { type: "integer", example: 1250 },
                            averageReadinessScore: { type: "number", example: 72.5 },
                            averageCreditsEarned: { type: "number", example: 6.8 },
                            placementRate: { type: "number", example: 0.82 }
                          }
                        }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    students: [
                      {
                        studentId: "STU-2024001",
                        name: "Rahul Sharma",
                        department: "Computer Science",
                        year: 3,
                        readinessScore: 85,
                        completedInternships: 2,
                        creditsEarned: 12,
                        activeApplications: 1,
                        topSkills: ["JavaScript", "React", "Python"]
                      },
                      {
                        studentId: "STU-2024002",
                        name: "Priya Patel",
                        department: "Computer Science",
                        year: 4,
                        readinessScore: 82,
                        completedInternships: 1,
                        creditsEarned: 8,
                        activeApplications: 0,
                        topSkills: ["Python", "Machine Learning", "Data Science"]
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 63,
                      totalItems: 1250,
                      itemsPerPage: 20,
                      hasNextPage: true,
                      hasPrevPage: false
                    },
                    summary: {
                      totalStudents: 1250,
                      averageReadinessScore: 72.5,
                      averageCreditsEarned: 6.8,
                      placementRate: 0.82
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid sortBy parameter",
                  error: { code: "INVALID_PARAMETER" }
                }
              }
            }
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          403: { description: "Forbidden - Admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          500: { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      } 
    },

    // ==================== Testing and Utility Routes ====================
    // Testing endpoints for verifying service configuration and system health
    // Most testing endpoints require admin authentication
    
    // Health Check Endpoint
    "/health": {
      get: {
        summary: "API health check",
        description: "Returns API health status and server uptime. This endpoint is publicly accessible and can be used for monitoring and load balancer health checks. No authentication required.",
        tags: ["Testing"],
        security: [],
        responses: {
          200: {
            description: "API is healthy and operational",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthCheckResponse"
                },
                example: {
                  success: true,
                  message: "Prashiskshan API is healthy",
                  data: {
                    uptime: 12345.67
                  }
                }
              }
            }
          }
        }
      }
    },

    // Email Service Test
    "/tests/email": {
      post: {
        summary: "Test email service",
        description: "Send a test email to verify email service configuration (Brevo or Mailgun). Admin only. Use this endpoint to test email templates and ensure email delivery is working correctly before sending to real users.",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TestEmailRequest"
              },
              example: {
                to: "test@example.com",
                subject: "Test Email from Prashiskshan",
                template: "welcome",
                data: {
                  name: "Rahul Sharma",
                  link: "https://prashiskshan.edu/dashboard"
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Email sent successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Test email sent successfully",
                  data: {
                    messageId: "msg_abc123xyz",
                    to: "test@example.com",
                    template: "welcome"
                  }
                }
              }
            }
          },
          400: {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Missing required fields: to, subject, template"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          500: {
            description: "Email service error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Failed to send test email",
                  error: {
                    code: "EMAIL_SERVICE_ERROR",
                    details: {
                      error: "SMTP connection failed"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // S3/R2 Storage Test
    "/tests/s3": {
      post: {
        summary: "Test S3/R2 storage service",
        description: "Upload a test file to S3/R2 storage to verify storage configuration. Admin only. Use this endpoint to test file upload functionality and ensure storage credentials are correctly configured.",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/TestS3UploadRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Test file uploaded successfully",
                  data: {
                    url: "https://storage.prashiskshan.edu/test/sample-file.pdf",
                    key: "test/sample-file.pdf"
                  }
                }
              }
            }
          },
          400: {
            description: "No file provided",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "No file provided"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          500: {
            description: "Storage service error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Failed to upload test file",
                  error: {
                    code: "STORAGE_ERROR",
                    details: {
                      error: "Access denied"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Queue Service Test
    "/tests/queue": {
      post: {
        summary: "Test queue service",
        description: "Add a test job to the specified queue to verify queue configuration and Redis connectivity. Admin only. Use this endpoint to test background job processing for email, SMS, logbook processing, reports, notifications, completion workflows, and AI tasks.",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TestQueueJobRequest"
              },
              example: {
                queueName: "email",
                data: {
                  to: "test@example.com",
                  template: "welcome",
                  data: {
                    name: "Test User"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Job added to queue successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "Test job added to queue successfully",
                  data: {
                    jobId: "job_1234567890",
                    queueName: "email"
                  }
                }
              }
            }
          },
          400: {
            description: "Missing or invalid queue name",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Invalid queue name. Must be one of: email, sms, logbook, report, notification, completion, ai"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          500: {
            description: "Queue service error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Failed to add test job to queue",
                  error: {
                    code: "QUEUE_ERROR",
                    details: {
                      error: "Redis connection failed"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Gemini AI Test
    "/tests/gemini": {
      post: {
        summary: "Test Gemini AI service",
        description: "Send a test prompt to Gemini AI to verify AI service configuration. Admin only. Use this endpoint to test AI text generation and ensure Gemini API credentials are correctly configured. Choose between 'flash' model for speed or 'pro' model for higher quality responses.",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TestGeminiRequest"
              },
              example: {
                prompt: "Write a brief summary about the importance of internships in education",
                model: "flash"
              }
            }
          }
        },
        responses: {
          200: {
            description: "AI response generated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "AI response generated successfully",
                  data: {
                    response: "Internships play a crucial role in education by providing students with practical, hands-on experience in their field of study. They bridge the gap between theoretical knowledge and real-world application, helping students develop professional skills, build networks, and gain insights into their chosen career paths.",
                    model: "flash"
                  }
                }
              }
            }
          },
          400: {
            description: "Missing prompt or invalid model",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Invalid model. Must be 'flash' or 'pro'"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          500: {
            description: "AI service error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Failed to generate AI response",
                  error: {
                    code: "AI_SERVICE_ERROR",
                    details: {
                      error: "API key invalid"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Service Status Check
    "/tests/status": {
      get: {
        summary: "Get test services status",
        description: "Check the configuration status of all test services (Email, S3/R2, Queue, Gemini AI). Admin only. Use this endpoint to quickly verify which services are properly configured before running individual tests.",
        tags: ["Testing"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Services status retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TestServicesStatusResponse"
                },
                example: {
                  success: true,
                  message: "Test services status retrieved",
                  data: {
                    email: {
                      configured: true
                    },
                    s3: {
                      configured: true
                    },
                    queue: {
                      connected: true
                    },
                    gemini: {
                      configured: true
                    }
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },

    // Debug Endpoint - Firebase Status
    "/debug/firebase": {
      get: {
        summary: "Firebase configuration debug",
        description: "Get detailed Firebase configuration and connection status for debugging authentication issues. Returns information about Firebase initialization, credentials, and connection test results. No authentication required for debugging purposes.",
        tags: ["Testing"],
        security: [],
        responses: {
          200: {
            description: "Firebase debug information retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FirebaseDebugResponse"
                },
                example: {
                  success: true,
                  message: "Firebase Debug Status",
                  data: {
                    initialized: true,
                    projectId: "prashiskshan-dev",
                    clientEmail: "firebase-adminsdk@prashiskshan-dev.iam.gserviceaccount.com",
                    privateKeyValid: true,
                    connectionTest: "Success",
                    privateKeyDetails: {
                      hasHeader: true,
                      hasFooter: true,
                      length: 1704
                    }
                  }
                }
              }
            }
          },
          500: {
            description: "Debug check failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "Debug check failed",
                  error: {
                    code: "DEBUG_ERROR",
                    details: {
                      error: "Firebase not initialized"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Notification Endpoints
    "/notifications": {
      get: {
        summary: "Get user notifications",
        description: "Retrieve all notifications for the authenticated user, sorted by creation date (newest first). Returns up to 50 most recent notifications along with unread count. Notifications include application updates, internship approvals, credit request status changes, and system announcements.",
        tags: ["Notifications"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Notifications retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Notifications fetched successfully" },
                    data: {
                      type: "object",
                      properties: {
                        notifications: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Notification" }
                        },
                        unreadCount: {
                          type: "integer",
                          example: 3,
                          description: "Number of unread notifications"
                        }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  message: "Notifications fetched successfully",
                  data: {
                    notifications: [
                      {
                        notificationId: "NOT-2024001",
                        userId: "507f1f77bcf86cd799439011",
                        role: "student",
                        type: "application_accepted",
                        title: "Application Accepted",
                        message: "Your application for Full Stack Developer Intern has been accepted by Tech Innovations Pvt Ltd",
                        priority: "high",
                        actionUrl: "/student/applications/APP-2024001",
                        read: false,
                        readAt: null,
                        deliveries: [
                          {
                            channel: "email",
                            status: "sent",
                            sentAt: "2024-01-15T10:30:00Z"
                          }
                        ],
                        metadata: {
                          applicationId: "APP-2024001",
                          internshipId: "INT-2024001",
                          companyName: "Tech Innovations Pvt Ltd"
                        },
                        createdAt: "2024-01-15T10:30:00Z",
                        updatedAt: "2024-01-15T10:30:00Z"
                      },
                      {
                        notificationId: "NOT-2024002",
                        userId: "507f1f77bcf86cd799439011",
                        role: "student",
                        type: "credit_approved",
                        title: "Credits Approved",
                        message: "Your credit request for 4 credits has been approved by the admin",
                        priority: "medium",
                        actionUrl: "/student/credits",
                        read: true,
                        readAt: "2024-01-14T15:20:00Z",
                        deliveries: [],
                        metadata: {
                          creditRequestId: "CR-2024001",
                          creditsApproved: 4
                        },
                        createdAt: "2024-01-14T14:00:00Z",
                        updatedAt: "2024-01-14T15:20:00Z"
                      }
                    ],
                    unreadCount: 1
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Authentication required"
                }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Failed to fetch notifications",
                  error: {
                    code: "DATABASE_ERROR"
                  }
                }
              }
            }
          }
        }
      }
    },

    "/notifications/{id}/read": {
      patch: {
        summary: "Mark notification as read",
        description: "Mark a specific notification as read by its ID. Updates the read status and sets the readAt timestamp. Only the notification owner can mark it as read.",
        tags: ["Notifications"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Notification ID to mark as read",
            schema: { type: "string" },
            example: "NOT-2024001"
          }
        ],
        responses: {
          200: {
            description: "Notification marked as read successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Notification marked as read" },
                    data: { $ref: "#/components/schemas/Notification" }
                  }
                },
                example: {
                  success: true,
                  message: "Notification marked as read",
                  data: {
                    notificationId: "NOT-2024001",
                    userId: "507f1f77bcf86cd799439011",
                    role: "student",
                    type: "application_accepted",
                    title: "Application Accepted",
                    message: "Your application for Full Stack Developer Intern has been accepted",
                    priority: "high",
                    actionUrl: "/student/applications/APP-2024001",
                    read: true,
                    readAt: "2024-01-15T16:45:00Z",
                    deliveries: [],
                    metadata: {},
                    createdAt: "2024-01-15T10:30:00Z",
                    updatedAt: "2024-01-15T16:45:00Z"
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          404: {
            description: "Notification not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Notification not found"
                }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/notifications/read-all": {
      patch: {
        summary: "Mark all notifications as read",
        description: "Mark all unread notifications for the authenticated user as read. Updates all notifications with read=false to read=true and sets readAt timestamp. Useful for clearing notification badges.",
        tags: ["Notifications"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "All notifications marked as read successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "All notifications marked as read",
                  data: {}
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    // File Upload Endpoints
    "/upload": {
      post: {
        summary: "Upload a file",
        description: "Upload a file to cloud storage (R2 or ImageKit). Supports PDF and image files (JPEG, JPG, PNG) up to 10MB. Used for uploading documents like resumes, certificates, company registration documents, and profile images. Returns the file URL and metadata. No authentication required to support registration flows.",
        tags: ["File Upload"],
        security: [],
        parameters: [
          {
            name: "provider",
            in: "query",
            required: false,
            description: "Storage provider to use (r2 or imagekit). Defaults to r2.",
            schema: {
              type: "string",
              enum: ["r2", "imagekit"],
              default: "r2"
            },
            example: "r2"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "File to upload (PDF, JPEG, JPG, or PNG, max 10MB)"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File uploaded successfully" },
                    data: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          format: "uri",
                          example: "https://pub-abc123.r2.dev/documents/resume-1234567890.pdf",
                          description: "Public URL of the uploaded file"
                        },
                        key: {
                          type: "string",
                          example: "documents/resume-1234567890.pdf",
                          description: "Storage key for the file"
                        },
                        fileId: {
                          type: "string",
                          example: "img_abc123xyz",
                          description: "File ID (ImageKit only, used for deletion)"
                        },
                        provider: {
                          type: "string",
                          example: "r2",
                          description: "Storage provider used"
                        }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  message: "File uploaded successfully",
                  data: {
                    url: "https://pub-abc123.r2.dev/documents/resume-1234567890.pdf",
                    key: "documents/resume-1234567890.pdf",
                    provider: "r2"
                  }
                }
              }
            }
          },
          400: {
            description: "Bad request - No file uploaded or invalid file type",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed."
                }
              }
            }
          },
          413: {
            description: "Payload too large - File exceeds 10MB limit",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "File size exceeds 10MB limit"
                }
              }
            }
          },
          500: {
            description: "Internal server error - Upload failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "File upload failed",
                  error: {
                    code: "STORAGE_ERROR"
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        summary: "Delete a file",
        description: "Delete a file from cloud storage (R2 or ImageKit). For R2, provide the file URL. For ImageKit, provide the fileId. No authentication required to support registration cleanup flows.",
        tags: ["File Upload"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    description: "File URL to delete (required for R2)"
                  },
                  fileId: {
                    type: "string",
                    description: "File ID to delete (required for ImageKit)"
                  },
                  provider: {
                    type: "string",
                    enum: ["r2", "imagekit"],
                    default: "r2",
                    description: "Storage provider"
                  }
                },
                oneOf: [
                  { required: ["url"] },
                  { required: ["fileId"] }
                ]
              },
              examples: {
                r2: {
                  summary: "Delete from R2",
                  value: {
                    url: "https://pub-abc123.r2.dev/documents/resume-1234567890.pdf",
                    provider: "r2"
                  }
                },
                imagekit: {
                  summary: "Delete from ImageKit",
                  value: {
                    fileId: "img_abc123xyz",
                    provider: "imagekit"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "File deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "File deleted successfully",
                  data: null
                }
              }
            }
          },
          400: {
            description: "Bad request - Missing required parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "URL is required"
                }
              }
            }
          },
          404: {
            description: "File not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "File not found"
                }
              }
            }
          },
          500: {
            description: "Internal server error - Deletion failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "File deletion failed",
                  error: {
                    code: "STORAGE_ERROR"
                  }
                }
              }
            }
          }
        }
      }
    },

    // Metrics Endpoints
    "/metrics": {
      get: {
        summary: "Get credit transfer system metrics",
        description: "Retrieve comprehensive metrics for the credit transfer system including request counts, processing times, approval rates, and performance statistics. Admin only. Used for monitoring system health and identifying bottlenecks.",
        tags: ["Admin", "Analytics"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Metrics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalRequests: { type: "integer", example: 150 },
                        pendingRequests: { type: "integer", example: 12 },
                        approvedRequests: { type: "integer", example: 120 },
                        rejectedRequests: { type: "integer", example: 18 },
                        avgProcessingTime: { type: "number", example: 2.5, description: "Average processing time in days" },
                        approvalRate: { type: "number", example: 0.87, description: "Approval rate (0-1)" },
                        mentorReviewTime: { type: "number", example: 1.2, description: "Average mentor review time in days" },
                        adminReviewTime: { type: "number", example: 1.3, description: "Average admin review time in days" }
                      }
                    },
                    timestamp: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  success: true,
                  data: {
                    totalRequests: 150,
                    pendingRequests: 12,
                    approvedRequests: 120,
                    rejectedRequests: 18,
                    avgProcessingTime: 2.5,
                    approvalRate: 0.87,
                    mentorReviewTime: 1.2,
                    adminReviewTime: 1.3
                  },
                  timestamp: "2024-01-15T10:30:00Z"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  message: "Admin access required"
                }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  error: {
                    message: "Failed to fetch metrics"
                  }
                }
              }
            }
          }
        }
      }
    },

    "/metrics/summary": {
      get: {
        summary: "Get metrics summary with logging",
        description: "Retrieve a summary of credit transfer metrics with detailed logging. Admin only. Provides high-level overview of system performance and key indicators.",
        tags: ["Admin", "Analytics"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Metrics summary retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        overview: {
                          type: "object",
                          properties: {
                            totalRequests: { type: "integer", example: 150 },
                            activeRequests: { type: "integer", example: 12 },
                            completedRequests: { type: "integer", example: 138 }
                          }
                        },
                        performance: {
                          type: "object",
                          properties: {
                            avgProcessingTime: { type: "number", example: 2.5 },
                            approvalRate: { type: "number", example: 0.87 }
                          }
                        },
                        trends: {
                          type: "object",
                          properties: {
                            requestsThisWeek: { type: "integer", example: 15 },
                            requestsLastWeek: { type: "integer", example: 12 },
                            growthRate: { type: "number", example: 0.25 }
                          }
                        }
                      }
                    },
                    timestamp: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  success: true,
                  data: {
                    overview: {
                      totalRequests: 150,
                      activeRequests: 12,
                      completedRequests: 138
                    },
                    performance: {
                      avgProcessingTime: 2.5,
                      approvalRate: 0.87
                    },
                    trends: {
                      requestsThisWeek: 15,
                      requestsLastWeek: 12,
                      growthRate: 0.25
                    }
                  },
                  timestamp: "2024-01-15T10:30:00Z"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },

    "/metrics/health": {
      get: {
        summary: "Check system health and get alerts",
        description: "Check the health of the credit transfer system and retrieve any active alerts. Admin only. Returns health status, active alerts, and system diagnostics. Returns 503 if system is unhealthy.",
        tags: ["Admin", "Analytics"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "System is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        healthy: { type: "boolean", example: true },
                        alerts: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              severity: { type: "string", enum: ["info", "warning", "critical"], example: "info" },
                              message: { type: "string", example: "System operating normally" },
                              timestamp: { type: "string", format: "date-time" }
                            }
                          }
                        },
                        metrics: {
                          type: "object",
                          properties: {
                            pendingRequests: { type: "integer", example: 12 },
                            overdueRequests: { type: "integer", example: 2 },
                            avgResponseTime: { type: "number", example: 1.5 }
                          }
                        }
                      }
                    },
                    timestamp: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  success: true,
                  data: {
                    healthy: true,
                    alerts: [],
                    metrics: {
                      pendingRequests: 12,
                      overdueRequests: 2,
                      avgResponseTime: 1.5
                    }
                  },
                  timestamp: "2024-01-15T10:30:00Z"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          503: {
            description: "Service unavailable - System is unhealthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    data: {
                      type: "object",
                      properties: {
                        healthy: { type: "boolean", example: false },
                        alerts: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              severity: { type: "string", example: "critical" },
                              message: { type: "string", example: "High number of overdue requests" },
                              timestamp: { type: "string", format: "date-time" }
                            }
                          }
                        }
                      }
                    },
                    timestamp: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  success: false,
                  data: {
                    healthy: false,
                    alerts: [
                      {
                        severity: "critical",
                        message: "High number of overdue requests",
                        timestamp: "2024-01-15T10:30:00Z"
                      }
                    ],
                    metrics: {
                      pendingRequests: 45,
                      overdueRequests: 20,
                      avgResponseTime: 5.2
                    }
                  },
                  timestamp: "2024-01-15T10:30:00Z"
                }
              }
            }
          }
        }
      }
    },

    "/metrics/reset": {
      post: {
        summary: "Reset all metrics",
        description: "Reset all credit transfer metrics to zero. Admin only. Used for testing and maintenance purposes. This action is logged for audit purposes.",
        tags: ["Admin", "Analytics"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Metrics reset successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "All metrics have been reset" },
                    timestamp: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  success: true,
                  message: "All metrics have been reset",
                  timestamp: "2024-01-15T10:30:00Z"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: {
                  success: false,
                  error: {
                    message: "Failed to reset metrics"
                  }
                }
              }
            }
          }
        }
      }
    },
        // Non-production Test Cleanup Endpoints
    "/test/firebase-users": {
      delete: {
        summary: "Clear all Firebase users (Non-production only)",
        description: "Delete all Firebase authentication users. This endpoint is only available in non-production environments and is used for cleaning up test data. Returns 403 Forbidden in production.",
        tags: ["Testing"],
        security: [],
        responses: {
          200: {
            description: "All Firebase users deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "All Firebase users deleted successfully",
                  data: {
                    deletedCount: 42
                  }
                }
              }
            }
          },
          403: {
            description: "Forbidden - Endpoint disabled in production",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "This endpoint is disabled in production"
                }
              }
            }
          }
        }
      }
    },

    "/test/mongo-data": {
      delete: {
        summary: "Clear all MongoDB data (Non-production only)",
        description: "Delete all data from MongoDB collections (Students, Companies, Mentors, Admins). This endpoint is only available in non-production environments and is used for cleaning up test data. Returns 403 Forbidden in production.",
        tags: ["Testing"],
        security: [],
        responses: {
          200: {
            description: "All MongoDB data cleared successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse"
                },
                example: {
                  success: true,
                  message: "All MongoDB data cleared successfully",
                  data: {
                    students: 15,
                    companies: 8,
                    mentors: 5,
                    admins: 2
                  }
                }
              }
            }
          },
          403: {
            description: "Forbidden - Endpoint disabled in production",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error"
                },
                example: {
                  success: false,
                  message: "This endpoint is disabled in production"
                }
              }
            }
          }
        }
      }

  }
        },



};

export default openapi;
