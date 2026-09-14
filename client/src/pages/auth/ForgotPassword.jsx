import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Input from "../../components/common/Input";
import PasswordInput from "../../components/common/PasswordInput";
import Button from "../../components/common/Button";
import authService from "../../services/authService";
import { isValidEmail, validatePassword } from "../../utils/validators";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendTimer((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendTimer]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const sendOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendPasswordResetOtp({
        email: normalizedEmail,
      });
      setEmail(normalizedEmail);
      setOtp("");
      setResendTimer(Number(response.retryAfter || 60));
      setStep("otp");
      setSuccess(response.message || "Password reset OTP sent to your email.");
    } catch (err) {
      const retryAfter = Number(err.response?.data?.retryAfter || 0);
      if (retryAfter) setResendTimer(retryAfter);
      setError(err.response?.data?.message || "Unable to send password reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyPasswordResetOtp({
        email: email.trim().toLowerCase(),
        otp,
      });
      setVerificationToken(response.verificationToken || "");
      setOtp("");
      setStep("password");
      setSuccess("OTP verified. You can now set a new password.");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    clearMessages();
    setLoading(true);
    try {
      const response = await authService.resendPasswordResetOtp({
        email: email.trim().toLowerCase(),
      });
      setOtp("");
      setResendTimer(Number(response.retryAfter || 60));
      setSuccess(response.message || "New password reset OTP sent.");
    } catch (err) {
      const retryAfter = Number(err.response?.data?.retryAfter || 0);
      if (retryAfter) setResendTimer(retryAfter);
      setError(err.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    const passwordError = validatePassword(password);
    if (passwordError.length) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!verificationToken) {
      setError("Please verify the OTP before setting a new password.");
      setStep("otp");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        verificationToken,
        password,
        confirmPassword,
      });
      setPassword("");
      setConfirmPassword("");
      setVerificationToken("");
      setStep("success");
      setSuccess(response.message || "Password reset successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("email");
    setOtp("");
    setVerificationToken("");
    setResendTimer(0);
    clearMessages();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="auth-back">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="auth-heading">
          <span className="section-kicker">ACCOUNT RECOVERY</span>
          <h1>
            {step === "email" && "Reset your password."}
            {step === "otp" && "Verify your OTP."}
            {step === "password" && "Set a new password."}
            {step === "success" && "Password updated."}
          </h1>
          <p>
            {step === "email" && "Enter your registered email and we'll help you recover your account."}
            {step === "otp" && `Enter the 6-digit OTP sent to ${email}.`}
            {step === "password" && "Create a new password for your account."}
            {step === "success" && "Your password has been changed successfully."}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="success-box">
            <CheckCircle2 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {success}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={sendOtp} className="auth-form">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessages();
              }}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" loading={loading} className="btn-full" icon={<ArrowRight size={18} />}>
              Continue
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="auth-form">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="6-digit OTP"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                clearMessages();
              }}
              placeholder="000000"
              required
            />
            <div className="forgot-otp-actions">
              <button type="button" className="forgot-link-button" onClick={resendOtp} disabled={loading || resendTimer > 0}>
                <RefreshCw size={14} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
              <button type="button" className="forgot-link-button" onClick={changeEmail}>Change email</button>
            </div>
            <Button type="submit" loading={loading} className="btn-full" icon={<ArrowRight size={18} />}>
              Verify OTP
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetPassword} className="auth-form">
            <PasswordInput
              label="New password"
              name="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearMessages();
              }}
              placeholder="Enter new password"
              required
            />
            <PasswordInput
              label="Confirm new password"
              name="confirm-new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearMessages();
              }}
              placeholder="Re-enter new password"
              required
            />
            <p className="forgot-password-hint">
              Password must be at least 8 characters and include uppercase, lowercase, number and special character.
            </p>
            <Button type="submit" loading={loading} className="btn-full" icon={<ArrowRight size={18} />}>
              Set new password
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="auth-form">
            <Button type="button" className="btn-full" onClick={() => navigate("/login", { state: { passwordReset: true, email } })}>
              Go to login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
