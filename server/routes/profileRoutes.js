import { Router } from "express";

import {
  getCitizenProfile,
  updateCitizenProfile,
  getUniversityProfile,
  updateUniversityProfile,
  getIndustryProfile,
  updateIndustryProfile
} from "../controllers/profileController.js";

import { protect } from "../middleware/auth.js";

import profileUpload from "../middleware/profileUpload.js";

const router = Router();

/* =========================================================
   CITIZEN
========================================================= */

router.get(
  "/citizen",
  protect,
  getCitizenProfile
);

router.put(
  "/citizen",
  protect,
  profileUpload.single("photo"),
  updateCitizenProfile
);

/* =========================================================
   UNIVERSITY
========================================================= */

router.get(
  "/university",
  protect,
  getUniversityProfile
);

router.put(
  "/university",
  protect,
  profileUpload.single("logo"),
  updateUniversityProfile
);

/* =========================================================
   INDUSTRY
========================================================= */

router.get(
  "/industry",
  protect,
  getIndustryProfile
);

router.put(
  "/industry",
  protect,
  profileUpload.single("logo"),
  updateIndustryProfile
);

export default router;