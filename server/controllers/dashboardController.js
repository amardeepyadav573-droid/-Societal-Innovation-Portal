import mongoose from "mongoose";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Project from "../models/Project.js";
import University from "../models/University.js";
import Industry from "../models/Industry.js";
import Team from "../models/Team.js";
import asyncHandler from "../utils/asyncHandler.js";

const oid = (v) =>
  v && mongoose.Types.ObjectId.isValid(v)
    ? new mongoose.Types.ObjectId(v)
    : null;
const percent = (n, total) =>
  total ? Number(((n / total) * 100).toFixed(1)) : 0;
const fmt = (items, total, key) =>
  items.map((x) => ({
    [key]: x._id || "OTHER",
    count: x.count,
    percentage: percent(x.count, total),
  }));
const activeProject = {
  status: "ACTIVE",
  stage: {
    $in: [
      "RESEARCH",
      "PLANNING",
      "DEVELOPMENT",
      "PROTOTYPE",
      "TESTING",
      "PILOT",
      "DEPLOYMENT",
    ],
  },
};

let publicStatisticsCache = null;
let publicStatisticsCacheAt = 0;
const PUBLIC_STATISTICS_TTL_MS = 30_000;

export const getPublicStatistics = asyncHandler(async (_req, res) => {
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  if (
    publicStatisticsCache &&
    Date.now() - publicStatisticsCacheAt < PUBLIC_STATISTICS_TTL_MS
  ) {
    return res.json({ success: true, data: publicStatisticsCache });
  }
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  const [
    totalChallenges,
    underReview,
    resolvedChallenges,
    activeProjects,
    citizens,
    universities,
    industries,
    impact,
  ] = await Promise.all([
    Problem.countDocuments(),
    Problem.countDocuments({ status: "UNDER_REVIEW" }),
    Problem.countDocuments({ status: { $in: ["IMPLEMENTED", "COMPLETED"] } }),
    Project.countDocuments(activeProject),
    User.countDocuments({ role: "CITIZEN", isActive: true }),
    University.countDocuments({ isActive: true }),
    Industry.countDocuments({ isActive: true }),
    Project.aggregate([
      {
        $group: {
          _id: null,
          peopleImpacted: { $sum: "$impact.peopleImpacted" },
        },
      },
    ]),
  ]);
  const data = {
    totalChallenges,
    underReview,
    activeProjects,
    resolvedChallenges,
    citizens,
    universities,
    industries,
    peopleImpacted: impact[0]?.peopleImpacted || 0,
  };
  publicStatisticsCache = data;
  publicStatisticsCacheAt = Date.now();
  res.json({ success: true, data });
});

