import LocationMaster from "../models/LocationMaster.js";

const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ");

export const getStates = async (req, res, next) => {
  try {
    const states = await LocationMaster.distinct("state", { isActive: true });
    states.sort((a, b) => a.localeCompare(b));
    return res.json({ success: true, data: states });
  } catch (error) { next(error); }
};

export const getDistricts = async (req, res, next) => {
  try {
    const state = normalize(decodeURIComponent(req.params.state || ""));
    if (!state) return res.status(400).json({ success: false, message: "State is required." });
    const districts = await LocationMaster.distinct("district", { state, isActive: true });
    districts.sort((a, b) => a.localeCompare(b));
    return res.json({ success: true, data: districts });
  } catch (error) { next(error); }
};

export const getBlocks = async (req, res, next) => {
  try {
    const state = normalize(decodeURIComponent(req.params.state || ""));
    const district = normalize(decodeURIComponent(req.params.district || ""));
    if (!state || !district) return res.status(400).json({ success: false, message: "State and district are required." });
    const blocks = await LocationMaster.distinct("block", { state, district, isActive: true, block: { $nin: ["", null] } });
    blocks.sort((a, b) => a.localeCompare(b));
    return res.json({ success: true, data: blocks });
  } catch (error) { next(error); }
};

export const validateLocation = async (req, res, next) => {
  try {
    const state = normalize(req.body.state);
    const district = normalize(req.body.district);
    const block = normalize(req.body.block);
    if (!state || !district) return res.status(400).json({ success: false, message: "State and district are required." });

    const filter = { state, district, isActive: true };
    if (block) filter.block = block;
    const exists = await LocationMaster.exists(filter);
    return res.json({ success: true, valid: Boolean(exists) });
  } catch (error) { next(error); }
};
