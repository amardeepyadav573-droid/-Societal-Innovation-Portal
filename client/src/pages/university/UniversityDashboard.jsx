import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Rocket,
  Users,
  XCircle,
  UserRound,
} from "lucide-react";

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import dashboardService from "../../services/dashboardService";
import projectService from "../../services/projectService";
import "./UniversityDashboard.css";
export default function UniversityDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await dashboardService.getUniversityDashboard();

      setData(response?.data || response || null);
    } catch (error) {
      setError(
        error.response?.data?.message || "Unable to load university dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats || {};

  const respond = async (projectId, requestId, status) => {
    try {
      setBusy(requestId);

      await projectService.respondCollaboration(projectId, requestId, status);

      await load();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update collaboration request.",
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container dashboard-page role-dashboard university-dashboard">
        <header className="dashboard-header dashboard-hero">
          <div className="university-hero-content">
            <span className="section-kicker">UNIVERSITY INNOVATION HUB</span>

            <h1>
              {data?.university?.shortName ||
                data?.university?.name ||
                "University Dashboard"}
            </h1>

            <p>
              Evaluate routed challenges, build multidisciplinary teams, work
              with industry and deliver measurable community outcomes.
            </p>
          </div>

          <div className="university-header-actions">
            <Link
              to="/university/profile"
              className="btn btn-secondary university-profile-button"
            >
              <UserRound size={17} />
              University Profile
            </Link>

            <button
              type="button"
              className="dashboard-refresh"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />

              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </header>

        {error && (
          <div className="dashboard-error university-error">
            <span>{error}</span>

            <button type="button" onClick={load}>
              Try again
            </button>
          </div>
        )}

        <section className="stats-grid">
          <Stat
            icon={FileText}
            label="Assigned Challenges"
            value={stats.assignedChallenges}
          />

          <Stat
            icon={Clock3}
            label="Pending Acceptance"
            value={stats.pendingChallenges}
          />

          <Stat
            icon={Rocket}
            label="Active Projects"
            value={stats.activeProjects}
          />

          <Stat
            icon={CheckCircle2}
            label="Completed Projects"
            value={stats.completedProjects}
          />
        </section>

        <section className="dashboard-grid-2">
          <div className="dashboard-card">
            <Header kicker="PROJECT PIPELINE" title="Innovation projects" />

            <div className="project-overview project-overview-4">
              <Overview label="Research" value={stats.researchProjects} />

              <Overview label="Prototype" value={stats.prototypeProjects} />

              <Overview label="Pilot" value={stats.pilotProjects} />

              <Overview
                label="Deployment / complete"
                value={stats.implementedProjects}
              />
            </div>
          </div>

          <div className="dashboard-card">
            <Header kicker="CAPACITY" title="Institutional participation" />

            <div className="capacity-list">
              <Capacity
                icon={Users}
                label="Faculty / mentors"
                value={stats.facultyMentors}
              />

              <Capacity
                icon={Users}
                label="Student members"
                value={stats.studentMembers}
              />

              <Capacity
                icon={BookOpen}
                label="Research teams"
                value={stats.researchTeams}
              />

              <Capacity
                icon={Rocket}
                label="Industry collaborations"
                value={stats.industryCollaborations}
              />
            </div>
          </div>
        </section>

        <section className="dashboard-card lifecycle-card">
          <Header kicker="PROJECT LIFECYCLE" title="Latest project stages" />
          <div className="lifecycle-list">
            {(data?.recentProjects || []).map((project) => {
              const stages = [
                "RESEARCH",
                "PLANNING",
                "DEVELOPMENT",
                "PROTOTYPE",
                "TESTING",
                "PILOT",
                "DEPLOYMENT",
                "COMPLETED",
              ];
              const currentIndex = Math.max(0, stages.indexOf(project.stage));
              return (
                <article className="lifecycle-item" key={project._id}>
                  <div className="lifecycle-heading">
                    <div>
                      <strong>{project.title}</strong>
                      <span>
                        {project.projectId || "Project"} · {project.status}
                      </span>
                    </div>
                    <b>{Number(project.progress || 0)}%</b>
                  </div>
                  <div className="lifecycle-track">
                    <span
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(project.progress || 0)))}%`,
                      }}
                    />
                  </div>
                  <div className="lifecycle-steps">
                    {stages.map((stage, index) => (
                      <span
                        key={stage}
                        className={
                          index < currentIndex
                            ? "done"
                            : index === currentIndex
                              ? "current"
                              : ""
                        }
                      >
                        <i>{index + 1}</i>
                        {stage.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
            {!loading && !data?.recentProjects?.length && (
              <div className="dashboard-empty-state compact">
                <Rocket size={22} />
                <span>No projects available for lifecycle tracking yet.</span>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card recent-card">
          <Header
            kicker="ASSIGNED CHALLENGES"
            title="Recent challenges"
            action={
              <Link to="/university/problems" className="card-action">
                Open queue
                <ArrowRight size={15} />
              </Link>
            }
          />

          <div className="challenge-table">
            {loading ? (
              <LoadingRows />
            ) : (
              <>
                {(data?.recentChallenges || []).map((problem) => (
                  <Link
                    to={`/problems/${problem._id}`}
                    className="challenge-row"
                    key={problem._id}
                  >
                    <div className="challenge-main">
                      <div className="challenge-id">
                        {problem.problemId || "CHALLENGE"}
                      </div>

                      <strong>{problem.title}</strong>

                      <span>
                        {String(
                          problem.category || "Societal Challenge",
                        ).replaceAll("_", " ")}

                        {" · "}

                        {problem.location?.district || "Jharkhand"}
                      </span>
                    </div>

                    <Status status={problem.status} />

                    <div className="challenge-date">
                      {problem.acceptedBy?.name
                        ? `Accepted by ${problem.acceptedBy.name}`
                        : "Awaiting acceptance"}
                    </div>
                  </Link>
                ))}

                {!data?.recentChallenges?.length && (
                  <div className="dashboard-empty-state compact">
                    <FileText size={22} />
                    <span>No challenges assigned yet.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="dashboard-card">
          <Header
            kicker="INDUSTRY PARTNERSHIP"
            title="Collaboration requests"
          />

          <div className="request-list">
            {(data?.collaborationRequests || []).map((request) => (
              <div className="request-row" key={request._id}>
                <div className="request-info">
                  <strong>
                    {request.industry?.name || "Industry partner"}
                  </strong>

                  <span>{request.projectTitle || "Collaboration request"}</span>

                  <p>
                    {request.message ||
                      "The industry partner has requested collaboration on this project."}
                  </p>
                </div>

                <div className="request-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    disabled={busy === request._id}
                    onClick={() =>
                      respond(request.projectId, request._id, "ACCEPTED")
                    }
                  >
                    <CheckCircle2 size={15} />
                    Accept
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    disabled={busy === request._id}
                    onClick={() =>
                      respond(request.projectId, request._id, "REJECTED")
                    }
                  >
                    <XCircle size={15} />
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {!data?.collaborationRequests?.length && (
              <span className="muted-text">
                No pending industry collaboration requests.
              </span>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="dashboard-stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>

        <span className="live-indicator">LIVE</span>
      </div>

      <div className="stat-value">
        {Number(value || 0).toLocaleString("en-IN")}
      </div>

      <div className="stat-label">{label}</div>
    </div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({ label, value }) {
  return (
    <div className="overview-item">
      <strong>{Number(value || 0).toLocaleString("en-IN")}</strong>

      <span>{label}</span>
    </div>
  );
}

/* =========================================================
   CAPACITY
========================================================= */

function Capacity({ icon: Icon, label, value }) {
  return (
    <div className="capacity-item">
      <div className="capacity-icon">
        <Icon size={18} />
      </div>

      <span>{label}</span>

      <strong>{Number(value || 0).toLocaleString("en-IN")}</strong>
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({ kicker, title, action }) {
  return (
    <div className="card-header">
      <div>
        <span className="section-kicker">{kicker}</span>

        <h2>{title}</h2>
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function Status({ status }) {
  const value = String(status || "PENDING");

  return (
    <span className={`status-badge status-${value.toLowerCase()}`}>
      {value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingRows() {
  return (
    <div className="dashboard-skeleton-list">
      {[1, 2, 3].map((item) => (
        <div className="skeleton-row" key={item} />
      ))}
    </div>
  );
}
