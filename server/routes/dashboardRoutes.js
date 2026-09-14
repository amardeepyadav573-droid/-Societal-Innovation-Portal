import { Router } from "express";

import {
  getGovernmentDashboard,
  getCitizenDashboard,
  getUniversityDashboard,
  getIndustryDashboard,
  getPublicStatistics
} from "../controllers/dashboardController.js";

import {
  protect,
  authorize
} from "../middleware/auth.js";

const router = Router();

router.get("/public-stats", getPublicStatistics);

router.get(
  "/citizen",
  protect,
  authorize("CITIZEN"),
  getCitizenDashboard
);

router.get(
  "/government",
  protect,
  authorize("GOVERNMENT", "ADMIN"),
  getGovernmentDashboard
);

router.get(
  "/university",
  protect,
  authorize("UNIVERSITY", "FACULTY", "STUDENT"),
  getUniversityDashboard
);

router.get(
  "/industry",
  protect,
  authorize("INDUSTRY", "MENTOR"),
  getIndustryDashboard
);

export default router;
