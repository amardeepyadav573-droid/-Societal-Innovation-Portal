import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
  },
  { timestamps: true },
);
schema.index({ user: 1, createdAt: -1 });
schema.index({ status: 1, createdAt: -1 });

export default mongoose.model("SupportTicket", schema);
