import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

const smtpConfigured =
  Boolean(env.smtp.host) &&
  Boolean(env.smtp.user) &&
  Boolean(env.smtp.pass);

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,

    secure: env.smtp.secure,

    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },

    connectionTimeout: env.smtp.connectionTimeout,

    greetingTimeout: env.smtp.greetingTimeout,

    socketTimeout: env.smtp.socketTimeout,

    pool: true,

    maxConnections: 2,

    maxMessages: 50,
  });
}

export const verifyEmailTransport = async () => {
  if (!transporter) {
    console.warn(
      "[SMTP] SMTP is not configured.",
    );

    if (env.isProduction) {
      throw new Error(
        "SMTP is not configured in production.",
      );
    }

    return false;
  }

  try {
    await transporter.verify();

    console.log(
      `[SMTP] Connected successfully to ${env.smtp.host}:${env.smtp.port}`,
    );

    return true;
  } catch (error) {
    console.error(
      "[SMTP] Connection failed:",
      error.message,
    );

    throw error;
  }
};

export const sendVerificationOtp = async ({
  email,
  otp,
  name = "User",
  purpose = "REGISTRATION",
}) => {
  if (!transporter) {
    if (env.isProduction) {
      const error = new Error(
        "SMTP is not configured.",
      );

      error.statusCode = 503;

      error.publicMessage =
        "The email service is temporarily unavailable. Please try again shortly.";

      throw error;
    }

    console.warn(
      `[DEV OTP] ${email}: ${otp}`,
    );

    return;
  }

  const isPasswordReset =
    purpose === "PASSWORD_RESET";

  const subject = isPasswordReset
    ? "Societal Innovation Portal - Password Reset OTP"
    : "Societal Innovation Portal - Email Verification OTP";

  const introText = isPasswordReset
    ? "Use this OTP to reset your Societal Innovation account password:"
    : "Your OTP for Societal Innovation account verification is:";

  const actionText = isPasswordReset
    ? "password reset"
    : "verification";

  try {
    const result = await transporter.sendMail({
      from: env.smtp.from || env.smtp.user,

      to: email,

      subject,

      text: `Hello ${name},

${introText}

${otp}

This OTP will expire in 10 minutes.

If you did not request this ${actionText}, please ignore this email.

Regards,
Societal Innovation Team`,

      html: `
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

          <p>${introText}</p>

          <div
            style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 20px;
              text-align: center;
              background: #f3f4f6;
              border-radius: 10px;
              margin: 20px 0;
            "
          >
            ${otp}
          </div>

          <p>
            This OTP will expire in
            <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request this ${actionText},
            please ignore this email.
          </p>

          <p>
            Regards,<br />
            Societal Innovation Team
          </p>
        </div>
      `,
    });

    console.log(
      `[SMTP] Email sent successfully to ${email}. Message ID: ${result.messageId}`,
    );

    return result;
  } catch (error) {
    console.error(
      `[SMTP] Email sending failed: ${error.message}`,
    );

    error.statusCode = 503;

    error.publicMessage =
      "The email service is temporarily unavailable. Please try again shortly.";

    throw error;
  }
};