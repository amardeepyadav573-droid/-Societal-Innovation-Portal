import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import PasswordInput from "../../components/common/PasswordInput";
import authService from "../../services/authService";
import { isValidEmail, validatePassword } from "../../utils/validators";
import "./Register.css";
const participationTypes = [
  {
    value: "CITIZEN",
    label: "Citizen",
    description: "Submit societal problems and participate in solutions.",
  },
  {
    value: "UNIVERSITY",
    label: "University / HEI",
    description:
      "Connect students, faculty, researchers and innovation centres.",
  },
  {
    value: "INDUSTRY",
    label: "Industry / Startup / MSME",
    description: "Collaborate on technology, innovation, CSR and research.",
  },
  {
    value: "GOVERNMENT",
    label: "Government",
    description: "Publish challenges and coordinate civic innovation.",
  },
];

const Register = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("email");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    participationType: "CITIZEN",
  });

  const passwordErrors = useMemo(
    () => validatePassword(form.password),
    [form.password],
  );

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
      const response = await authService.sendRegistrationOtp({
        email: normalizedEmail,
      });
      setEmail(normalizedEmail);
      setOtpSent(true);
      setResendTimer(Number(response.retryAfter || 60));
      setSuccess(response.message || "OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOtp({
        email: email.trim().toLowerCase(),
        otp,
      });
      setVerificationToken(response.verificationToken || "");
      setEmailVerified(true);
      setStep("form");
      setOtp("");
      setSuccess(
        "Email verified successfully. Now complete your registration.",
      );
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
      const response = await authService.resendOtp({
        email: email.trim().toLowerCase(),
      });
      setResendTimer(Number(response.retryAfter || 60));
      setSuccess(response.message || "New OTP sent.");
    } catch (err) {
      const retryAfter = Number(err.response?.data?.retryAfter || 0);
      if (retryAfter) setResendTimer(retryAfter);
      setError(err.response?.data?.message || "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    clearMessages();
  };

  const createAccount = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!emailVerified || !verificationToken) {
      setError("Please verify your email before creating the account.");
      setStep("email");
      return;
    }
    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (passwordErrors.length) {
      setError("Please create a stronger password.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        name: form.name.trim(),
        email: email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        participationType: form.participationType,
        verificationToken,
      });

      if (response.token) localStorage.setItem("token", response.token);
      if (response.user)
        localStorage.setItem("user", JSON.stringify(response.user));
      setStep("success");
      setSuccess("Your account has been created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("email");
    setEmailVerified(false);
    setVerificationToken("");
    setOtpSent(false);
    setOtp("");
    setResendTimer(0);
    clearMessages();
  };

  if (step === "success") {
    return (
      <div className="register-page">
        <div className="register-card success-card">
          <CheckCircle2 size={70} />
          <h1>Account Created!</h1>
          <p>Your email has been verified and your account is ready.</p>
          <button
            className="primary-btn"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon">
            {emailVerified ? <CheckCircle2 size={26} /> : <Mail size={26} />}
          </div>
          <h1>
            {emailVerified ? "Complete Your Registration" : "Verify Your Email"}
          </h1>
          <p>
            {emailVerified
              ? "Your email is verified. Complete the form below to create your account."
              : "Verify your email first. The registration form will appear after verification."}
          </p>
        </div>

        {error && <div className="register-error">{error}</div>}
        {success && <div className="register-success">{success}</div>}

        {!emailVerified ? (
          <div className="email-verification-panel">
            <div className="form-group">
              <label htmlFor="registration-email">Email Address *</label>
              <input
                id="registration-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setOtpSent(false);
                  clearMessages();
                }}
                placeholder="you@example.com"
                disabled={otpSent}
                autoComplete="email"
              />
            </div>

            {!otpSent ? (
              <button
                className="primary-btn"
                type="button"
                onClick={sendOtp}
                disabled={loading}
              >
                <Mail size={17} />
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            ) : (
              <form onSubmit={verifyEmail}>
                <div className="otp-inline-box">
                  <div className="otp-inline-heading">
                    <ShieldCheck size={19} />
                    <div>
                      <strong>Verify Email</strong>
                      <span>Enter the 6-digit OTP sent to {email}</span>
                    </div>
                  </div>
                  <input
                    className="otp-input"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                  />
                  <button
                    className="primary-btn"
                    disabled={loading || otp.length !== 6}
                  >
                    <ShieldCheck size={17} />
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={resendOtp}
                    disabled={loading || resendTimer > 0}
                  >
                    <RefreshCw size={17} />
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      clearMessages();
                    }}
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={createAccount}>
            <div className="verified-email-row">
              <div>
                <span>Email Address</span>
                <strong>{email}</strong>
              </div>
              <span className="verified-pill">
                <CheckCircle2 size={15} /> Verified
              </span>
              <button type="button" onClick={changeEmail}>
                Change
              </button>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>

            <PasswordInput
              label="Password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Create a strong password"
              required
            />
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Confirm your password"
              required
            />

            <div className="password-rules">
              <strong>Password requirements</strong>
              <ul>
                <li className={form.password.length >= 8 ? "valid" : ""}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(form.password) ? "valid" : ""}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(form.password) ? "valid" : ""}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(form.password) ? "valid" : ""}>
                  One number
                </li>
                <li
                  className={
                    /[!@#$%^&*(),.?":{}|<>_\-\\[\]/;'`~+=]/.test(form.password)
                      ? "valid"
                      : ""
                  }
                >
                  One special character
                </li>
              </ul>
            </div>

            <div className="participation-section">
              <h3>Participation Type</h3>
              <div className="participation-grid">
                {participationTypes.map((item) => (
                  <label
                    key={item.value}
                    className={`participation-option ${form.participationType === item.value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="participationType"
                      value={item.value}
                      checked={form.participationType === item.value}
                      onChange={updateField}
                    />
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button className="primary-btn" disabled={loading} type="submit">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="login-link">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
