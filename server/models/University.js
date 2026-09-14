import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    shortName: {
      type: String,
      trim: true,
      maxlength: 50
    },

    type: {
      type: String,
      enum: [
        "UNIVERSITY",
        "COLLEGE",
        "INSTITUTE",
        "POLYTECHNIC",
        "RESEARCH_INSTITUTE",
        "OTHER"
      ],
      default: "UNIVERSITY"
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      trim: true
    },

    website: {
      type: String,
      trim: true
    },

    establishedYear: {
      type: Number,
      min: 1800,
      max: 2100
    },

    logo: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000
    },

    about: {
      type: String,
      trim: true,
      maxlength: 3000
    },

    /* =====================================================
       LOCATION
    ===================================================== */

    location: {
      state: {
        type: String,
        trim: true
      },

      district: {
        type: String,
        trim: true
      },

      city: {
        type: String,
        trim: true
      },

      town: {
        type: String,
        trim: true
      },

      village: {
        type: String,
        trim: true
      },

      block: {
        type: String,
        trim: true
      },

      panchayat: {
        type: String,
        trim: true
      },

      pincode: {
        type: String,
        trim: true
      },

      address: {
        type: String,
        trim: true,
        maxlength: 1000
      },

      coordinates: {
        lat: Number,
        lng: Number
      }
    },

    /* =====================================================
       ACADEMIC INFORMATION
    ===================================================== */

    departments: [
      {
        type: String,
        trim: true
      }
    ],

    courses: [
      {
        type: String,
        trim: true
      }
    ],

    disciplines: [
      {
        type: String,
        trim: true
      }
    ],

    /* =====================================================
       RESEARCH & EXPERTISE
    ===================================================== */

    researchAreas: [
      {
        type: String,
        trim: true
      }
    ],

    expertise: [
      {
        type: String,
        trim: true
      }
    ],

    facilities: [
      {
        type: String,
        trim: true
      }
    ],

    facultyResearchers: [
      {
        type: String,
        trim: true
      }
    ],

    innovationFacilities: [
      {
        type: String,
        trim: true
      }
    ],

    incubationFacilities: [
      {
        type: String,
        trim: true
      }
    ],

    /* =====================================================
       PROJECT INFORMATION
    ===================================================== */

    ongoingProjects: [
      {
        type: String,
        trim: true
      }
    ],

    previousProjects: [
      {
        type: String,
        trim: true
      }
    ],

    availableResources: [
      {
        type: String,
        trim: true
      }
    ],

    collaborationInterests: [
      {
        type: String,
        trim: true
      }
    ],

    /* =====================================================
       COUNTS
    ===================================================== */

    studentsCount: {
      type: Number,
      default: 0,
      min: 0
    },

    facultyCount: {
      type: Number,
      default: 0,
      min: 0
    },

    /* =====================================================
       STATUS
    ===================================================== */

    isVerified: {
      type: Boolean,
      default: false
    },

    validationStatus: {
      type: String,
      enum: ["PENDING", "VALIDATED", "REJECTED"],
      default: "PENDING",
      index: true
    },

    validationReason: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    validatedAt: Date,

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

universitySchema.index({
  name: "text",
  shortName: "text",
  description: "text",
  expertise: "text",
  disciplines: "text",
  researchAreas: "text"
});

universitySchema.index({ isActive: 1, "location.district": 1, name: 1 });
universitySchema.index({ isActive: 1, name: 1 });

const University =
  mongoose.models.University ||
  mongoose.model(
    "University",
    universitySchema
  );

export default University;
