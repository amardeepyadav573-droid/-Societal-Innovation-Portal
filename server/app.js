import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import env from "./config/env.js";
import apiLimiter from "./middleware/rateLimiter.js";
import locationRoutes from "./routes/locationRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import universityRoutes from "./routes/universityRoutes.js";
import industryRoutes from "./routes/industryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.join(__dirname, "uploads");

app.set("trust proxy", 1);

const allowedOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(uploadsDirectory, {
    fallthrough: false,
    maxAge: env.isProduction ? "1d" : 0,
  }),
);

if (env.nodeEnv === "development") app.use(morgan("dev"));

app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Jharkhand Societal Innovation Collaboration Portal",
    version: "1.0.0",
    status: "online",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/industries", industryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
