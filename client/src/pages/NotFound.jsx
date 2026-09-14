import { ArrowLeft, Home, SearchX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./NotFound.css";
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <SearchX size={34} />
        </div>
        <span className="section-kicker">404 · PAGE NOT FOUND</span>
        <h1>We couldn't find that page.</h1>
        <p>
          The link may be outdated, or the page may have moved. Use one of the
          options below to continue.
        </p>
        <div className="not-found-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go back
          </button>
          <Link className="btn btn-primary" to="/">
            <Home size={16} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
