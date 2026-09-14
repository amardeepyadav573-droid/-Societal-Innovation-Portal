import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?._id ? String(req.user._id) : ipKeyGenerator(req.ip),
  skip: (req) => req.path === "/health" || req.path === "/notifications/stream",
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

export default apiLimiter;
