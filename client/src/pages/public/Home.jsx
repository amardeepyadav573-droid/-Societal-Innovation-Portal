import sipLogo from "../../assets/sip-logo.png";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Lightbulb,
  MapPinned,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import dashboardService from "../../services/dashboardService";

import Footer from "../../components/layout/Footer";
import "./Home.css";
export default function Home() {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        setStatsError("");
        const response = await dashboardService.getPublicStatistics();
        if (active) setStats(response?.data || response || null);
      } catch (error) {
        if (active) {
          setStatsError(
            error?.response?.data?.message ||
            "Live statistics are temporarily unavailable.",
          );
        }
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const format = (value) => Number(value || 0).toLocaleString("en-IN");
  const statItems = [
    ["Total Challenges", stats?.totalChallenges],
    ["Under Review", stats?.underReview],
    ["Active Projects", stats?.activeProjects],
    ["Resolved Challenges", stats?.resolvedChallenges],
    ["Registered Citizens", stats?.citizens],
    ["Participating Universities", stats?.universities],
    ["Industry Partners", stats?.industries],
    ["People Impacted", stats?.peopleImpacted],
  ];
  return (
    <div className="public-page">
      <header className="public-navbar">
        <Link to="/" className="brand">
          <div className="brand-mark"><img src={sipLogo} alt="Societal Innovation Portal" /></div>

          <div className="brand-text">
            <strong>Societal Innovation</strong>

            <span>Government of Jharkhand</span>
          </div>
        </Link>

        <nav>
          <Link to="/explore">Explore Challenges</Link>

          <Link to="/about">About</Link>

          <Link to="/login" className="btn btn-primary btn-small">
            Login
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Government of Jharkhand
          </div>
          <h1>
            Turning
            <span>societal challenges</span>
            into real-world innovation.
          </h1>

          <p>
            A technology-enabled ecosystem connecting citizens, universities,
            researchers, industries and government to build practical solutions
            for Jharkhand .
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Submit a Challenge
              <ArrowRight size={18} />
            </Link>

            <Link to="/explore" className="btn btn-secondary btn-large">
              Explore Challenges
            </Link>
          </div>

          <div className="hero-trust">
            <span>
              <CheckCircle2 size={17} />
              Transparent workflow
            </span>

            <span>
              <CheckCircle2 size={17} />
              AI-assisted routing
            </span>

            <span>
              <CheckCircle2 size={17} />
              Impact tracking
            </span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="innovation-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />

            <div className="orbit-center">
              <Lightbulb size={42} />
              <span>INNOVATION</span>
            </div>

            <div className="orbit-node node-one">
              <Users size={21} />
            </div>

            <div className="orbit-node node-two">
              <Building2 size={21} />
            </div>

            <div className="orbit-node node-three">
              <Rocket size={21} />
            </div>
          </div>
        </div>
      </section>

      <section
        className="stats-strip live-stats-strip"
        aria-label="Live platform statistics"
      >
        {statItems.map(([label, value]) => (
          <div className="live-stat" key={label}>
            <strong>{stats ? format(value) : "—"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      {statsError && (
        <div className="live-stats-message" role="status">
          {statsError} <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <section className="section">
        <div className="section-heading">
          <span className="section-kicker">HOW IT WORKS</span>

          <h2>From local problem to measurable impact.</h2>

          <p>
            The portal creates a structured journey from citizen reporting to
            institutional innovation and real-world implementation.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <span>01</span>
            <MapPinned size={26} />
            <h3>Identify</h3>
            <p>
              Citizens and communities submit challenges with evidence and
              location.
            </p>
          </div>

          <div className="workflow-card">
            <span>02</span>
            <ShieldCheck size={26} />
            <h3>Validate</h3>
            <p>Challenges are reviewed, categorized and prioritized.</p>
          </div>

          <div className="workflow-card">
            <span>03</span>
            <Lightbulb size={26} />
            <h3>Innovate</h3>
            <p>Universities form multidisciplinary teams.</p>
          </div>

          <div className="workflow-card">
            <span>04</span>
            <Rocket size={26} />
            <h3>Deploy</h3>
            <p>Industry partners help prototype and implement.</p>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="section-heading">
          <span className="section-kicker">ONE ECOSYSTEM</span>

          <h2>Everyone has a role in solving the problem.</h2>
        </div>

        <div className="stakeholder-grid">
          <div className="stakeholder-card">
            <Users size={28} />
            <h3>Citizens</h3>
            <p>Identify and document challenges from the ground.</p>
          </div>

          <div className="stakeholder-card">
            <Building2 size={28} />
            <h3>Universities</h3>
            <p>Transform challenges into research and innovation.</p>
          </div>

          <div className="stakeholder-card">
            <Rocket size={28} />
            <h3>Industry</h3>
            <p>Mentor, fund, prototype and deploy solutions.</p>
          </div>

          <div className="stakeholder-card">
            <Globe2 size={28} />
            <h3>Government</h3>
            <p>Monitor outcomes and coordinate systemic impact.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
