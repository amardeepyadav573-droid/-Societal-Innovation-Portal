import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Rocket,
  Users,
  RefreshCw,
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Loader from "../../components/common/Loader";
import projectService from "../../services/projectService";
import useAuth from "../../hooks/useAuth";
import "./ProjectDetails.css";
export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [saving, setSaving] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setProject((await projectService.getProject(id)).project || null);
    } catch (e) {
      setError(e.response?.data?.message || "Project not found.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [id]);
  const update = async (mid, completion) => {
    try {
      setSaving(mid);
      await projectService.updateMilestone(id, mid, { completion });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update progress.");
    } finally {
      setSaving("");
    }
  };
  if (loading)
    return (
      <DashboardLayout>
        <Loader fullPage />
      </DashboardLayout>
    );
  if (!project)
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="dashboard-error">{error || "Project not found."}</div>
        </div>
      </DashboardLayout>
    );
  const canUpdate = [
    "ADMIN",
    "GOVERNMENT",
    "UNIVERSITY",
    "FACULTY",
    "MENTOR",
    "INDUSTRY",
  ].includes(user?.role);
  const canReview = ["ADMIN", "GOVERNMENT"].includes(user?.role);
  return (
    <DashboardLayout>
      <div className="page-container">
        <Link to="/projects" className="back-link">
          ← Back to projects
        </Link>
        <div className="project-detail-hero">
          <div>
            <span className="domain-tag">
              {project.problem?.category || "Innovation"}
            </span>
            <h1>{project.title}</h1>
            <p>{project.description}</p>
            <div className="detail-meta">
              <span>{project.university?.name}</span>
              <span>
                {project.stage} · {project.status}
              </span>
            </div>
          </div>
          <div className="project-score">
            <strong>{project.progress || 0}%</strong>
            <span>overall progress</span>
          </div>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        <div className="project-detail-grid">
          <main>
            <div className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Project lifecycle</h2>
                  <p>
                    Milestone completion drives the challenge progress shown to
                    the citizen and government.
                  </p>
                </div>
                <RefreshCw size={19} />
              </div>
              <div className="timeline">
                {(project.milestones || []).map((m) => (
                  <div className="timeline-item" key={m._id}>
                    <div className="timeline-icon">
                      {m.completion >= 100 ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Clock3 size={17} />
                      )}
                    </div>
                    <div className="timeline-content">
                      <strong>{m.title}</strong>
                      <span>
                        {m.status} · {m.completion || 0}%
                      </span>
                      <div className="progress-track">
                        <span style={{ width: `${m.completion || 0}%` }} />
                      </div>
                      {canUpdate && m.completion < 100 && (
                        <div className="milestone-actions">
                          <button
                            disabled={saving === m._id}
                            onClick={() =>
                              update(
                                m._id,
                                Math.min(100, (m.completion || 0) + 25),
                              )
                            }
                          >
                            {saving === m._id ? "Saving…" : "+25%"}
                          </button>
                          <button
                            disabled={saving === m._id}
                            onClick={() => update(m._id, 100)}
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {project.proposal && (
              <div className="dashboard-panel">
                <h2>Solution proposal</h2>
                <p>
                  <strong>Status:</strong> {project.proposal.status}
                </p>
                <p>
                  {project.proposal.abstract || "Proposal not submitted yet."}
                </p>
                {canReview &&
                  ["SUBMITTED", "UNDER_REVIEW"].includes(
                    project.proposal.status,
                  ) && (
                    <div className="request-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          try {
                            await projectService.reviewProposal(
                              id,
                              "UNDER_REVIEW",
                            );
                            await load();
                          } catch (e) {
                            setError(
                              e.response?.data?.message ||
                                "Unable to review proposal.",
                            );
                          }
                        }}
                      >
                        Mark under review
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            await projectService.reviewProposal(id, "APPROVED");
                            await load();
                          } catch (e) {
                            setError(
                              e.response?.data?.message ||
                                "Unable to approve proposal.",
                            );
                          }
                        }}
                      >
                        Approve proposal
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          try {
                            await projectService.reviewProposal(id, "REJECTED");
                            await load();
                          } catch (e) {
                            setError(
                              e.response?.data?.message ||
                                "Unable to reject proposal.",
                            );
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
              </div>
            )}
          </main>
          <aside>
            <div className="detail-panel">
              <h3>Project team</h3>
              <div className="team-mini">
                <Users size={17} />
                {(project.studentTeam?.length || 0) + 1} contributors
              </div>
              <div className="team-mini">
                <FileText size={17} />
                {project.milestones?.length || 0} milestones
              </div>
              <div className="team-mini">
                <Rocket size={17} />
                {project.industryPartners?.length || 0} industry partners
              </div>
            </div>
            <div className="detail-panel">
              <h3>Community impact</h3>
              <div className="team-mini">
                <Users size={17} />
                {Number(project.impact?.peopleImpacted || 0).toLocaleString(
                  "en-IN",
                )}{" "}
                people impacted
              </div>
              <div className="team-mini">
                ₹
                {Number(project.impact?.costSaved || 0).toLocaleString("en-IN")}{" "}
                cost saved
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
