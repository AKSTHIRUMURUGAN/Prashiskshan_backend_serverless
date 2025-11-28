import mongoose from "mongoose";

const { Schema } = mongoose;

const creditRequestSchema = new Schema(
    {
        requestId: { type: String, required: true, unique: true, index: true },
        studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
        sourceId: { type: Schema.Types.ObjectId, required: true }, // Logbook ID or Internship ID
        sourceType: { type: String, enum: ["logbook", "internship", "certification"], required: true },
        credits: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ["pending_mentor", "pending_admin", "approved", "rejected"],
            default: "pending_mentor",
            index: true,
        },
        mentorId: { type: Schema.Types.ObjectId, ref: "Mentor", index: true },
        requestedAt: { type: Date, default: Date.now },
        approvedAt: Date,
        approvedBy: { type: String }, // Admin ID
        rejectionReason: String,
    },
    { timestamps: true },
);


creditRequestSchema.index({ studentId: 1, status: 1 });

const CreditRequest = mongoose.model("CreditRequest", creditRequestSchema);

export default CreditRequest;
