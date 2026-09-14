import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import problemService from "../../services/problemService";
import "./MyProblems.css";

const STATUS_CONFIG = {
  SUBMITTED: {
    label: "Submitted",
    className: "status-submitted",
    icon: FileText,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "status-review",
    icon: Clock3,
  },
  VALIDATED: {
    label: "Validated",
    className: "status-validated",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className: "status-rejected",
    icon: AlertCircle,
  },
  DUPLICATE: {
    label: "Duplicate",
    className: "status-rejected",
    icon: AlertCircle,
  },
  ASSIGNED: {
    label: "University Assigned",
    className: "status-assigned",
    icon: Sparkles,
  },
  ACCEPTED: {
    label: "Accepted",
    className: "status-accepted",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "status-progress",
    icon: Clock3,
  },
  PROTOTYPE: {
    label: "Prototype",
    className: "status-progress",
    icon: Sparkles,
  },
  PILOT: {
    label: "Pilot",
    className: "status-progress",
    icon: Sparkles,
  },
  IMPLEMENTED: {
    label: "Implemented",
    className: "status-completed",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Completed",
    className: "status-completed",
    icon: CheckCircle2,
  },
};

function formatStatus(status) {
  return (
    STATUS_CONFIG[status]?.label ||
    String(status || "Submitted")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCategory(problem) {
  return (
    problem?.category ||
    problem?.domain ||
    problem?.aiAnalysis?.category ||
    "OTHER"
  );
}

function getProgress(problem) {
  if (typeof problem?.progress === "number") {
    return Math.min(100, Math.max(0, problem.progress));
  }

  if (typeof problem?.project?.progress === "number") {
    return Math.min(100, Math.max(0, problem.project.progress));
  }

  if (typeof problem?.assignedProject?.progress === "number") {
    return Math.min(100, Math.max(0, problem.assignedProject.progress));
  }

  const completedStatuses = ["IMPLEMENTED", "COMPLETED"];

  if (completedStatuses.includes(problem?.status)) {
    return 100;
  }

  if (problem?.status === "IN_PROGRESS") {
    return 50;
  }

  if (problem?.status === "ACCEPTED") {
    return 25;
  }

  return 0;
}

function getUniversity(problem) {
  return problem?.assignedUniversity || problem?.university || null;
}

export default function MyProblems() {
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadProblems = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await problemService.myProblems({
        limit: 50,
      });

      // API response is { success, data: { problems, pagination } }.
      // Keep a fallback for older service implementations that returned
      // the inner data object directly.
      const payload = result?.data || result || {};
      const nextProblems = Array.isArray(payload?.problems)
        ? payload.problems
        : [];

      setProblems(nextProblems);
      setPagination(payload?.pagination || {});
    } catch (err) {
        setError(
        err?.response?.data?.message || "Unable to load your challenges.",
      );

      setProblems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesSearch =
        !query ||
        problem?.title?.toLowerCase().includes(query) ||
        problem?.description?.toLowerCase().includes(query) ||
        getCategory(problem)?.toLowerCase().includes(query) ||
        problem?.location?.district?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || problem?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [problems, search, statusFilter]);

  const stats = useMemo(() => {
    const total = Number(pagination?.total ?? problems.length);

    const completed = problems.filter(
      (item) => item.status === "COMPLETED" || item.status === "IMPLEMENTED",
    ).length;

    const active = problems.filter((item) =>
      [
        "UNDER_REVIEW",
        "VALIDATED",
        "ASSIGNED",
        "ACCEPTED",
        "IN_PROGRESS",
        "PROTOTYPE",
        "PILOT",
      ].includes(item.status),
    ).length;

    const rejected = problems.filter(
      (item) => item.status === "REJECTED" || item.status === "DUPLICATE",
    ).length;

    return {
      total,
      active,
      completed,
      rejected,
    };
  }, [problems, pagination?.total]);

  return (
    <DashboardLayout>
      <div className="my-problems-page">
        <div className="page-container">
          {/* HEADER */}
          <div className="my-problems-header">
            <div>
              <span className="section-kicker">CITIZEN CONTRIBUTIONS</span>

              <h1>My Challenges</h1>

              <p>
                Track every societal challenge you have submitted and follow its
                journey from submission to real-world impact.
              </p>
            </div>

            <div className="my-problems-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  loadProblems({
                    refresh: true,
                  })
                }
                disabled={loading || refreshing}
              >
                {refreshing ? (
                  <Loader2 size={17} className="spin" />
                ) : (
                  <RefreshCw size={17} />
                )}
                Refresh
              </button>

              <Link to="/citizen/submit" className="btn btn-primary">
                Submit challenge
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="problems-error">
              <AlertCircle size={19} />
              <div>
                <strong>Unable to load challenges</strong>

                <p>{error}</p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => loadProblems()}
              >
                Try again
              </button>
            </div>
          )}

          {/* STATS */}
          <div className="my-problems-stats">
            <div className="mini-stat-card">
              <span>Total submitted</span>
              <strong>{loading ? "—" : stats.total}</strong>
            </div>

            <div className="mini-stat-card">
              <span>Active</span>
              <strong>{loading ? "—" : stats.active}</strong>
            </div>

            <div className="mini-stat-card">
              <span>Completed</span>
              <strong>{loading ? "—" : stats.completed}</strong>
            </div>

            <div className="mini-stat-card">
              <span>Rejected / Duplicate</span>
              <strong>{loading ? "—" : stats.rejected}</strong>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="problems-toolbar">
            <div className="problem-search">
              <Search size={18} />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your challenges..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="problem-filter"
            >
              <option value="ALL">All statuses</option>

              <option value="SUBMITTED">Submitted</option>

              <option value="UNDER_REVIEW">Under Review</option>

              <option value="VALIDATED">Validated</option>

              <option value="ASSIGNED">University Assigned</option>

              <option value="ACCEPTED">Accepted</option>

              <option value="IN_PROGRESS">In Progress</option>

              <option value="PROTOTYPE">Prototype</option>

              <option value="PILOT">Pilot</option>

              <option value="IMPLEMENTED">Implemented</option>

              <option value="COMPLETED">Completed</option>

              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="problems-loading">
              <Loader2 size={32} className="spin" />

              <p>Loading your challenges...</p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="problems-empty">
              <div className="problems-empty-icon">
                <FileText size={30} />
              </div>

              <h2>
                {problems.length === 0
                  ? "No challenges yet"
                  : "No matching challenges"}
              </h2>

              <p>
                {problems.length === 0
                  ? "Your submitted societal challenges will appear here."
                  : "Try changing your search or status filter."}
              </p>

              {problems.length === 0 && (
                <Link to="/citizen/submit" className="btn btn-primary">
                  Submit your first challenge
                  <ArrowRight size={17} />
                </Link>
              )}
            </div>
          ) : (
            <div className="problems-list">
              {filteredProblems.map((problem) => {
                const status =
                  STATUS_CONFIG[problem.status] || STATUS_CONFIG.SUBMITTED;

                const StatusIcon = status.icon;

                const university = getUniversity(problem);

                const progress = getProgress(problem);

                return (
                  <article
                    className="problem-list-card"
                    key={problem._id || problem.problemId}
                  >
                    <div className="problem-card-main">
                      <div className="problem-card-top">
                        <div className="problem-card-id">
                          {problem.problemId || "CHALLENGE"}
                        </div>

                        <div className={`problem-status ${status.className}`}>
                          <StatusIcon size={14} />

                          {formatStatus(problem.status)}
                        </div>
                      </div>

                      <Link
                        to={`/problems/${problem._id || problem.problemId}`}
                        className="problem-card-title"
                      >
                        {problem.title}
                      </Link>

                      <p className="problem-card-description">
                        {problem.description}
                      </p>

                      <div className="problem-card-meta">
                        <span>
                          <Sparkles size={14} />

                          {getCategory(problem)}
                        </span>

                        {problem?.location?.district && (
                          <span>
                            <MapPin size={14} />

                            {problem.location.district}
                          </span>
                        )}

                        <span>Submitted {formatDate(problem.createdAt)}</span>
                      </div>
                    </div>

                    <div className="problem-card-side">
                      <div className="problem-progress">
                        <div className="problem-progress-heading">
                          <span>Solution progress</span>

                          <strong>{progress}%</strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-value"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="problem-assignment">
                        <span>Assigned institution</span>

                        <strong>
                          {university?.name ||
                            university?.shortName ||
                            "Not assigned yet"}
                        </strong>

                        {problem?.acceptedBy && (
                          <small>
                            Accepted by{" "}
                            {problem.acceptedBy?.name ||
                              problem.acceptedBy?.email ||
                              "University team"}
                          </small>
                        )}
                      </div>

                      <Link
                        to={`/problems/${problem._id || problem.problemId}`}
                        className="problem-view-link"
                      >
                        View details
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pagination?.total > 0 && (
            <div className="problems-result-count">
              Showing <strong>{filteredProblems.length}</strong> of{" "}
              <strong>{pagination.total}</strong> challenges
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
