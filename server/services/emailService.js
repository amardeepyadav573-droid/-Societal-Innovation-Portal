import axios from "axios";
import env from "../config/env.js";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Check whether Brevo HTTP API is configured.
 */
const isBrevoConfigured = () => {
  return Boolean(
    env.brevo?.apiKey &&
      env.brevo?.fromEmail,
  );
};

/**
 * Get common Brevo API configuration.
 */
const getBrevoConfig = () => {
  if (!env.brevo?.apiKey) {
    throw new Error(
      "BREVO_API_KEY is not configured.",
    );
  }

  if (!env.brevo?.fromEmail) {
    throw new Error(
      "BREVO_FROM_EMAIL is not configured.",
    );
  }

  return {
    headers: {
      accept: "application/json",
      "api-key": env.brevo.apiKey,
      "content-type": "application/json",
    },

    timeout: 15000,
  };
};

/**
 * Verify Brevo email transport configuration.
 *
 * This does not use SMTP.
 * It simply verifies that the required
 * Brevo HTTP API environment variables exist.
 */
export const verifyEmailTransport = async () => {
  if (!isBrevoConfigured()) {
    if (env.isProduction) {
      throw new Error(
        "Brevo email service is not configured.",
      );
    }

    console.warn(
      "[DEV] Brevo email service is not configured.",
    );

    return false;
  }

  return true;
};

/**
 * Send registration/password-reset OTP using
 * Brevo Transactional Email HTTP API.
 */
export const sendVerificationOtp = async ({
  email,
  otp,
  name = "User",
  purpose = "REGISTRATION",
}) => {
  if (!email) {
    throw new Error(
      "Recipient email is required.",
    );
  }

  if (!otp) {
    throw new Error(
      "OTP is required.",
    );
  }

  const isPasswordReset =
    purpose === "PASSWORD_RESET";

  const subject = isPasswordReset
    ? "Societal Innovation Portal - Password Reset OTP"
    : "Societal Innovation Portal - Email Verification OTP";

  const message = isPasswordReset
    ? "Use the following OTP to reset your Societal Innovation account password:"
    : "Use the following OTP to verify your email:";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <div
    style="
      max-width:600px;
      margin:30px auto;
      background:#ffffff;
      border-radius:12px;
      padding:30px;
      box-sizing:border-box;
    "
  >
    <h2
      style="
        margin-top:0;
        color:#155e91;
      "
    >
      Societal Innovation Portal
    </h2>

    <p style="font-size:16px;color:#333;">
      Hello ${name},
    </p>

    <p style="font-size:16px;color:#333;">
      ${message}
    </p>

    <div
      style="
        margin:25px 0;
        padding:20px;
        text-align:center;
        background:#f1f5f9;
        border-radius:10px;
      "
    >
      <div
        style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          color:#155e91;
        "
      >
        ${otp}
      </div>
    </div>

    <p style="font-size:15px;color:#555;">
      This OTP will expire in
      <strong>10 minutes</strong>.
    </p>

    <p style="font-size:15px;color:#555;">
      If you did not request this
      ${isPasswordReset ? "password reset" : "verification"},
      please ignore this email.
    </p>

    <p
      style="
        margin-top:30px;
        font-size:15px;
        color:#555;
      "
    >
      Regards,<br />
      <strong>Societal Innovation Team</strong>
    </p>
  </div>
</body>
</html>
`;

  const textContent = `
Hello ${name},

${message}

Your OTP is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this ${
    isPasswordReset
      ? "password reset"
      : "verification"
  }, please ignore this email.

Regards,
Societal Innovation Team
`;

  const payload = {
    sender: {
      name:
        env.brevo.fromName ||
        "Societal Innovation",

      email: env.brevo.fromEmail,
    },

    to: [
      {
        email,
        name,
      },
    ],

    subject,

    htmlContent,

    textContent,
  };

  try {
    console.log(
      `[BREVO] Sending OTP email to ${email}...`,
    );

    const response = await axios.post(
      BREVO_API_URL,
      payload,
      getBrevoConfig(),
    );

    console.log(
      `[BREVO] OTP email sent successfully to ${email}`,
    );

    return response.data;
  } catch (error) {
    const brevoError =
      error?.response?.data;

    console.error(
      "[BREVO] Email sending failed:",
      brevoError || error.message,
    );

    const message =
      brevoError?.message ||
      error?.message ||
      "The email service is temporarily unavailable. Please try again shortly.";

    const serviceError = new Error(message);

    serviceError.statusCode = 503;

    serviceError.publicMessage =
      "The email service is temporarily unavailable. Please try again shortly.";

    throw serviceError;
  }
};