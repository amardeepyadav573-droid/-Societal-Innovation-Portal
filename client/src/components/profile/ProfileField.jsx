import "./ProfileField.css";
export default function ProfileField({
  label,
  value,
  placeholder = "Not provided",
  fullWidth = false
}) {
  const displayValue =
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
      ? value
      : placeholder;

  return (
    <div
      className={`profile-field ${
        fullWidth
          ? "profile-field-full"
          : ""
      }`}
    >
      <span className="profile-field-label">
        {label}
      </span>

      <div className="profile-field-value">
        {Array.isArray(
          displayValue
        )
          ? displayValue.length
            ? displayValue.join(", ")
            : placeholder
          : displayValue}
      </div>
    </div>
  );
}
