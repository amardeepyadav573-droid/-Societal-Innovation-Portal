import { useEffect, useState } from "react";
import { resolveMediaUrl } from "../../utils/media";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Rocket,
  Handshake,
  FlaskConical,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import "./IndustryDetails.css";
const list = (v) => (Array.isArray(v) ? v : []);
export default function IndustryDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/industries/${id}`);
        setData(r.data?.data || null);
      } catch (e) {
        setError(
          e.response?.data?.message || "Unable to load organization profile.",
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
  if (error || !data?.industry)
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="dashboard-error">
            {error || "Industry not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  const o = data.industry;
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
            {o.logo ? (
              <img src={resolveMediaUrl(o.logo)} alt="" />
            ) : (
              <Building2 size={34} />
            )}
          </div>
          <div className="org-title">
            <span className="section-kicker">INDUSTRY / STARTUP</span>
            <h1>{o.name}</h1>
            <p>{o.type || "Innovation organization"}</p>
            <div className="detail-meta">
              <span>
                <MapPin size={15} />
                {o.location?.district || "Jharkhand"}
                {o.location?.city ? `, ${o.location.city}` : ""}
              </span>
              {o.website && (
                <a href={o.website} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> Website
                </a>
              )}
            </div>
          </div>
        </header>
        <div className="detail-stat-grid">
          <div>
            <Rocket size={18} />
            <strong>{list(o.productsServices).length}</strong>
            <span>Products / services</span>
          </div>
          <div>
            <FlaskConical size={18} />
            <strong>{list(o.technologyAreas).length}</strong>
            <span>Technology areas</span>
          </div>
          <div>
            <Handshake size={18} />
            <strong>{list(o.collaborationPreferences).length}</strong>
            <span>Collaboration modes</span>
          </div>
          <div>
            <CheckCircle2 size={18} />
            <strong>{o.isVerified ? "Verified" : "Profile"}</strong>
            <span>Organization status</span>
          </div>
        </div>
        <section className="detail-content-grid">
          <main className="detail-main">
            <Info title="About" text={o.about || o.description} />
            <Info
              title="Sector & products"
              items={[...list(o.sector), ...list(o.productsServices)]}
            />
            <Info
              title="Technology & expertise"
              items={[
                ...list(o.technologyAreas),
                ...list(o.skillsExpertise),
                ...list(o.capabilities),
              ]}
            />
            <Info
              title="Resources & funding"
              items={[...list(o.resources), ...list(o.fundingInterests)]}
            />
            <Info
              title="Innovation, CSR & research"
              items={[
                ...list(o.innovationAreas),
                ...list(o.csrInterests),
                ...list(o.researchCollaborationInterests),
              ]}
            />
            <Info
              title="Challenges & collaboration preferences"
              items={[
                ...list(o.problemsChallenges),
                ...list(o.collaborationPreferences),
              ]}
            />
          </main>
          <aside className="detail-side">
            <div className="detail-side-card">
              <h3>Organization details</h3>
              <p>
                <b>Type:</b> {o.type || "—"}
              </p>
              <p>
                <b>Founded:</b> {o.foundedYear || "—"}
              </p>
              <p>
                <b>Founder / CEO:</b> {o.founderCEO || "—"}
              </p>
              <p>
                <b>Email:</b> {o.email || "—"}
              </p>
              <p>
                <b>Phone:</b> {o.phone || "—"}
              </p>
              <p>
                <b>Location:</b>{" "}
                {o.location?.address || o.location?.district || "—"}
              </p>
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
