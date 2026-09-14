import "./StatusBadge.css";
export default function StatusBadge({ status = "SUBMITTED" }) {
  const value = String(status).replaceAll("_", " ");
  return (
    <span className={`status-badge status-${String(status).toLowerCase()}`}>
      {value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}
