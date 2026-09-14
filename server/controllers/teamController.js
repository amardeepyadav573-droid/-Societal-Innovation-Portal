import Team from "../models/Team.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const linkedUniversity = (req) =>
  ["UNIVERSITY", "FACULTY", "STUDENT"].includes(req.user.role) &&
  req.user.organizationModel === "University" &&
  req.user.organization;

export const getTeams = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res
      .status(400)
      .json({
        success: false,
        message: "Your university account is not linked to a university.",
      });
  const teams = await Team.find({ university: req.user.organization })
    .populate("project", "title progress stage")
    .populate("facultyMentors", "name email department role")
    .populate("facultyMentor", "name email department role")
    .populate("members", "name email department role")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { teams } });
});

export const createTeam = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res
      .status(403)
      .json({
        success: false,
        message: "Only a linked university account can create teams.",
      });
  const { name, description, projectId } = req.body;
  if (!String(name || "").trim())
    return res
      .status(400)
      .json({ success: false, message: "Team name is required." });
  let project = null;
  if (projectId) {
    project = await Project.findOne({
      _id: projectId,
      university: req.user.organization,
    });
    if (!project)
      return res
        .status(404)
        .json({
          success: false,
          message: "Project not found for your university.",
        });
  }
  const mentorIds = Array.isArray(req.body.facultyMentors)
    ? req.body.facultyMentors
    : req.body.facultyMentor
      ? [req.body.facultyMentor]
      : [];
  const mentors = await User.find({
    _id: { $in: mentorIds },
    organization: req.user.organization,
    role: { $in: ["FACULTY", "MENTOR", "UNIVERSITY"] },
    isActive: true,
  }).select("_id");
  const studentIds = Array.isArray(req.body.studentMembers)
    ? req.body.studentMembers
    : [];
  const cleanNames = (value) =>
    Array.isArray(value)
      ? [
          ...new Set(value.map((x) => String(x || "").trim()).filter(Boolean)),
        ].slice(0, 50)
      : [];
  const manualFacultyMentors = cleanNames(req.body.manualFacultyMentors);
  const manualStudentMembers = cleanNames(req.body.manualStudentMembers);
  const students = await User.find({
    _id: { $in: studentIds },
    organization: req.user.organization,
    role: "STUDENT",
    isActive: true,
  }).select("_id");
  const members = [req.user._id, ...students.map((x) => x._id)];
  const team = await Team.create({
    name: String(name).trim(),
    description: String(description || "").trim(),
    university: req.user.organization,
    project: project?._id || null,
    facultyMentors: mentors.map((x) => x._id),
    facultyMentor: mentors[0]?._id || null,
    manualFacultyMentors,
    manualStudentMembers,
    members,
    status: String(req.body.status || "ACTIVE").toUpperCase(),
  });
  if (
    project &&
    !project.studentTeam.some((id) => String(id) === String(req.user._id))
  ) {
    project.studentTeam.push(req.user._id);
    await project.save();
  }
  const populated = await Team.findById(team._id)
    .populate("project", "title progress stage")
    .populate("facultyMentor", "name email")
    .populate("members", "name email department role");
  res
    .status(201)
    .json({
      success: true,
      message: "Research team created.",
      data: { team: populated },
    });
});

export const addTeamMember = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res.status(403).json({ success: false, message: "Not authorized." });
  const team = await Team.findOne({
    _id: req.params.id,
    university: req.user.organization,
  });
  if (!team)
    return res.status(404).json({ success: false, message: "Team not found." });
  const member = await User.findOne({
    _id: req.body.userId,
    organization: req.user.organization,
    role: { $in: ["STUDENT", "FACULTY", "MENTOR", "UNIVERSITY"] },
    isActive: true,
  });
  if (!member)
    return res
      .status(404)
      .json({ success: false, message: "University member not found." });
  const isFaculty = ["FACULTY", "MENTOR", "UNIVERSITY"].includes(member.role);
  if (isFaculty) {
    if (!team.facultyMentors.some((id) => String(id) === String(member._id))) {
      team.facultyMentors.push(member._id);
    }
    if (!team.facultyMentor) team.facultyMentor = member._id;
  } else if (!team.members.some((id) => String(id) === String(member._id))) {
    team.members.push(member._id);
  }
  await team.save();
  if (!isFaculty && team.project) {
    await Project.findByIdAndUpdate(team.project, {
      $addToSet: { studentTeam: member._id },
    });
  }
  const populated = await Team.findById(team._id)
    .populate("project", "title progress stage")
    .populate("facultyMentors", "name email department role")
    .populate("facultyMentor", "name email department role")
    .populate("members", "name email department role");
  res.json({
    success: true,
    message: isFaculty
      ? "Faculty / mentor added to team."
      : "Student member added to team.",
    data: { team: populated },
  });
});

