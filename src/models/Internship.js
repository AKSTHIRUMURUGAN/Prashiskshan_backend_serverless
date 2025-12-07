import mongoose from "mongoose";

const { Schema } = mongoose;

const eligibilitySchema = new Schema(
  {
    minYear: Number,
    minReadinessScore: Number,
    requiredModules: { type: [String], default: [] },
  },
  { _id: false },
);

const adminReviewSchema = new Schema(
  {
    reviewedBy: String,
    reviewedAt: Date,
    decision: { type: String, enum: ["approved", "rejected"] },
    comments: String,
    reasons: [String],
    editHistory: [{
      editedAt: Date,
      editedBy: String,
      changes: Schema.Types.Mixed,
      reason: String,
    }],
  },
  { _id: false },
);

const mentorApprovalSchema = new Schema(
  {
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    mentorId: String,
    approvedAt: Date,
    comments: String,
    department: String,
  },
  { _id: false },
);

// Schema for tracking multiple department approvals (for "All" department internships)
const departmentApprovalSchema = new Schema(
  {
    department: { type: String, required: true },
    mentorId: { type: String, required: true },
    approvedAt: { type: Date, required: true },
    comments: String,
  },
  { _id: false },
);

const aiTagsSchema = new Schema(
  {
    primarySkills: { type: [String], default: [] },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    careerPath: String,
    industryFit: { type: [String], default: [] },
    learningIntensity: String,
    technicalDepth: String,
    generatedAt: Date,
  },
  { _id: false },
);

const auditTrailSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    actor: String,
    actorRole: String,
    action: String,
    fromStatus: String,
    toStatus: String,
    reason: String,
    metadata: Schema.Types.Mixed,
  },
  { _id: false },
);

const internshipSchema = new Schema(
  {
    internshipId: { type: String, required: true, unique: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    department: { type: String, required: true, index: true },
    requiredSkills: { type: [String], required: true },
    optionalSkills: { type: [String], default: [] },
    duration: { type: String, required: true },
    stipend: Number,
    location: String,
    workMode: { type: String, enum: ["remote", "onsite", "hybrid"], required: true },
    startDate: { type: Date, required: true },
    applicationDeadline: { type: Date, required: true, index: true },
    slots: { type: Number, required: true, min: 1 },
    appliedCount: { type: Number, default: 0 },
    responsibilities: { type: [String], default: [] },
    learningOpportunities: { type: [String], default: [] },
    eligibilityRequirements: eligibilitySchema,
    status: {
      type: String,
      enum: [
        "draft",
        "pending_admin_verification",
        "pending_mentor_verification",
        "admin_approved",
        "admin_rejected",
        "mentor_rejected",
        "open_for_applications",
        "closed",
        "cancelled"
      ],
      default: "pending_admin_verification",
      index: true,
    },
    slotsRemaining: { type: Number },
    adminReview: adminReviewSchema,
    mentorApproval: mentorApprovalSchema,
    departmentApprovals: [departmentApprovalSchema], // Track approvals from multiple departments
    aiTags: aiTagsSchema,
    auditTrail: [auditTrailSchema],
    postedBy: { type: String, required: true },
    postedAt: Date,
    closedAt: Date,
    // Soft delete fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Pre-save hook to set slotsRemaining default value
internshipSchema.pre("save", function preSave(next) {
  if (this.isNew && this.slotsRemaining === undefined) {
    this.slotsRemaining = this.slots;
  }
  next();
});

internshipSchema.virtual("isActive").get(function isActive() {
  const now = new Date();
  return this.status === "open_for_applications" && (!this.applicationDeadline || this.applicationDeadline >= now);
});

// Compound indexes for query optimization
internshipSchema.index({ status: 1, department: 1 });
internshipSchema.index({ companyId: 1, status: 1 });
internshipSchema.index({ department: 1, "mentorApproval.status": 1 });
internshipSchema.index({ department: 1, status: 1, applicationDeadline: 1 });
internshipSchema.index({ status: 1, startDate: 1 });
internshipSchema.index({ requiredSkills: 1 });
internshipSchema.index({ title: "text", description: "text" });
// Additional indexes for admin internship management (Task 1)
internshipSchema.index({ status: 1, createdAt: -1 });
internshipSchema.index({ status: 1, postedAt: -1 });
internshipSchema.index({ location: 1 });
internshipSchema.index({ workMode: 1 });

const Internship = mongoose.model("Internship", internshipSchema);

export default Internship;

