import { Router } from "express";
import {
  createProblem,
  getProblems,
  getProblemById,
  updateProblemStatus,
  assignProblem,
  acceptProblem,
  createProjectFromProblem,
  getIndustryOpportunities,
  deleteProblem,
  getEvidence,
} from "../controllers/problemController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { problemValidator } from "../validators/problemValidator.js";

const router = Router();
router.get(
  "/industry/opportunities",
  protect,
  authorize("INDUSTRY"),
  getIndustryOpportunities,
);
router.get("/", getProblems);
router.post(
  "/",
  protect,
  upload.array("evidence", 8),
  problemValidator,
  createProblem,
);
router.get("/evidence/:fileId", getEvidence);
router.get("/:id", getProblemById);
router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN", "GOVERNMENT"),
  updateProblemStatus,
);
router.patch(
  "/:id/assign",
  protect,
  authorize("ADMIN", "GOVERNMENT"),
  assignProblem,
);
router.patch("/:id/accept", protect, authorize("UNIVERSITY"), acceptProblem);
router.post(
  "/:id/create-project",
  protect,
  authorize("ADMIN", "GOVERNMENT", "UNIVERSITY"),
  createProjectFromProblem,
);
router.delete("/:id", protect, deleteProblem);
export default router;
