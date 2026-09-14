import Project from "../models/Project.js";
import Problem from "../models/Problem.js";
import Industry from "../models/Industry.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const populateProject = (query) =>
  query
    .populate(
      "problem",
      "problemId title description category priority location submittedBy",
    )
    .populate("university", "name shortName location")
    .populate("facultyMentor", "name email department expertise")
    .populate("studentTeam", "name email department expertise")
    .populate("industryPartners", "name type capabilities")
    .populate("collaborationRequests.industry", "name type capabilities")
    .populate("collaborationRequests.requestedBy", "name email role");

const canManageProject = (user, project) => {
  if (["ADMIN", "GOVERNMENT"].includes(user.role)) return true;
  if (user.role === "UNIVERSITY")
    return String(user.organization) === String(project.university);
  if (["FACULTY", "MENTOR"].includes(user.role))
    return (
      String(user._id) === String(project.facultyMentor) ||
      String(user.organization) === String(project.university)
    );
  if (user.role === "INDUSTRY")
    return (project.industryPartners || []).some(
      (id) => String(id) === String(user.organization),
    );
  return false;
};

const syncProblem = async (project) => {
  const progress = Number(project.progress || 0);
  let status = "IN_PROGRESS";
  if (project.stage === "PROTOTYPE") status = "PROTOTYPE";
  if (project.stage === "PILOT") status = "PILOT";
  if (project.stage === "DEPLOYMENT") status = "IMPLEMENTED";
  if (
    project.stage === "COMPLETED" ||
    project.status === "COMPLETED" ||
    progress >= 100
  )
    status = "COMPLETED";
  await Problem.findByIdAndUpdate(project.problem, {
    progress,
    status,
    assignedProject: project._id,
  });
};

export const getProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === "CITIZEN") {
    const citizenProblems = await Problem.find({
      submittedBy: req.user._id,
    }).select("_id");
    filter.problem = { $in: citizenProblems.map((p) => p._id) };
  }
  if (
    req.user.role === "UNIVERSITY" ||
    req.user.role === "FACULTY" ||
    req.user.role === "STUDENT"
  ) {
    if (req.user.role === "UNIVERSITY")
      filter.university = req.user.organization;
  }
  if (req.user.role === "INDUSTRY" || req.user.role === "MENTOR")
    filter.industryPartners = req.user.organization;
  if (req.user.role === "STUDENT") filter.studentTeam = req.user._id;
  if (req.user.role === "FACULTY") filter.facultyMentor = req.user._id;
  const projects = await populateProject(
    Project.find(filter).sort({ createdAt: -1 }),
  );
  res.json({ success: true, data: { projects } });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await populateProject(Project.findById(req.params.id));
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  res.json({ success: true, data: { project } });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  if (!canManageProject(req.user, project))
    return res
      .status(403)
      .json({
        success: false,
        message: "You do not have permission to update this project.",
      });
  const allowed = [
    "title",
    "description",
    "objective",
    "stage",
    "status",
    "facultyMentor",
    "studentTeam",
    "industryPartners",
    "budget",
    "impact",
    "outcomes",
    "expectedEndDate",
  ];
  for (const field of allowed)
    if (req.body[field] !== undefined) project[field] = req.body[field];
  if (req.body.proposal !== undefined)
    project.proposal = {
      ...(project.proposal?.toObject?.() || project.proposal || {}),
      ...req.body.proposal,
    };
  if (project.stage === "COMPLETED" || project.status === "COMPLETED") {
    project.progress = 100;
    project.actualEndDate ||= new Date();
  }
  await project.save();
  await syncProblem(project);
  const updated = await populateProject(Project.findById(project._id));
  res.json({
    success: true,
    message: "Project updated successfully.",
    data: { project: updated },
  });
});

export const updateMilestone = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  if (!canManageProject(req.user, project))
    return res
      .status(403)
      .json({
        success: false,
        message: "You do not have permission to update this project.",
      });
  const milestone = project.milestones.id(req.params.milestoneId);
  if (!milestone)
    return res
      .status(404)
      .json({ success: false, message: "Milestone not found." });
  if (req.body.status !== undefined) milestone.status = req.body.status;
  if (req.body.completion !== undefined)
    milestone.completion = Math.max(
      0,
      Math.min(100, Number(req.body.completion)),
    );
  if (req.body.deliverables !== undefined)
    milestone.deliverables = Array.isArray(req.body.deliverables)
      ? req.body.deliverables
      : [];
  if (milestone.completion >= 100) milestone.status = "COMPLETED";
  if (
    milestone.completion > 0 &&
    milestone.completion < 100 &&
    milestone.status === "PENDING"
  )
    milestone.status = "IN_PROGRESS";
  await project.save();
  await syncProblem(project);
  const updated = await populateProject(Project.findById(project._id));
  res.json({
    success: true,
    message: "Milestone updated.",
    data: { project: updated },
  });
});

