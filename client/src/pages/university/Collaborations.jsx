import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Search,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import collaborationService from "../../services/collaborationService";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import "./Collaborations.css";

export default function Collaborations() {
  const [requests, setRequests] = useState([]),
    [partners, setPartners] = useState([]),
    [search, setSearch] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [r, p] = await Promise.all([
        collaborationService.list(),
        collaborationService.discover("INDUSTRY", search),
      ]);
      setRequests(r.requests || []);
      setPartners(p.industries || []);
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to load collaboration data.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const searchPartners = async (e) => {
    e.preventDefault();
    try {
      const p = await collaborationService.discover("INDUSTRY", search);
      setPartners(p.industries || []);
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to search industry partners.",
      );
    }
  };
  const sendRequest = async (id) => {
    try {
      setBusy(id);
      setError("");
      await collaborationService.send(
        id,
        message ||
          "We would like to explore a research, technology or implementation collaboration.",
      );
      setMessage("");
      setSuccess("Collaboration request sent.");
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to send collaboration request.",
      );
    } finally {
      setBusy("");
    }
  };
  const respond = async (id, status) => {
    try {
      setBusy(id);
      await collaborationService.respond(id, status);
      setSuccess(`Request ${status.toLowerCase()} successfully.`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update request.");
    } finally {
      setBusy("");
    }
  };
  const discoverable = useMemo(
    () =>
      partners.filter(
        (p) => !["PENDING", "ACCEPTED"].includes(p._collaborationStatus),
      ),
    [partners],
  );

  return (
    <DashboardLayout>
      <div className="page-container collaboration-page">
        <header className="page-header collaboration-header">
          <div>
            <span className="section-kicker">
              UNIVERSITY · INDUSTRY NETWORK
            </span>
            <h1>Industry Collaborations</h1>
            <p>
              Review requests, discover trusted companies and manage active
              partnerships.
            </p>
          </div>
          <button
            className="dashboard-refresh"
            onClick={load}
            disabled={loading}
          >
            <Clock3 size={16} /> Refresh
          </button>
        </header>
        {error && (
          <div className="dashboard-error">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="success-inline">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <section className="collab-section">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">COLLABORATION WORKSPACE</span>
              <h2>Requests & partnerships</h2>
            </div>
          </div>
          {loading ? (
            <Loader />
          ) : !requests.length ? (
            <div className="collab-empty">
              <MessageSquare size={25} />
              <strong>No collaboration requests yet</strong>
              <span>Incoming industry requests will appear here.</span>
            </div>
          ) : (
            <div className="collab-request-grid">
              {requests.map((r) => (
                <article className="collab-request-card" key={r._id}>
                  <div className="collab-card-top">
                    <div className="partner-icon">
                      <Building2 size={20} />
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <h3>{r.industry?.name || "Industry partner"}</h3>
                  <p className="collab-meta">
                    {r.industry?.type || "Organization"} ·{" "}
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString("en-IN")
                      : ""}
                  </p>
                  <p>{r.message || "No message provided."}</p>
                  <div className="collab-actions">
                    <Link
                      className="btn btn-secondary btn-small"
                      to={`/industry/partners/${r.industry?._id}`}
                    >
                      <UserRound size={15} /> View Profile
                    </Link>
                    {r.status === "PENDING" &&
                      r.requestedByType !== "UNIVERSITY" && (
                        <>
                          <button
                            className="btn btn-primary btn-small"
                            disabled={busy === r._id}
                            onClick={() => respond(r._id, "ACCEPTED")}
                          >
                            <CheckCircle2 size={15} /> Accept
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            disabled={busy === r._id}
                            onClick={() => respond(r._id, "REJECTED")}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="collab-section">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">DISCOVER</span>
              <h2>Find industry partners</h2>
              <p>
                Accepted and pending partners are automatically removed from
                this list.
              </p>
            </div>
          </div>
          <form className="partner-search" onSubmit={searchPartners}>
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by organization, sector or technology"
            />
            <button className="btn btn-primary">Search</button>
          </form>
          <textarea
            className="collab-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional collaboration message"
            rows={3}
          />
          <div className="partner-grid">
            {discoverable.map((p) => (
              <article className="partner-card" key={p._id}>
                <div className="partner-avatar">
                  {p.logo ? (
                    <img src={p.logo} alt="" />
                  ) : (
                    <Building2 size={22} />
                  )}
                </div>
                <div className="partner-info">
                  <h3>{p.name}</h3>
                  <span>
                    {p.type} · {p.location?.district || "Jharkhand"}
                  </span>
                  <p>
                    {(p.domains || p.technologyAreas || [])
                      .slice(0, 3)
                      .join(" · ") || "Innovation partner"}
                  </p>
                </div>
                <div className="partner-card-actions">
                  <Link
                    className="btn btn-secondary btn-small"
                    to={`/industry/partners/${p._id}`}
                  >
                    View Profile
                  </Link>
                  <button
                    className="btn btn-primary btn-small"
                    disabled={busy === p._id}
                    onClick={() => sendRequest(p._id)}
                  >
                    <Send size={15} />
                    {busy === p._id ? "Sending…" : "Send Request"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!loading && !discoverable.length && (
            <div className="collab-empty compact">
              <CheckCircle2 size={22} />
              <strong>No new industry partners to request.</strong>
              <span>
                Pending and accepted relationships appear in your collaboration
                requests above.
              </span>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
