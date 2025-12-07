// Complete Company Endpoints Documentation
// This file contains the complete company endpoints to be inserted into openapi.mjs
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8

// Copy this content and replace the company section in openapi.mjs (lines 4207-4425)

const companyEndpoints = `
    // Company Routes (Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8)
    "/companies/dashboard": { 
      get: { 
        summary: "Get company dashboard overview", 
        description: "Retrieve comprehensive dashboard data including active internships, application statistics, intern progress, pending reviews, and recent activity.",
        tags: ["Companies", "Companies - Dashboard"], 
        security: [{ BearerAuth: [] }], 
        responses: { 
          200: { 
            description: "Dashboard data retrieved successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    stats: { activeInternships: 5, totalApplications: 127, pendingReview: 23, activeInterns: 12 },
                    recentApplications: [{ applicationId: "APP-2024050", studentName: "Rahul Sharma", status: "pending" }]
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
        description: "Retrieve complete company profile including verification status, documents, statistics, and reappeal information.",
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
                  data: {
                    company: {
                      companyId: "COM-2024001",
                      companyName: "Tech Innovations Pvt Ltd",
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
        description: "Update company profile information including contact details, point of contact, and address.",
        tags: ["Companies", "Companies - Profile"], 
        security: [{ BearerAuth: [] }], 
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string", example: "+91-22-87654321" },
                  address: { type: "string" },
                  website: { type: "string", format: "uri" },
                  pointOfContact: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string", format: "email" },
                      phone: { type: "string" },
                      designation: { type: "string" }
                    }
                  }
                }
              },
              example: {
                phone: "+91-22-87654321",
                pointOfContact: { name: "Amit Kumar", email: "amit@company.com", designation: "HR Manager" }
              }
            }
          }
        },
        responses: { 
          200: { description: "Profile updated successfully" },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        } 
      }
    },
`;

export default companyEndpoints;
