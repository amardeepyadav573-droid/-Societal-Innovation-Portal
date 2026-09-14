import { ArrowUpRight, MapPin, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import { formatDate, truncateText } from "../../utils/formatters";
import "./ProblemCard.css";
export default function ProblemCard({ problem, actions }) {
  const progress = Number(
    problem.progress || problem.assignedProject?.progress || 0,
  );
  return (
    <article className="problem-card">
      <div className="problem-card-top">
        <span className="domain-tag">
          {format(
            problem.customDomain ||
              problem.category ||
              problem.domain ||
              "OTHER",
          )}
        </span>
        <StatusBadge status={problem.status || "SUBMITTED"} />
      </div>
      <h3>{problem.title || "Untitled Challenge"}</h3>
      <p>{truncateText(problem.description, 150)}</p>
      <div className="problem-meta">
        <span>
          <MapPin size={15} />
          {problem.location?.district || problem.district || "Jharkhand"}
        </span>
        <span>{formatDate(problem.createdAt)}</span>
      </div>
      {problem.assignedUniversity && (
        <div className="problem-assignment">
          <UserCheck size={15} /> Assigned:{" "}
          {problem.assignedUniversity.shortName ||
            problem.assignedUniversity.name}
        </div>
      )}
      {(problem.status === "ACCEPTED" || progress > 0) && (
        <div className="problem-progress">
          <div>
            <span>Work progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {actions || (
        <Link
          to={`/problems/${problem._id || problem.id}`}
          className="problem-link"
        >
          View challenge <ArrowUpRight size={16} />
        </Link>
      )}
    </article>
  );
}
function format(v) {
  return String(v)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
