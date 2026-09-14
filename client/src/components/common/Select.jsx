import "./Select.css";
export default function Select({
  label,
  options = [],
  error,
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

      <select
        className={`form-input ${
          error ? "input-error" : ""
        }`}
        {...props}
      >
        <option value="">
          Select {label}
        </option>

        {options.map((option) => {
          const value =
            typeof option === "string"
              ? option
              : option.value;

          const text =
            typeof option === "string"
              ? option
              : option.label;

          return (
            <option
              value={value}
              key={value}
            >
              {text}
            </option>
          );
        })}
      </select>

      {error && (
        <span className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}
