// Company Endpoints Documentation - Complete
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8

export const companyEndpoints = {
  // Company Dashboard and Profile (Requirements: 3.1)
  "/companies/dashboard": {
    get: {
      summary: "Get company dashboard overview",
      description: "Retrieve comprehensive dashboard data including active internships, application statistics, intern progress, pending reviews, and recent activity. Provides a complete overview of company's internship program status.",
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
                  stats: {
                    activeInternships: 5,
                    totalApplications: 127,
                    pendingReview: 23,
                    activeInterns: 12,
                    completedInternships: 8
                  },
                  recentApplications: [
                    {
                      applicationId: "APP-2024050",
                      studentName: "Rahul Sharma",
                      internshipTitle: "Full Stack Developer Intern",
                      appliedAt: "2024-02-15T10:30:00Z",
                      status: "pending"
                    }
                  ],
                  upcomingDeadlines: [
                    {
                      internshipId: "INT-2024010",
                      title: "Backend Developer Intern",
                      applicationDeadline: "2024-03-01T23:59:59Z",
                      daysRemaining: 5
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

  "/companies/profile": {
    get: {
      summary: "Get company profile",
      description: "Retrieve complete company profile including verification status, documents, point of contact, statistics, and reappeal information if applicable.",
      tags: ["Companies", "Companies - Profile"],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "Company profile retrieved successfully",
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
                          company: { $ref: "#/components/schemas/Company" }
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
                  company: {
                    companyId: "COM-2024001",
                    companyName: "Tech Innovations Pvt Ltd",
                    email: "hr@techinnovations.com",
                    status: "verified",
                    stats: {
                      totalInternshipsPosted: 15,
                      activeInternships: 3,
                      studentsHired: 25,
                      avgRating: 4.5
                    }
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
    },
    patch: {
      summary: "Update company profile",
      description: "Update company profile information including contact details, point of contact, and address. Verified companies can update most fields without re-verification.",
      tags: ["Companies", "Companies - Profile"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                phone: { type: "string", example: "+91-22-87654321" },
                address: { type: "string", example: "456 New Tech Park, Powai, Mumbai, Maharashtra 400076" },
                website: { type: "string", format: "uri", example: "https://techinnovations.com" },
                about: { type: "string", example: "Updated company description" },
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
              pointOfContact: {
                name: "Amit Kumar",
                email: "amit.kumar@techinnovations.com",
                phone: "+91-9123456789",
                designation: "Senior HR Manager"
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
              example: {
                success: true,
                message: "Profile updated successfully",
                data: {
                  company: {
                    companyId: "COM-2024001",
                    phone: "+91-22-87654321",
                    address: "456 New Tech Park, Powai, Mumbai, Maharashtra 400076"
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

  // Company Internship Management (Requirements: 3.1, 3.2)
  "/companies/internships": {
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
                description: { type: "string", minLength: 100, maxLength: 5000, example: "Join our dynamic team to work on cutting-edge web applications..." },
                department: { type: "string", example: "Computer Science" },
                duration: { type: "string", example: "6 months" },
                requiredSkills: { 
                  type: "array", 
                  items: { type: "string" }, 
                  minItems: 1,
                  example: ["JavaScript", "React", "Node.js", "MongoDB"] 
                },
                optionalSkills: { 
                  type: "array", 
                  items: { type: "string" },
                  example: ["TypeScript", "Docker", "AWS"] 
                },
                startDate: { type: "string", format: "date", example: "2024-06-01" },
                applicationDeadline: { type: "string", format: "date-time", example: "2024-05-15T23:59:59Z" },
                slots: { type: "integer", minimum: 1, maximum: 50, example: 5 },
                stipend: { type: "number", minimum: 0, example: 15000 },
                location: { type: "string", example: "Mumbai, Maharashtra" },
                workMode: { type: "string", enum: ["remote", "onsite", "hybrid"], example: "hybrid" },
                responsibilities: { 
                  type: "array", 
                  items: { type: "string" },
                  example: [
                    "Develop and maintain web applications",
                    "Participate in code reviews",
                    "Collaborate with cross-functional teams"
                  ]
                },
                learningOpportunities: { 
                  type: "array", 
                  items: { type: "string" },
                  example: [
                    "Hands-on experience with modern web technologies",
                    "Mentorship from senior developers",
                    "Exposure to agile development practices"
                  ]
                },
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
              description: "Join our dynamic team to work on cutting-edge web applications using React, Node.js, and MongoDB. You'll collaborate with experienced developers, participate in code reviews, and contribute to real-world projects that impact thousands of users.",
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
              responsibilities: [
                "Develop and maintain web applications",
                "Participate in code reviews",
                "Collaborate with cross-functional teams"
              ],
              learningOpportunities: [
                "Hands-on experience with modern web technologies",
                "Mentorship from senior developers",
                "Exposure to agile development practices"
              ],
              eligibilityRequirements: {
                minYear: 2,
                maxYear: 4,
                minReadinessScore: 60,
                requiredDepartments: ["Computer Science", "Information Technology"]
              }
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
                    aiTagging: {
                      status: "processing",
                      message: "AI tags will be generated shortly"
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
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                message: "Validation failed",
                error: {
                  code: "VALIDATION_ERROR",
                  details: {
                    title: "Title must be at least 10 characters",
                    applicationDeadline: "Application deadline must be before start date"
                  }
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
      summary: "Get all company internships",
      description: "Retrieve paginated list of all internships posted by the company with filtering by status. Includes application counts, slot availability, and current workflow status.",
      tags: ["Companies", "Companies - Internships", "Internship Lifecycle"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "status",
          in: "query",
          schema: { 
            type: "string",
            enum: ["draft", "pending_admin_verification", "admin_approved", "admin_rejected", "mentor_rejected", "open_for_applications", "closed", "cancelled"]
          },
          description: "Filter by internship status",
          example: "open_for_applications"
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
        },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", enum: ["postedAt", "applicationDeadline", "startDate", "appliedCount"], default: "postedAt" },
          description: "Sort field",
          example: "postedAt"
        },
        {
          name: "sortOrder",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Sort order",
          example: "desc"
        }
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
                  pagination: {
                    currentPage: 1,
                    totalPages: 3,
                    totalItems: 15,
                    itemsPerPage: 20
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

  "/companies/internships/{internshipId}": {
    get: {
      summary: "Get internship details",
      description: "Retrieve complete details of a specific internship including AI tags, application statistics, workflow status, and audit trail.",
      tags: ["Companies", "Companies - Internships", "Internship Lifecycle"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "internshipId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Internship ID",
          example: "INT-2024050"
        }
      ],
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
                    internshipId: "INT-2024050",
                    title: "Full Stack Developer Intern",
                    description: "Join our dynamic team...",
                    status: "open_for_applications",
                    companyId: "COM-2024001",
                    department: "Computer Science",
                    duration: "6 months",
                    requiredSkills: ["JavaScript", "React", "Node.js"],
                    slots: 5,
                    slotsRemaining: 3,
                    appliedCount: 45,
                    aiTags: {
                      primarySkills: ["Web Development", "Full Stack"],
                      difficulty: "intermediate",
                      careerPath: ["Software Engineer", "Full Stack Developer"],
                      industryFit: ["Technology", "Software"]
                    },
                    adminReview: {
                      status: "approved",
                      reviewedBy: "ADM-001",
                      reviewedAt: "2024-02-16T14:00:00Z"
                    },
                    mentorApproval: {
                      status: "approved",
                      approvedBy: "MEN-2024001",
                      approvedAt: "2024-02-17T10:00:00Z"
                    }
                  }
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
    patch: {
      summary: "Update internship details",
      description: "Update internship information. If the internship is already approved, updating it will reset status to 'pending_admin_verification' for re-review. Only internships in draft, pending, or rejected status can be freely updated.",
      tags: ["Companies", "Companies - Internships", "Internship Lifecycle"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "internshipId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Internship ID",
          example: "INT-2024050"
        }
      ],
      requestBody: {
        required: true,
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
                workMode: { type: "string", enum: ["remote", "onsite", "hybrid"] },
                responsibilities: { type: "array", items: { type: "string" } },
                learningOpportunities: { type: "array", items: { type: "string" } }
              }
            },
            example: {
              stipend: 18000,
              workMode: "remote",
              optionalSkills: ["TypeScript", "Docker", "AWS", "GraphQL"]
            }
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
                data: {
                  internship: {
                    internshipId: "INT-2024050",
                    status: "pending_admin_verification",
                    updatedAt: "2024-02-20T15:00:00Z"
                  }
                }
              }
            }
          }
        },
        400: {
          description: "Cannot update - internship is closed or cancelled",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" }
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
      summary: "Cancel internship",
      description: "Cancel an internship posting. Sets status to 'cancelled'. Notifies all applicants. Cannot cancel internships with accepted interns.",
      tags: ["Companies", "Companies - Internships", "Internship Lifecycle"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "internshipId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Internship ID",
          example: "INT-2024050"
        }
      ],
      responses: {
        200: {
          description: "Internship cancelled successfully",
          content: {
            "application/json": {
              example: {
                success: true,
                message: "Internship cancelled successfully. All applicants have been notified.",
                data: {
                  internshipId: "INT-2024050",
                  status: "cancelled",
                  cancelledAt: "2024-02-20T16:00:00Z",
                  notifiedApplicants: 45
                }
              }
            }
          }
        },
        400: {
          description: "Cannot cancel - has accepted interns",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                message: "Cannot cancel internship with accepted interns",
                error: { code: "HAS_ACCEPTED_INTERNS" }
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
