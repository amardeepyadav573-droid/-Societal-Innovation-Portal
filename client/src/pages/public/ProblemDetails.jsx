import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import problemService from "../../services/problemService";
import EvidenceViewer from "../../components/problems/EvidenceViewer";
import AIChatbot from "../../components/ai/AIChatbot";
import useAuth from "../../hooks/useAuth";
import "./ProblemDetails.css";
export default function ProblemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProblem = async () => {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("Challenge ID missing.");
        }

        const result = await problemService.getById(id);
        const payload = result?.data || result || {};
        const nextProblem = payload?.problem || null;

        if (!nextProblem) {
          throw new Error(result?.message || "Challenge not found.");
        }

        if (mounted) {
          setProblem(nextProblem);
        }
      } catch (err) {
if (mounted) {
          setProblem(null);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Challenge not found.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProblem();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="problem-details-page">
        <div className="details-loading">Loading challenge...</div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="problem-details-page">
        <div className="details-error">{error || "Challenge not found."}</div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="back-button"
        >
          ← Back
        </button>
      </div>
    );
  }

  const location = problem.location || {};
  const university = problem.assignedUniversity;
  const project = problem.assignedProject;

  return (
    <div className="problem-details-page">
      <div className="problem-details-container">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="back-button"
        >
          ← Back
        </button>

        <div className="problem-header">
          <div>
            <div className="problem-id">{problem.problemId || problem._id}</div>

            <h1>{problem.title}</h1>

            <p className="problem-description">{problem.description}</p>
          </div>

          <div className="problem-status">
            {String(problem.status || "").replaceAll("_", " ")}
          </div>
        </div>

        <div className="problem-info-grid">
          <div className="info-card">
            <span>Category</span>
            <strong>
              {problem.customDomain || problem.category || "Other"}
            </strong>
          </div>

          <div className="info-card">
            <span>Priority</span>
            <strong>{problem.priority || "Medium"}</strong>
          </div>

          <div className="info-card">
            <span>District</span>
            <strong>{location.district || "Not specified"}</strong>
          </div>

          <div className="info-card">
            <span>Affected People</span>
            <strong>{problem.affectedPeople || 0}</strong>
          </div>
        </div>

        <section className="details-section">
          <h2>Challenge Details</h2>

          <div className="details-row">
            <span>Submitted by</span>
            <strong>{problem.submittedBy?.name || "Citizen"}</strong>
          </div>

          <div className="details-row">
            <span>Submitted on</span>
            <strong>
              {problem.createdAt
                ? new Date(problem.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </strong>
          </div>

          <div className="details-row">
            <span>Location</span>
            <strong>
              {[
                location.village,
                location.block,
                location.district,
                location.state,
              ]
                .filter(Boolean)
                .join(", ") || "Jharkhand"}
            </strong>
          </div>

          {problem.expectedSolution && (
            <div className="details-block">
              <h3>Expected Solution</h3>
              <p>{problem.expectedSolution}</p>
            </div>
          )}
        </section>

        <section className="details-section">
          <h2>Assignment & Progress</h2>

          <div className="assignment-card">
            <div>
              <span>Assigned Institution</span>

              <strong>{university?.name || "Not assigned yet"}</strong>
            </div>

            <div>
              <span>Accepted By</span>

              <strong>{problem.acceptedBy?.name || "Not accepted yet"}</strong>
            </div>

            <div>
              <span>Solution Progress</span>

              <strong>{problem.progress || project?.progress || 0}%</strong>
            </div>
          </div>

          <div className="progress-bar">
            <div
              style={{
                width: `${Math.min(
                  Math.max(
                    Number(problem.progress ?? project?.progress ?? 0),
                    0,
                  ),
                  100,
                )}%`,
              }}
            />
          </div>
        </section>

        {project && (
          <section className="details-section">
            <h2>Innovation Project</h2>

            <div className="project-card">
              <h3>{project.title}</h3>

              {project.description && <p>{project.description}</p>}

              <div className="project-meta">
                <span>Status: {project.status || "Not started"}</span>

                <span>Progress: {project.progress || 0}%</span>
              </div>
            </div>
          </section>
        )}

        {Array.isArray(problem.evidence) && problem.evidence.length > 0 && (
          <section className="details-section">
            <h2>Evidence & Media</h2>
            <p className="details-section-intro">
              Review photos, videos and supporting documents submitted with this
              challenge.
            </p>
            <EvidenceViewer evidence={problem.evidence} />
          </section>
        )}
      </div>
      {user && <AIChatbot />}
    </div>
  );
}
