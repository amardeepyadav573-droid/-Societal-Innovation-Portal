import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: ["REGISTRATION", "PASSWORD_RESET"],
      default: "REGISTRATION",
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: { type: String, required: true },
    verificationTokenHash: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

emailVerificationSchema.index({ email: 1, purpose: 1 }, { unique: true });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("EmailVerification", emailVerificationSchema);
