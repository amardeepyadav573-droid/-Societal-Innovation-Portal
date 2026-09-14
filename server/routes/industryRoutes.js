import { Router } from "express";

import {
  getIndustries,
  getIndustry,
  createIndustry
} from "../controllers/industryController.js";

import {
  protect,
  authorize
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  protect,
  getIndustries
);

router.get(
  "/:id",
  protect,
  getIndustry
);

router.post(
  "/",
  protect,
  authorize(
    "ADMIN",
    "GOVERNMENT"
  ),
  createIndustry
);

export default router;