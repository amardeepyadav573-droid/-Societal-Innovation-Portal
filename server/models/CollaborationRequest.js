import mongoose from "mongoose";

const collaborationRequestSchema = new mongoose.Schema(
  {
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
      index: true,
    },
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedByType: {
      type: String,
      enum: ["UNIVERSITY", "INDUSTRY"],
      required: true,
    },
    message: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

collaborationRequestSchema.index(
  { university: 1, industry: 1, status: 1 },
  { partialFilterExpression: { status: "PENDING" }, unique: true },
);

const CollaborationRequest =
  mongoose.models.CollaborationRequest ||
  mongoose.model("CollaborationRequest", collaborationRequestSchema);
export default CollaborationRequest;