export const getGovernmentDashboard = asyncHandler(async (req, res) => {
  const [
    totalChallenges,
    submitted,
    underReview,
    validated,
    assigned,
    accepted,
    inProgress,
    resolved,
    activeProjects,
    completedProjects,
    citizens,
    universities,
    industries,
    teams,
    statusBreakdown,
    domainBreakdown,
    recentChallenges,
    impact,
    outcomeCounts,
    districtBreakdown,
  ] = await Promise.all([
    Problem.countDocuments(),
    Problem.countDocuments({ status: "SUBMITTED" }),
    Problem.countDocuments({ status: "UNDER_REVIEW" }),
    Problem.countDocuments({ status: "VALIDATED" }),
    Problem.countDocuments({ status: "ASSIGNED" }),
    Problem.countDocuments({ status: "ACCEPTED" }),
    Problem.countDocuments({
      status: { $in: ["IN_PROGRESS", "PROTOTYPE", "PILOT"] },
    }),
    Problem.countDocuments({ status: { $in: ["IMPLEMENTED", "COMPLETED"] } }),
    Project.countDocuments(activeProject),
    Project.countDocuments({
      $or: [{ status: "COMPLETED" }, { stage: "COMPLETED" }],
    }),
    User.countDocuments({ role: "CITIZEN", isActive: true }),
    University.countDocuments({ isActive: true }),
    Industry.countDocuments({ isActive: true }),
    Team.countDocuments(),
    Problem.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Problem.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Problem.find()
      .populate("submittedBy", "name role")
      .populate("assignedUniversity", "name shortName")
      .populate("acceptedBy", "name email role")
      .populate("assignedProject", "title progress stage status")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Project.aggregate([
      {
        $group: {
          _id: null,
          peopleImpacted: { $sum: "$impact.peopleImpacted" },
          villagesCovered: { $sum: "$impact.villagesCovered" },
          costSaved: { $sum: "$impact.costSaved" },
          waterSaved: { $sum: "$impact.waterSaved" },
          energySaved: { $sum: "$impact.energySaved" },
          employmentGenerated: { $sum: "$impact.employmentGenerated" },
        },
      },
    ]),
    Project.aggregate([
      {
        $group: {
          _id: null,
          prototypes: {
            $sum: { $cond: [{ $eq: ["$outcomes.prototype", true] }, 1, 0] },
          },
          patents: {
            $sum: { $cond: [{ $eq: ["$outcomes.patent", true] }, 1, 0] },
          },
          startups: {
            $sum: { $cond: [{ $eq: ["$outcomes.startup", true] }, 1, 0] },
          },
          researchPapers: {
            $sum: { $cond: [{ $eq: ["$outcomes.researchPaper", true] }, 1, 0] },
          },
          technologyTransfers: {
            $sum: {
              $cond: [{ $eq: ["$outcomes.technologyTransfer", true] }, 1, 0],
            },
          },
        },
      },
    ]),
    Problem.aggregate([
      { $group: { _id: "$location.district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const monthly = await Problem.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 11, 1)),
        },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const i = impact[0] || {
    peopleImpacted: 0,
    villagesCovered: 0,
    costSaved: 0,
    waterSaved: 0,
    energySaved: 0,
    employmentGenerated: 0,
  };
  const o = outcomeCounts[0] || {
    prototypes: 0,
    patents: 0,
    startups: 0,
    researchPapers: 0,
    technologyTransfers: 0,
  };
  res.json({
    success: true,
    data: {
      stats: {
        totalChallenges,
        submitted,
        underReview,
        validated,
        assigned,
        accepted,
        inProgress,
        completed: resolved,
        resolved,
        activeProjects,
        completedProjects,
        citizens,
        universities,
        industries,
        teams,
        peopleImpacted: i.peopleImpacted,
      },
      statusBreakdown: fmt(statusBreakdown, totalChallenges, "status"),
      domainBreakdown: fmt(domainBreakdown, totalChallenges, "category"),
      districtBreakdown,
      monthlySubmissions: monthly,
      impact: i,
      outcomes: o,
      recentChallenges,
    },
  });
});

export const getCitizenDashboard = asyncHandler(async (req, res) => {
  const userId = oid(req.user?._id);
  if (!userId)
    return res
      .status(401)
      .json({
        success: false,
        message: "Authenticated user could not be resolved.",
      });
  const base = { submittedBy: userId };
  const [
    totalChallenges,
    submitted,
    underReview,
    validated,
    assigned,
    inProgress,
    resolved,
    impact,
    recentChallenges,
    domains,
  ] = await Promise.all([
    Problem.countDocuments(base),
    Problem.countDocuments({ ...base, status: "SUBMITTED" }),
    Problem.countDocuments({ ...base, status: "UNDER_REVIEW" }),
    Problem.countDocuments({ ...base, status: "VALIDATED" }),
    Problem.countDocuments({
      ...base,
      status: { $in: ["ASSIGNED", "ACCEPTED"] },
    }),
    Problem.countDocuments({
      ...base,
      status: { $in: ["IN_PROGRESS", "PROTOTYPE", "PILOT"] },
    }),
    Problem.countDocuments({
      ...base,
      status: { $in: ["IMPLEMENTED", "COMPLETED"] },
    }),
    Problem.aggregate([
      { $match: base },
      { $group: { _id: null, peopleImpacted: { $sum: "$affectedPeople" } } },
    ]),
    Problem.find(base)
      .populate("assignedUniversity", "name shortName")
      .populate("acceptedBy", "name email role")
      .populate("assignedProject", "title progress stage status")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Problem.aggregate([
      { $match: base },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  const peopleImpacted = impact[0]?.peopleImpacted || 0;
  res.json({
    success: true,
    data: {
      stats: {
        totalChallenges,
        submitted,
        underReview,
        validated,
        assigned,
        inProgress,
        resolved,
        completed: resolved,
        peopleImpacted,
      },
      domainBreakdown: fmt(domains, totalChallenges, "category"),
      recentChallenges,
      recentProblems: recentChallenges,
    },
  });
});

export const getUniversityDashboard = asyncHandler(async (req, res) => {
  const universityId = oid(req.user?.organization);
  if (
    !["UNIVERSITY", "FACULTY", "STUDENT"].includes(req.user?.role) ||
    req.user?.organizationModel !== "University" ||
    !universityId
  )
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Your university account is not linked to a university. Open Settings and complete the university profile.",
      });
  const university = await University.findById(universityId).lean();
  if (!university)
    return res
      .status(404)
      .json({ success: false, message: "Linked university not found." });
  const pf = { university: universityId },
    af = { assignedUniversity: universityId };
  const [
    assignedChallenges,
    pendingChallenges,
    acceptedChallenges,
    activeProjects,
    completedProjects,
    researchProjects,
    prototypeProjects,
    pilotProjects,
    implementedProjects,
    facultyMentors,
    studentMembers,
    researchTeams,
    industryCollaborations,
    recentChallenges,
    requests,
    recentProjects,
  ] = await Promise.all([
    Problem.countDocuments(af),
    Problem.countDocuments({ ...af, status: "ASSIGNED" }),
    Problem.countDocuments({
      ...af,
      status: { $in: ["ACCEPTED", "IN_PROGRESS", "PROTOTYPE", "PILOT"] },
    }),
    Project.countDocuments({ ...pf, ...activeProject }),
    Project.countDocuments({
      ...pf,
      $or: [{ status: "COMPLETED" }, { stage: "COMPLETED" }],
    }),
    Project.countDocuments({
      ...pf,
      stage: "RESEARCH",
      status: { $ne: "COMPLETED" },
    }),
    Project.countDocuments({
      ...pf,
      stage: "PROTOTYPE",
      status: { $ne: "COMPLETED" },
    }),
    Project.countDocuments({
      ...pf,
      stage: "PILOT",
      status: { $ne: "COMPLETED" },
    }),
    Project.countDocuments({
      ...pf,
      stage: { $in: ["DEPLOYMENT", "COMPLETED"] },
    }),
    User.countDocuments({
      organization: universityId,
      organizationModel: "University",
      role: { $in: ["FACULTY", "MENTOR"] },
      isActive: true,
    }),
    User.countDocuments({
      organization: universityId,
      organizationModel: "University",
      role: "STUDENT",
      isActive: true,
    }),
    Team.countDocuments({ university: universityId }),
    Project.countDocuments({
      ...pf,
      industryPartners: { $exists: true, $ne: [] },
    }),
    Problem.find(af)
      .populate("submittedBy", "name role")
      .populate("acceptedBy", "name email role")
      .populate("assignedProject", "title progress stage status")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Project.find({ ...pf, "collaborationRequests.status": "PENDING" })
      .populate("collaborationRequests.industry", "name type capabilities")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);
  res.json({
    success: true,
    data: {
      university: {
        _id: university._id,
        name: university.name,
        shortName: university.shortName,
        location: university.location,
        expertise: university.expertise,
      },
      stats: {
        assignedChallenges,
        pendingChallenges,
        acceptedChallenges,
        activeProjects,
        completedProjects,
        researchProjects,
        prototypeProjects,
        pilotProjects,
        implementedProjects,
        facultyMentors,
        studentMembers,
        researchTeams,
        industryCollaborations,
      },
      recentChallenges,
      collaborationRequests: requests.flatMap((p) =>
        (p.collaborationRequests || [])
          .filter((r) => r.status === "PENDING")
          .map((r) => ({
            ...(typeof r.toObject === "function" ? r.toObject() : r),
            projectId: p._id,
            projectTitle: p.title,
          })),
      ),
      recentProjects,
    },
  });
});

export const getIndustryDashboard = asyncHandler(async (req, res) => {
  const industryId = oid(req.user?.organization);
  if (
    !["INDUSTRY", "MENTOR"].includes(req.user?.role) ||
    req.user?.organizationModel !== "Industry" ||
    !industryId
  )
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Your industry account is not linked to an industry. Open Settings and complete the industry profile.",
      });
  const industry = await Industry.findById(industryId).lean();
  if (!industry)
    return res
      .status(404)
      .json({ success: false, message: "Linked industry not found." });
  const pf = { industryPartners: industryId };
  const [
    activeProjects,
    completedProjects,
    universityPartners,
    mentors,
    prototypesSupported,
    deployments,
    recentProjects,
    matchedChallenges,
    pendingRequests,
  ] = await Promise.all([
    Project.countDocuments({ ...pf, ...activeProject }),
    Project.countDocuments({
      ...pf,
      $or: [{ status: "COMPLETED" }, { stage: "COMPLETED" }],
    }),
    Project.distinct("university", pf),
    Project.distinct("facultyMentor", { ...pf, facultyMentor: { $ne: null } }),
    Project.countDocuments({
      ...pf,
      stage: { $in: ["PROTOTYPE", "TESTING", "PILOT"] },
    }),
    Project.countDocuments({
      ...pf,
      stage: { $in: ["DEPLOYMENT", "COMPLETED"] },
    }),
    Project.find(pf)
      .populate("university", "name shortName")
      .populate("problem", "title problemId category")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Problem.countDocuments({
      "recommendedIndustries.industry": industryId,
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
    }),
    Project.countDocuments({
      "collaborationRequests.industry": industryId,
      "collaborationRequests.status": "PENDING",
    }),
  ]);
  const [mentoring, coDevelopment, funding, pilotDeployment] =
    await Promise.all([
      Project.countDocuments({ ...pf, facultyMentor: { $ne: null } }),
      Project.countDocuments({
        ...pf,
        stage: { $in: ["DEVELOPMENT", "PROTOTYPE", "TESTING"] },
      }),
      Project.countDocuments({
        ...pf,
        $or: [
          { "budget.approved": { $gt: 0 } },
          { "budget.spent": { $gt: 0 } },
        ],
      }),
      Project.countDocuments({
        ...pf,
        stage: { $in: ["PILOT", "DEPLOYMENT", "COMPLETED"] },
      }),
    ]);
  res.json({
    success: true,
    data: {
      industry: {
        _id: industry._id,
        name: industry.name,
        type: industry.type,
        domains: industry.domains,
        capabilities: industry.capabilities,
      },
      stats: {
        activeCollaborations: activeProjects,
        challengesEngaged: matchedChallenges,
        activeProjects,
        completedPilots: completedProjects,
        mentoring,
        coDevelopment,
        funding,
        pilotDeployment,
        universityPartners: universityPartners.filter(Boolean).length,
        mentors: mentors.filter(Boolean).length,
        prototypesSupported,
        deployments,
        pendingRequests,
      },
      recentProjects,
    },
  });
});
