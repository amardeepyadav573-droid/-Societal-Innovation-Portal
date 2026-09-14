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
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean)
  .join(",");

if (nodeEnv === "production" && !clientUrl) {
  throw new Error("CLIENT_URL is required in production.");
}

const smtpPort = Number(process.env.SMTP_PORT) || 587;

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

smtp: {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT) || 587,

  secure:
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true",

  family: Number(process.env.SMTP_FAMILY) || 4,

  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || "",

  connectionTimeout:
    Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 20000,

  greetingTimeout:
    Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 20000,

  socketTimeout:
    Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 30000,
},

  ai: {
    provider: String(
      process.env.AI_PROVIDER || "gemini",
    ).toLowerCase(),

    model:
      process.env.AI_MODEL || "gemini-3.6-flash",

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

  resend: {
  apiKey: process.env.RESEND_API_KEY || "",
  from:
    process.env.RESEND_FROM_EMAIL ||
    "societalinnovation009@gmail.com",
},


};