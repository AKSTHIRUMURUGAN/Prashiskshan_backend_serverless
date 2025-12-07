import mongoose from "mongoose";

const { Schema } = mongoose;

const evaluationSchema = new Schema(
  {
    mentorScore: Number,
    companyScore: Number,
    overallComments: String,
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
  },
  { _id: false },
);

const certificateSchema = new Schema(
  {
    certificateUrl: String,
    recommendationLetterUrl: String,
  },
  { _id: false },
);

const creditRequestSchema = new Schema(
  {
    requested: { type: Boolean, default: false },
    requestId: { type: Schema.Types.ObjectId, ref: "CreditRequest" },
    requestedAt: Date,
    status: String,
  },
  { _id: false },
);

const companyCompletionSchema = new Schema(
  {
    markedCompleteBy: String,
    markedCompleteAt: Date,
    evaluationScore: Number,
    evaluationComments: String,
  },
  { _id: false },
);

const cachedInternshipDataSchema = new Schema(
  {
    title: String,
    department: String,
    companyName: String,
    startDate: Date,
    endDate: Date,
  },
  { _id: false },
);

const completionSchema = new Schema(
  {
    completionId: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    internshipId: { type: Schema.Types.ObjectId, ref: "Internship", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    totalHours: { type: Number, required: true },
    creditsEarned: { type: Number, required: true },
    completionDate: { type: Date, required: true },
    evaluation: evaluationSchema,
    certificates: certificateSchema,
    aiSummary: String,
    status: { type: String, enum: ["pending", "issued", "completed"], default: "pending" },
    
    // Credit request tracking
    creditRequest: { type: creditRequestSchema, default: () => ({}) },
    
    // Company completion details
    companyCompletion: companyCompletionSchema,
    
    // Cached internship data for orphaned reference handling
    cachedInternshipData: cachedInternshipDataSchema,
  },
  { timestamps: true },
);

completionSchema.index({ studentId: 1, internshipId: 1 }, { unique: true });

const InternshipCompletion = mongoose.model("InternshipCompletion", completionSchema);

export default InternshipCompletion;

