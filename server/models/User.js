import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const roles = [
  "CITIZEN",
  "GOVERNMENT",
  "UNIVERSITY",
  "FACULTY",
  "STUDENT",
  "INDUSTRY",
  "MENTOR",
  "ADMIN"
];

const participationTypes = [
  "CITIZEN",
  "UNIVERSITY",
  "INDUSTRY",
  "GOVERNMENT"
];

const userSchema = new mongoose.Schema(
  {
    /* =====================================================
       BASIC ACCOUNT INFORMATION
    ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },

    role: {
      type: String,
      enum: roles,
      default: "CITIZEN",
      index: true
    },

    participationType: {
      type: String,
      enum: participationTypes,
      default: "CITIZEN"
    },

    /* =====================================================
       CITIZEN PROFILE
    ===================================================== */

    dob: {
      type: Date
    },

    gender: {
      type: String,
      trim: true,
      enum: [
        "Male",
        "Female",
        "Other",
        "Prefer not to say",
        ""
      ],
      default: ""
    },

    occupation: {
      type: String,
      trim: true,
      maxlength: 150
    },

    education: {
      type: String,
      trim: true,
      maxlength: 250
    },

    skills: [
      {
        type: String,
        trim: true,
        maxlength: 100
      }
    ],

    areasOfInterest: [
      {
        type: String,
        trim: true,
        maxlength: 150
      }
    ],

    about: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    avatar: {
      type: String,
      trim: true
    },

    /* =====================================================
       ORGANIZATION
    ===================================================== */

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "organizationModel",
      default: null
    },

    organizationModel: {
      type: String,
      enum: [
        "University",
        "Industry",
        null
      ],
      default: null
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 150
    },

    department: {
      type: String,
      trim: true,
      maxlength: 150
    },

    expertise: [
      {
        type: String,
        trim: true
      }
    ],

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

      block: {
        type: String,
        trim: true
      },

      panchayat: {
        type: String,
        trim: true
      },

      village: {
        type: String,
        trim: true
      },

      pincode: {
        type: String,
        trim: true,
        maxlength: 10
      },

      address: {
        type: String,
        trim: true,
        maxlength: 500
      }
    },

    /* =====================================================
       VERIFICATION
    ===================================================== */

    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

/* =========================================================
   PASSWORD HASHING
========================================================= */

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );

    next();
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   PASSWORD COMPARISON
========================================================= */

userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(
    candidatePassword,
    this.password
  );
};

/* =========================================================
   JSON SANITIZATION
========================================================= */

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.__v;

  return obj;
};

userSchema.index({ organization: 1, organizationModel: 1, role: 1, isActive: 1 });

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export default User;