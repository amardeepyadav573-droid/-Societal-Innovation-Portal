import { useEffect, useState } from "react";
import { resolveMediaUrl } from "../../utils/media";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Users,
  FlaskConical,
  Handshake,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import "./UniversityDetails.css";
const list = (value) => (Array.isArray(value) ? value : []);
export default function UniversityDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await api.get(`/universities/${id}`);
        setData(r.data?.data || null);
      } catch (e) {
        setError(
          e.response?.data?.message || "Unable to load university profile.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  if (loading)
    return (
      <DashboardLayout>
        <Loader fullPage />
      </DashboardLayout>
    );
  if (error || !data?.university)
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="dashboard-error">
            {error || "University not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  const u = data.university;
  const status = u.validationStatus || (u.isVerified ? "VALIDATED" : "PENDING");
  return (
    <DashboardLayout>
      <div className="page-container org-details-page">
        <button
          type="button"
          className="back-link"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <header className="org-detail-hero">
          <div className="org-logo">
            {u.logo ? (
              <img src={resolveMediaUrl(u.logo)} alt="" />
            ) : (
              <Building2 size={34} />
            )}
          </div>
          <div className="org-title">
            <div className="detail-title-row">
              <span className="section-kicker">UNIVERSITY / HEI</span>
              <StatusBadge status={status} />
            </div>
            <h1>{u.name}</h1>
            <p>{u.shortName || u.type || "Higher education institution"}</p>
            <div className="detail-meta">
              <span>
                <MapPin size={15} />
                {u.location?.district || "Jharkhand"}
                {u.location?.city ? `, ${u.location.city}` : ""}
              </span>
              {u.website && (
                <a href={u.website} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> Website
                </a>
              )}
            </div>
          </div>
        </header>
        <div className="detail-stat-grid">
          <div>
            <Users size={18} />
            <strong>{u.studentsCount || 0}</strong>
            <span>Students</span>
          </div>
          <div>
            <Users size={18} />
            <strong>{u.facultyCount || 0}</strong>
            <span>Faculty / Researchers</span>
          </div>
          <div>
            <FlaskConical size={18} />
            <strong>{list(u.researchAreas).length}</strong>
            <span>Research areas</span>
          </div>
          <div>
            <Handshake size={18} />
            <strong>{list(u.collaborationInterests).length}</strong>
            <span>Collaboration interests</span>
          </div>
        </div>
        <section className="detail-content-grid">
          <main className="detail-main">
            <Info title="About" text={u.about || u.description} />
            <Info
              title="Academic departments & courses"
              items={[...list(u.departments), ...list(u.courses)]}
            />
            <Info
              title="Research & expertise"
              items={[...list(u.researchAreas), ...list(u.expertise)]}
            />
            <Info
              title="Facilities & innovation"
              items={[
                ...list(u.facilities),
                ...list(u.innovationFacilities),
                ...list(u.incubationFacilities),
              ]}
            />
            <Info
              title="Projects & resources"
              items={[
                ...list(u.ongoingProjects),
                ...list(u.previousProjects),
                ...list(u.availableResources),
              ]}
            />
          </main>
          <aside className="detail-side">
            <div className="detail-side-card">
              <h3>Institution details</h3>
              <p>
                <b>Type:</b> {u.type || "—"}
              </p>
              <p>
                <b>Established:</b> {u.establishedYear || "—"}
              </p>
              <p>
                <b>Email:</b> {u.email || "—"}
              </p>
              <p>
                <b>Phone:</b> {u.phone || "—"}
              </p>
              <p>
                <b>Location:</b>{" "}
                {u.location?.address || u.location?.district || "—"}
              </p>
            </div>
            <div className="detail-side-card">
              <h3>Validation</h3>
              <div className="validation-state">
                <CheckCircle2 size={19} />
                <strong>{status}</strong>
              </div>
              {u.validationReason && <p>{u.validationReason}</p>}
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
function Info({ title, text, items }) {
  return (
    <section className="info-block">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {items?.length ? (
        <div className="tag-list">
          {items.map((x, i) => (
            <span key={`${x}-${i}`}>{x}</span>
          ))}
        </div>
      ) : (
        !text && <p className="muted-text">Not provided yet.</p>
      )}
    </section>
  );
}
