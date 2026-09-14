import { useEffect, useState } from "react";
import { ArrowUpRight, FileText, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import projectService from "../../services/projectService";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import "./Proposals.css";
export default function Proposals() {
  const [projects, setProjects] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [active, setActive] = useState(null),
    [form, setForm] = useState({
      abstract: "",
      methodology: "",
      expectedOutcome: "",
      budget: "",
    });
  const load = async () => {
    try {
      setLoading(true);
      setProjects((await projectService.getProjects()).projects || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load proposals.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await projectService.submitProposal(active, form);
      setActive(null);
      setForm({
        abstract: "",
        methodology: "",
        expectedOutcome: "",
        budget: "",
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to submit proposal.");
    }
  };
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">UNIVERSITY</span>
            <h1>Solution proposals</h1>
            <p>
              Submit and track research proposals for projects created from
              community challenges.
            </p>
          </div>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        {loading ? (
          <Loader />
        ) : !projects.length ? (
          <EmptyState
            title="No projects yet"
            description="Accept a challenge and create a project before submitting a proposal."
          />
        ) : (
          <div className="proposal-list">
            {projects.map((p) => (
              <article className="proposal-card" key={p._id}>
                <div className="proposal-icon">
                  <FileText size={22} />
                </div>
                <div className="proposal-main">
                  <span className="domain-tag">
                    {p.problem?.category || "Innovation"}
                  </span>
                  <h3>{p.title}</h3>
                  <p>
                    Status: {p.proposal?.status || "DRAFT"} · Budget requested:
                    ₹{Number(p.proposal?.budget || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="proposal-status">
                  {p.proposal?.status || "DRAFT"}
                </span>
                <Link className="icon-button" to={`/projects/${p._id}`}>
                  <ArrowUpRight size={18} />
                </Link>
                {[undefined, "DRAFT", "REJECTED"].includes(
                  p.proposal?.status,
                ) && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setActive(p._id)}
                  >
                    <Plus size={15} />{" "}
                    {p.proposal?.status === "REJECTED"
                      ? "Resubmit"
                      : "Submit proposal"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
        {active && (
          <div className="modal-backdrop">
            <form className="modal-card" onSubmit={submit}>
              <div className="modal-heading">
                <h2>Submit solution proposal</h2>
                <button type="button" onClick={() => setActive(null)}>
                  <X />
                </button>
              </div>
              <textarea
                className="form-textarea"
                placeholder="Abstract"
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                required
              />
              <textarea
                className="form-textarea"
                placeholder="Methodology"
                value={form.methodology}
                onChange={(e) =>
                  setForm({ ...form, methodology: e.target.value })
                }
                required
              />
              <textarea
                className="form-textarea"
                placeholder="Expected outcome"
                value={form.expectedOutcome}
                onChange={(e) =>
                  setForm({ ...form, expectedOutcome: e.target.value })
                }
                required
              />
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="Budget requested (₹)"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
              <button className="btn btn-primary" type="submit">
                Submit for review
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
