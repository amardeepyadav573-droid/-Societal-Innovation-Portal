import { Router } from "express";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  streamNotifications
} from "../controllers/notificationController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, getNotifications);
router.get("/stream", protect, streamNotifications);

router.patch(
  "/read-all",
  protect,
  markAllAsRead
);

router.patch(
  "/:id/read",
  protect,
  markAsRead
);

router.delete(
  "/:id",
  protect,
  deleteNotification
);

export default router;