import "./ProgressCard.css";
export default function ProgressCard({
  title,
  value,
  total,
  label
}) {
  const percentage = total
    ? Math.min(
        100,
        Math.round(
          (value / total) * 100
        )
      )
    : 0;

  return (
    <div className="progress-card">

      <div className="progress-header">
        <div>
          <strong>{title}</strong>
          <span>{label}</span>
        </div>

        <strong>
          {percentage}%
        </strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-bar"
          style={{
            width: `${percentage}%`
          }}
        />
      </div>

    </div>
  );
}
