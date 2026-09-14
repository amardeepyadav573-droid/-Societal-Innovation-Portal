import Problem from "../models/Problem.js";
import Project from "../models/Project.js";
import University from "../models/University.js";
import Industry from "../models/Industry.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { analyzeProblem } from "../services/aiService.js";
import {
  recommendUniversities,
  recommendIndustries,
} from "../services/matchingService.js";
import { createNotification } from "../services/notificationService.js";
import { cloudinary } from "../config/cloudinary.js";
import env from "../config/env.js";
import fs from "fs/promises";
import LocationMaster from "../models/LocationMaster.js";
import { storeEvidenceFile, deleteEvidenceFile, streamEvidenceFile } from "../utils/gridfs.js";

const VALID_CATEGORIES = [
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
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_STATUSES = [
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
];
const activeStatuses = [
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "PROTOTYPE",
  "PILOT",
];
const resolvedStatuses = ["IMPLEMENTED", "COMPLETED"];

const parseLocation = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const cleanLocation = (location) => ({
  state: String(location?.state || "").trim(),
  district: String(location?.district || "").trim(),
  block: String(location?.block || "").trim(),
  panchayat: String(location?.panchayat || "").trim(),
  village: String(location?.village || "").trim(),
  ward: String(location?.ward || "").trim(),
  address: String(location?.address || "").trim(),
  coordinates: location?.coordinates
    ? {
        lat: Number(location.coordinates.lat),
        lng: Number(location.coordinates.lng),
      }
    : undefined,
});
const normalizeCategory = (v) =>
  VALID_CATEGORIES.includes(
    String(v || "")
      .trim()
      .toUpperCase(),
  )
    ? String(v).trim().toUpperCase()
    : "OTHER";
const normalizePriority = (v) =>
  VALID_PRIORITIES.includes(
    String(v || "")
      .trim()
      .toUpperCase(),
  )
    ? String(v).trim().toUpperCase()
    : "MEDIUM";
const notify = async (recipient, title, message, link) => {
  try {
    await createNotification({
      recipient,
      title,
      message,
      type: "PROBLEM",
      link,
    });
  } catch (e) {
    console.error("Notification failed:", e.message);
  }
};

export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    expectedSolution,
    category,
    customDomain,
    subCategory,
    affectedPeople,
    location,
    priority,
  } = req.body;
  if (!req.user?._id)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  if (!String(title || "").trim())
    return res
      .status(400)
      .json({ success: false, message: "Challenge title is required." });
  if (!String(description || "").trim())
    return res
      .status(400)
      .json({ success: false, message: "Challenge description is required." });
  const parsedLocation = parseLocation(location);
  const normalizedLocation = cleanLocation(parsedLocation);
  if (!normalizedLocation.state)
    return res
      .status(400)
      .json({
        success: false,
        message: "State is required.",
        field: "location.state",
      });
  if (!normalizedLocation.district)
    return res
      .status(400)
      .json({
        success: false,
        message: "District is required.",
        field: "location.district",
      });
  if (
    String(category || "").toUpperCase() === "OTHER" &&
    !String(customDomain || "").trim()
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please enter your problem domain.",
        field: "customDomain",
      });
  }
  const locationExists = await LocationMaster.exists({
    state: normalizedLocation.state,
    district: normalizedLocation.district,
    isActive: true,
    ...(normalizedLocation.block ? { block: normalizedLocation.block } : {}),
  });
  if (!locationExists)
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Selected location is not valid. Please choose State, District and Block from the location lists.",
      });

  let ai = {
    category: normalizeCategory(category),
    priority: normalizePriority(priority),
    confidence: 0,
    keywords: [],
    requiredExpertise: [],
    suggestedSubCategory: subCategory || "",
    reasoning: "AI analysis unavailable.",
    analyzedAt: new Date(),
  };
  try {
    const result = await analyzeProblem({
      title: String(title).trim(),
      description: String(description).trim(),
      category: normalizeCategory(category),
    });
    if (result)
      ai = {
        ...ai,
        ...result,
        category: normalizeCategory(result.category || category),
        priority: normalizePriority(result.priority || priority),
        requiredExpertise: Array.isArray(result.requiredExpertise)
          ? result.requiredExpertise
          : [],
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        analyzedAt: result.analyzedAt || new Date(),
      };
  } catch (e) {
    console.error("AI analysis failed:", e.message);
  }

  let recommendedUniversities = [],
    recommendedIndustries = [];
  try {
    const expertise = Array.isArray(ai.requiredExpertise)
      ? ai.requiredExpertise
      : [];
    [recommendedUniversities, recommendedIndustries] = await Promise.all([
      recommendUniversities(expertise),
      recommendIndustries(expertise),
    ]);
  } catch (e) {
    console.error("Matching failed:", e.message);
  }

  const evidence = [];
  const storedGridFsIds = [];

  try {
    for (const file of req.files || []) {
      const type = file.mimetype?.startsWith("image/")
        ? "IMAGE"
        : file.mimetype?.startsWith("video/")
          ? "VIDEO"
          : "DOCUMENT";

      if (env.storageProvider === "mongodb") {
        const stored = await storeEvidenceFile(file);
        storedGridFsIds.push(stored.id);
        evidence.push({
          name: file.originalname || "Evidence",
          url: stored.url,
          publicId: stored.id,
          type,
        });
      } else if (env.storageProvider === "cloudinary") {
        const configured =
          env.cloudinary.cloudName &&
          env.cloudinary.apiKey &&
          env.cloudinary.apiSecret;

        if (!configured) {
          const error = new Error("Cloudinary evidence storage is not configured.");
          error.statusCode = 503;
          error.publicMessage =
            "Evidence storage is not configured. Set STORAGE_PROVIDER=mongodb to store evidence in MongoDB, or configure Cloudinary.";
          throw error;
        }

        try {
          const uploaded = await cloudinary.uploader.upload(file.path, {
            folder: "societal-innovation/evidence",
            resource_type: "auto",
          });
          evidence.push({
            name: file.originalname || "Evidence",
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            type,
          });
        } catch (uploadError) {
          const error = new Error("Evidence cloud upload failed.");
          error.statusCode = 503;
          error.publicMessage =
            "Evidence storage is temporarily unavailable. Please check the Cloudinary configuration or use STORAGE_PROVIDER=mongodb.";
          error.cause = uploadError;
          throw error;
        }
      } else {
        evidence.push({
          name: file.originalname || "Evidence",
          url: file.filename
            ? `/uploads/${encodeURIComponent(file.filename)}`
            : "",
          publicId: file.filename || "",
          type,
        });
      }
    }
  } catch (error) {
    await Promise.all(storedGridFsIds.map((id) => deleteEvidenceFile(id).catch(() => {})));
    await Promise.all((req.files || []).map((file) => fs.unlink(file.path).catch(() => {})));
    throw error;
  } finally {
    await Promise.all((req.files || []).map((file) => fs.unlink(file.path).catch(() => {})));
  }

  const problem = await Problem.create({
    title: String(title).trim(),
    description: String(description).trim(),
    expectedSolution: String(expectedSolution || "").trim(),
    category: normalizeCategory(ai.category || category),
    customDomain: String(customDomain || "").trim(),
    subCategory: String(subCategory || ai.suggestedSubCategory || "").trim(),
    priority: normalizePriority(ai.priority || priority),
    submittedBy: req.user._id,
    affectedPeople: Number(affectedPeople) >= 0 ? Number(affectedPeople) : 0,
    location: normalizedLocation,
    evidence,
    aiAnalysis: ai,
    recommendedUniversities,
    recommendedIndustries,
  });

  await notify(
    req.user._id,
    "Challenge Submitted",
    `Your challenge ${problem.problemId} has been submitted successfully.`,
    `/problems/${problem._id}`,
  );

  const governmentUsers = await User.find({
    role: { $in: ["GOVERNMENT", "ADMIN"] },
    isActive: true,
  }).select("_id");
  await Promise.all(
    governmentUsers.map((u) =>
      createNotification({
        recipient: u._id,
        title: "New Citizen Challenge",
        message: `${problem.problemId}: ${problem.title}`,
        type: "PROBLEM",
        link: "/government/challenges",
      }),
    ),
  );

  const recommendedUniversityIds = (recommendedUniversities || [])
    .map((item) => item.university)
    .filter(Boolean);
  const universityUsers = recommendedUniversityIds.length
    ? await User.find({
        organization: { $in: recommendedUniversityIds },
        organizationModel: "University",
        isActive: true,
      }).select("_id")
    : [];
  await Promise.all(
    universityUsers.map((u) =>
      createNotification({
        recipient: u._id,
        title: "New Matched Societal Challenge",
        message: `${problem.problemId}: ${problem.title}`,
        type: "PROBLEM",
        link: `/problems/${problem._id}`,
      }),
    ),
  );

  const populated = await Problem.findById(problem._id)
    .populate("submittedBy", "name email role")
    .populate(
      "recommendedUniversities.university",
      "name shortName location expertise",
    )
    .populate(
      "recommendedIndustries.industry",
      "name type domains capabilities",
    );
  res
    .status(201)
    .json({
      success: true,
      message: "Societal challenge submitted successfully.",
      data: { problem: populated },
    });
});

