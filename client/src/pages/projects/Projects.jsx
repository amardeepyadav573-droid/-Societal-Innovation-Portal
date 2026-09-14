import { useEffect, useState } from "react";
import { FolderKanban, Rocket, Users, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import projectService from "../../services/projectService";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import "./Projects.css";
export default function Projects() {
  const [projects, setProjects] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setProjects((await projectService.getProjects()).projects || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">INNOVATION PIPELINE</span>
            <h1>Projects</h1>
            <p>
              Follow solutions from research to implementation using live
              project progress.
            </p>
          </div>
          <button className="dashboard-refresh" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        {loading ? (
          <Loader />
        ) : !projects.length ? (
          <EmptyState
            title="No projects yet"
            description="Projects appear after a validated challenge is accepted and converted into an innovation project."
          />
        ) : (
          <div className="project-grid">
            {projects.map((p) => (
              <article className="project-card" key={p._id}>
                <div className="project-top">
                  <div className="project-icon">
                    <FolderKanban size={21} />
                  </div>
                  <span className="domain-tag">
                    {p.problem?.category || "Innovation"}
                  </span>
                </div>
                <h3>{p.title}</h3>
                <div className="project-stage">
                  <Rocket size={15} />
                  {p.stage} · {p.status}
                </div>
                <div className="project-progress">
                  <div>
                    <span>Progress</span>
                    <strong>{p.progress || 0}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </div>
                <div className="project-footer">
                  <span>
                    <Users size={15} />
                    {(p.studentTeam?.length || 0) + 1} contributors
                  </span>
                  <Link to={`/projects/${p._id}`}>View project</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
