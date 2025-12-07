// ==================== Student Routes ====================
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7

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
            schema: {
              allOf: [
                { $ref: "#/components/schemas/SuccessResponse" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        student: { $ref: "#/components/schemas/Student" },
                        mentor: { $ref: "#/components/schemas/Mentor" },
                        activeInternships: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Internship" }
                        },
                        recentApplications: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Application" }
                        },
                        upcomingDeadlines: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              internshipId: { type: "string" },
                              title: { type: "string" },
                              deadline: { type: "string", format: "date-time" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            },
            example: {
              success: true,
              message: "Dashboard data retrieved successfully",
              data: {
                student: {
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
                mentor: {
                  mentorId: "MEN-2024001",
                  profile: {
                    name: "Dr. Anjali Verma",
                    department: "Computer Science",
                    designation: "Associate Professor"
                  }
                },
                activeInternships: [],
                recentApplications: [
                  {
                    applicationId: "APP-2024001",
                    internshipId: "INT-2024001",
                    status: "pending",
                    appliedAt: "2024-01-15T10:30:00Z"
                  }
                ],
                upcomingDeadlines: [
                  {
                    internshipId: "INT-2024002",
                    title: "Backend Developer Intern",
                    deadline: "2024-02-01T23:59:59Z"
                  }
                ]
              }
            }
          }
        }
      },
      401: {
        description: "Unauthorized - invalid or missing token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Unauthorized",
              error: { code: "UNAUTHORIZED" }
            }
          }
        }
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      }
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
                    rollNumber: "CS2021001",
                    phone: "+91-9876543210",
                    bio: "Passionate about web development and AI",
                    skills: ["JavaScript", "React", "Python", "Machine Learning"],
                    interests: ["Web Development", "AI/ML", "Cloud Computing"],
                    resumeUrl: "https://storage.example.com/resumes/STU-2024001.pdf",
                    profileImage: "https://storage.example.com/profiles/STU-2024001.jpg"
                  },
                  readinessScore: 75,
                  completedModules: ["MOD-001", "MOD-002"],
                  credits: {
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
                  },
                  completedInternships: 2,
                  certifications: [
                    {
                      type: "Internship Completion",
                      companyName: "Tech Corp",
                      position: "Software Developer Intern",
                      creditsEarned: 4,
                      completedAt: "2023-12-10T00:00:00Z"
                    }
                  ],
                  interviewAttempts: 5
                }
              }
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
  }
},

// Internship Discovery (Requirements: 2.2)
"/students/internships": {
  get: {
    summary: "Browse available internships with filtering and AI match scores",
    description: "Browse mentor-approved internships for the student's department with comprehensive filtering options (location, work mode, skills, stipend range, search query). Optionally include AI-powered match scores that analyze student profile compatibility with each internship.",
    tags: ["Students", "Students - Internships", "Internship Lifecycle"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1, minimum: 1 },
        description: "Page number for pagination",
        example: 1
      },
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        description: "Number of items per page",
        example: 20
      },
      {
        name: "location",
        in: "query",
        schema: { type: "string" },
        description: "Filter by location (city or state)",
        example: "Mumbai, Maharashtra"
      },
      {
        name: "workMode",
        in: "query",
        schema: { type: "string", enum: ["remote", "onsite", "hybrid"] },
        description: "Filter by work mode",
        example: "hybrid"
      },
      {
        name: "skills",
        in: "query",
        schema: { type: "string" },
        description: "Comma-separated list of required skills",
        example: "JavaScript,React,Node.js"
      },
      {
        name: "minStipend",
        in: "query",
        schema: { type: "number", minimum: 0 },
        description: "Minimum monthly stipend in INR",
        example: 10000
      },
      {
        name: "maxStipend",
        in: "query",
        schema: { type: "number", minimum: 0 },
        description: "Maximum monthly stipend in INR",
        example: 25000
      },
      {
        name: "search",
        in: "query",
        schema: { type: "string" },
        description: "Search query for title, description, or company name",
        example: "full stack developer"
      },
      {
        name: "includeMatchScore",
        in: "query",
        schema: { type: "boolean", default: false },
        description: "Include AI-powered match scores (requires additional processing)",
        example: true
      }
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
                          items: {
                            allOf: [
                              { $ref: "#/components/schemas/Internship" },
                              {
                                type: "object",
                                properties: {
                                  matchScore: {
                                    type: "number",
                                    description: "AI match score (0-100) if includeMatchScore=true"
                                  },
                                  matchAnalysis: {
                                    type: "object",
                                    description: "AI match analysis if includeMatchScore=true"
                                  }
                                }
                              }
                            ]
                          }
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
                    companyId: "COM-2024001",
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
                    appliedCount: 15,
                    startDate: "2024-06-01",
                    applicationDeadline: "2024-05-15T23:59:59Z",
                    matchScore: 85,
                    matchAnalysis: {
                      strengths: ["Strong JavaScript skills", "React experience"],
                      gaps: ["Limited Node.js experience"]
                    }
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
      400: {
        description: "Invalid query parameters",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Invalid parameters",
              error: {
                code: "VALIDATION_ERROR",
                details: { minStipend: "Must be a positive number" }
              }
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
  }
},