export const submitProposal = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  if (
    !["UNIVERSITY", "FACULTY"].includes(req.user.role) ||
    (req.user.role === "UNIVERSITY" &&
      String(req.user.organization) !== String(project.university))
  )
    return res
      .status(403)
      .json({
        success: false,
        message: "Only the assigned university team can submit this proposal.",
      });
  const { abstract, methodology, expectedOutcome, budget } = req.body;
  if (!abstract || !methodology || !expectedOutcome)
    return res
      .status(400)
      .json({
        success: false,
        message: "Abstract, methodology and expected outcome are required.",
      });
  project.proposal = {
    ...(project.proposal?.toObject?.() || project.proposal || {}),
    abstract,
    methodology,
    expectedOutcome,
    budget: Number(budget || 0),
    submittedAt: new Date(),
    status: "SUBMITTED",
  };
  project.budget.requested = Number(budget || 0);
  await project.save();
  res.json({
    success: true,
    message: "Proposal submitted for review.",
    data: { project },
  });
});

export const reviewProposal = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  if (
    !canManageProject(req.user, project) &&
    !["GOVERNMENT", "ADMIN"].includes(req.user.role)
  )
    return res.status(403).json({ success: false, message: "Not authorized." });
  const { status } = req.body;
  if (!["UNDER_REVIEW", "APPROVED", "REJECTED"].includes(status))
    return res
      .status(400)
      .json({ success: false, message: "Invalid proposal review status." });
  project.proposal.status = status;
  if (status === "APPROVED") project.proposal.approvedAt = new Date();
  await project.save();
  res.json({
    success: true,
    message: `Proposal ${status.toLowerCase()}.`,
    data: { project },
  });
});

export const requestCollaboration = asyncHandler(async (req, res) => {
  if (
    req.user.role !== "INDUSTRY" ||
    req.user.organizationModel !== "Industry" ||
    !req.user.organization
  )
    return res
      .status(403)
      .json({
        success: false,
        message: "Only a linked industry account can request collaboration.",
      });
  const project = await Project.findById(req.params.id);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  const alreadyPartner = project.industryPartners.some(
    (id) => String(id) === String(req.user.organization),
  );
  if (alreadyPartner)
    return res
      .status(409)
      .json({
        success: false,
        message: "Your industry is already a project partner.",
      });
  const pending = project.collaborationRequests.find(
    (r) =>
      String(r.industry) === String(req.user.organization) &&
      r.status === "PENDING",
  );
  if (pending)
    return res
      .status(409)
      .json({
        success: false,
        message: "Collaboration request already pending.",
      });
  project.collaborationRequests.push({
    industry: req.user.organization,
    requestedBy: req.user._id,
    message: String(
      req.body.message ||
        "Interested in mentoring, prototyping or implementation.",
    ),
    status: "PENDING",
  });
  await project.save();
  const universityUsers = await User.find({
    organization: project.university,
    organizationModel: "University",
    role: "UNIVERSITY",
    isActive: true,
  }).select("_id");
  const industry = await Industry.findById(req.user.organization).select(
    "name",
  );
  await Promise.all(
    universityUsers.map((u) =>
      createNotification({
        recipient: u._id,
        title: "Industry Collaboration Request",
        message: `${industry?.name || "An industry partner"} requested collaboration on ${project.title}.`,
        type: "PROJECT",
        link: `/projects/${project._id}`,
      }),
    ),
  );
  res
    .status(201)
    .json({
      success: true,
      message: "Collaboration request sent.",
      data: { project },
    });
});

export const respondCollaboration = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  if (
    req.user.role !== "UNIVERSITY" ||
    String(req.user.organization) !== String(project.university)
  )
    return res
      .status(403)
      .json({
        success: false,
        message: "Only the project university can respond.",
      });
  const request = project.collaborationRequests.id(req.params.requestId);
  if (!request)
    return res
      .status(404)
      .json({ success: false, message: "Collaboration request not found." });
  const { status } = req.body;
  if (!["ACCEPTED", "REJECTED"].includes(status))
    return res
      .status(400)
      .json({ success: false, message: "Invalid response." });
  request.status = status;
  request.respondedAt = new Date();
  if (
    status === "ACCEPTED" &&
    !project.industryPartners.some(
      (id) => String(id) === String(request.industry),
    )
  )
    project.industryPartners.push(request.industry);
  await project.save();
  await createNotification({
    recipient: request.requestedBy,
    title: `Collaboration ${status === "ACCEPTED" ? "Accepted" : "Declined"}`,
    message: `${project.title}: your collaboration request was ${status.toLowerCase()}.`,
    type: "PROJECT",
    link: `/projects/${project._id}`,
  });
  res.json({
    success: true,
    message: `Collaboration ${status.toLowerCase()}.`,
    data: { project },
  });
});
