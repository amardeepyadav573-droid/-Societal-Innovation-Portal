import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import University from "../models/University.js";
import Industry from "../models/Industry.js";
import EmailVerification from "../models/EmailVerification.js";

import env from "../config/env.js";
import {
  validateEmail,
  validateOtp,
  validatePassword,
} from "../validators/authValidator.js";

import {
  sendVerificationOtp,
} from "../services/emailService.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN = 60;
const VERIFICATION_TOKEN_BYTES = 32;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const hashVerificationToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const generateVerificationToken = () => crypto.randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");

const createToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role },
  env.jwtSecret,
  { expiresIn: env.jwtExpiresIn }
);

const publicUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  if (!obj.avatar && obj.organization?.logo) obj.avatar = obj.organization.logo;
  return obj;
};

/** POST /api/auth/send-registration-otp */
export const sendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser?.isVerified) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const previous = await EmailVerification.findOne({ email: normalizedEmail, purpose: "REGISTRATION" });
    if (previous?.lastSentAt) {
      const secondsSinceLastSend = Math.floor((Date.now() - previous.lastSentAt.getTime()) / 1000);
      if (secondsSinceLastSend < OTP_RESEND_COOLDOWN) {
        return res.status(429).json({ success: false, message: "Please wait before requesting another OTP.", retryAfter: OTP_RESEND_COOLDOWN - secondsSinceLastSend });
      }
    }

    const otp = generateOtp();
    await EmailVerification.deleteMany({ email: normalizedEmail, purpose: "REGISTRATION" });
    await EmailVerification.create({
      email: normalizedEmail,
      purpose: "REGISTRATION",
      otpHash: hashOtp(otp),
      verificationTokenHash: null,
      verifiedAt: null,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      lastSentAt: new Date(),
    });

    try {
      await sendVerificationOtp({ email: normalizedEmail, otp, name: "User" });
    } catch (emailError) {
      await EmailVerification.deleteMany({ email: normalizedEmail, purpose: "REGISTRATION" });
      throw emailError;
    }

    return res.status(200).json({ success: true, requiresOtp: true, email: normalizedEmail, message: "OTP sent to your email.", expiresInSeconds: OTP_EXPIRY_MINUTES * 60, retryAfter: OTP_RESEND_COOLDOWN });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/verify-otp */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });
    const otpError = validateOtp(otp);
    if (otpError) return res.status(400).json({ success: false, message: otpError });

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({ email: normalizedEmail, purpose: "REGISTRATION" });
    if (!verification) return res.status(400).json({ success: false, message: "OTP not found or expired. Please request a new OTP." });

    if (verification.expiresAt.getTime() < Date.now()) {
      await verification.deleteOne();
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP." });
    }

    if (verification.attempts >= verification.maxAttempts) {
      await verification.deleteOne();
      return res.status(429).json({ success: false, message: "Too many OTP attempts. Please request a new OTP." });
    }

    const incomingHash = hashOtp(otp);
    const expectedHash = verification.otpHash;
    const matches = incomingHash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(incomingHash, "hex"), Buffer.from(expectedHash, "hex"));
    if (!matches) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({ success: false, message: "Invalid OTP.", attemptsLeft: Math.max(0, verification.maxAttempts - verification.attempts) });
    }

    const verificationToken = generateVerificationToken();
    verification.verificationTokenHash = hashVerificationToken(verificationToken);
    verification.verifiedAt = new Date();
    verification.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    verification.attempts = 0;
    await verification.save();

    return res.status(200).json({ success: true, email: normalizedEmail, verified: true, verificationToken, message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/resend-otp */
export const sendPasswordResetOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Do not reveal whether an email is registered.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset OTP has been sent.",
        email: normalizedEmail,
        requiresOtp: true,
      });
    }

    const previous = await EmailVerification.findOne({
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
    });
    if (previous?.lastSentAt) {
      const secondsSinceLastSend = Math.floor((Date.now() - previous.lastSentAt.getTime()) / 1000);
      if (secondsSinceLastSend < OTP_RESEND_COOLDOWN) {
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another OTP.",
          retryAfter: OTP_RESEND_COOLDOWN - secondsSinceLastSend,
        });
      }
    }

    const otp = generateOtp();
    await EmailVerification.deleteMany({ email: normalizedEmail, purpose: "PASSWORD_RESET" });
    await EmailVerification.create({
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
      otpHash: hashOtp(otp),
      verificationTokenHash: null,
      verifiedAt: null,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      lastSentAt: new Date(),
    });

    try {
      await sendVerificationOtp({
        email: normalizedEmail,
        otp,
        name: user.name || "User",
        purpose: "PASSWORD_RESET",
      });
    } catch (emailError) {
      await EmailVerification.deleteMany({ email: normalizedEmail, purpose: "PASSWORD_RESET" });
      throw emailError;
    }

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      message: "Password reset OTP sent to your email.",
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      retryAfter: OTP_RESEND_COOLDOWN,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPasswordResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });
    const otpError = validateOtp(otp);
    if (otpError) return res.status(400).json({ success: false, message: otpError });

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
    });
    if (!verification) return res.status(400).json({ success: false, message: "OTP not found or expired. Please request a new OTP." });

    if (verification.expiresAt.getTime() < Date.now()) {
      await verification.deleteOne();
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP." });
    }

    if (verification.attempts >= verification.maxAttempts) {
      await verification.deleteOne();
      return res.status(429).json({ success: false, message: "Too many OTP attempts. Please request a new OTP." });
    }

    const incomingHash = hashOtp(otp);
    const expectedHash = verification.otpHash;
    const matches = incomingHash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(incomingHash, "hex"), Buffer.from(expectedHash, "hex"));
    if (!matches) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
        attemptsLeft: Math.max(0, verification.maxAttempts - verification.attempts),
      });
    }

    const verificationToken = generateVerificationToken();
    verification.verificationTokenHash = hashVerificationToken(verificationToken);
    verification.verifiedAt = new Date();
    verification.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    verification.attempts = 0;
    await verification.save();

    return res.status(200).json({
      success: true,
      email: normalizedEmail,
      verified: true,
      verificationToken,
      message: "OTP verified successfully. You can now set a new password.",
    });
  } catch (error) {
    next(error);
  }
};

