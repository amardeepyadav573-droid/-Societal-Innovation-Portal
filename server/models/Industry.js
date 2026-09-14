import mongoose from "mongoose";

const industrySchema = new mongoose.Schema(
  {
    /* =====================================================
       BASIC ORGANIZATION INFORMATION
    ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    type: {
      type: String,
      enum: [
        "INDUSTRY",
        "STARTUP",
        "MSME",
        "CSR",
        "RESEARCH_LAB",
        "INNOVATION_HUB",
        "NGO",
        "OTHER"
      ],
      default: "STARTUP"
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

    foundedYear: {
      type: Number,
      min: 1800,
      max: 2100
    },

    founderCEO: {
      type: String,
      trim: true,
      maxlength: 150
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
      }
    },

    /* =====================================================
       BUSINESS / TECHNOLOGY
    ===================================================== */

    sector: [
      {
        type: String,
        trim: true
      }
    ],

    domains: [
      {
        type: String,
        trim: true
      }
    ],

    productsServices: [
      {
        type: String,
        trim: true
      }
    ],

    technologyAreas: [
      {
        type: String,
        trim: true
      }
    ],

    skillsExpertise: [
      {
        type: String,
        trim: true
      }
    ],

    capabilities: [
      {
        type: String,
        trim: true
      }
    ],

    resources: [
      {
        type: String,
        trim: true
      }
    ],

    /* =====================================================
       FUNDING & INNOVATION
    ===================================================== */

    fundingInterests: [
      {
        type: String,
        trim: true
      }
    ],

    innovationAreas: [
      {
        type: String,
        trim: true
      }
    ],

    csrInterests: [
      {
        type: String,
        trim: true
      }
    ],

    researchCollaborationInterests: [
      {
        type: String,
        trim: true
      }
    ],

    problemsChallenges: [
      {
        type: String,
        trim: true
      }
    ],

    collaborationPreferences: [
      {
        type: String,
        trim: true
      }
    ],

    /* =====================================================
       EXISTING SYSTEM COMPATIBILITY
    ===================================================== */

    supportTypes: [
      {
        type: String,
        enum: [
          "MENTORSHIP",
          "FUNDING",
          "TECHNOLOGY",
          "PROTOTYPING",
          "TESTING",
          "PILOT",
          "DEPLOYMENT",
          "MANUFACTURING",
          "CSR"
        ]
      }
    ],

    fundingCapacity: {
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

industrySchema.index({
  name: "text",
  description: "text",
  domains: "text",
  capabilities: "text",
  sector: "text",
  technologyAreas: "text"
});

industrySchema.index({ isActive: 1, name: 1 });

const Industry =
  mongoose.models.Industry ||
  mongoose.model(
    "Industry",
    industrySchema
  );

export default Industry;
