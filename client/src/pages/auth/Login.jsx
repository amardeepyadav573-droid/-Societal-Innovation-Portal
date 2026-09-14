import {
  useState,
} from "react";

import {
  LockKeyhole,
  Mail,
} from "lucide-react";

import PasswordInput from "../../components/common/PasswordInput";

import { useAuth } from "../../context/AuthContext";
import "./Login.css";
const Login = () => {
  const { login } =
    useAuth();

  const [form, setForm] =
    useState({
      email: "",
      password: "",
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange =
    (event) => {
      setForm(
        (previous) => ({
          ...previous,
          [event.target.name]:
            event.target.value,
        })
      );

      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !form.email ||
        !form.password
      ) {
        setError(
          "Email and password are required."
        );
        return;
      }

      setLoading(true);

      try {
        const response =
          await login({
            email:
              form.email
                .trim()
                .toLowerCase(),
            password:
              form.password,
          });

        const role =
          response.user?.role;

        if (
          role === "CITIZEN"
        ) {
          window.location.href =
            "/citizen";
        } else if (
          [
            "UNIVERSITY",
            "FACULTY",
            "STUDENT",
          ].includes(role)
        ) {
          window.location.href =
            "/university";
        } else if (
          [
            "INDUSTRY",
            "MENTOR",
          ].includes(role)
        ) {
          window.location.href =
            "/industry";
        } else if (
          [
            "GOVERNMENT",
            "ADMIN",
          ].includes(role)
        ) {
          window.location.href =
            "/government";
        } else {
          window.location.href =
            "/citizen";
        }
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Login failed."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <LockKeyhole
              size={25}
            />
          </div>

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to Societal Innovation
          </p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="login-form-group">
            <label>
              Email Address
            </label>

            <div className="login-input-wrap">
              <Mail size={18} />

              <input
                name="email"
                type="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                placeholder="you@example.com"
              />
            </div>
          </div>

          <PasswordInput
            label="Password"
            name="password"
            value={
              form.password
            }
            onChange={
              handleChange
            }
            placeholder="Enter your password"
            required
          />

          <div className="login-options">
            <a href="/forgot-password">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={
              loading
            }
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <div className="register-link">
          Don't have an account?
          <a href="/register">
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;