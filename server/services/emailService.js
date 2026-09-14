import env from "../config/env.js";

const RESEND_API_URL = "https://api.resend.com/emails";

export const verifyEmailTransport = async () => {
  if (!env.resend.apiKey) {
    if (env.isProduction) {
      throw new Error("Resend API is not configured.");
    }

    return false;
  }

  return true;
};

export const sendVerificationOtp = async ({
  email,
  otp,
  name = "User",
  purpose = "REGISTRATION",
}) => {
  if (!env.resend.apiKey) {
    if (env.isProduction) {
      throw new Error("Resend API is not configured.");
    }

    console.warn(`[DEV OTP] ${email}: ${otp}`);
    return;
  }

  const isPasswordReset = purpose === "PASSWORD_RESET";

  const subject = isPasswordReset
    ? "Societal Innovation Portal - Password Reset OTP"
    : "Societal Innovation Portal - Email Verification OTP";

  const message = isPasswordReset
    ? "Use the following OTP to reset your Societal Innovation account password:"
    : "Use the following OTP to verify your email:";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2>Societal Innovation</h2>

      <p>Hello ${name},</p>

      <p>${message}</p>

      <div
        style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          padding:20px;
          text-align:center;
          background:#f3f4f6;
          border-radius:10px;
          margin:20px 0;
        "
      >
        ${otp}
      </div>

      <p>
        This OTP will expire in <strong>10 minutes</strong>.
      </p>

      <p>
        If you did not request this ${
          isPasswordReset ? "password reset" : "verification"
        }, please ignore this email.
      </p>

      <p>
        Regards,<br />
        Societal Innovation Team
      </p>
    </div>
  `;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.resend.from,
        to: [email],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);

      const error = new Error(
        data?.message || "Resend email service failed.",
      );

      error.statusCode = 503;
      error.publicMessage =
        "The email service is temporarily unavailable. Please try again shortly.";

      throw error;
    }

    console.log("Email sent successfully through Resend:", data?.id);

    return data;
  } catch (error) {
    console.error("Email sending failed:", error);

    if (!error.statusCode) {
      error.statusCode = 503;
      error.publicMessage =
        "The email service is temporarily unavailable. Please try again shortly.";
    }

    throw error;
  }
};