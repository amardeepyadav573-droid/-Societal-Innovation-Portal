import User from "../models/User.js";
import University from "../models/University.js";
import Industry from "../models/Industry.js";
import LocationMaster from "../models/LocationMaster.js";
import { cloudinary } from "../config/cloudinary.js";
import env from "../config/env.js";
import fs from "fs/promises";

/* =========================================================
   HELPERS
========================================================= */

const uploadProfileImage = async (file, folder) => {
  if (!file) return null;

  const configured =
    env.cloudinary.cloudName &&
    env.cloudinary.apiKey &&
    env.cloudinary.apiSecret;

  if (!configured && env.isProduction) {
    await fs.unlink(file.path).catch(() => {});
    const error = new Error("Persistent image storage is not configured.");
    error.statusCode = 503;
    error.publicMessage =
      "Profile image storage is temporarily unavailable. Please try again later.";
    throw error;
  }

  if (configured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: "image",
        overwrite: false,
      });
      await fs.unlink(file.path).catch(() => {});
      return result.secure_url;
    } catch (cloudinaryError) {
      await fs.unlink(file.path).catch(() => {});
      const error = new Error("Cloudinary upload failed.");
      error.statusCode = 503;
      error.publicMessage =
        "Profile image storage is temporarily unavailable. Please try again later.";
      error.cause = cloudinaryError;
      throw error;
    }
  }

  return `/uploads/profiles/${file.filename}`;
};

const parseJSON = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const cleanString = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value).trim();
};

const cleanArray = (value) => {
  const parsed = parseJSON(value, value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const safeUser = (user) => {
  if (!user) return null;

  const obj = user.toObject ? user.toObject() : { ...user };

  delete obj.password;
  delete obj.__v;
  if (!obj.avatar && obj.organization?.logo) obj.avatar = obj.organization.logo;

  return obj;
};

const safeOrganization = (organization) => {
  if (!organization) return null;

  const obj = organization.toObject
    ? organization.toObject()
    : { ...organization };

  delete obj.__v;

  return obj;
};

/* =========================================================
   LOCATION VALIDATION
========================================================= */

const validateDistrict = async (state, district, block = "") => {
  if (!state || !district) {
    return {
      valid: false,
      message: "State and district are required."
    };
  }

  const normalizedState = String(state).trim();
  const normalizedDistrict = String(district).trim();

  const normalizedBlock = String(block || "").trim();
  const filter = { state: normalizedState, district: normalizedDistrict, isActive: true };
  if (normalizedBlock) filter.block = normalizedBlock;
  const record = await LocationMaster.findOne(filter).lean();

  if (!record) {
    return {
      valid: false,
      message: "Selected district does not belong to the selected state."
    };
  }

  return {
    valid: true,
    record
  };
};

/* =========================================================
   CITIZEN PROFILE
========================================================= */

export const getCitizenProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("organization");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: safeUser(user)
    });
  } catch (error) {
    console.error("getCitizenProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load citizen profile."
    });
  }
};

export const updateCitizenProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (
      !["CITIZEN"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Citizen profile is available only for citizen accounts."
      });
    }

    const location = parseJSON(req.body.location, {});

    const state = cleanString(location?.state);
    const district = cleanString(location?.district);

    if (state || district) {
      const validation = await validateDistrict(state, district, cleanString(location?.block));

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    }

    if (req.body.name !== undefined) {
      user.name = cleanString(req.body.name);
    }

    if (req.body.phone !== undefined) {
      user.phone = cleanString(req.body.phone);
    }

    if (req.body.dob !== undefined) {
      user.dob = req.body.dob
        ? new Date(req.body.dob)
        : null;
    }

    if (req.body.gender !== undefined) {
      user.gender = cleanString(req.body.gender);
    }

    if (req.body.occupation !== undefined) {
      user.occupation = cleanString(req.body.occupation);
    }

    if (req.body.education !== undefined) {
      user.education = cleanString(req.body.education);
    }

    if (req.body.skills !== undefined) {
      user.skills = cleanArray(req.body.skills);
    }

    if (req.body.areasOfInterest !== undefined) {
      user.areasOfInterest = cleanArray(
        req.body.areasOfInterest
      );
    }

    if (req.body.about !== undefined) {
      user.about = cleanString(req.body.about);
    }

    if (location) {
      user.location = {
        state,
        district,
        city: cleanString(location.city),
        town: cleanString(location.town),
        village: cleanString(location.village),
        block: cleanString(location.block),
        panchayat: cleanString(location.panchayat),
        pincode: cleanString(location.pincode),
        address: cleanString(location.address)
      };
    }

    if (req.file) {
      user.avatar = await uploadProfileImage(req.file, "societal-innovation/citizens");
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password");

    return res.status(200).json({
      success: true,
      message: "Citizen profile updated successfully.",
      data: safeUser(updatedUser)
    });
  } catch (error) {
    console.error("updateCitizenProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update citizen profile."
    });
  }
};

/* =========================================================
   UNIVERSITY PROFILE
========================================================= */

export const getUniversityProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("organization");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (
      !["UNIVERSITY", "FACULTY", "STUDENT"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "University profile is not available for this account."
      });
    }

    let university = null;

    if (user.organization) {
      university = await University.findById(
        user.organization
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser(user),
        university: safeOrganization(university)
      }
    });
  } catch (error) {
    console.error("getUniversityProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load university profile."
    });
  }
};

