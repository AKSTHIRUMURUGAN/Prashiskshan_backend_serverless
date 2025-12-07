import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, '../src/docs/openapi.mjs');

console.log('📝 Inserting Task 9 endpoints into openapi.mjs...\n');

// Read the file
let content = fs.readFileSync(openapiPath, 'utf8');
const lines = content.split('\n');

// Find the line with "// Non-production Test Cleanup Endpoints"
const insertBeforeIndex = lines.findIndex(line => line.includes('// Non-production Test Cleanup Endpoints'));

if (insertBeforeIndex === -1) {
  console.error('❌ Could not find insertion point');
  process.exit(1);
}

console.log(`Found insertion point at line ${insertBeforeIndex + 1}`);

// The new endpoints to insert
const newEndpoints = `    // Notification Endpoints
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

`;

// Insert the new endpoints
lines.splice(insertBeforeIndex, 0, newEndpoints);

// Write the file back
const newContent = lines.join('\n');
fs.writeFileSync(openapiPath, newContent, 'utf8');

console.log('✅ Successfully inserted Task 9 endpoints!');
console.log(`\nAdded endpoints:`);
console.log('  - /notifications (GET)');
console.log('  - /notifications/{id}/read (PATCH)');
console.log('  - /notifications/read-all (PATCH)');
console.log('  - /upload (POST, DELETE)');
console.log('  - /metrics (GET)');
console.log('  - /metrics/summary (GET)');
console.log('  - /metrics/health (GET)');
console.log('  - /metrics/reset (POST)');
