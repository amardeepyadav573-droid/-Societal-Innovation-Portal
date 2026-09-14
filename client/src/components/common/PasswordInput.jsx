import {
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";
import "./PasswordInput.css";
const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
}) => {
  const [visible, setVisible] =
    useState(false);

  return (
    <div className="password-field">
      <label htmlFor={name}>
        {label}

        {required && (
          <span className="required">
            *
          </span>
        )}
      </label>

      <div
        className={`password-wrapper ${
          error
            ? "has-error"
            : ""
        }`}
      >
        <input
          id={name}
          name={name}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          placeholder={
            placeholder
          }
          disabled={disabled}
          autoComplete="new-password"
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setVisible(
              (current) =>
                !current
            )
          }
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>

      {error && (
        <span className="field-error">
          {error}
        </span>
      )}
    </div>
  );
};

export default PasswordInput;