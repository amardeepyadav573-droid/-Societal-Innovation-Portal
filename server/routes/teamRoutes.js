import { Router } from "express";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getUniversityMembers,
} from "../controllers/teamController.js";
import { protect, authorize } from "../middleware/auth.js";
const router = Router();
router.use(protect, authorize("UNIVERSITY", "FACULTY", "STUDENT"));
router.get("/members/candidates", getUniversityMembers);
router.get("/", getTeams);
router.post("/", createTeam);
router.patch("/:id", updateTeam);
router.delete("/:id", deleteTeam);
router.post("/:id/members", addTeamMember);
router.delete("/:id/members/:userId", removeTeamMember);
export default router;
