import "./StatCard.css";
export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <div className="stat-icon">
          <Icon size={21} />
        </div>

        {change && (
          <span className="stat-change">
            {change}
          </span>
        )}

      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-title">
        {title}
      </div>

      {description && (
        <div className="stat-description">
          {description}
        </div>
      )}

    </div>
  );
}
