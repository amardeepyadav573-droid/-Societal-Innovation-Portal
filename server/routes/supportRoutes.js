import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { createTicket, getTickets } from "../controllers/supportController.js";
const router = Router();
router.get("/", protect, getTickets);
router.post("/", protect, createTicket);
router.patch(
  "/:id",
  protect,
  authorize("ADMIN", "GOVERNMENT"),
  async (req, res) => {
    const SupportTicket = (await import("../models/SupportTicket.js")).default;
    const t = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!t)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found." });
    res.json({ success: true, data: { ticket: t } });
  },
);
export default router;