export const getEvidence = asyncHandler(async (req, res) => {
  const found = await streamEvidenceFile(req.params.fileId, res);
  if (!found && !res.headersSent) {
    return res.status(404).json({
      success: false,
      message: "Evidence file not found.",
    });
  }
});

export const getProblems = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    priority,
    state,
    district,
    block,
    search,
    page = 1,
    limit = 12,
  } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (state) filter["location.state"] = state;
  if (district) filter["location.district"] = district;
  if (block) filter["location.block"] = block;
  if (search) filter.$text = { $search: search };

  if (req.user?.role === "CITIZEN") filter.submittedBy = req.user._id;
  if (req.user?.role === "UNIVERSITY") {
    if (req.user.organizationModel !== "University" || !req.user.organization)
      return res
        .status(400)
        .json({
          success: false,
          message: "Your university account is not linked to a university.",
        });
    filter.assignedUniversity = req.user.organization;
  }
  if (req.user?.role === "INDUSTRY") {
    if (req.query.mine === "true") {
      if (req.user.organizationModel !== "Industry" || !req.user.organization)
        return res
          .status(400)
          .json({
            success: false,
            message: "Your industry account is not linked to an industry.",
          });
      filter["recommendedIndustries.industry"] = req.user.organization;
    } else {
      filter.status = {
        $in: [
          "VALIDATED",
          "ASSIGNED",
          "ACCEPTED",
          "IN_PROGRESS",
          "PROTOTYPE",
          "PILOT",
        ],
      };
    }
  }

  const pageNumber = Math.max(Number(page), 1),
    limitNumber = Math.min(Math.max(Number(limit), 1), 100),
    skip = (pageNumber - 1) * limitNumber;
  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .select("problemId title description category customDomain subCategory priority status location affectedPeople progress submittedBy assignedUniversity acceptedBy assignedProject createdAt")
      .populate("submittedBy", "name email role")
      .populate("assignedUniversity", "name shortName")
      .populate("acceptedBy", "name email role")
      .populate("assignedProject", "title status progress stage industryPartners")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Problem.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      problems,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    },
  });
});

