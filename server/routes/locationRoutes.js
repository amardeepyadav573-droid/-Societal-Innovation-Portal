import { Router } from "express";
import {
  getStates,
  getDistricts,
  getBlocks,
  validateLocation,
} from "../controllers/locationController.js";

const router = Router();
router.get("/states", getStates);
router.get("/districts", async (_req, res, next) => {
  try {
    const districts = await (
      await import("../models/LocationMaster.js")
    ).default.distinct("district", { isActive: true });
    districts.sort((a, b) => a.localeCompare(b));
    res.json({ success: true, data: districts });
  } catch (e) {
    next(e);
  }
});
router.get("/districts/:state", getDistricts);
router.get("/blocks/:state/:district", getBlocks);
router.post("/validate", validateLocation);
export default router;
