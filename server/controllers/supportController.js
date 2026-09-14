import SupportTicket from "../models/SupportTicket.js";
import asyncHandler from "../utils/asyncHandler.js";
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message)
    return res
      .status(400)
      .json({ success: false, message: "Subject and message are required." });
  const ticket = await SupportTicket.create({
    user: req.user._id,
    subject,
    message,
  });
  res
    .status(201)
    .json({
      success: true,
      message: "Support ticket created.",
      data: { ticket },
    });
});
export const getTickets = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "ADMIN" || req.user.role === "GOVERNMENT"
      ? {}
      : { user: req.user._id };
  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { tickets } });
});
