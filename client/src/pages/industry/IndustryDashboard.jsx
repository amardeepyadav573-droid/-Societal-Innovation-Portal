import {
  ArrowRight,
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Handshake,
  RefreshCw,
  Rocket,
  TrendingUp,
  Users,
  UserRound
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import dashboardService from "../../services/dashboardService";
import "./IndustryDashboard.css";
export default function IndustryDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (
    silent = false
  ) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await dashboardService.getIndustryDashboard();

      setData(
        response?.data ||
          response ||
          null
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load industry dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data?.stats || {};

  return (
    <DashboardLayout>
      <div className="page-container dashboard-page role-dashboard industry-dashboard">
        <header className="dashboard-header dashboard-hero">
          <div className="industry-hero-content">
            <span className="section-kicker">
              INDUSTRY & INNOVATION HUB
            </span>

            <h1>
              {data?.industry?.name ||
                "Industry Dashboard"}
            </h1>

            <p>
              Discover challenges, collaborate
              with universities and accelerate
              real-world innovation.
            </p>
          </div>

          <div className="industry-header-actions">
            <Link
              to="/industry/profile"
              className="btn btn-secondary industry-profile-button"
            >
              <UserRound size={17} />
              Industry / Startup Profile
            </Link>

            <button
              type="button"
              className="dashboard-refresh"
              onClick={() =>
                loadDashboard(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "spin" : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh data"}
            </button>
          </div>
        </header>

        {error && (
          <ErrorBanner
            message={error}
            onRetry={() =>
              loadDashboard()
            }
          />
        )}

        <section className="stats-grid">
          <Stat
            icon={Handshake}
            label="Active Collaborations"
            value={
              stats.activeCollaborations
            }
          />

          <Stat
            icon={FileText}
            label="Matched Challenges"
            value={
              stats.challengesEngaged
            }
          />

          <Stat
            icon={Rocket}
            label="Active Projects"
            value={
              stats.activeProjects
            }
          />

          <Stat
            icon={CheckCircle2}
            label="Completed Pilots"
            value={
              stats.completedPilots
            }
          />
        </section>

        <section className="dashboard-grid-2">
          <div className="dashboard-card">
            <CardHeader
              kicker="COLLABORATION PIPELINE"
              title="Project engagement"
              icon={TrendingUp}
            />

            <div className="project-overview project-overview-4">
              <OverviewItem
                label="Mentor-supported"
                value={stats.mentoring}
              />

              <OverviewItem
                label="Co-development"
                value={
                  stats.coDevelopment
                }
              />

              <OverviewItem
                label="Funded projects"
                value={stats.funding}
              />

              <OverviewItem
                label="Pilot / deployment"
                value={
                  stats.pilotDeployment
                }
              />
            </div>
          </div>

          <div className="dashboard-card">
            <CardHeader
              kicker="INDUSTRY CAPABILITY"
              title="Partnership activity"
              icon={BriefcaseBusiness}
            />

            <div className="capacity-list">
              <Capacity
                icon={Users}
                label="University Partners"
                value={
                  stats.universityPartners
                }
              />

              <Capacity
                icon={Users}
                label="Faculty Mentors"
                value={stats.mentors}
              />

              <Capacity
                icon={Rocket}
                label="Prototypes Supported"
                value={
                  stats.prototypesSupported
                }
              />

              <Capacity
                icon={CheckCircle2}
                label="Deployments"
                value={
                  stats.deployments
                }
              />
            </div>
          </div>
        </section>

        <section className="dashboard-card recent-card">
          <CardHeader
            kicker="INNOVATION PROJECTS"
            title="Recent collaborations"
            action={
              <Link
                to="/projects"
                className="card-action"
              >
                View projects
                <ArrowRight size={15} />
              </Link>
            }
          />

          <div className="challenge-table">
            {loading ? (
              <LoadingRows />
            ) : (
              <>
                {(data?.recentProjects || [])
                  .map((project) => (
                    <Link
                      to={`/projects/${project._id}`}
                      className="challenge-row"
                      key={project._id}
                    >
                      <div className="challenge-main">
                        <div className="challenge-id">
                          {project.projectId ||
                            "PROJECT"}
                        </div>

                        <strong>
                          {project.title}
                        </strong>

                        <span>
                          {project.university
                            ?.shortName ||
                            project.university
                              ?.name ||
                            "University partner"}
                        </span>
                      </div>

                      <span
                        className={`status-badge status-${String(
                          project.status || ""
                        ).toLowerCase()}`}
                      >
                        {formatStatus(
                          project.status
                        )}
                      </span>

                      <div className="challenge-date">
                        {formatDate(
                          project.createdAt
                        )}
                      </div>
                    </Link>
                  ))}

                {!data?.recentProjects
                  ?.length && (
                  <EmptyState
                    text="No industry collaborations yet."
                  />
                )}
              </>
            )}
          </div>
        </section>

        <section className="dashboard-card opportunity-card dashboard-opportunity">
          <div className="opportunity-icon">
            <Rocket size={24} />
          </div>

          <div className="opportunity-content">
            <span className="section-kicker">
              OPPORTUNITY
            </span>

            <h2>
              Discover new societal challenges
            </h2>

            <p>
              Explore validated challenges
              that match your capabilities and
              create high-impact partnerships.
            </p>
          </div>

          <Link
            to="/industry/opportunities"
            className="btn btn-primary"
          >
            Explore challenges
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="dashboard-stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>

        <span className="live-indicator">
          LIVE
        </span>
      </div>

      <div className="stat-value">
        {Number(
          value || 0
        ).toLocaleString("en-IN")}
      </div>

      <div className="stat-label">
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewItem({
  label,
  value
}) {
  return (
    <div className="overview-item">
      <strong>
        {Number(
          value || 0
        ).toLocaleString("en-IN")}
      </strong>

      <span>{label}</span>
    </div>
  );
}

/* =========================================================
   CAPACITY
========================================================= */

function Capacity({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="capacity-item">
      <div className="capacity-icon">
        <Icon size={18} />
      </div>

      <span>{label}</span>

      <strong>
        {Number(
          value || 0
        ).toLocaleString("en-IN")}
      </strong>
    </div>
  );
}

/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({
  kicker,
  title,
  icon: Icon,
  action
}) {
  return (
    <div className="card-header">
      <div>
        <span className="section-kicker">
          {kicker}
        </span>

        <h2>{title}</h2>
      </div>

      {action ||
        (Icon ? (
          <Icon size={21} />
        ) : null)}
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorBanner({
  message,
  onRetry
}) {
  return (
    <div className="dashboard-error industry-error">
      <AlertCircle size={19} />

      <span>{message}</span>

      <button
        type="button"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  text
}) {
  return (
    <div className="dashboard-empty-state compact">
      <FileText size={22} />
      <span>{text}</span>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingRows() {
  return (
    <div className="dashboard-skeleton-list">
      {[1, 2, 3].map(
        (item) => (
          <div
            className="skeleton-row"
            key={item}
          />
        )
      )}
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function formatStatus(
  value = ""
) {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (c) => c.toUpperCase()
    );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}