import "./Input.css";
export default function Input({
  label,
  error,
  hint,
  className = "",
  ...props
}) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}

          {props.required && (
            <span className="required">*</span>
          )}
        </label>
      )}

      <input
        className={`form-input ${
          error ? "input-error" : ""
        } ${className}`}
        {...props}
      />

      {hint && !error && (
        <span className="form-hint">
          {hint}
        </span>
      )}

      {error && (
        <span className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}
