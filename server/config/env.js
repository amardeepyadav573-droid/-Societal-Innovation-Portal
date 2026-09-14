import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

const required = ["MONGO_URI", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is missing in environment configuration.`);
  }
}

const clientUrl = String(process.env.CLIENT_URL || "")
  .trim()
  .replace(/\/$/, "");

if (nodeEnv === "production" && !clientUrl) {
  throw new Error("CLIENT_URL is required in production.");
}

export default {
  nodeEnv,

  isProduction: nodeEnv === "production",

  port: Number(process.env.PORT) || 5000,

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  clientUrl,

  storageProvider: String(
    process.env.STORAGE_PROVIDER || "mongodb",
  ).toLowerCase(),

  /*
   * Brevo HTTP API
   *
   * SMTP is intentionally not used here.
   */
  brevo: {
    apiKey: String(process.env.BREVO_API_KEY || "").trim(),

    fromEmail: String(
      process.env.BREVO_FROM_EMAIL || "",
    ).trim(),

    fromName: String(
      process.env.BREVO_FROM_NAME || "Societal Innovation",
    ).trim(),
  },

  ai: {
    provider: String(
      process.env.AI_PROVIDER || "gemini",
    ).toLowerCase(),

    model:
      process.env.AI_MODEL ||
      "gemini-3.6-flash",

    apiKey:
      process.env.AI_API_KEY ||
      (
        String(
          process.env.AI_PROVIDER || "gemini",
        ).toLowerCase() === "openai"
          ? process.env.OPENAI_API_KEY
          : process.env.GEMINI_API_KEY
      ) ||
      "",

    timeoutMs:
      Number(process.env.AI_TIMEOUT_MS) || 30000,
  },

  cloudinary: {
    cloudName:
      process.env.CLOUDINARY_CLOUD_NAME || "",

    apiKey:
      process.env.CLOUDINARY_API_KEY || "",

    apiSecret:
      process.env.CLOUDINARY_API_SECRET || "",
  },
};