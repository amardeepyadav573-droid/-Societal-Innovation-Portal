import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  register,
  sendRegistrationOtp,
  verifyOtp,
  resendOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  resetPassword,
  login,
  me,
  logout,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: {
    success: false,
    message: "Too many login attempts. Please wait before trying again.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait before trying again.",
  },
});

router.post("/send-registration-otp", otpLimiter, sendRegistrationOtp);
router.post("/register", register);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/send-password-reset-otp", otpLimiter, sendPasswordResetOtp);
router.post("/verify-password-reset-otp", otpLimiter, verifyPasswordResetOtp);
router.post("/resend-password-reset-otp", otpLimiter, resendPasswordResetOtp);
router.post("/reset-password", resetPassword);
router.post("/login", loginLimiter, login);
router.get("/me", authMiddleware, me);
router.post("/logout", authMiddleware, logout);

export default router;
