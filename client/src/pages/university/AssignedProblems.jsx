import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Rocket, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProblemCard from "../../components/problems/ProblemCard";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import problemService from "../../services/problemService";
import "./AssignedProblems.css";
export default function AssignedProblems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setSetupRequired(false);

      const result = await problemService.getAssignedProblems();
      setProblems(Array.isArray(result.problems) ? result.problems : []);
    } catch (e) {
      const status = e.response?.status;
      const message =
        e.response?.data?.message || "Unable to load assigned challenges.";
      setSetupRequired(
        status === 400 &&
          /linked to a university|university profile/i.test(message),
      );
      setError(message);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const accept = async (id) => {
    try {
      setBusy(id);
      setError("");
      await problemService.accept(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to accept challenge.");
    } finally {
      setBusy("");
    }
  };

  const createProject = async (id) => {
    try {
      setBusy(id);
      setError("");
      const result = await problemService.createProject(id);
      const project = result?.data?.project || result?.project;
      if (project?._id) {
        window.location.href = `/projects/${project._id}`;
      } else {
        await load();
      }
    } catch (e) {
      setError(e.response?.data?.message || "Unable to create project.");
    } finally {
      setBusy("");
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">UNIVERSITY WORKSPACE</span>
            <h1>Assigned challenges</h1>
            <p>
              Review the challenges routed to your institution and move accepted
              challenges into projects.
            </p>
          </div>
          <button
            className="dashboard-refresh"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="dashboard-error">
            <strong>
              {setupRequired
                ? "University profile required"
                : "Unable to load assigned challenges"}
            </strong>
            <span>{error}</span>
            {setupRequired && (
              <Link className="btn btn-primary btn-small" to="/settings">
                Complete university profile
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <Loader />
        ) : !problems.length ? (
          <EmptyState
            title="No assigned challenges"
            description={
              setupRequired
                ? "Complete your university profile first. Government-assigned challenges will appear here."
                : "Government will route validated challenges to your university."
            }
          />
        ) : (
          <div className="problem-grid">
            {problems.map((problem) => (
              <ProblemCard
                key={problem._id}
                problem={problem}
                actions={
                  <div className="problem-actions">
                    <Link
                      className="btn btn-secondary btn-small"
                      to={`/problems/${problem._id}`}
                    >
                      <Eye size={15} /> Details
                    </Link>

                    {["ASSIGNED", "VALIDATED"].includes(problem.status) && (
                      <button
                        className="btn btn-primary btn-small"
                        disabled={busy === problem._id}
                        onClick={() => accept(problem._id)}
                      >
                        <CheckCircle2 size={15} />
                        {busy === problem._id
                          ? "Working..."
                          : "Accept challenge"}
                      </button>
                    )}

                    {problem.status === "ACCEPTED" &&
                      !problem.assignedProject && (
                        <button
                          className="btn btn-primary btn-small"
                          disabled={busy === problem._id}
                          onClick={() => createProject(problem._id)}
                        >
                          <Rocket size={15} />
                          {busy === problem._id
                            ? "Creating..."
                            : "Create project"}
                        </button>
                      )}

                    {problem.assignedProject && (
                      <Link
                        className="btn btn-secondary btn-small"
                        to={`/projects/${problem.assignedProject._id || problem.assignedProject}`}
                      >
                        <Rocket size={15} /> Open project
                      </Link>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
