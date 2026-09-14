import mongoose from "mongoose";
import University from "../models/University.js";
import Problem from "../models/Problem.js";
import Project from "../models/Project.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { matchUniversityToProblem, rankUniversitiesForProblem } from "../services/matchingService.js";

export const getUniversities = asyncHandler(async (req, res) => {
  const { district, search, expertise } = req.query;

  const filter = {
    isActive: true,
  };

  if (district) {
    filter["location.district"] = district;
  }

  if (search) {
    filter.$text = {
      $search: search,
    };
  }

  if (expertise) {
    filter.expertise = {
      $in: expertise.split(","),
    };
  }

  const universities = await University.find(filter)
    .select("name shortName type logo description about location researchAreas isVerified validationStatus")
    .sort({ name: 1 })
    .limit(100)
    .lean();

  res.json({
    success: true,
    data: { universities },
  });
});

export const getUniversity = asyncHandler(async (req, res) => {
  const university = await University.findById(req.params.id);

  if (!university) {
    return res.status(404).json({
      success: false,
      message: "University not found.",
    });
  }

  const [problems, projects] = await Promise.all([
    Problem.countDocuments({
      assignedUniversity: university._id,
    }),

    Project.countDocuments({
      university: university._id,
    }),
  ]);

  res.json({
    success: true,
    data: {
      university,
      stats: {
        assignedChallenges: problems,
        projects,
      },
    },
  });
});

export const createUniversity = asyncHandler(async (req, res) => {
  const university = await University.create(req.body);

  res.status(201).json({
    success: true,
    message: "University created.",
    data: { university },
  });
});

export const validateUniversity = asyncHandler(async (req, res) => {
  const status = String(req.body.status || "").toUpperCase();
  if (!["VALIDATED", "REJECTED"].includes(status)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Status must be VALIDATED or REJECTED.",
      });
  }

  const university = await University.findById(req.params.id);
  if (!university)
    return res
      .status(404)
      .json({ success: false, message: "University not found." });

  university.validationStatus = status;
  university.isVerified = status === "VALIDATED";
  university.validationReason = String(req.body.reason || "")
    .trim()
    .slice(0, 1000);
  university.validatedBy = req.user._id;
  university.validatedAt = new Date();
  await university.save();

  await User.updateMany(
    { organization: university._id, organizationModel: "University" },
    { $set: { isVerified: status === "VALIDATED" } },
  );

  const universityUsers = await User.find({
    organization: university._id,
    organizationModel: "University",
    isActive: true,
  }).select("_id");

  await Promise.all(
    universityUsers.map((member) =>
      createNotification({
        recipient: member._id,
        title:
          status === "VALIDATED"
            ? "University Profile Validated"
            : "University Validation Rejected",
        message:
          status === "VALIDATED"
            ? "Your university profile has been validated by Government."
            : `Your university profile was rejected.${university.validationReason ? ` Reason: ${university.validationReason}` : ""}`,
        type: "APPROVAL",
        link: "/university/profile",
      }),
    ),
  );

  res.json({
    success: true,
    message: `University ${status.toLowerCase()}.`,
    data: { university },
  });
});



export const validateUniversityProblemMatch = asyncHandler(async (req, res) => {
  const { problemId, reason } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return res.status(400).json({
      success: false,
      message: "A valid problemId is required to confirm this university match.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid university id.",
    });
  }

  const [problem, university] = await Promise.all([
    Problem.findById(problemId),
    University.findOne({ _id: req.params.id, isActive: true }).select(
      "_id name shortName",
    ),
  ]);

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found.",
    });
  }

  if (!university) {
    return res.status(404).json({
      success: false,
      message: "University not found or inactive.",
    });
  }

  // Confirming a match creates the actual problem → university assignment.
  // The university profile's global verification status remains separate.
  problem.assignedUniversity = university._id;
  problem.status = "ASSIGNED";
  problem.acceptedBy = null;
  problem.acceptedAt = null;
  problem.reviewedBy = req.user._id;
  problem.reviewedAt = new Date();
  await problem.save();

  const universityUsers = await User.find({
    organization: university._id,
    organizationModel: "University",
    role: "UNIVERSITY",
    isActive: true,
  }).select("_id");

  await Promise.all(
    universityUsers.map((member) =>
      createNotification({
        recipient: member._id,
        title: "New Challenge Validated",
        message: `${problem.problemId} has been validated and assigned to ${university.name}.`,
        type: "APPROVAL",
        link: `/problems/${problem._id}`,
      }),
    ),
  );

  await createNotification({
    recipient: problem.submittedBy,
    title: "University Validated for Your Challenge",
    message: `${university.name} has been validated and assigned to ${problem.problemId}.`,
    type: "APPROVAL",
    link: `/problems/${problem._id}`,
  });

  res.json({
    success: true,
    message: `University match confirmed for ${problem.problemId}.`,
    data: {
      problem,
      university,
      reason: String(reason || "").trim().slice(0, 1000),
    },
  });
});

export const matchUniversitiesForProblem = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid problem id.",
    });
  }

  const problem = await Problem.findById(problemId)
    .select(
      "problemId title description expectedSolution category customDomain subCategory location aiAnalysis",
    )
    .lean();

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: "Problem not found.",
    });
  }

  const { totalUniversities, matches } = await rankUniversitiesForProblem(
    problem,
    { limit: 10 },
  );

  res.json({
    success: true,
    data: {
      problem: {
        _id: problem._id,
        problemId: problem.problemId,
        title: problem.title,
        category: problem.category,
      },
      totalUniversities,
      matches,
    },
  });
});

export const matchUniversity = asyncHandler(async (req, res) => {
  const { problemId } = req.body || {};
  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    return res.status(400).json({
      success: false,
      message: "A valid problemId is required to analyze the university match.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid university id." });
  }

  const [university, problem] = await Promise.all([
    University.findOne({ _id: req.params.id, isActive: true })
      .select("name shortName departments disciplines courses researchAreas expertise facilities facultyResearchers innovationFacilities incubationFacilities ongoingProjects previousProjects availableResources collaborationInterests")
      .lean(),
    Problem.findById(problemId)
      .select("title description expectedSolution category customDomain subCategory location aiAnalysis")
      .lean(),
  ]);

  if (!university) {
    return res.status(404).json({ success: false, message: "University not found." });
  }
  if (!problem) {
    return res.status(404).json({ success: false, message: "Problem not found." });
  }

  const match = matchUniversityToProblem(problem, university);
  res.json({ success: true, data: { match } });
});
