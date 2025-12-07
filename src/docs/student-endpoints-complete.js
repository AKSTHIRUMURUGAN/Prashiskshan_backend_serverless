// This file contains comprehensive student endpoint documentation
// To be integrated into openapi.mjs

export const studentEndpoints = {
  // Dashboard and Profile
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
  }
};