export const updateTeam = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res.status(403).json({ success: false, message: "Not authorized." });
  const team = await Team.findOne({
    _id: req.params.id,
    university: req.user.organization,
  });
  if (!team)
    return res.status(404).json({ success: false, message: "Team not found." });
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Team name is required." });
    team.name = name;
  }
  if (req.body.description !== undefined)
    team.description = String(req.body.description).trim();
  if (
    req.body.status !== undefined &&
    ["PLANNING", "ACTIVE", "COMPLETED"].includes(
      String(req.body.status).toUpperCase(),
    )
  )
    team.status = String(req.body.status).toUpperCase();
  if (req.body.projectId !== undefined) {
    if (!req.body.projectId) team.project = null;
    else {
      const project = await Project.findOne({
        _id: req.body.projectId,
        university: req.user.organization,
      });
      if (!project)
        return res
          .status(404)
          .json({
            success: false,
            message: "Project not found for your university.",
          });
      team.project = project._id;
    }
  }
  if (
    req.body.facultyMentors !== undefined ||
    req.body.facultyMentor !== undefined
  ) {
    const ids = Array.isArray(req.body.facultyMentors)
      ? req.body.facultyMentors
      : req.body.facultyMentor
        ? [req.body.facultyMentor]
        : [];
    const mentors = await User.find({
      _id: { $in: ids },
      organization: req.user.organization,
      role: { $in: ["FACULTY", "MENTOR", "UNIVERSITY"] },
      isActive: true,
    }).select("_id");
    team.facultyMentors = mentors.map((x) => x._id);
    team.facultyMentor = mentors[0]?._id || null;
  }
  if (req.body.studentMembers !== undefined) {
    const students = await User.find({
      _id: { $in: req.body.studentMembers || [] },
      organization: req.user.organization,
      role: "STUDENT",
      isActive: true,
    }).select("_id");
    const creator = team.members?.[0] || req.user._id;
    team.members = [
      creator,
      ...students
        .map((x) => x._id)
        .filter((id) => String(id) !== String(creator)),
    ];
  }
  if (req.body.manualFacultyMentors !== undefined)
    team.manualFacultyMentors = [
      ...new Set(
        (Array.isArray(req.body.manualFacultyMentors)
          ? req.body.manualFacultyMentors
          : []
        )
          .map((x) => String(x || "").trim())
          .filter(Boolean),
      ),
    ].slice(0, 50);
  if (req.body.manualStudentMembers !== undefined)
    team.manualStudentMembers = [
      ...new Set(
        (Array.isArray(req.body.manualStudentMembers)
          ? req.body.manualStudentMembers
          : []
        )
          .map((x) => String(x || "").trim())
          .filter(Boolean),
      ),
    ].slice(0, 50);
  await team.save();
  const populated = await Team.findById(team._id)
    .populate("project", "title progress stage")
    .populate("facultyMentors", "name email department role")
    .populate("facultyMentor", "name email department role")
    .populate("members", "name email department role");
  res.json({
    success: true,
    message: "Research team updated.",
    data: { team: populated },
  });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res.status(403).json({ success: false, message: "Not authorized." });
  const team = await Team.findOne({
    _id: req.params.id,
    university: req.user.organization,
  });
  if (!team)
    return res.status(404).json({ success: false, message: "Team not found." });
  await Team.deleteOne({ _id: team._id });
  res.json({ success: true, message: "Research team deleted." });
});

export const removeTeamMember = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res.status(403).json({ success: false, message: "Not authorized." });
  const team = await Team.findOne({
    _id: req.params.id,
    university: req.user.organization,
  });
  if (!team)
    return res.status(404).json({ success: false, message: "Team not found." });
  if (String(team.members?.[0]) === String(req.params.userId))
    return res
      .status(400)
      .json({ success: false, message: "The team creator cannot be removed." });
  team.members = (team.members || []).filter(
    (id) => String(id) !== String(req.params.userId),
  );
  team.facultyMentors = (team.facultyMentors || []).filter(
    (id) => String(id) !== String(req.params.userId),
  );
  if (String(team.facultyMentor || "") === String(req.params.userId)) {
    team.facultyMentor = team.facultyMentors[0] || null;
  }
  await team.save();
  if (team.project)
    await Project.findByIdAndUpdate(team.project, {
      $pull: { studentTeam: req.params.userId },
    });
  res.json({ success: true, message: "Member removed.", data: { team } });
});

export const getUniversityMembers = asyncHandler(async (req, res) => {
  if (!linkedUniversity(req))
    return res.status(403).json({ success: false, message: "Not authorized." });
  const members = await User.find({
    organization: req.user.organization,
    organizationModel: "University",
    isActive: true,
    role: { $in: ["STUDENT", "FACULTY", "MENTOR", "UNIVERSITY"] },
  })
    .select("name email role department")
    .sort({ name: 1 })
    .limit(300)
    .lean();
  res.json({ success: true, data: { members } });
});
