import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  RefreshCw
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState
} from "react";

import Button from "../../components/common/Button";

import api from "../../services/api";
import "./VerifyOtp.css";
export default function VerifyOtp() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const emailFromState =
    location.state?.email || "";

  const roleFromState =
    location.state?.role || "";

  const [
    email,
    setEmail
  ] = useState(
    emailFromState
  );

  const [
    otp,
    setOtp
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    resendLoading,
    setResendLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");

  const [
    secondsLeft,
    setSecondsLeft
  ] = useState(600);

  const [
    resendSeconds,
    setResendSeconds
  ] = useState(0);

  const otpInputRef =
    useRef(null);

  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setSecondsLeft(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [secondsLeft]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setResendSeconds(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [resendSeconds]);

  const formatTime =
    (seconds) => {
      const minutes =
        Math.floor(
          seconds / 60
        );

      const remaining =
        seconds % 60;

      return `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        remaining
      ).padStart(
        2,
        "0"
      )}`;
    };

  const handleOtpChange =
    (event) => {
      const value =
        event.target.value
          .replace(/\D/g, "")
          .slice(0, 6);

      setOtp(value);
      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (!email.trim()) {
        setError(
          "Email address is required."
        );
        return;
      }

      if (otp.length !== 6) {
        setError(
          "Please enter the complete 6-digit OTP."
        );
        return;
      }

      if (secondsLeft <= 0) {
        setError(
          "This OTP has expired. Please request a new OTP."
        );
        return;
      }

      try {
        setLoading(true);

        const response =
          await api.post(
            "/auth/verify-otp",
            {
              email:
                email.trim()
                  .toLowerCase(),
              otp
            }
          );

        const data =
          response?.data || {};

        setSuccess(
          data.message ||
            "Email verified successfully."
        );

        window.setTimeout(
          () => {
            navigate(
              "/login",
              {
                replace: true,
                state: {
                  verified: true,
                  email:
                    email
                      .trim()
                      .toLowerCase()
                }
              }
            );
          },
          900
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
          err.response?.data
            ?.error ||
          "OTP verification failed."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleResend =
    async () => {
      setError("");
      setSuccess("");

      if (!email.trim()) {
        setError(
          "Enter the email address used during registration."
        );
        return;
      }

      if (resendSeconds > 0) {
        return;
      }

      try {
        setResendLoading(true);

        const response =
          await api.post(
            "/auth/resend-otp",
            {
              email:
                email.trim()
                  .toLowerCase()
            }
          );

        setOtp("");
        setSecondsLeft(600);
        setResendSeconds(30);

        setSuccess(
          response?.data
            ?.message ||
          "A new OTP has been sent."
        );

        otpInputRef.current?.focus();
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
          err.response?.data
            ?.error ||
          "Unable to resend OTP."
        );
      } finally {
        setResendLoading(false);
      }
    };

  return (
    <div className="otp-page">

      <div className="otp-card">

        <Link
          to="/register"
          className="otp-back"
        >
          <ArrowLeft size={16} />
          Back to registration
        </Link>

        <div className="otp-icon">
          <Mail size={27} />
        </div>

        <div className="otp-heading">
          <span className="section-kicker">
            EMAIL VERIFICATION
          </span>

          <h1>
            Verify your email.
          </h1>

          <p>
            We sent a 6-digit verification
            code to your email address.
          </p>
        </div>

        <div className="otp-email-box">
          <Mail size={17} />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="you@example.com"
            aria-label="Email address"
          />
        </div>

        {error && (
          <div className="otp-message otp-error">
            {error}
          </div>
        )}

        {success && (
          <div className="otp-message otp-success">
            <CheckCircle2
              size={17}
            />
            {success}
          </div>
        )}

        <form
          className="otp-form"
          onSubmit={handleSubmit}
        >

          <label
            className="otp-label"
            htmlFor="registration-otp"
          >
            Enter OTP
          </label>

          <input
            ref={otpInputRef}
            id="registration-otp"
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={
              handleOtpChange
            }
            placeholder="000000"
            maxLength={6}
            aria-label="6 digit OTP"
          />

          <div className="otp-meta">

            <span>
              {secondsLeft > 0
                ? `Expires in ${formatTime(
                    secondsLeft
                  )}`
                : "OTP expired"}
            </span>

            <button
              type="button"
              className="otp-resend"
              onClick={
                handleResend
              }
              disabled={
                resendLoading ||
                resendSeconds > 0
              }
            >
              <RefreshCw
                size={14}
                className={
                  resendLoading
                    ? "otp-spin"
                    : ""
                }
              />

              {resendLoading
                ? "Sending..."
                : resendSeconds > 0
                ? `Resend in ${resendSeconds}s`
                : "Resend OTP"}
            </button>

          </div>

          <Button
            type="submit"
            loading={loading}
            className="btn-full"
          >
            Verify email
          </Button>

        </form>

        <p className="otp-security">
          Your verification code is valid
          for 10 minutes and can only be
          used once.
        </p>

        {roleFromState && (
          <span className="otp-role">
            Account type:{" "}
            {String(
              roleFromState
            ).replaceAll(
              "_",
              " "
            )}
          </span>
        )}

      </div>

    </div>
  );
}