import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Rocket,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import analyticsService from "../../services/analyticsService";
import "./Analytics.css";
export default function Analytics() {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setData((await analyticsService.getDashboard())?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const o = data?.overview || {},
    impact = data?.impact || {};
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="section-kicker">GOVERNMENT ANALYTICS</span>
            <h1>Innovation intelligence</h1>
            <p>
              Real-time insights from challenges, institutions, projects and
              measurable outcomes.
            </p>
          </div>
          <button className="dashboard-refresh" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        {error && <div className="dashboard-error">{error}</div>}
        <section className="dashboard-grid-4 compact-stats-grid">
          <Metric icon={Users} label="Citizens" value={o.citizens} />
          <Metric
            icon={Building2}
            label="Universities"
            value={o.universities}
          />
          <Metric
            icon={Rocket}
            label="Industry partners"
            value={o.industries}
          />
          <Metric
            icon={BarChart3}
            label="Active projects"
            value={o.activeProjects}
          />
        </section>
        <section className="analytics-grid">
          <div className="analytics-card analytics-large">
            <div className="analytics-heading">
              <div>
                <h3>Challenge submissions</h3>
                <span>Live monthly totals</span>
              </div>
              <TrendingUp size={20} />
            </div>
            <div className="real-bar-chart">
              {(data?.monthlySubmissions || []).map((m) => (
                <div
                  className="real-bar-item"
                  key={`${m._id.year}-${m._id.month}`}
                >
                  <div
                    className="real-bar"
                    style={{
                      height: `${Math.max(8, Math.min(100, (m.count / Math.max(...(data?.monthlySubmissions || [{ count: 1 }]).map((x) => x.count))) * 100))}%`,
                    }}
                  />
                  <span>
                    {String(m._id.month).padStart(2, "0")}/
                    {String(m._id.year).slice(-2)}
                  </span>
                  <b>{m.count}</b>
                </div>
              ))}
              {!loading && !data?.monthlySubmissions?.length && (
                <p>No submission data yet.</p>
              )}
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-heading">
              <div>
                <h3>Impact generated</h3>
                <span>Across all projects</span>
              </div>
              <BarChart3 size={20} />
            </div>
            <div className="outcome-stack">
              <Metric
                icon={Users}
                label="People impacted"
                value={impact.peopleImpacted}
              />
              <Metric
                icon={Rocket}
                label="Villages covered"
                value={impact.villagesCovered}
              />
              <Metric
                icon={TrendingUp}
                label="Employment generated"
                value={impact.employmentGenerated}
              />
            </div>
          </div>
        </section>
        <section className="dashboard-grid-2">
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">DOMAINS</span>
                <h2>Challenges by domain</h2>
              </div>
            </div>
            {(data?.categoryStats || []).map((x) => (
              <div className="domain-row" key={x._id}>
                <span>{String(x._id).replaceAll("_", " ")}</span>
                <div className="domain-bar">
                  <span
                    style={{
                      width: `${Math.min(100, (x.count / Math.max(1, o.totalProblems)) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{x.count}</strong>
              </div>
            ))}
          </div>
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">OUTCOMES</span>
                <h2>Innovation outcomes</h2>
              </div>
            </div>
            <div className="outcome-grid">
              {Object.entries({
                Prototypes: data?.outcomes?.prototypes || 0,
                Patents: data?.outcomes?.patents || 0,
                Startups: data?.outcomes?.startups || 0,
                "Research papers": data?.outcomes?.researchPapers || 0,
                "Technology transfers":
                  data?.outcomes?.technologyTransfers || 0,
              }).map(([k, v]) => (
                <div key={k}>
                  <strong>{v}</strong>
                  <span>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
function Metric({ icon: Icon, label, value }) {
  return (
    <div className="mini-stat-card">
      <div className="mini-stat-icon">
        <Icon size={19} />
      </div>
      <div>
        <strong>{Number(value || 0).toLocaleString("en-IN")}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
