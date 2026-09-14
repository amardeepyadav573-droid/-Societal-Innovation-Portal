import mongoose from "mongoose";

const categories = [
  "EDUCATION",
  "HEALTHCARE",
  "AGRICULTURE",
  "WATER",
  "SANITATION",
  "ENVIRONMENT",
  "ENERGY",
  "RURAL_LIVELIHOOD",
  "URBAN_DEVELOPMENT",
  "ACCESSIBILITY",
  "PUBLIC_ADMINISTRATION",
  "TRANSPORT",
  "DIGITAL_SERVICES",
  "SKILL_DEVELOPMENT",
  "WOMEN_CHILD",
  "OTHER",
];

const problemSchema = new mongoose.Schema(
  {
    problemId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true },
    expectedSolution: { type: String, trim: true },
    category: { type: String, enum: categories, default: "OTHER", index: true },
    customDomain: { type: String, trim: true, maxlength: 120 },
    subCategory: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "VALIDATED",
        "REJECTED",
        "DUPLICATE",
        "ASSIGNED",
        "ACCEPTED",
        "IN_PROGRESS",
        "PROTOTYPE",
        "PILOT",
        "IMPLEMENTED",
        "COMPLETED",
      ],
      default: "SUBMITTED",
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    location: {
      state: { type: String, required: true, trim: true, index: true },
      district: { type: String, required: true, index: true },
      block: { type: String, trim: true },
      panchayat: String,
      village: String,
      ward: String,
      address: String,
      coordinates: { lat: Number, lng: Number },
    },
    affectedPeople: { type: Number, default: 0, min: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    evidence: [
      {
        url: String,
        publicId: String,
        type: { type: String, enum: ["IMAGE", "VIDEO", "DOCUMENT"] },
        name: String,
      },
    ],
    aiAnalysis: {
      confidence: Number,
      keywords: [String],
      requiredExpertise: [String],
      suggestedSubCategory: String,
      reasoning: String,
      analyzedAt: Date,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      default: null,
    },
    duplicateScore: { type: Number, default: 0 },
    recommendedUniversities: [
      {
        university: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
        score: Number,
        reason: String,
      },
    ],
    recommendedIndustries: [
      {
        industry: { type: mongoose.Schema.Types.ObjectId, ref: "Industry" },
        score: Number,
        reason: String,
      },
    ],
    assignedUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      default: null,
    },
    assignedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acceptedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true },
);

problemSchema.index({
  title: "text",
  description: "text",
  category: "text",
  subCategory: "text",
});

problemSchema.pre("save", function (next) {
  if (!this.problemId)
    this.problemId = `SIP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  next();
});

problemSchema.index({ createdAt: -1 });
problemSchema.index({ submittedBy: 1, createdAt: -1 });
problemSchema.index({ assignedUniversity: 1, createdAt: -1 });
problemSchema.index({ status: 1, createdAt: -1 });
problemSchema.index({ "location.state": 1, "location.district": 1, "location.block": 1, createdAt: -1 });
problemSchema.index({ "recommendedIndustries.industry": 1, status: 1 });

export default mongoose.model("Problem", problemSchema);
