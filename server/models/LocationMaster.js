import mongoose from "mongoose";

const locationMasterSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, trim: true, index: true },
    stateCode: { type: Number, default: null, index: true },
    district: { type: String, required: true, trim: true, index: true },
    districtCode: { type: Number, default: null, index: true },
    block: { type: String, trim: true, default: "", index: true },
    blockCode: { type: Number, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// A district can exist without a block (legacy/imported district master).
locationMasterSchema.index(
  { state: 1, district: 1, block: 1 },
  { unique: true },
);
locationMasterSchema.index({ state: 1, district: 1, isActive: 1 });
locationMasterSchema.index({ state: 1, block: 1, isActive: 1 });

const LocationMaster =
  mongoose.models.LocationMaster ||
  mongoose.model("LocationMaster", locationMasterSchema);

export default LocationMaster;
