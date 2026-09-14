import CollaborationRequest from "../models/CollaborationRequest.js";
import University from "../models/University.js";
import Industry from "../models/Industry.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const id = (value) => (value ? String(value) : "");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const linkedOrg = (user, model) =>
  user?.organizationModel === model && user?.organization
    ? user.organization
    : null;

const populate = (query) =>
  query
    .populate(
      "university",
      "name shortName type email phone website logo location departments courses researchAreas expertise facilities facultyResearchers innovationFacilities incubationFacilities ongoingProjects previousProjects availableResources collaborationInterests about description isVerified validationStatus validationReason",
    )
    .populate(
      "industry",
      "name type email phone website logo location sector domains productsServices technologyAreas skillsExpertise capabilities resources fundingInterests innovationAreas csrInterests researchCollaborationInterests problemsChallenges collaborationPreferences about description isVerified",
    )
    .populate(
      "requestedBy",
      "name email role organization organizationModel avatar",
    )
    .populate("respondedBy", "name email role");

export const listCollaborations = asyncHandler(async (req, res) => {
  const universityId = linkedOrg(req.user, "University");
  const industryId = linkedOrg(req.user, "Industry");
  if (!universityId && !industryId)
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Complete your organization profile before using collaborations.",
      });

  const filter = universityId
    ? { university: universityId }
    : { industry: industryId };
  if (["PENDING", "ACCEPTED", "REJECTED"].includes(req.query.status))
    filter.status = req.query.status;

  const requests = await populate(
    CollaborationRequest.find(filter).sort({ createdAt: -1 }).limit(100),
  );
  res.json({ success: true, data: { requests } });
});

export const discoverPartners = asyncHandler(async (req, res) => {
  const type = String(req.query.type || "").toUpperCase();
  const search = String(req.query.search || "").trim();
  const safeSearch = escapeRegex(search);
  const userUniversity = linkedOrg(req.user, "University");
  const userIndustry = linkedOrg(req.user, "Industry");

  if (type === "INDUSTRY") {
    if (!userUniversity)
      return res
        .status(403)
        .json({
          success: false,
          message: "Only a university account can browse industry partners.",
        });
    const filter = { isActive: true };
    if (search)
      filter.$or = [
        { name: new RegExp(safeSearch, "i") },
        { description: new RegExp(safeSearch, "i") },
        { domains: new RegExp(safeSearch, "i") },
        { technologyAreas: new RegExp(safeSearch, "i") },
      ];
    const industries = await Industry.find(filter)
      .sort({ name: 1 })
      .limit(100)
      .lean();
    const ownUniversity = String(userUniversity);
    const relations = await CollaborationRequest.find({
      university: userUniversity,
      industry: { $in: industries.map((item) => item._id) },
      status: { $in: ["PENDING", "ACCEPTED"] },
    })
      .select("industry status _id")
      .lean();
    const relationMap = new Map(
      relations.map((item) => [String(item.industry), item]),
    );
    const enriched = industries.map((item) => ({
      ...item,
      _collaborationStatus: relationMap.get(String(item._id))?.status || null,
      _collaborationRequestId: relationMap.get(String(item._id))?._id || null,
    }));
    return res.json({ success: true, data: { industries: enriched } });
  }

  if (type === "UNIVERSITY") {
    if (!userIndustry)
      return res
        .status(403)
        .json({
          success: false,
          message: "Only an industry account can browse universities.",
        });
    const filter = { isActive: true };
    if (search)
      filter.$or = [
        { name: new RegExp(safeSearch, "i") },
        { description: new RegExp(safeSearch, "i") },
        { expertise: new RegExp(safeSearch, "i") },
        { researchAreas: new RegExp(safeSearch, "i") },
      ];
    const universities = await University.find(filter)
      .sort({ name: 1 })
      .limit(100)
      .lean();
    const relations = await CollaborationRequest.find({
      industry: userIndustry,
      university: { $in: universities.map((item) => item._id) },
      status: { $in: ["PENDING", "ACCEPTED"] },
    })
      .select("university status _id")
      .lean();
    const relationMap = new Map(
      relations.map((item) => [String(item.university), item]),
    );
    const enriched = universities.map((item) => ({
      ...item,
      _collaborationStatus: relationMap.get(String(item._id))?.status || null,
      _collaborationRequestId: relationMap.get(String(item._id))?._id || null,
    }));
    return res.json({ success: true, data: { universities: enriched } });
  }

  return res
    .status(400)
    .json({
      success: false,
      message: "Partner type must be UNIVERSITY or INDUSTRY.",
    });
});

