import mongoose from "mongoose";

const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    gstCertificate: String,
    cinNumber: { type: String, required: true, unique: true },
    registrationCertificate: String,
    addressProof: String,
    additionalDocuments: [{
      id: String,
      label: String,
      url: String,
      uploadedAt: Date
    }]
  },
  { _id: false },
);

const pointOfContactSchema = new Schema(
  {
    name: { type: String, required: true },
    designation: String,
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const aiVerificationSchema = new Schema(
  {
    riskLevel: { type: String, enum: ["low", "medium", "high"] },
    confidence: Number,
    findings: { type: [String], default: [] },
    concerns: { type: [String], default: [] },
    recommendation: String,
    analyzedAt: Date,
  },
  { _id: false },
);

const adminReviewSchema = new Schema(
  {
    reviewedBy: String,
    reviewedAt: Date,
    comments: String,
    decision: String,
    reasons: { type: [String], default: [] },
  },
  { _id: false },
);

const blockInfoSchema = new Schema(
  {
    reason: String,
    blockedBy: String,
    blockedAt: Date,
  },
  { _id: false },
);

const reappealSchema = new Schema(
  {
    message: {
      type: String,
      minlength: 10,
      maxlength: 2000,
    },
    attachment: String,
    submittedAt: Date,
    reviewedBy: String,
    reviewedAt: Date,
    reviewFeedback: String,
    rejectionReason: String,
    cooldownEndsAt: Date,
    history: [
      {
        message: String,
        attachment: String,
        submittedAt: Date,
        reviewedAt: Date,
        decision: { type: String, enum: ["approved", "rejected"] },
        reviewedBy: String,
        feedback: String,
      },
    ],
  },
  { _id: false },
);

const statsSchema = new Schema(
  {
    totalInternshipsPosted: { type: Number, default: 0 },
    activeInternships: { type: Number, default: 0 },
    studentsHired: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
  },
  { _id: false },
);

const companySchema = new Schema(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    firebaseUid: { type: String, required: true, unique: true },
    companyName: { type: String, required: true, index: true },
    about: String,
    website: {
      type: String,
      required: true,
      match: [/^https?:\/\/.+/i, "Website must be a valid URL"],
    },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    documents: { type: documentSchema, required: true },
    pointOfContact: { type: pointOfContactSchema, required: true },
    status: {
      type: String,
      enum: ["pending_verification", "verified", "rejected", "suspended", "blocked", "reappeal"],
      default: "pending_verification",
      index: true,
    },
    blockInfo: blockInfoSchema,
    reappeal: reappealSchema,
    aiVerification: aiVerificationSchema,
    adminReview: adminReviewSchema,
    restrictions: { type: [String], default: [] },
    colleges: { type: [String], default: [] },
    stats: { type: statsSchema, default: () => ({}) },
    lastLoginAt: Date,
    logoUrl: String,
    events: {
      type: [
        new Schema(
          {
            eventId: { type: String, required: true },
            title: String,
            description: String,
            date: Date,
            targetDepartments: { type: [String], default: [] },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    challenges: {
      type: [
        new Schema(
          {
            challengeId: { type: String, required: true },
            title: String,
            description: String,
            rewards: String,
            deadline: Date,
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

companySchema.index({ status: 1, createdAt: -1 });
companySchema.index({ companyName: "text" });
companySchema.index({ "reappeal.submittedAt": -1 });
companySchema.index({ status: 1, "reappeal.submittedAt": -1 });

/**
 * Pre-remove hook to clean up reappeal attachments when company is deleted
 * Requirements: 7.5
 */
companySchema.pre("remove", async function (next) {
  try {
    // Clean up current reappeal attachment
    if (this.reappeal?.attachment) {
      const { storageService } = await import("../services/storageService.js");
      const { logger } = await import("../utils/logger.js");
      
      const extractKeyFromUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1);
        } catch (error) {
          return null;
        }
      };

      const key = extractKeyFromUrl(this.reappeal.attachment);
      if (key) {
        await storageService.deleteFile(key, "r2").catch((error) => {
          logger.warn("Failed to delete reappeal attachment on company removal", {
            companyId: this.companyId,
            key,
            error: error.message,
          });
        });
      }
    }

    // Clean up historical reappeal attachments
    if (this.reappeal?.history && Array.isArray(this.reappeal.history)) {
      const { storageService } = await import("../services/storageService.js");
      const { logger } = await import("../utils/logger.js");
      
      const extractKeyFromUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1);
        } catch (error) {
          return null;
        }
      };

      for (const historyItem of this.reappeal.history) {
        if (historyItem.attachment) {
          const key = extractKeyFromUrl(historyItem.attachment);
          if (key) {
            await storageService.deleteFile(key, "r2").catch((error) => {
              logger.warn("Failed to delete historical reappeal attachment on company removal", {
                companyId: this.companyId,
                key,
                error: error.message,
              });
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    // Don't block company deletion if cleanup fails
    const { logger } = await import("../utils/logger.js");
    logger.error("Error in company pre-remove hook", {
      companyId: this.companyId,
      error: error.message,
    });
    next();
  }
});

/**
 * Pre-deleteOne hook to clean up reappeal attachments when company is deleted via deleteOne
 * Requirements: 7.5
 */
companySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    // Clean up current reappeal attachment
    if (this.reappeal?.attachment) {
      const { storageService } = await import("../services/storageService.js");
      const { logger } = await import("../utils/logger.js");
      
      const extractKeyFromUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1);
        } catch (error) {
          return null;
        }
      };

      const key = extractKeyFromUrl(this.reappeal.attachment);
      if (key) {
        await storageService.deleteFile(key, "r2").catch((error) => {
          logger.warn("Failed to delete reappeal attachment on company deletion", {
            companyId: this.companyId,
            key,
            error: error.message,
          });
        });
      }
    }

    // Clean up historical reappeal attachments
    if (this.reappeal?.history && Array.isArray(this.reappeal.history)) {
      const { storageService } = await import("../services/storageService.js");
      const { logger } = await import("../utils/logger.js");
      
      const extractKeyFromUrl = (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1);
        } catch (error) {
          return null;
        }
      };

      for (const historyItem of this.reappeal.history) {
        if (historyItem.attachment) {
          const key = extractKeyFromUrl(historyItem.attachment);
          if (key) {
            await storageService.deleteFile(key, "r2").catch((error) => {
              logger.warn("Failed to delete historical reappeal attachment on company deletion", {
                companyId: this.companyId,
                key,
                error: error.message,
              });
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    // Don't block company deletion if cleanup fails
    const { logger } = await import("../utils/logger.js");
    logger.error("Error in company pre-deleteOne hook", {
      companyId: this.companyId,
      error: error.message,
    });
    next();
  }
});

const Company = mongoose.model("Company", companySchema);

export default Company;

