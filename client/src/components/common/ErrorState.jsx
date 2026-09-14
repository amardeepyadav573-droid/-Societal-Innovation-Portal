import {
AlertTriangle
} from "lucide-react";
import "./ErrorState.css";

export default function ErrorState({
  message = "Something went wrong."
}) {
  return (
    <div className="error-state">
      <AlertTriangle size={24} />

      <div>
        <strong>
          Unable to load data
        </strong>

        <p>{message}</p>
      </div>
    </div>
  );
}
