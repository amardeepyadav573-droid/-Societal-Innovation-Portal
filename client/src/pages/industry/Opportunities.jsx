import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  MapPin,
  Handshake,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import problemService from "../../services/problemService";
import projectService from "../../services/projectService";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import "./Opportunities.css";
export default function Opportunities() {
  const [problems, setProblems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setProblems(
        (await problemService.getIndustryOpportunities()).problems || [],
      );
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load opportunities.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const request = async (id) => {
    try {
      setBusy(id);
      await projectService.requestCollaboration(
        id,
        "Our organisation would like to support this challenge through mentorship, technology, prototyping, funding or pilot implementation.",
      );
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to send collaboration request.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">INDUSTRY PARTNERSHIP</span>
            <h1>Innovation opportunities</h1>
            <p>Live challenges matched to your organisation's capabilities.</p>
          </div>
          <button className="dashboard-refresh" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        {loading ? (
          <Loader />
        ) : !problems.length ? (
          <EmptyState
            title="No matched opportunities yet"
            description="As citizens submit validated challenges, AI matching will surface relevant opportunities here."
          />
        ) : (
          <div className="opportunity-grid">
            {problems.map((p) => {
              const project = p.assignedProject;
              const already = project?.industryPartners?.some(
                (x) =>
                  String(x) === String(p.recommendedIndustries?.[0]?.industry),
              );
              return (
                <article className="opportunity-card" key={p._id}>
                  <div className="opportunity-top">
                    <span className="domain-tag">
                      {String(p.category).replaceAll("_", " ")}
                    </span>
                    <Link className="icon-button" to={`/problems/${p._id}`}>
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <div className="opportunity-meta">
                    <span>
                      <Building2 size={15} />
                      {p.assignedUniversity?.shortName ||
                        p.assignedUniversity?.name ||
                        "University matching pending"}
                    </span>
                    <span>
                      <MapPin size={15} />
                      {p.location?.district || "Jharkhand"}
                    </span>
                  </div>
                  {project ? (
                    <>
                      <div className="opportunity-project">
                        <strong>Project: {project.title}</strong>
                        <span>
                          {project.progress || 0}% complete · {project.stage}
                        </span>
                      </div>
                      <div className="opportunity-actions">
                        <Link
                          className="btn btn-secondary"
                          to={`/projects/${project._id}`}
                        >
                          <ArrowUpRight size={15} /> View project
                        </Link>
                        <button
                          className="btn btn-primary"
                          disabled={busy === project._id}
                          onClick={() => request(project._id)}
                        >
                          <Handshake size={15} />
                          {busy === project._id
                            ? "Sending…"
                            : "Request collaboration"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="muted-text">
                      Waiting for university project creation.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