export const getProblemById = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id)
    .populate("submittedBy", "name email role")
    .populate("assignedUniversity", "name shortName location expertise")
    .populate("acceptedBy", "name email role department")
    .populate(
      "recommendedUniversities.university",
      "name shortName location expertise",
    )
    .populate(
      "recommendedIndustries.industry",
      "name type domains capabilities",
    )
    .populate({
      path: "assignedProject",
      populate: [
        { path: "university", select: "name shortName" },
        { path: "facultyMentor", select: "name email" },
        { path: "industryPartners", select: "name type" },
      ],
    });
  if (!problem)
    return res
      .status(404)
      .json({ success: false, message: "Challenge not found." });
  if (
    req.user?.role === "CITIZEN" &&
    String(problem.submittedBy?._id) !== String(req.user._id)
  )
    return res
      .status(403)
      .json({
        success: false,
        message: "You are not allowed to view this challenge.",
      });
  res.json({ success: true, data: { problem } });
});

export const updateProblemStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!VALID_STATUSES.includes(status))
    return res
      .status(400)
      .json({ success: false, message: "Invalid problem status." });
  const problem = await Problem.findById(req.params.id);
  if (!problem)
    return res
      .status(404)
      .json({ success: false, message: "Challenge not found." });
  problem.status = status;
  problem.reviewedBy = req.user._id;
  problem.reviewedAt = new Date();
  problem.rejectionReason =
    status === "REJECTED" ? String(rejectionReason || "").trim() : "";
  await problem.save();
  await notify(
    problem.submittedBy,
    "Challenge Status Updated",
    `Your challenge ${problem.problemId} is now ${status}.`,
    `/problems/${problem._id}`,
  );
  res.json({
    success: true,
    message: "Challenge status updated.",
    data: { problem },
  });
});

export const assignProblem = asyncHandler(async (req, res) => {
  const { universityId } = req.body;
  if (!universityId)
    return res
      .status(400)
      .json({ success: false, message: "University ID is required." });
  const [problem, university] = await Promise.all([
    Problem.findById(req.params.id),
    University.findById(universityId),
  ]);
  if (!problem)
    return res
      .status(404)
      .json({ success: false, message: "Challenge not found." });
  if (!university || !university.isActive)
    return res
      .status(404)
      .json({ success: false, message: "University not found or inactive." });
  problem.assignedUniversity = university._id;
  problem.status = "ASSIGNED";
  problem.acceptedBy = null;
  problem.acceptedAt = null;
  await problem.save();
  const universityUsers = await User.find({
    organization: university._id,
    organizationModel: "University",
    role: "UNIVERSITY",
    isActive: true,
  }).select("_id");
  await Promise.all(
    universityUsers.map((u) =>
      notify(
        u._id,
        "New Challenge Assigned",
        `${problem.problemId} has been assigned to ${university.name}.`,
        `/problems/${problem._id}`,
      ),
    ),
  );
  await notify(
    problem.submittedBy,
    "University Assigned",
    `Your challenge ${problem.problemId} has been assigned to ${university.name}.`,
    `/problems/${problem._id}`,
  );
  res.json({
    success: true,
    message: "Challenge assigned successfully.",
    data: { problem },
  });
});