"/students/internships/recommended": {
  get: {
    summary: "Get AI-recommended internships based on student profile",
    description: "Retrieve personalized internship recommendations using AI analysis of student's skills, interests, completed modules, and career goals. Recommendations are ranked by match score and relevance.",
    tags: ["Students", "Students - Internships", "AI Services"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 10, minimum: 1, maximum: 50 },
        description: "Number of recommendations to return",
        example: 10
      }
    ],
    responses: {
      200: {
        description: "Recommended internships retrieved successfully",
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
                        recommendations: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              internship: { $ref: "#/components/schemas/Internship" },
                              matchScore: { type: "number", example: 92 },
                              reasoning: {
                                type: "string",
                                example: "Excellent match based on your JavaScript and React skills"
                              },
                              strengths: {
                                type: "array",
                                items: { type: "string" },
                                example: ["Skill alignment", "Career path fit"]
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            },
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
                      department: "Computer Science",
                      requiredSkills: ["JavaScript", "React", "Node.js"],
                      stipend: 15000,
                      location: "Mumbai, Maharashtra",
                      workMode: "hybrid"
                    },
                    matchScore: 92,
                    reasoning: "Excellent match based on your JavaScript and React skills. Your completed web development modules align perfectly with this role.",
                    strengths: ["Strong skill alignment", "Career path fit", "Location preference match"]
                  }
                ]
              }
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
        description: "Rate limit exceeded for AI features",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      }
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
            schema: {
              allOf: [
                { $ref: "#/components/schemas/SuccessResponse" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        completedInternships: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              internshipCompletionId: { type: "string" },
                              internshipId: { type: "string" },
                              title: { type: "string" },
                              companyName: { type: "string" },
                              startDate: { type: "string", format: "date" },
                              endDate: { type: "string", format: "date" },
                              durationWeeks: { type: "integer" },
                              canRequestCredits: { type: "boolean" },
                              creditRequestStatus: {
                                type: "string",
                                enum: ["none", "pending", "approved", "rejected"]
                              },
                              creditRequestId: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            },
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
                  },
                  {
                    internshipCompletionId: "IC-2023045",
                    internshipId: "INT-2023020",
                    title: "Data Analyst Intern",
                    companyName: "Analytics Inc",
                    startDate: "2023-01-01",
                    endDate: "2023-06-01",
                    durationWeeks: 20,
                    canRequestCredits: false,
                    creditRequestStatus: "approved",
                    creditRequestId: "CR-2023015"
                  }
                ]
              }
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
  }
},

