import mongoose from "mongoose";

const { Schema } = mongoose;

const qualityCriteriaSchema = new Schema(
  {
    logbookComplete: { type: Boolean, default: false },
    reportQuality: { type: Boolean, default: false },
    learningOutcomes: { type: Boolean, default: false },
    companyEvaluation: { type: Boolean, default: false },
  },
  { _id: false },
);

const mentorReviewSchema = new Schema(
  {
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Mentor" },
    reviewedAt: Date,
    decision: { type: String, enum: ["approved", "rejected"] },
    feedback: String,
    qualityCriteria: { type: qualityCriteriaSchema, default: () => ({}) },
    criteriaFeedback: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  { _id: false },
);

const complianceChecksSchema = new Schema(
  {
    nepCompliant: { type: Boolean, default: false },
    documentationComplete: { type: Boolean, default: false },
    feesCleared: { type: Boolean, default: false },
    departmentApproved: { type: Boolean, default: false },
  },
  { _id: false },
);

const adminReviewSchema = new Schema(
  {
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    reviewedAt: Date,
    decision: { type: String, enum: ["approved", "rejected"] },
    feedback: String,
    complianceChecks: { type: complianceChecksSchema, default: () => ({}) },
  },
  { _id: false },
);

const submissionHistorySchema = new Schema(
  {
    submittedAt: { type: Date, default: Date.now },
    status: String,
    reviewedBy: { type: Schema.Types.ObjectId, refPath: "submissionHistory.reviewerModel" },
    reviewerModel: { type: String, enum: ["Mentor", "Admin"] },
    reviewedAt: Date,
    feedback: String,
  },
  { _id: false },
);

const certificateSchema = new Schema(
  {
    certificateUrl: String,
    certificateId: String,
    generatedAt: Date,
  },
  { _id: false },
);

const metadataSchema = new Schema(
  {
    notificationsSent: { type: [String], default: [] },
    remindersSent: { type: Number, default: 0 },
    escalations: { type: Number, default: 0 },
  },
  { _id: false },
);

const creditRequestSchema = new Schema(
  {
    creditRequestId: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    internshipCompletionId: {
      type: Schema.Types.ObjectId,
      ref: "InternshipCompletion",
      required: true,
      unique: true,
      index: true,
    },
    internshipId: { type: Schema.Types.ObjectId, ref: "Internship", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "Mentor", required: true, index: true },

    // Request details
    requestedCredits: { type: Number, required: true },
    calculatedCredits: { type: Number, required: true },
    internshipDurationWeeks: { type: Number, required: true },

    // Status tracking
    status: {
      type: String,
      enum: [
        "pending_student_action",
        "pending_mentor_review",
        "mentor_approved",
        "mentor_rejected",
        "pending_admin_review",
        "admin_approved",
        "admin_rejected",
        "credits_added",
        "completed",
      ],
      default: "pending_mentor_review",
      index: true,
    },

    // Mentor review
    mentorReview: mentorReviewSchema,

    // Admin review
    adminReview: adminReviewSchema,

    // Resubmission tracking
    submissionHistory: {
      type: [submissionHistorySchema],
      default: [],
    },

    // Certificate generation
    certificate: certificateSchema,

    // Timestamps
    requestedAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    completedAt: Date,

    // Metadata
    metadata: { type: metadataSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
creditRequestSchema.index({ studentId: 1, status: 1 });
creditRequestSchema.index({ mentorId: 1, status: 1 });
creditRequestSchema.index({ status: 1, requestedAt: 1 });

// Valid state transitions map
const VALID_TRANSITIONS = {
  pending_student_action: ["pending_mentor_review"],
  pending_mentor_review: ["mentor_approved", "mentor_rejected"],
  mentor_approved: ["pending_admin_review"],
  mentor_rejected: ["pending_student_action"],
  pending_admin_review: ["admin_approved", "admin_rejected"],
  admin_approved: ["credits_added"],
  admin_rejected: ["pending_resolution"],
  pending_resolution: ["pending_admin_review"],
  credits_added: ["completed"],
};

/**
 * Validate if a state transition is valid
 * @param {string} newStatus - The new status to transition to
 * @returns {boolean} - True if transition is valid
 */
creditRequestSchema.methods.canTransitionTo = function (newStatus) {
  const validNextStates = VALID_TRANSITIONS[this.status] || [];
  return validNextStates.includes(newStatus);
};

/**
 * Transition to a new status with validation
 * @param {string} newStatus - The new status to transition to
 * @throws {Error} - If transition is invalid
 */
creditRequestSchema.methods.transitionTo = function (newStatus) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(
      `Invalid state transition from ${this.status} to ${newStatus}. Valid transitions: ${VALID_TRANSITIONS[this.status]?.join(", ") || "none"}`,
    );
  }
  this.status = newStatus;
  this.lastUpdatedAt = new Date();
};

/**
 * Add an entry to submission history
 * @param {Object} entry - History entry object
 */
creditRequestSchema.methods.addToHistory = function (entry) {
  this.submissionHistory.push({
    submittedAt: entry.submittedAt || new Date(),
    status: entry.status || this.status,
    reviewedBy: entry.reviewedBy,
    reviewerModel: entry.reviewerModel,
    reviewedAt: entry.reviewedAt,
    feedback: entry.feedback,
  });
};

/**
 * Check if request is overdue based on expected timelines
 * @returns {boolean} - True if request is overdue
 */
creditRequestSchema.methods.isOverdue = function () {
  const EXPECTED_TIMELINES = {
    pending_mentor_review: 7, // 7 days
    pending_admin_review: 5, // 5 days
    pending_student_action: 14, // 14 days
  };

  const expectedDays = EXPECTED_TIMELINES[this.status];
  if (!expectedDays) return false;

  const daysSinceLastUpdate = Math.floor((Date.now() - this.lastUpdatedAt) / (1000 * 60 * 60 * 24));
  return daysSinceLastUpdate > expectedDays;
};

/**
 * Pre-save hook to update lastUpdatedAt
 */
creditRequestSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedAt = new Date();
  }
  next();
});

const CreditRequest = mongoose.model("CreditRequest", creditRequestSchema);

export default CreditRequest;