export const acceptProblem = asyncHandler(async (req, res) => {
  if (
    req.user.role !== "UNIVERSITY" ||
    req.user.organizationModel !== "University" ||
    !req.user.organization
  )
    return res
      .status(403)
      .json({
        success: false,
        message: "Only a linked university account can accept a challenge.",
      });
  const problem = await Problem.findById(req.params.id);
  if (!problem)
    return res
      .status(404)
      .json({ success: false, message: "Challenge not found." });
  if (String(problem.assignedUniversity) !== String(req.user.organization))
    return res
      .status(403)
      .json({
        success: false,
        message: "This challenge is not assigned to your university.",
      });
  if (!["ASSIGNED", "VALIDATED"].includes(problem.status))
    return res
      .status(400)
      .json({
        success: false,
        message: `Challenge cannot be accepted from ${problem.status}.`,
      });
  problem.status = "ACCEPTED";
  problem.acceptedBy = req.user._id;
  problem.acceptedAt = new Date();
  await problem.save();
  await notify(
    problem.submittedBy,
    "Challenge Accepted",
    `${problem.problemId} has been accepted by your assigned university.`,
    `/problems/${problem._id}`,
  );
  res.json({
    success: true,
    message: "Challenge accepted. You can now create the innovation project.",
    data: { problem },
  });
});

export const createProjectFromProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);
  if (!problem)
    return res
      .status(404)
      .json({ success: false, message: "Challenge not found." });
  if (!problem.assignedUniversity)
    return res
      .status(400)
      .json({
        success: false,
        message: "Assign a university before creating a project.",
      });
  if (req.user?.role === "UNIVERSITY") {
    if (String(req.user.organization) !== String(problem.assignedUniversity))
      return res
        .status(403)
        .json({
          success: false,
          message: "This challenge is assigned to another university.",
        });
    if (problem.status !== "ACCEPTED")
      return res
        .status(400)
        .json({
          success: false,
          message: "Accept the challenge before creating a project.",
        });
  }
  const existing = await Project.findOne({ problem: problem._id });
  if (existing)
    return res
      .status(409)
      .json({
        success: false,
        message: "Project already exists.",
        data: { project: existing },
      });
  const project = await Project.create({
    title: `Innovation Project: ${problem.title}`,
    description: problem.description,
    problem: problem._id,
    university: problem.assignedUniversity,
    objective: problem.expectedSolution,
    startDate: new Date(),
    progress: 0,
    milestones: [
      "Problem Research",
      "Solution Design",
      "Prototype Development",
      "Testing",
      "Pilot Implementation",
      "Deployment",
    ].map((title) => ({ title, status: "PENDING", completion: 0 })),
  });
  problem.assignedProject = project._id;
  problem.status = "IN_PROGRESS";
  problem.progress = 0;
  await problem.save();
  await notify(
    problem.submittedBy,
    "Innovation Project Started",
    `A project has been created for ${problem.problemId}.`,
    `/projects/${project._id}`,
  );
  res
    .status(201)
    .json({
      success: true,
      message: "Innovation project created.",
      data: { project },
    });
});

export const getIndustryOpportunities = asyncHandler(async (req, res) => {
  if (
    req.user.role !== "INDUSTRY" ||
    req.user.organizationModel !== "Industry" ||
    !req.user.organization
  )
    return res
      .status(400)
      .json({
        success: false,
        message: "Your industry account is not linked to an industry.",
      });
  const filter = {
    status: {
      $in: [
        "VALIDATED",
        "ASSIGNED",
        "ACCEPTED",
        "IN_PROGRESS",
        "PROTOTYPE",
        "PILOT",
      ],
    },
    "recommendedIndustries.industry": req.user.organization,
  };
  const problems = await Problem.find(filter)
    .populate("assignedUniversity", "name shortName")
    .populate("assignedProject", "title progress stage status industryPartners")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: { problems } });
});

export const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id);
  if (!problem)
    return res
      .status(404)
      .json({ success: false, message: "Challenge not found." });
  if (
    !["ADMIN", "GOVERNMENT"].includes(req.user.role) &&
    String(problem.submittedBy) !== String(req.user._id)
  )
    return res
      .status(403)
      .json({ success: false, message: "You cannot delete this challenge." });
  if (problem.assignedProject)
    return res
      .status(400)
      .json({
        success: false,
        message: "A project already exists for this challenge.",
      });
  await problem.deleteOne();
  res.json({ success: true, message: "Challenge deleted." });
});
