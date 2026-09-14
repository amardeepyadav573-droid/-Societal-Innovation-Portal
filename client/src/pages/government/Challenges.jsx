import { useEffect, useState } from "react";
import {
  Download,
  Filter,
  RefreshCw,
  CheckCircle2,
  Send,
  XCircle,
  Rocket,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import problemService from "../../services/problemService";
import api from "../../services/api";
import Select from "../../components/common/Select";
import StatusBadge from "../../components/common/StatusBadge";
import { DOMAINS } from "../../utils/constants";
import locationService from "../../services/locationService";
import "./Challenges.css";
export default function Challenges() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]),
    [universities, setUniversities] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filters, setFilters] = useState({
      status: "",
      category: "",
      state: "",
      district: "",
      block: "",
    }),
    [busy, setBusy] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      const r = await problemService.getProblems({ ...filters, limit: 100 });
      setProblems(r.problems || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load challenges.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    api
      .get("/universities")
      .then((r) => setUniversities(r.data?.data?.universities || []))
      .catch(() => setUniversities([]));
  }, []);
  useEffect(() => {
    load();
  }, [
    filters.status,
    filters.category,
    filters.state,
    filters.district,
    filters.block,
  ]);
  const [states, setStates] = useState([]),
    [districts, setDistricts] = useState([]),
    [blocks, setBlocks] = useState([]);
  useEffect(() => {
    locationService
      .getStates()
      .then((r) => setStates(r.data || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setFilters((f) => ({ ...f, district: "", block: "" }));
    if (!filters.state) {
      setDistricts([]);
      setBlocks([]);
      return;
    }
    locationService
      .getDistricts(filters.state)
      .then((r) => setDistricts(r.data || []))
      .catch(() => setDistricts([]));
  }, [filters.state]);
  useEffect(() => {
    setFilters((f) => ({ ...f, block: "" }));
    if (!filters.state || !filters.district) {
      setBlocks([]);
      return;
    }
    locationService
      .getBlocks(filters.state, filters.district)
      .then((r) => setBlocks(r.data || []))
      .catch(() => setBlocks([]));
  }, [filters.district]);
  const action = async (fn, id) => {
    try {
      setBusy(id);
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Action failed.");
    } finally {
      setBusy("");
    }
  };
  const exportCsv = () => {
    const rows = [
      [
        "Problem ID",
        "Title",
        "Category",
        "District",
        "Status",
        "Priority",
        "Assigned University",
        "Accepted By",
        "Progress",
      ],
      ...problems.map((p) => [
        p.problemId,
        p.title,
        p.category,
        p.location?.district,
        p.status,
        p.priority,
        p.assignedUniversity?.name || "",
        p.acceptedBy?.name || "",
        p.progress || 0,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sip-challenges.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">GOVERNMENT CONTROL ROOM</span>
            <h1>Challenge management</h1>
            <p>
              Review, validate, assign and monitor every community challenge
              using live database records.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        <div className="dashboard-card challenge-filters">
          <Filter size={18} />
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              "SUBMITTED",
              "UNDER_REVIEW",
              "VALIDATED",
              "ASSIGNED",
              "ACCEPTED",
              "IN_PROGRESS",
              "PROTOTYPE",
              "PILOT",
              "IMPLEMENTED",
              "COMPLETED",
              "REJECTED",
            ]}
          />
          <Select
            label="Domain"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            options={DOMAINS}
          />
          <Select
            label="State"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            options={states}
          />
          <Select
            label="District"
            value={filters.district}
            onChange={(e) =>
              setFilters({ ...filters, district: e.target.value })
            }
            options={districts}
          />
          <Select
            label="Block"
            value={filters.block}
            onChange={(e) => setFilters({ ...filters, block: e.target.value })}
            options={blocks}
          />
        </div>
        <div className="dashboard-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Accepted by</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">Loading live challenges…</td>
                  </tr>
                ) : (
                  problems.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <Link to={`/problems/${p._id}`}>
                          <strong>{p.title}</strong>
                        </Link>
                        <small>
                          {p.problemId} ·{" "}
                          {String(p.category).replaceAll("_", " ")}
                        </small>
                      </td>
                      <td>{p.location?.district || "-"}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>{p.acceptedBy?.name || "Not accepted yet"}</td>
                      <td>
                        <div className="table-progress">
                          <span style={{ width: `${p.progress || 0}%` }} />
                          <b>{p.progress || 0}%</b>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          {["SUBMITTED", "UNDER_REVIEW"].includes(p.status) && (
                            <button
                              className="icon-text-btn"
                              onClick={() =>
                                navigate(
                                  `/government/universities?problem=${encodeURIComponent(p._id)}`,
                                )
                              }
                            >
                              <CheckCircle2 size={14} /> Validate
                            </button>
                          )}
                          {p.status === "VALIDATED" && (
                            <select
                              className="inline-select"
                              defaultValue=""
                              onChange={(e) =>
                                e.target.value &&
                                action(
                                  () =>
                                    problemService.assign(
                                      p._id,
                                      e.target.value,
                                    ),
                                  p._id,
                                )
                              }
                            >
                              <option value="">Assign university…</option>
                              {universities.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.shortName || u.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {p.status === "REJECTED" && (
                            <span className="muted-text">Rejected</span>
                          )}
                          {["SUBMITTED", "UNDER_REVIEW", "VALIDATED"].includes(
                            p.status,
                          ) && (
                            <button
                              className="icon-text-btn danger"
                              disabled={busy === p._id}
                              onClick={() =>
                                action(
                                  () =>
                                    problemService.updateStatus(
                                      p._id,
                                      "REJECTED",
                                      "Rejected during government review",
                                    ),
                                  p._id,
                                )
                              }
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          )}
                          {p.assignedProject && (
                            <Link
                              className="icon-text-btn"
                              to={`/projects/${p.assignedProject._id || p.assignedProject}`}
                            >
                              <Rocket size={14} /> Project
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && !problems.length && (
                  <tr>
                    <td colSpan="6">
                      No challenges match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