"/students/internships/{internshipId}": {
  get: {
    summary: "Get detailed internship information with AI match analysis",
    description: "Retrieve complete internship details including company information, requirements, responsibilities, learning opportunities, and AI-powered match analysis showing how well the student's profile aligns with the internship requirements.",
    tags: ["Students", "Students - Internships", "Internship Lifecycle"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "internshipId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Internship ID",
        example: "INT-2024001"
      }
    ],
    responses: {
      200: {
        description: "Internship details retrieved successfully",
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
                        internship: { $ref: "#/components/schemas/Internship" },
                        company: {
                          type: "object",
                          properties: {
                            companyId: { type: "string" },
                            companyName: { type: "string" },
                            about: { type: "string" },
                            website: { type: "string" },
                            logoUrl: { type: "string" }
                          }
                        },
                        matchAnalysis: {
                          type: "object",
                          properties: {
                            matchScore: { type: "number" },
                            skillsMatch: {
                              type: "object",
                              properties: {
                                matched: { type: "array", items: { type: "string" } },
                                missing: { type: "array", items: { type: "string" } }
                              }
                            },
                            strengths: { type: "array", items: { type: "string" } },
                            recommendations: { type: "array", items: { type: "string" } },
                            eligibility: {
                              type: "object",
                              properties: {
                                isEligible: { type: "boolean" },
                                reasons: { type: "array", items: { type: "string" } }
                              }
                            }
                          }
                        },
                        hasApplied: { type: "boolean" },
                        applicationId: { type: "string" }
                      }
                    }
                  }
                }
              ]
            },
            example: {
              success: true,
              message: "Internship details retrieved successfully",
              data: {
                internship: {
                  internshipId: "INT-2024001",
                  title: "Full Stack Developer Intern",
                  description: "Work on exciting web development projects using modern technologies",
                  department: "Computer Science",
                  requiredSkills: ["JavaScript", "React", "Node.js"],
                  optionalSkills: ["TypeScript", "Docker"],
                  duration: "6 months",
                  stipend: 15000,
                  location: "Mumbai, Maharashtra",
                  workMode: "hybrid",
                  status: "open_for_applications",
                  slots: 5,
                  slotsRemaining: 3,
                  startDate: "2024-06-01",
                  applicationDeadline: "2024-05-15T23:59:59Z",
                  responsibilities: [
                    "Develop new features",
                    "Write unit tests",
                    "Participate in code reviews"
                  ],
                  learningOpportunities: [
                    "Mentorship from senior developers",
                    "Exposure to production systems"
                  ]
                },
                company: {
                  companyId: "COM-2024001",
                  companyName: "Tech Innovations Pvt Ltd",
                  about: "Leading technology company specializing in AI and cloud solutions",
                  website: "https://techinnovations.com",
                  logoUrl: "https://storage.example.com/logos/COM-2024001.png"
                },
                matchAnalysis: {
                  matchScore: 85,
                  skillsMatch: {
                    matched: ["JavaScript", "React"],
                    missing: ["Node.js"]
                  },
                  strengths: [
                    "Strong frontend skills",
                    "Relevant coursework completed",
                    "Good readiness score"
                  ],
                  recommendations: [
                    "Complete Node.js module before applying",
                    "Highlight your React projects in cover letter"
                  ],
                  eligibility: {
                    isEligible: true,
                    reasons: ["Meets year requirement", "Sufficient readiness score"]
                  }
                },
                hasApplied: false,
                applicationId: null
              }
            }
          }
        }
      },
      404: {
        description: "Internship not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Internship not found",
              error: { code: "NOT_FOUND" }
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
  }
},

