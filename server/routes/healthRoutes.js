import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready
      ? "Societal Innovation Collaboration Portal API is running."
      : "Database connection is not ready.",
    database: ready ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;
