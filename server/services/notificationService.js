import Notification from "../models/Notification.js";
import { emitToUser } from "../realtime.js";

export const createNotification = async ({
  recipient,
  title,
  message,
  type = "SYSTEM",
  link = ""
}) => {
  const notification = await Notification.create({
    recipient,
    title,
    message,
    type,
    link
  });
  emitToUser(recipient, "notification:new", notification);
  return notification;
};

export const createBulkNotifications = async (
  recipients,
  data
) => {
  const notifications = recipients.map((recipient) => ({
    recipient,
    ...data
  }));

  if (!notifications.length) return [];

  return Notification.insertMany(notifications);
};