// Application Management (Requirements: 2.3)
"/students/internships/{internshipId}/apply": {
  post: {
    summary: "Apply to an internship",
    description: "Submit an application to an internship with cover letter and optional resume. Creates notifications for the company and mentor. Validates eligibility, deadline, and duplicate applications.",
    tags: ["Students", "Students - Applications", "Application Flow"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "internshipId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Internship ID to apply to",
        example: "INT-2024001"
      }
    ],
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
                  companyId: "COM-2024001",
                  department: "Computer Science",
                  status: "pending",
                  appliedAt: "2024-01-20T14:30:00Z",
                  coverLetter: "I am excited to apply...",
                  resumeUrl: "https://storage.example.com/resumes/STU-2024001.pdf"
                }
              }
            }
          }
        }
      },
      400: {
        description: "Invalid request - deadline passed, already applied, or validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Application deadline has passed",
              error: { code: "DEADLINE_PASSED" }
            }
          }
        }
      },
      403: {
        description: "Not eligible - doesn't meet requirements",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "You do not meet the eligibility requirements",
              error: {
                code: "NOT_ELIGIBLE",
                details: { reason: "Minimum readiness score not met" }
              }
            }
          }
        }
      },
      404: {
        description: "Internship not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      409: {
        description: "Duplicate application - already applied to this internship",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "You have already applied to this internship",
              error: { code: "DUPLICATE_APPLICATION" }
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
  }
},

