import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  listCollaborations,
  discoverPartners,
  sendCollaborationRequest,
  respondToCollaboration,
} from "../controllers/collaborationController.js";

const router = Router();

router.get(
  "/",
  protect,
  authorize("UNIVERSITY", "FACULTY", "INDUSTRY", "MENTOR"),
  listCollaborations,
);
router.get(
  "/discover",
  protect,
  authorize("UNIVERSITY", "FACULTY", "INDUSTRY", "MENTOR"),
  discoverPartners,
);
router.post(
  "/",
  protect,
  authorize("UNIVERSITY", "FACULTY", "INDUSTRY", "MENTOR"),
  sendCollaborationRequest,
);
router.patch(
  "/:id/respond",
  protect,
  authorize("UNIVERSITY", "FACULTY", "INDUSTRY", "MENTOR"),
  respondToCollaboration,
);

export default router;
