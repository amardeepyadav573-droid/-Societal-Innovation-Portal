import {
Inbox
} from "lucide-react";
import "./EmptyState.css";

export default function EmptyState({
  title = "Nothing here yet",
  description = "There is no data available at the moment.",
  action
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={28} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {action}
    </div>
  );
}
