import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  RefreshCw,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import dashboardService from "../../services/dashboardService";
import "./CitizenDashboard.css";
export default function CitizenDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await dashboardService.getCitizenDashboard();

      setDashboard(response?.data || response || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};

  const recentChallenges = dashboard?.recentChallenges || [];

  const total = Number(stats.totalChallenges || 0);

  const resolved = Number(stats.resolved || 0);

  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="page-container dashboard-page citizen-dashboard">
        <header className="dashboard-welcome dashboard-hero">
          <div className="citizen-hero-content">
            <span className="section-kicker">CITIZEN WORKSPACE</span>

            <h1>Turn your local observation into action.</h1>

            <p>
              Submit challenges, track progress and follow the solutions created
              around them.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Link
              to="/citizen/profile"
              className="btn btn-secondary citizen-profile-button"
            >
              <UserRound size={17} />
              Citizen Profile
            </Link>

            <button
              type="button"
              className="dashboard-refresh"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "spin" : ""} />

              {refreshing ? "Refreshing..." : "Refresh data"}
            </button>

            <Link to="/citizen/submit" className="btn btn-primary">
              <Plus size={18} />
              Submit challenge
            </Link>
          </div>
        </header>

        {error && (
          <div className="dashboard-error">
            <span>{error}</span>

            <button type="button" onClick={() => loadDashboard()}>
              Try again
            </button>
          </div>
        )}

        <section className="stats-grid" aria-label="Citizen statistics">
          <StatCard
            icon={ClipboardList}
            label="Challenges submitted"
            value={loading ? "—" : total}
          />

          <StatCard
            icon={Clock3}
            label="Under review"
            value={loading ? "—" : stats.underReview || 0}
          />

          <StatCard
            icon={CheckCircle2}
            label="Resolved"
            value={loading ? "—" : resolved}
          />

          <StatCard
            icon={TrendingUp}
            label="People impacted"
            value={loading ? "—" : stats.peopleImpacted || 0}
          />
        </section>

        <div className="dashboard-grid citizen-content-grid">
          <section className="dashboard-panel dashboard-card">
            <div className="panel-heading card-header">
              <div>
                <span className="section-kicker">LIVE ACTIVITY</span>

                <h2>Recent challenges</h2>

                <p>Your latest submissions from the portal.</p>
              </div>

              <Link to="/citizen/problems" className="card-action">
                View all
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="activity-list">
              {loading ? (
                <LoadingRows />
              ) : recentChallenges.length ? (
                recentChallenges.map((problem) => (
                  <Link
                    to={`/problems/${problem._id}`}
                    className="activity-item dashboard-activity-item"
                    key={problem._id}
                  >
                    <div className="activity-dot" />

                    <div className="activity-content">
                      <strong>{problem.title}</strong>

                      <span>
                        {formatStatus(problem.status)}

                        {problem.location?.district ? " · " : ""}

                        {problem.location?.district || "Jharkhand"}

                        {problem.acceptedBy?.name
                          ? ` · Accepted by ${problem.acceptedBy.name}`
                          : ""}

                        {problem.progress || problem.assignedProject?.progress
                          ? ` · ${
                              problem.progress ||
                              problem.assignedProject?.progress
                            }% work`
                          : ""}
                      </span>
                    </div>

                    <ArrowRight size={16} className="activity-arrow" />
                  </Link>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </section>

          <aside className="dashboard-panel impact-panel citizen-impact-card">
            <div
              className="impact-ring"
              style={{
                "--progress": `${resolutionRate}%`,
              }}
            >
              <div>
                <strong>{loading ? "—" : `${resolutionRate}%`}</strong>

                <span>resolved</span>
              </div>
            </div>

            <span className="section-kicker">YOUR CONTRIBUTION</span>

            <h2>Your voice can drive innovation.</h2>

            <p>
              Every validated challenge can become an opportunity for students,
              researchers and industry to create measurable impact.
            </p>

            <div className="impact-summary">
              <SummaryItem label="Validated" value={stats.validated || 0} />

              <SummaryItem label="In progress" value={stats.inProgress || 0} />

              <SummaryItem
                label="People impacted"
                value={stats.peopleImpacted || 0}
              />
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="dashboard-stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>

        <span className="live-indicator">LIVE</span>
      </div>

      <div className="stat-value">
        {Number.isFinite(value) ? value.toLocaleString("en-IN") : value}
      </div>

      <div className="stat-label">{label}</div>
    </div>
  );
}

/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({ label, value }) {
  return (
    <div className="impact-summary-item">
      <strong>{Number(value || 0).toLocaleString("en-IN")}</strong>

      <span>{label}</span>
    </div>
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

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="dashboard-empty-state">
      <ClipboardList size={24} />

      <strong>No challenges yet</strong>

      <span>Submit your first societal challenge.</span>

      <Link to="/citizen/submit" className="btn btn-secondary btn-small">
        Create challenge
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

/* =========================================================
   STATUS FORMATTER
========================================================= */

function formatStatus(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
