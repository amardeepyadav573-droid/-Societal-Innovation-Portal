import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    // New multi-mentor structure; facultyMentor is retained for legacy records.
    facultyMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    facultyMentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Manual team members are names entered by the university when no platform account exists.
    manualFacultyMentors: [{ type: String, trim: true, maxlength: 120 }],
    manualStudentMembers: [{ type: String, trim: true, maxlength: 120 }],
    status: {
      type: String,
      enum: ["PLANNING", "ACTIVE", "COMPLETED"],
      default: "PLANNING",
    },
  },
  { timestamps: true },
);

teamSchema.index({ university: 1, createdAt: -1 });
teamSchema.index({ project: 1 });

export default mongoose.models.Team || mongoose.model("Team", teamSchema);
