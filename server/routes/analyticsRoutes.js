import { Router } from "express";

import {
  getDashboardAnalytics
} from "../controllers/analyticsController.js";

import {
  protect,
  authorize
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/dashboard",
  protect,
  authorize(
    "ADMIN",
    "GOVERNMENT"
  ),
  getDashboardAnalytics
);

export default router;