"/students/applications": {
  get: {
    summary: "List all student applications with status and feedback",
    description: "Retrieve paginated list of all applications submitted by the student with current status, company feedback, mentor approval status, and timeline. Supports filtering by application status.",
    tags: ["Students", "Students - Applications", "Application Flow"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "status",
        in: "query",
        schema: {
          type: "string",
          enum: ["pending", "mentor_approved", "shortlisted", "accepted", "rejected", "withdrawn"]
        },
        description: "Filter by application status",
        example: "pending"
      },
      {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1, minimum: 1 },
        description: "Page number",
        example: 1
      },
      {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        description: "Items per page",
        example: 20
      }
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
                    studentId: "STU-2024001",
                    internshipId: "INT-2024001",
                    companyId: "COM-2024001",
                    department: "Computer Science",
                    status: "shortlisted",
                    appliedAt: "2024-01-20T14:30:00Z",
                    coverLetter: "I am excited to apply...",
                    mentorApproval: {
                      status: "approved",
                      mentorId: "MEN-001",
                      approvedAt: "2024-01-21T10:00:00Z",
                      comments: "Strong candidate"
                    },
                    companyFeedback: {
                      status: "shortlisted",
                      reviewedAt: "2024-01-22T15:00:00Z",
                      feedback: "Impressive background",
                      nextSteps: "Schedule technical interview"
                    },
                    cachedInternshipData: {
                      title: "Full Stack Developer Intern",
                      companyName: "Tech Innovations Pvt Ltd",
                      startDate: "2024-06-01"
                    }
                  }
                ],
                pagination: {
                  currentPage: 1,
                  totalPages: 2,
                  totalItems: 25,
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
        description: "Invalid query parameters",
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

"/students/applications/{applicationId}": {
  get: {
    summary: "Get detailed application information with complete timeline",
    description: "Retrieve complete application details including internship information, mentor approval status, company feedback, AI ranking analysis, and full timeline of all events and status changes.",
    tags: ["Students", "Students - Applications", "Application Flow"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "applicationId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Application ID",
        example: "APP-2024015"
      }
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
              message: "Application details retrieved successfully",
              data: {
                application: {
                  applicationId: "APP-2024015",
                  studentId: "STU-2024001",
                  internshipId: "INT-2024001",
                  companyId: "COM-2024001",
                  department: "Computer Science",
                  status: "shortlisted",
                  appliedAt: "2024-01-20T14:30:00Z",
                  coverLetter: "I am excited to apply for this position...",
                  resumeUrl: "https://storage.example.com/resumes/STU-2024001.pdf",
                  mentorApproval: {
                    status: "approved",
                    mentorId: "MEN-001",
                    approvedAt: "2024-01-21T10:00:00Z",
                    comments: "Strong candidate with good technical skills",
                    recommendedPreparation: ["Review React documentation", "Practice coding interviews"]
                  },
                  companyFeedback: {
                    status: "shortlisted",
                    reviewedAt: "2024-01-22T15:00:00Z",
                    feedback: "Impressive background and strong cover letter",
                    nextSteps: "Schedule technical interview for next week"
                  },
                  aiRanking: {
                    matchScore: 85,
                    reasoning: "Strong skill match with required technologies",
                    strengths: ["Relevant coursework", "Strong technical skills"],
                    concerns: ["Limited industry experience"],
                    recommendation: "Strongly recommend for interview"
                  },
                  timeline: [
                    {
                      event: "Application submitted",
                      timestamp: "2024-01-20T14:30:00Z",
                      performedBy: "STU-2024001"
                    },
                    {
                      event: "Mentor approved",
                      timestamp: "2024-01-21T10:00:00Z",
                      performedBy: "MEN-001",
                      notes: "Strong candidate"
                    },
                    {
                      event: "Company shortlisted",
                      timestamp: "2024-01-22T15:00:00Z",
                      performedBy: "COM-2024001"
                    }
                  ],
                  cachedInternshipData: {
                    title: "Full Stack Developer Intern",
                    companyName: "Tech Innovations Pvt Ltd",
                    department: "Computer Science",
                    startDate: "2024-06-01",
                    applicationDeadline: "2024-05-15T23:59:59Z"
                  }
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
  delete: {
    summary: "Withdraw an application",
    description: "Withdraw a submitted application. Only allowed if application is in 'pending', 'mentor_approved', or 'shortlisted' status. Cannot withdraw after acceptance or rejection.",
    tags: ["Students", "Students - Applications", "Application Flow"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "applicationId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Application ID to withdraw",
        example: "APP-2024015"
      }
    ],
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
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Cannot withdraw application in current status",
              error: {
                code: "INVALID_STATUS",
                details: { currentStatus: "accepted" }
              }
            }
          }
        }
      },
      404: {
        description: "Application not found",
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
            activities: "Worked on implementing user authentication module, participated in code reviews, and attended team meetings.",
            tasksCompleted: ["Implemented login API", "Fixed authentication bugs", "Wrote unit tests"],
            skillsUsed: ["JavaScript", "React", "Node.js", "JWT"],
            challenges: "Faced issues with JWT token expiration handling, resolved with mentor guidance.",
            learnings: "Learned about secure authentication practices and token management.",
            attachments: ["https://storage.example.com/screenshots/week3-1.png"]
          }
        }
      }
    },
    responses: {
      201: {
        description: "Logbook submitted successfully",
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
                        logbook: { $ref: "#/components/schemas/Logbook" }
                      }
                    }
                  }
                }
              ]
            },
            example: {
              success: true,
              message: "Logbook submitted successfully",
              data: {
                logbook: {
                  logbookId: "LOG-2024015",
                  studentId: "STU-2024001",
                  internshipId: "INT-2024001",
                  companyId: "COM-2024001",
                  weekNumber: 3,
                  startDate: "2024-06-15",
                  endDate: "2024-06-21",
                  hoursWorked: 40,
                  activities: "Worked on implementing user authentication module...",
                  tasksCompleted: ["Implemented login API", "Fixed authentication bugs"],
                  skillsUsed: ["JavaScript", "React", "Node.js", "JWT"],
                  challenges: "Faced issues with JWT token expiration handling...",
                  learnings: "Learned about secure authentication practices...",
                  status: "submitted",
                  submittedAt: "2024-06-22T10:00:00Z",
                  aiSummary: {
                    summary: "Student demonstrated strong progress in authentication implementation",
                    keySkillsDemonstrated: ["Backend Development", "Security", "Problem Solving"],
                    estimatedProductivity: "high"
                  }
                }
              }
            }
          }
        }
      },
      400: {
        description: "Validation error - invalid data or duplicate week",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Logbook for this week already exists",
              error: { code: "DUPLICATE_WEEK" }
            }
          }
        }
      },
      404: {
        description: "Internship not found or not active",
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
  },
  get: {
    summary: "Get all logbook entries for student",
    description: "Retrieve all logbook entries submitted by the student across all internships, with mentor and company feedback, AI summaries, and review status.",
    tags: ["Students", "Students - Logbooks", "Logbook Flow"],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: "internshipId",
        in: "query",
        schema: { type: "string" },
        description: "Filter by specific internship",
        example: "INT-2024001"
      },
      {
        name: "status",
        in: "query",
        schema: {
          type: "string",
          enum: ["draft", "submitted", "pending_mentor_review", "approved", "needs_revision"]
        },
        description: "Filter by review status",
        example: "approved"
      }
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
                    startDate: "2024-06-15",
                    endDate: "2024-06-21",
                    hoursWorked: 40,
                    activities: "Worked on implementing user authentication module...",
                    status: "approved",
                    submittedAt: "2024-06-22T10:00:00Z",
                    mentorReview: {
                      status: "approved",
                      reviewedBy: "MEN-001",
                      reviewedAt: "2024-06-23T14:00:00Z",
                      comments: "Excellent progress this week!",
                      creditsApproved: 0.5
                    },
                    companyFeedback: {
                      rating: 4,
                      comments: "Great work on the authentication module",
                      providedAt: "2024-06-24T09:00:00Z"
                    },
                    aiSummary: {
                      summary: "Student demonstrated strong progress",
                      keySkillsDemonstrated: ["Backend Development", "Security"],
                      estimatedProductivity: "high"
                    }
                  }
                ]
              }
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
            schema: {
              allOf: [
                { $ref: "#/components/schemas/SuccessResponse" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        modules: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              code: { type: "string", example: "MOD-003" },
                              title: { type: "string", example: "Advanced Node.js" },
                              description: { type: "string" },
                              duration: { type: "string", example: "4 weeks" },
                              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                              skills: { type: "array", items: { type: "string" } },
                              recommendationReason: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            },
            example: {
              success: true,
              message: "Recommended modules retrieved successfully",
              data: {
                modules: [
                  {
                    code: "MOD-003",
                    title: "Advanced Node.js Development",
                    description: "Learn advanced Node.js concepts including streams, clustering, and performance optimization",
                    duration: "4 weeks",
                    difficulty: "intermediate",
                    skills: ["Node.js", "Backend Development", "Performance Optimization"],
                    recommendationReason: "This module addresses the Node.js skill gap identified in your recent internship applications"
                  }
                ]
              }
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
  }
},

"/students/modules/start": {
  post: {
    summary: "Start a learning module",
    description: "Begin a learning module and track progress. Updates student's module progress and readiness score.",
    tags: ["Students", "Students - Learning"],
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/StartModuleRequest" },
          example: {
            moduleCode: "MOD-003"
          }
        }
      }
    },
    responses: {
      200: {
        description: "Module started successfully",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
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
      400: {
        description: "Module already started or completed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      404: {
        description: "Module not found",
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

"/students/modules/complete": {
  post: {
    summary: "Complete a learning module",
    description: "Mark a learning module as completed with optional score. Updates student's completed modules list and recalculates readiness score.",
    tags: ["Students", "Students - Learning"],
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CompleteModuleRequest" },
          example: {
            moduleCode: "MOD-003",
            score: 85
          }
        }
      }
    },
    responses: {
      200: {
        description: "Module completed successfully",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
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
      400: {
        description: "Module not started or already completed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      404: {
        description: "Module not found",
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

// Interview Practice (Requirements: 2.6)
"/students/interviews/start": {
  post: {
    summary: "Start AI-powered mock interview session",
    description: "Begin an AI-powered mock interview practice session. Specify domain (e.g., 'web development', 'data science') and difficulty level. AI generates relevant technical questions.",
    tags: ["Students", "Students - Interview Practice", "AI Services"],
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/StartInterviewRequest" },
          example: {
            domain: "web development",
            difficulty: "intermediate"
          }
        }
      }
    },
    responses: {
      201: {
        description: "Interview session started successfully",
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
                        sessionId: { type: "string" },
                        domain: { type: "string" },
                        difficulty: { type: "string" },
                        firstQuestion: { type: "string" },
                        startedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              ]
            },
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
      400: {
        description: "Invalid domain or difficulty",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      429: {
        description: "Rate limit exceeded for AI features",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              success: false,
              message: "Daily interview limit reached. Try again tomorrow.",
              error: { code: "RATE_LIMIT_EXCEEDED" }
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
  }
},

"/students/interviews/answer": {
  post: {
    summary: "Submit answer to interview question",
    description: "Submit an answer to the current interview question. AI evaluates the answer and provides feedback, then generates the next question or concludes the interview.",
    tags: ["Students", "Students - Interview Practice", "AI Services"],
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/SubmitInterviewAnswerRequest" },
          example: {
            sessionId: "IS-2024001",
            answer: "var is function-scoped and can be redeclared, let is block-scoped and cannot be redeclared, and const is also block-scoped but cannot be reassigned after initialization."
          }
        }
      }
    },
    responses: {
      200: {
        description: "Answer evaluated successfully",
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
                        feedback: { type: "string" },
                        score: { type: "number" },
                        nextQuestion: { type: "string" },
                        isComplete: { type: "boolean" }
                      }
                    }
                  }
                }
              ]
            },
            example: {
              success: true,
              message: "Answer evaluated",
              data: {
                feedback: "Good answer! You correctly identified the key differences. You could also mention hoisting behavior.",
                score: 8,
                nextQuestion: "What is the event loop in JavaScript and how does it work?",
                isComplete: false
              }
            }
          }
        }
      },
      404: {
        description: "Session not found or expired",
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

"/students/interviews/end": {
  post: {
    summary: "End interview session and get final report",
    description: "End the current interview session and receive a comprehensive performance report with overall score, strengths, areas for improvement, and recommendations.",
    tags: ["Students", "Students - Interview Practice", "AI Services"],
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/EndInterviewRequest" },
          example: {
            sessionId: "IS-2024001"
          }
        }
      }
    },
    responses: {
      200: {
        description: "Interview session ended successfully",
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
                        sessionId: { type: "string" },
                        overallScore: { type: "number" },
                        questionsAnswered: { type: "integer" },
                        strengths: { type: "array", items: { type: "string" } },
                        areasForImprovement: { type: "array", items: { type: "string" } },
                        recommendations: { type: "array", items: { type: "string" } },
                        duration: { type: "string" }
                      }
                    }
                  }
                }
              ]
            },
            example: {
              success: true,
              message: "Interview session completed",
              data: {
                sessionId: "IS-2024001",
                overallScore: 7.5,
                questionsAnswered: 5,
                strengths: ["Good understanding of JavaScript fundamentals", "Clear explanations"],
                areasForImprovement: ["Async programming concepts", "Performance optimization"],
                recommendations: ["Study promises and async/await", "Practice algorithm problems"],
                duration: "25 minutes"
              }
            }
          }
        }
      },
      404: {
        description: "Session not found",
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
            schema: {
              allOf: [
                { $ref: "#/components/schemas/SuccessResponse" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        sessions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              sessionId: { type: "string" },
                              domain: { type: "string" },
                              difficulty: { type: "string" },
                              overallScore: { type: "number" },
                              questionsAnswered: { type: "integer" },
                              completedAt: { type: "string", format: "date-time" }
                            }
                          }
                        },
                        totalAttempts: { type: "integer" },
                        averageScore: { type: "number" }
                      }
                    }
                  }
                }
              ]
            },
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
