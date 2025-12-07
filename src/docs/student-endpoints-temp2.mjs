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
            schema: {
              allOf: [
                { $ref: "#/components/schemas/SuccessResponse" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        earned: { type: "number", example: 12 },
                        approved: { type: "number", example: 8 },
                        pending: { type: "number", example: 4 },
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
                    addedAt: "2023-12-15T10:00:00Z",
                    certificateUrl: "https://storage.example.com/certificates/CR-2024001.pdf"
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