export const resendPasswordResetOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
    });

    if (!user || !verification) {
      return res.status(404).json({ success: false, message: "Password reset session not found. Please request a new OTP." });
    }

    if (verification.lastSentAt) {
      const secondsSinceLastSend = Math.floor((Date.now() - verification.lastSentAt.getTime()) / 1000);
      if (secondsSinceLastSend < OTP_RESEND_COOLDOWN) {
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another OTP.",
          retryAfter: OTP_RESEND_COOLDOWN - secondsSinceLastSend,
        });
      }
    }

    const otp = generateOtp();
    verification.otpHash = hashOtp(otp);
    verification.verificationTokenHash = null;
    verification.verifiedAt = null;
    verification.expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    verification.attempts = 0;
    verification.lastSentAt = new Date();
    await verification.save();

    try {
      await sendVerificationOtp({
        email: normalizedEmail,
        otp,
        name: user.name || "User",
        purpose: "PASSWORD_RESET",
      });
    } catch (emailError) {
      await verification.deleteOne();
      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "New password reset OTP sent.",
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      retryAfter: OTP_RESEND_COOLDOWN,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, verificationToken, password, confirmPassword } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match." });
    if (typeof verificationToken !== "string" || verificationToken.length < 32) {
      return res.status(403).json({ success: false, message: "Please verify the OTP before setting a new password." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
    });
    if (!verification?.verifiedAt || !verification.verificationTokenHash) {
      return res.status(403).json({ success: false, message: "Password reset verification is required." });
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      await verification.deleteOne();
      return res.status(403).json({ success: false, message: "Password reset session has expired. Please request a new OTP." });
    }

    const tokenHash = hashVerificationToken(verificationToken);
    if (tokenHash !== verification.verificationTokenHash) {
      return res.status(403).json({ success: false, message: "Invalid password reset session. Please verify the OTP again." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      await verification.deleteOne();
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    user.password = password;
    await user.save();
    await verification.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(409).json({ success: false, message: "An account with this email already exists." });

    const verification = await EmailVerification.findOne({ email: normalizedEmail, purpose: "REGISTRATION" });
    if (!verification) return res.status(404).json({ success: false, message: "Registration session not found. Please send a new OTP." });

    if (verification.lastSentAt) {
      const secondsSinceLastSend = Math.floor((Date.now() - verification.lastSentAt.getTime()) / 1000);
      if (secondsSinceLastSend < OTP_RESEND_COOLDOWN) {
        return res.status(429).json({ success: false, message: "Please wait before requesting another OTP.", retryAfter: OTP_RESEND_COOLDOWN - secondsSinceLastSend });
      }
    }

    const otp = generateOtp();
    verification.otpHash = hashOtp(otp);
    verification.verificationTokenHash = null;
    verification.verifiedAt = null;
    verification.expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    verification.attempts = 0;
    verification.lastSentAt = new Date();
    await verification.save();

    try {
      await sendVerificationOtp({ email: normalizedEmail, otp, name: "User" });
    } catch (emailError) {
      await verification.deleteOne();
      throw emailError;
    }

    return res.status(200).json({ success: true, message: "New OTP sent.", expiresInSeconds: OTP_EXPIRY_MINUTES * 60, retryAfter: OTP_RESEND_COOLDOWN });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/register */
export const register = async (req, res, next) => {
  let session;
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      participationType,
      verificationToken,
      profile,
    } = req.body;

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const allowedTypes = ["CITIZEN", "UNIVERSITY", "INDUSTRY", "GOVERNMENT"];
    if (!allowedTypes.includes(participationType)) {
      return res.status(400).json({ success: false, message: "Invalid participation type." });
    }
    if (typeof verificationToken !== "string" || verificationToken.length < 32) {
      return res.status(403).json({ success: false, message: "Please verify your email before creating the account." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
      purpose: "REGISTRATION",
    });

    if (!verification?.verifiedAt || !verification.verificationTokenHash) {
      return res.status(403).json({ success: false, message: "Email verification is required before registration." });
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      await verification.deleteOne();
      return res.status(403).json({ success: false, message: "Email verification has expired. Please verify again." });
    }

    const tokenHash = hashVerificationToken(verificationToken);
    if (tokenHash !== verification.verificationTokenHash) {
      return res.status(403).json({ success: false, message: "Invalid email verification session. Please verify your email again." });
    }

    session = await User.startSession();
    let createdUser;

    await session.withTransaction(async () => {
      const existingUser = await User.findOne({ email: normalizedEmail }).session(session);
      if (existingUser) {
        const error = new Error("An account with this email already exists.");
        error.statusCode = 409;
        throw error;
      }

      const user = new User({
        name: name?.trim(),
        email: normalizedEmail,
        password,
        phone: phone || "",
        participationType,
        role: participationType,
        isVerified: true,
        isActive: true,
      });

      const safeProfile = profile && typeof profile === "object" ? profile : {};

      if (participationType === "UNIVERSITY") {
        const university = new University({
          ...safeProfile,
          name: safeProfile.name || `${user.name}'s University`,
          email: normalizedEmail,
        });
        await university.save({ session });
        user.organization = university._id;
        user.organizationModel = "University";
      } else if (participationType === "INDUSTRY") {
        const industry = new Industry({
          ...safeProfile,
          name: safeProfile.name || `${user.name}'s Organization`,
          email: normalizedEmail,
        });
        await industry.save({ session });
        user.organization = industry._id;
        user.organizationModel = "Industry";
      }

      await user.save({ session });
      createdUser = user;
    });

    await verification.deleteOne();
    const token = createToken(createdUser);
    return res.status(201).json({
      success: true,
      message: "Email verified and account created.",
      token,
      user: publicUser(createdUser),
    });
  } catch (error) {
    next(error);
  } finally {
    await session?.endSession().catch(() => {});
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const emailError =
      validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    if (
      typeof password !==
      "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      })
        .select("+password")
        .populate("organization");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email first.",
        requiresVerification: true,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    user.lastLogin =
      new Date();

    await user.save();

    const token =
      createToken(user);

    return res.status(200).json({
      success: true,
      token,
      user:
        publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
export const me = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).populate("organization");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user:
        publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};