import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { addNotificationClient } from "../realtime.js";

export const getNotifications =
  asyncHandler(async (req, res) => {
    const notifications =
      await Notification.find({
        recipient: req.user._id
      })
        .sort({ createdAt: -1 })
        .limit(50);

    const unread =
      await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
      });

    res.json({
      success: true,
      data: {
        notifications,
        unread
      }
    });
  });

export const markAsRead =
  asyncHandler(async (req, res) => {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipient: req.user._id
        },
        {
          isRead: true
        },
        {
          new: true
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read.",
      data: { notification }
    });
  });

export const markAllAsRead =
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({
      success: true,
      message:
        "All notifications marked as read."
    });
  });


export const deleteNotification =
  asyncHandler(async (req, res) => {
    const notification =
      await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user._id
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    res.json({
      success: true,
      message: "Notification deleted.",
      data: {
        notificationId: notification._id,
        wasUnread: !notification.isRead
      }
    });
  });

export const streamNotifications = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`event: ready\ndata: ${JSON.stringify({ connected: true })}\n\n`);
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, 25000);
  res.on("close", () => clearInterval(heartbeat));
  addNotificationClient(req.user._id, res);
};
