import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  RefreshCw,
  Rocket,
  Users,
  AlertCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import dashboardService from "../../services/dashboardService";
import "./GovernmentDashboard.css";

export default function GovernmentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");
      const response = await dashboardService.getGovernmentDashboard();
      setData(response?.data || response || null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load government dashboard.",
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
  const total = Number(stats.totalChallenges || 0);

  return (
    <DashboardLayout>
      <div className="page-container dashboard-page role-dashboard government-dashboard">
        <header className="dashboard-header dashboard-hero">
          <div>
            <span className="section-kicker">GOVERNMENT COMMAND CENTER</span>
            <h1>Societal Innovation Overview</h1>
            <p>
              Monitor real challenges, institutional participation, innovation
              projects and measurable outcomes across Jharkhand.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        {error && <ErrorBanner message={error} onRetry={loadDashboard} />}

        <section className="stats-grid">
          <Stat
            icon={FileText}
            label="Total Challenges"
            value={stats.totalChallenges}
          />
          <Stat icon={Clock3} label="Under Review" value={stats.underReview} />
          <Stat
            icon={Rocket}
            label="Active Projects"
            value={stats.activeProjects}
          />
          <Stat
            icon={CheckCircle2}
            label="Resolved Challenges"
            value={stats.completed}
          />
        </section>

        <section className="dashboard-card validation-cta-card">
          <div>
            <span className="section-kicker">INSTITUTIONAL GOVERNANCE</span>
            <h2>University validation</h2>
            <p>
              Review registered university profiles and validate institutional
              participation before routing collaboration opportunities.
            </p>
          </div>
          <Link to="/government/universities" className="btn btn-primary">
            Review universities <ArrowRight size={16} />
          </Link>
        </section>

        <section className="dashboard-grid-2">
          <div className="dashboard-card">
            <CardHeader
              kicker="CHALLENGE PIPELINE"
              title="Live challenge status"
              icon={BarChart3}
            />
            <div className="pipeline-list">
              {(data?.statusBreakdown || []).map((item) => (
                <div className="pipeline-row" key={item.status}>
                  <div className="pipeline-label">
                    <strong>{formatStatus(item.status)}</strong>
                    <span>{item.count} challenges</span>
                  </div>
                  <div className="pipeline-progress">
                    <span style={{ width: `${item.percentage || 0}%` }} />
                  </div>
                  <b>{item.percentage || 0}%</b>
                </div>
              ))}
              {!loading && !data?.statusBreakdown?.length && (
                <EmptyState text="No challenge data available yet." />
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <CardHeader
              kicker="THEMATIC INTELLIGENCE"
              title="Challenges by domain"
              icon={Activity}
            />
            <div className="domain-list">
              {(data?.domainBreakdown || []).map((item) => (
                <div className="domain-row" key={item.category}>
                  <span>{formatStatus(item.category)}</span>
                  <div className="domain-bar">
                    <span style={{ width: `${item.percentage || 0}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
              {!loading && !data?.domainBreakdown?.length && (
                <EmptyState text="No domain statistics available." />
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-grid-4 compact-stats-grid">
          <Metric
            icon={Users}
            label="Registered Citizens"
            value={stats.citizens}
          />
          <Metric
            icon={Building2}
            label="Participating Universities"
            value={stats.universities}
          />
          <Metric
            icon={Rocket}
            label="Industry Partners"
            value={stats.industries}
          />
          <Metric
            icon={Users}
            label="People Impacted"
            value={stats.peopleImpacted}
          />
        </section>

        <section className="dashboard-card recent-card">
          <CardHeader
            kicker="LIVE ACTIVITY"
            title="Recent challenges"
            action={
              <Link to="/government/challenges" className="card-action">
                View all <ArrowRight size={15} />
              </Link>
            }
          />

          <div className="challenge-table">
            {(data?.recentChallenges || []).map((problem) => (
              <Link
                to={`/problems/${problem._id}`}
                className="challenge-row"
                key={problem._id}
              >
                <div className="challenge-main">
                  <div className="challenge-id">{problem.problemId}</div>
                  <strong>{problem.title}</strong>
                  <span>
                    <MapPin size={13} />
                    {problem.location?.district || "Jharkhand"}
                    {problem.submittedBy?.name
                      ? ` · ${problem.submittedBy.name}`
                      : ""}
                  </span>
                </div>
                <StatusBadge status={problem.status} />
                <div className="challenge-date">
                  {formatDate(problem.createdAt)}
                </div>
              </Link>
            ))}
            {!loading && !data?.recentChallenges?.length && (
              <EmptyState text="No challenges submitted yet." />
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

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

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="mini-stat-card">
      <div className="mini-stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <strong>{Number(value || 0).toLocaleString("en-IN")}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function CardHeader({ kicker, title, icon: Icon, action }) {
  return (
    <div className="card-header">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {action || (Icon ? <Icon size={21} /> : null)}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge status-${String(status || "").toLowerCase()}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="dashboard-error">
      <AlertCircle size={19} />
      <span>{message}</span>
      <button type="button" onClick={() => onRetry()}>
        Retry
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="dashboard-empty-state compact">
      <FileText size={22} />
      <span>{text}</span>
    </div>
  );
}

function formatStatus(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
