import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    startDate: Date,
    dueDate: Date,
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
      default: "PENDING",
    },
    completion: { type: Number, min: 0, max: 100, default: 0 },
    deliverables: [String],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const collaborationRequestSchema = new mongoose.Schema(
  {
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: String,
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
    respondedAt: Date,
  },
  { timestamps: true },
);

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      unique: true,
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    facultyMentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    industryPartners: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Industry" },
    ],
    collaborationRequests: [collaborationRequestSchema],
    stage: {
      type: String,
      enum: [
        "RESEARCH",
        "PLANNING",
        "DEVELOPMENT",
        "PROTOTYPE",
        "TESTING",
        "PILOT",
        "DEPLOYMENT",
        "COMPLETED",
      ],
      default: "RESEARCH",
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    objective: String,
    proposal: {
      abstract: String,
      methodology: String,
      expectedOutcome: String,
      budget: Number,
      submittedAt: Date,
      approvedAt: Date,
      status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
        default: "DRAFT",
      },
    },
    milestones: [milestoneSchema],
    budget: {
      requested: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
    },
    outcomes: {
      prototype: Boolean,
      patent: Boolean,
      researchPaper: Boolean,
      startup: Boolean,
      technologyTransfer: Boolean,
    },
    impact: {
      peopleImpacted: { type: Number, default: 0 },
      villagesCovered: { type: Number, default: 0 },
      schoolsCovered: { type: Number, default: 0 },
      costSaved: { type: Number, default: 0 },
      waterSaved: { type: Number, default: 0 },
      energySaved: { type: Number, default: 0 },
      employmentGenerated: { type: Number, default: 0 },
      description: String,
    },
    startDate: Date,
    expectedEndDate: Date,
    actualEndDate: Date,
  },
  { timestamps: true },
);

projectSchema.pre("save", function (next) {
  if (!this.projectId)
    this.projectId = `SIP-P-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  if (this.milestones?.length) {
    this.progress = Math.round(
      this.milestones.reduce((sum, m) => sum + Number(m.completion || 0), 0) /
        this.milestones.length,
    );
    if (this.progress >= 100) {
      this.progress = 100;
      this.stage = "COMPLETED";
      this.status = "COMPLETED";
      this.actualEndDate ||= new Date();
    }
  }
  next();
});

projectSchema.index({ createdAt: -1 });
projectSchema.index({ university: 1, createdAt: -1 });
projectSchema.index({ industryPartners: 1, createdAt: -1 });
projectSchema.index({ status: 1, stage: 1, createdAt: -1 });
projectSchema.index({ "collaborationRequests.industry": 1, "collaborationRequests.status": 1 });

export default mongoose.model("Project", projectSchema);