export const sendCollaborationRequest = asyncHandler(async (req, res) => {
  const requestedByType = ["UNIVERSITY", "FACULTY"].includes(req.user.role)
    ? "UNIVERSITY"
    : ["INDUSTRY", "MENTOR"].includes(req.user.role)
      ? "INDUSTRY"
      : "";
  if (!requestedByType)
    return res
      .status(403)
      .json({
        success: false,
        message:
          "Only university and industry accounts can send collaboration requests.",
      });

  const ownOrg = linkedOrg(
    req.user,
    requestedByType === "UNIVERSITY" ? "University" : "Industry",
  );
  if (!ownOrg)
    return res
      .status(400)
      .json({
        success: false,
        message: "Complete your organization profile first.",
      });

  const targetId = String(req.body.targetId || "");
  const message = String(req.body.message || "").trim();
  if (!/^[a-f\d]{24}$/i.test(targetId))
    return res
      .status(400)
      .json({ success: false, message: "Invalid partner ID." });
  if (message.length > 2000)
    return res
      .status(400)
      .json({ success: false, message: "Message is too long." });

  let universityId;
  let industryId;
  if (requestedByType === "UNIVERSITY") {
    universityId = ownOrg;
    industryId = targetId;
    if (!(await Industry.exists({ _id: industryId, isActive: true })))
      return res
        .status(404)
        .json({ success: false, message: "Industry partner not found." });
  } else {
    industryId = ownOrg;
    universityId = targetId;
    if (!(await University.exists({ _id: universityId, isActive: true })))
      return res
        .status(404)
        .json({ success: false, message: "University partner not found." });
  }

  const existing = await CollaborationRequest.findOne({
    university: universityId,
    industry: industryId,
    status: { $in: ["PENDING", "ACCEPTED"] },
  });
  if (existing?.status === "PENDING")
    return res
      .status(409)
      .json({
        success: false,
        message:
          "A collaboration request is already pending between these organizations.",
      });
  if (existing?.status === "ACCEPTED")
    return res
      .status(409)
      .json({
        success: false,
        message: "These organizations are already connected.",
      });

  const request = await CollaborationRequest.create({
    university: universityId,
    industry: industryId,
    requestedBy: req.user._id,
    requestedByType,
    message: message || "We would like to explore a collaboration opportunity.",
  });
  const [uni, industry, recipients] = await Promise.all([
    University.findById(universityId).select("name"),
    Industry.findById(industryId).select("name"),
    User.find({
      organization:
        requestedByType === "UNIVERSITY" ? industryId : universityId,
      organizationModel:
        requestedByType === "UNIVERSITY" ? "Industry" : "University",
      role: {
        $in:
          requestedByType === "UNIVERSITY"
            ? ["INDUSTRY", "MENTOR"]
            : ["UNIVERSITY", "FACULTY"],
      },
      isActive: true,
    }).select("_id"),
  ]);

  await Promise.all(
    recipients.map((recipient) =>
      createNotification({
        recipient: recipient._id,
        title: "New Collaboration Request",
        message: `${requestedByType === "UNIVERSITY" ? uni?.name : industry?.name} sent a collaboration request.`,
        type: "SYSTEM",
        link:
          requestedByType === "UNIVERSITY"
            ? "/industry/collaborations"
            : "/university/collaborations",
      }),
    ),
  );

  const populated = await populate(CollaborationRequest.findById(request._id));
  res
    .status(201)
    .json({
      success: true,
      message: "Collaboration request sent.",
      data: { request: populated },
    });
});

export const respondToCollaboration = asyncHandler(async (req, res) => {
  const request = await CollaborationRequest.findById(req.params.id);
  if (!request)
    return res
      .status(404)
      .json({ success: false, message: "Collaboration request not found." });

  const ownOrg = ["UNIVERSITY", "FACULTY"].includes(req.user.role)
    ? linkedOrg(req.user, "University")
    : ["INDUSTRY", "MENTOR"].includes(req.user.role)
      ? linkedOrg(req.user, "Industry")
      : null;
  if (!ownOrg)
    return res
      .status(403)
      .json({ success: false, message: "Organization profile is required." });

  const isUniversityRecipient =
    ["UNIVERSITY", "FACULTY"].includes(req.user.role) &&
    id(request.university) === id(ownOrg);
  const isIndustryRecipient =
    ["INDUSTRY", "MENTOR"].includes(req.user.role) &&
    id(request.industry) === id(ownOrg);
  if (!isUniversityRecipient && !isIndustryRecipient)
    return res
      .status(403)
      .json({
        success: false,
        message: "You are not authorized to manage this request.",
      });
  if (request.status !== "PENDING")
    return res
      .status(409)
      .json({
        success: false,
        message: "This request has already been processed.",
      });

  const status = String(req.body.status || "").toUpperCase();
  if (!["ACCEPTED", "REJECTED"].includes(status))
    return res
      .status(400)
      .json({ success: false, message: "Invalid collaboration status." });

  request.status = status;
  request.respondedBy = req.user._id;
  request.respondedAt = new Date();
  request.rejectionReason =
    status === "REJECTED"
      ? String(req.body.reason || "")
          .trim()
          .slice(0, 1000)
      : undefined;
  await request.save();

  const recipientOrg = isUniversityRecipient
    ? request.industry
    : request.university;
  const recipientModel = isUniversityRecipient ? "Industry" : "University";
  const users = await User.find({
    organization: recipientOrg,
    organizationModel: recipientModel,
    isActive: true,
    role: {
      $in:
        recipientModel === "Industry"
          ? ["INDUSTRY", "MENTOR"]
          : ["UNIVERSITY", "FACULTY"],
    },
  }).select("_id");
  await Promise.all(
    users.map((u) =>
      createNotification({
        recipient: u._id,
        title: `Collaboration ${status === "ACCEPTED" ? "Accepted" : "Rejected"}`,
        message: `Your collaboration request was ${status.toLowerCase()}.`,
        type: "SYSTEM",
        link:
          recipientModel === "Industry"
            ? "/industry/collaborations"
            : "/university/collaborations",
      }),
    ),
  );

  const populated = await populate(CollaborationRequest.findById(request._id));
  res.json({
    success: true,
    message: `Collaboration request ${status.toLowerCase()}.`,
    data: { request: populated },
  });
});
