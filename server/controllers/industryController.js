import Industry from "../models/Industry.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getIndustries =
  asyncHandler(async (req, res) => {
    const {
      type,
      search,
      domain
    } = req.query;

    const filter = {
      isActive: true
    };

    if (type) {
      filter.type = type;
    }

    if (domain) {
      filter.domains = {
        $in: domain.split(",")
      };
    }

    if (search) {
      filter.$text = {
        $search: search
      };
    }

    const industries =
      await Industry.find(filter)
        .sort({ name: 1 })
        .limit(100);

    res.json({
      success: true,
      data: { industries }
    });
  });

export const getIndustry =
  asyncHandler(async (req, res) => {
    const industry =
      await Industry.findById(
        req.params.id
      );

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: "Industry not found."
      });
    }

    res.json({
      success: true,
      data: { industry }
    });
  });

export const createIndustry =
  asyncHandler(async (req, res) => {
    const industry =
      await Industry.create(req.body);

    res.status(201).json({
      success: true,
      message: "Industry created.",
      data: { industry }
    });
  });