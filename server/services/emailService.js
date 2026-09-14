import nodemailer from "nodemailer";

import env from "../config/env.js";

let transporter = null;

if (
  env.smtp.host &&
  env.smtp.port &&
  env.smtp.user &&
  env.smtp.pass
) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,

    port: Number(env.smtp.port),

    secure: env.smtp.secure,

    // Force IPv4.
    // Render was trying to connect to the SMTP server
    // through IPv6 and returning ENETUNREACH.
    family: env.smtp.family,

    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },

    connectionTimeout:
      env.smtp.connectionTimeout,

    greetingTimeout:
      env.smtp.greetingTimeout,

    socketTimeout:
      env.smtp.socketTimeout,

    pool: true,

    maxConnections: 3,

    maxMessages: 100,
  });
}

export const verifyEmailTransport = async () => {
  if (!transporter) {
    if (env.isProduction) {
      throw new Error("SMTP is not configured.");
    }

    return false;
  }

  await transporter.verify();

  return true;
};

export const sendVerificationOtp = async ({
  email,
  otp,
  name,
  purpose = "REGISTRATION",
}) => {
  if (!transporter) {
    if (env.isProduction) {
      throw new Error("SMTP is not configured.");
    }

    console.warn(`[DEV OTP] ${email}: ${otp}`);

    return;
  }

  try {
    const isPasswordReset =
      purpose === "PASSWORD_RESET";

    const subject = isPasswordReset
      ? "Societal Innovation Portal - Password Reset OTP"
      : "Societal Innovation Portal - Email Verification OTP";

    const text = `Hello ${name},

${
  isPasswordReset
    ? "Use this OTP to reset your Societal Innovation account password:"
    : "Your OTP for Societal Innovation account verification is:"
}

${otp}

This OTP will expire in 10 minutes.

If you did not request this ${
  isPasswordReset
    ? "password reset"
    : "verification"
}, please ignore this email.

Regards,

Societal Innovation Team`;

    const html = `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
        "
      >
        <h2>Societal Innovation</h2>

        <p>Hello ${name},</p>

        <p>
          ${
            isPasswordReset
              ? "Use the following OTP to reset your account password:"
              : "Use the following OTP to verify your email:"
          }
        </p>

        <div
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            background: #f3f4f6;
            border-radius: 10px;
          "
        >
          ${otp}
        </div>

        <p>
          This OTP will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request this ${
            isPasswordReset
              ? "password reset"
              : "verification"
          }, please ignore this email.
        </p>

        <p>
          Regards,<br />
          Societal Innovation Team
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: env.smtp.from || env.smtp.user,

      to: email,

      subject,

      text,

      html,
    });
  } catch (error) {
    console.error(
      "Email sending failed:",
      error?.message || error,
    );

    error.statusCode = 503;

    error.publicMessage =
      "The email service is temporarily unavailable. Please try again shortly.";

    throw error;
  }
};