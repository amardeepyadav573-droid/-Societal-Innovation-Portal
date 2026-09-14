import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";
import problemService from "../../services/problemService";
import aiService from "../../services/aiService";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { resolveMediaUrl } from "../../utils/media";
import "./UniversityValidation.css";

export default function UniversityValidation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState([]);
  const [problems, setProblems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState(
    searchParams.get("problem") || "",
  );
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [rankedMatches, setRankedMatches] = useState([]);
  const [autoMatching, setAutoMatching] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUniversities = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/universities", {
        params: { search: search || undefined },
      });
      setUniversities(response.data?.data?.universities || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load universities.");
    } finally {
      setLoading(false);
    }
  };

  const loadProblems = async () => {
    try {
      setProblemsLoading(true);
      const result = await problemService.getProblems({ limit: 100 });
      setProblems(result.problems || []);
    } catch {
      setProblems([]);
    } finally {
      setProblemsLoading(false);
    }
  };

  const loadMatches = async (problemId) => {
    if (!problemId) {
      setRankedMatches([]);
      setAiSummary("");
      return;
    }

    try {
      setAutoMatching(true);
      setRankedMatches([]);
      setAiSummary("");
      const response = await api.get(
        `/universities/matches/${encodeURIComponent(problemId)}`,
      );
      const matches = response.data?.data?.matches || [];
      setRankedMatches(matches);

      if (matches.length) {
        setAiSummaryLoading(true);
        aiService
          .summarizeUniversityMatches(problemId, matches)
          .then((summary) => setAiSummary(summary || ""))
          .catch(() => setAiSummary(""))
          .finally(() => setAiSummaryLoading(false));
      }
    } catch (e) {
      setRankedMatches([]);
      setAiSummary("");
      setError(e.response?.data?.message || "Unable to calculate university matches.");
    } finally {
      setAutoMatching(false);
    }
  };

  useEffect(() => {
    loadUniversities();
    loadProblems();
  }, []);

  useEffect(() => {
    setSelectedProblemId(searchParams.get("problem") || "");
    setMatchResult(null);
    setSelectedUniversityId("");
  }, [searchParams]);

  useEffect(() => {
    loadMatches(selectedProblemId);
  }, [selectedProblemId]);

  const selectedProblem = useMemo(
    () => problems.find((problem) => problem._id === selectedProblemId) || null,
    [problems, selectedProblemId],
  );

  const chooseProblem = (problemId) => {
    setSelectedProblemId(problemId);
    setSelectedUniversityId("");
    setMatchResult(null);
    setRankedMatches([]);
    setAiSummary("");
    setSuccess("");
    setSearchParams(problemId ? { problem: problemId } : {});
  };

  const analyze = async (universityId) => {
    if (!selectedProblemId) {
      setError("Select a problem before validating a university.");
      return;
    }

    try {
      setBusy(`match:${universityId}`);
      setSelectedUniversityId(universityId);
      setMatchResult(null);
      setError("");
      setSuccess("");

      const response = await api.post(`/universities/${universityId}/match`, {
        problemId: selectedProblemId,
      });
      setMatchResult(response.data?.data?.match || null);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to analyze this university match.");
    } finally {
      setBusy("");
    }
  };

  const confirmValidation = async (universityId) => {
    const reason = "";
    try {
      setBusy(`validate:${universityId}`);
      setError("");
      await api.patch(`/universities/${universityId}/validate-match`, {
        problemId: selectedProblemId,
        reason,
      });
      setSuccess("University validated successfully.");
      setMatchResult(null);
      setSelectedUniversityId("");
      await loadUniversities();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update validation status.");
    } finally {
      setBusy("");
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Reason for rejection (optional):") || "";
    try {
      setBusy(`reject:${id}`);
      setError("");
      await api.patch(`/universities/${id}/validate`, {
        status: "REJECTED",
        reason,
      });
      setSuccess("University rejected successfully.");
      setMatchResult(null);
      setSelectedUniversityId("");
      await loadUniversities();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update validation status.");
    } finally {
      setBusy("");
    }
  };

  const filtered = universities.filter(
    (university) =>
      !status ||
      String(
        university.validationStatus ||
          (university.isVerified ? "VALIDATED" : "PENDING"),
      ) === status,
  );

  return (
    <DashboardLayout>
      <div className="page-container validation-page">
        <header className="page-header">
          <div>
            <span className="section-kicker">
              GOVERNMENT · INSTITUTIONAL VALIDATION
            </span>
            <h1>University Validation</h1>
            <p>
              Select a challenge, inspect university profiles and validate the
              institution against that specific challenge.
            </p>
          </div>
          <button className="dashboard-refresh" onClick={loadUniversities}>
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {error && (
          <div className="dashboard-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className="success-inline">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <section className="validation-problem-picker">
          <div>
            <span className="section-kicker">MATCHING CONTEXT</span>
            <h2>Choose the problem to validate against</h2>
            <p>
              Match scores are calculated from the selected problem and the
              selected university profile. Nothing is shown until you analyze.
            </p>
          </div>
          <label className="validation-select-wrap">
            <span>Problem / Challenge</span>
            <div>
              <select
                value={selectedProblemId}
                onChange={(event) => chooseProblem(event.target.value)}
                disabled={problemsLoading}
              >
                <option value="">
                  {problemsLoading ? "Loading challenges…" : "Select a challenge…"}
                </option>
                {problems.map((problem) => (
                  <option key={problem._id} value={problem._id}>
                    {problem.problemId || problem._id} · {problem.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </div>
          </label>
          {selectedProblem && (
            <div className="selected-problem-summary">
              <strong>{selectedProblem.title}</strong>
              <span>
                {selectedProblem.category?.replaceAll("_", " ")} ·{" "}
                {selectedProblem.location?.district || "Location not specified"}
              </span>
            </div>
          )}
        </section>

        {selectedProblem && (
          <section className="auto-match-panel" aria-live="polite">
            <div className="auto-match-header">
              <div>
                <span className="section-kicker">AI-ASSISTED UNIVERSITY MATCHING</span>
                <h2>Best universities for this challenge</h2>
                <p>
                  Every active university is scored automatically from the
                  challenge requirements and its real profile data. You no longer
                  need to open and validate universities one by one.
                </p>
              </div>
              {autoMatching && (
                <span className="auto-match-status">
                  <LoaderCircle className="spin" size={16} /> Analyzing universities…
                </span>
              )}
            </div>

            {!autoMatching && rankedMatches.length > 0 && (
              <div className="auto-match-grid">
                {rankedMatches.slice(0, 5).map((match, index) => (
                  <button
                    type="button"
                    className="auto-match-card"
                    key={match.university._id}
                    onClick={() => analyze(match.university._id)}
                  >
                    <div className="auto-match-rank">#{index + 1}</div>
                    <div className="auto-match-info">
                      <strong>{match.university.name}</strong>
                      <span>{match.university.shortName || "University"}</span>
                    </div>
                    <div className="auto-match-score">{match.score}%</div>
                  </button>
                ))}
              </div>
            )}

            {!autoMatching && !rankedMatches.length && (
              <div className="auto-match-empty">
                No university match could be calculated from the available profiles.
              </div>
            )}

            {(aiSummaryLoading || aiSummary) && (
              <div className="ai-match-summary">
                <div className="ai-match-summary-title">
                  <Sparkles size={17} />
                  <strong>AI recommendation</strong>
                </div>
                {aiSummaryLoading ? (
                  <p>AI is reviewing the calculated matches…</p>
                ) : (
                  <p>{aiSummary}</p>
                )}
              </div>
            )}
          </section>
        )}

        <section className="validation-toolbar">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              loadUniversities();
            }}
          >
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search university name or expertise"
            />
            <button className="btn btn-primary">Search</button>
          </form>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VALIDATED">Validated</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </section>

        {loading ? (
          <Loader />
        ) : (
          <div className="university-validation-list">
            {filtered.map((university) => {
              const current =
                university.validationStatus ||
                (university.isVerified ? "VALIDATED" : "PENDING");
              const isSelected = selectedUniversityId === university._id;
              const isMatching = busy === `match:${university._id}`;
              const isValidating = busy === `validate:${university._id}`;

              return (
                <article className="validation-card" key={university._id}>
                  <div className="validation-logo">
                    {university.logo ? (
                      <img src={resolveMediaUrl(university.logo)} alt="" />
                    ) : (
                      <Building2 size={25} />
                    )}
                  </div>

                  <div className="validation-main">
                    <div className="validation-title">
                      <div>
                        <h2>{university.name}</h2>
                        <p>
                          {university.shortName ||
                            university.type ||
                            "Higher education institution"}
                        </p>
                      </div>
                      <StatusBadge status={current} />
                    </div>

                    <div className="validation-meta">
                      <span>
                        <MapPin size={14} />
                        {university.location?.district || "Location not specified"}
                        {university.location?.city
                          ? `, ${university.location.city}`
                          : ""}
                      </span>
                      <span>
                        Profile:{" "}
                        {university.about || university.description
                          ? "Complete"
                          : "Needs details"}
                      </span>
                      <span>
                        {(university.researchAreas || []).length} research areas
                      </span>
                    </div>

                    <div className="validation-actions">
                      <Link
                        className="btn btn-secondary btn-small"
                        to={`/government/universities/${university._id}`}
                      >
                        <Eye size={15} /> Review Profile
                      </Link>

                      <button
                        className="btn btn-primary btn-small"
                        disabled={!selectedProblemId || Boolean(busy)}
                        onClick={() => analyze(university._id)}
                      >
                        {isMatching ? (
                          <>
                            <LoaderCircle className="spin" size={15} /> Analyzing…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            {current === "VALIDATED"
                              ? "Analyze Match"
                              : "Validate University"}
                          </>
                        )}
                      </button>

                      {isSelected && matchResult && (
                        <button
                          className="btn btn-secondary btn-small"
                          disabled={Boolean(busy)}
                          onClick={() => confirmValidation(university._id)}
                        >
                          {isValidating ? (
                            <>
                              <LoaderCircle className="spin" size={15} /> Confirming…
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={15} /> Confirm Validation
                            </>
                          )}
                        </button>
                      )}

                      {current !== "REJECTED" && (
                        <button
                          className="btn btn-secondary btn-small"
                          disabled={Boolean(busy)}
                          onClick={() => reject(university._id)}
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      )}
                    </div>

                    {isSelected && matchResult && (
                      <MatchResult result={matchResult} problem={selectedProblem} />
                    )}
                  </div>
                </article>
              );
            })}

            {!filtered.length && (
              <div className="collab-empty">
                <Building2 size={25} />
                <strong>No universities found</strong>
                <span>Try another search or status filter.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MatchResult({ result, problem }) {
  return (
    <section className="university-match-result" aria-live="polite">
      <div className="match-result-header">
        <div>
          <span className="section-kicker">VALIDATION ANALYSIS</span>
          <h3>University Match Score: {result.score}%</h3>
          <p>
            {problem?.title} · deterministic profile-to-problem analysis
          </p>
        </div>
      </div>

      <div className="match-factor-grid">
        {result.factors.map((factor) => (
          <div className="match-factor" key={factor.key}>
            <div className="match-factor-top">
              <strong>{factor.label}</strong>
              <b>{factor.score}%</b>
            </div>
            <div className="match-bar">
              <span style={{ width: `${factor.score}%` }} />
            </div>
            <small>Weight {factor.weight}%</small>
            {factor.matches?.length ? (
              <ul>
                {factor.matches.slice(0, 4).map((match) => (
                  <li key={`${factor.key}-${match.required}-${match.available}`}>
                    <span>{match.required}</span>
                    <b>↔</b>
                    <span>{match.available}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="match-none">No matching signals found in this field.</p>
            )}
          </div>
        ))}
      </div>

      <div className="match-explanation">
        <h4>Why this university matches</h4>
        {result.reasons?.length ? (
          <ul>
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>
            No strong field-level match was found in the available university
            profile data. The score remains deterministic and reflects that gap.
          </p>
        )}
      </div>
    </section>
  );
}
