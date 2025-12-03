import mongoose from "mongoose";

const { Schema } = mongoose;

const metricsSchema = new Schema(
  {
    // Company Metrics
    internshipsPosted: Number,
    applicationsReceived: Number,
    acceptanceRate: Number,
    completionRate: Number,
    averageRating: Number,
    
    // Mentor Metrics
    approvalsProcessed: Number,
    approvalRate: Number,
    averageResponseTime: Number,
    studentsSupervised: Number,
    
    // Department Metrics
    applicationRate: Number,
    placementRate: Number,
    averageCredits: Number,
    
    // Admin Metrics
    verificationsProcessed: Number,
    verificationRate: Number,
    activeInternships: Number,
  },
  { _id: false },
);

const analyticsSnapshotSchema = new Schema(
  {
    snapshotId: { type: String, required: true, unique: true, index: true },
    entityType: { 
      type: String, 
      enum: ["company", "mentor", "department", "admin"], 
      required: true,
      index: true,
    },
    entityId: { type: String, index: true },
    period: { 
      type: String, 
      enum: ["daily", "weekly", "monthly"], 
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    metrics: metricsSchema,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Compound indexes for efficient querying
analyticsSnapshotSchema.index({ entityType: 1, entityId: 1, date: -1 });
analyticsSnapshotSchema.index({ entityType: 1, period: 1, date: -1 });
analyticsSnapshotSchema.index({ date: -1, entityType: 1 });

const AnalyticsSnapshot = mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);

export default AnalyticsSnapshot;
