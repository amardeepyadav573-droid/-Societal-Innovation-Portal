import { Router } from "express";
import {
  getProjects,
  getProjectById,
  updateProject,
  updateMilestone,
  submitProposal,
  reviewProposal,
  requestCollaboration,
  respondCollaboration,
} from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, getProjects);
router.get("/:id", protect, getProjectById);
router.patch(
  "/:id",
  protect,
  authorize(
    "ADMIN",
    "GOVERNMENT",
    "UNIVERSITY",
    "FACULTY",
    "MENTOR",
    "INDUSTRY",
  ),
  updateProject,
);
router.patch(
  "/:id/milestones/:milestoneId",
  protect,
  authorize(
    "ADMIN",
    "GOVERNMENT",
    "UNIVERSITY",
    "FACULTY",
    "STUDENT",
    "MENTOR",
    "INDUSTRY",
  ),
  updateMilestone,
);
router.post(
  "/:id/proposal",
  protect,
  authorize("UNIVERSITY", "FACULTY"),
  submitProposal,
);
router.patch(
  "/:id/proposal/review",
  protect,
  authorize("ADMIN", "GOVERNMENT", "UNIVERSITY"),
  reviewProposal,
);
router.post(
  "/:id/collaboration",
  protect,
  authorize("INDUSTRY"),
  requestCollaboration,
);
router.patch(
  "/:id/collaboration/:requestId",
  protect,
  authorize("UNIVERSITY"),
  respondCollaboration,
);
export default router;
