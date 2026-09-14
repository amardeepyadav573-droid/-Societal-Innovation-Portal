import { Router } from "express";
import {
  getUniversities,
  getUniversity,
  createUniversity,
  validateUniversity,
  validateUniversityProblemMatch,
  matchUniversity,
  matchUniversitiesForProblem,
} from "../controllers/universityController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, getUniversities);
router.get("/matches/:problemId", protect, authorize("GOVERNMENT", "ADMIN"), matchUniversitiesForProblem);
router.post("/:id/match", protect, authorize("GOVERNMENT", "ADMIN"), matchUniversity);
router.patch("/:id/validate", protect, authorize("GOVERNMENT", "ADMIN"), validateUniversity);
router.patch("/:id/validate-match", protect, authorize("GOVERNMENT", "ADMIN"), validateUniversityProblemMatch);
router.get("/:id", protect, getUniversity);
router.post("/", protect, authorize("ADMIN", "GOVERNMENT"), createUniversity);

export default router;