export const updateUniversityProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (
      !["UNIVERSITY", "FACULTY", "STUDENT"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "University profile is not available for this account."
      });
    }

    let university = null;

    if (user.organization) {
      university = await University.findById(
        user.organization
      );
    }

    if (!university) {
      university = new University({
        name: cleanString(req.body.name) || user.name,
        email: user.email
      });
    }

    const location = parseJSON(req.body.location, {});

    if (
      location?.state ||
      location?.district
    ) {
      const validation = await validateDistrict(
        cleanString(location.state),
        cleanString(location.district),
        cleanString(location.block)
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    }

    const fields = [
      "name",
      "shortName",
      "type",
      "email",
      "phone",
      "website",
      "establishedYear",
      "description",
      "about",
      "departments",
      "courses",
      "researchAreas",
      "expertise",
      "facilities",
      "facultyResearchers",
      "innovationFacilities",
      "incubationFacilities",
      "ongoingProjects",
      "previousProjects",
      "availableResources",
      "collaborationInterests"
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (
          [
            "departments",
            "courses",
            "researchAreas",
            "expertise",
            "facilities",
            "facultyResearchers",
            "innovationFacilities",
            "incubationFacilities",
            "ongoingProjects",
            "previousProjects",
            "availableResources",
            "collaborationInterests"
          ].includes(field)
        ) {
          university[field] = cleanArray(
            req.body[field]
          );
        } else {
          university[field] = cleanString(
            req.body[field]
          );
        }
      }
    }

    if (req.body.establishedYear !== undefined) {
      const year = Number(req.body.establishedYear);

      university.establishedYear =
        Number.isFinite(year) && year > 0
          ? year
          : undefined;
    }

    if (location) {
      university.location = {
        state: cleanString(location.state),
        district: cleanString(location.district),
        city: cleanString(location.city),
        town: cleanString(location.town),
        village: cleanString(location.village),
        block: cleanString(location.block),
        panchayat: cleanString(location.panchayat),
        pincode: cleanString(location.pincode),
        address: cleanString(location.address)
      };
    }

    if (req.file) {
      university.logo = await uploadProfileImage(req.file, "societal-innovation/universities");
    }

    await university.save();

    // Keep the account avatar in sync so navbar/profile menus work immediately.
    if (university.logo) user.avatar = university.logo;
    user.organization = university._id;
    user.organizationModel = "University";
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password").populate("organization");
    return res.status(200).json({
      success: true,
      message: "University profile updated successfully.",
      data: {
        user: safeUser(updatedUser),
        university: safeOrganization(university)
      }
    });
  } catch (error) {
    console.error("updateUniversityProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update university profile."
    });
  }
};

/* =========================================================
   INDUSTRY / STARTUP PROFILE
========================================================= */

export const getIndustryProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("organization");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (
      !["INDUSTRY", "MENTOR"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Industry profile is not available for this account."
      });
    }

    let industry = null;

    if (user.organization) {
      industry = await Industry.findById(
        user.organization
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser(user),
        industry: safeOrganization(industry)
      }
    });
  } catch (error) {
    console.error("getIndustryProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load industry profile."
    });
  }
};

export const updateIndustryProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (
      !["INDUSTRY", "MENTOR"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Industry profile is not available for this account."
      });
    }

    let industry = null;

    if (user.organization) {
      industry = await Industry.findById(
        user.organization
      );
    }

    if (!industry) {
      industry = new Industry({
        name: cleanString(req.body.name) || user.name,
        email: user.email
      });
    }

    const location = parseJSON(req.body.location, {});

    if (
      location?.state ||
      location?.district
    ) {
      const validation = await validateDistrict(
        cleanString(location.state),
        cleanString(location.district),
        cleanString(location.block)
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    }

    const arrayFields = [
      "sector",
      "productsServices",
      "technologyAreas",
      "skillsExpertise",
      "capabilities",
      "resources",
      "fundingInterests",
      "innovationAreas",
      "csrInterests",
      "researchCollaborationInterests",
      "problemsChallenges",
      "collaborationPreferences"
    ];

    const scalarFields = [
      "name",
      "type",
      "email",
      "phone",
      "website",
      "founderCEO",
      "about"
    ];

    for (const field of scalarFields) {
      if (req.body[field] !== undefined) {
        industry[field] = cleanString(
          req.body[field]
        );
      }
    }

    for (const field of arrayFields) {
      if (req.body[field] !== undefined) {
        industry[field] = cleanArray(
          req.body[field]
        );
      }
    }

    if (req.body.foundedYear !== undefined) {
      const year = Number(req.body.foundedYear);

      industry.foundedYear =
        Number.isFinite(year) && year > 0
          ? year
          : undefined;
    }

    if (location) {
      industry.location = {
        state: cleanString(location.state),
        district: cleanString(location.district),
        city: cleanString(location.city),
        town: cleanString(location.town),
        village: cleanString(location.village),
        block: cleanString(location.block),
        panchayat: cleanString(location.panchayat),
        pincode: cleanString(location.pincode),
        address: cleanString(location.address)
      };
    }

    if (req.file) {
      industry.logo = await uploadProfileImage(req.file, "societal-innovation/industries");
    }

    await industry.save();

    // Keep the account avatar in sync so navbar/profile menus and refresh/login
    // use the same persisted image URL as the organization profile.
    if (industry.logo) user.avatar = industry.logo;
    user.organization = industry._id;
    user.organizationModel = "Industry";
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password").populate("organization");
    return res.status(200).json({
      success: true,
      message: "Industry profile updated successfully.",
      data: {
        user: safeUser(updatedUser),
        industry: safeOrganization(industry)
      }
    });
  } catch (error) {
    console.error("updateIndustryProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update industry profile."
    });
  }
};