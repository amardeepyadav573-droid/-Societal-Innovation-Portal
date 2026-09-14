import { Loader2 } from "lucide-react";
import "./Button.css";
export default function Button({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2
          size={18}
          className="spin"
        />
      ) : (
        icon
      )}

      <span>{children}</span>
    </button>
  );
}
