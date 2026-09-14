import sipLogo from "../../assets/sip-logo.png";
import {
ArrowRight,
  Building2,
  Lightbulb,
  ShieldCheck,
  Users
} from "lucide-react";

import {
  Link
} from "react-router-dom";

import Footer from "../../components/layout/Footer";
import "./About.css";

export default function About() {
  return (
    <div className="public-page">

      <header className="public-navbar">

        <Link to="/" className="brand">
          <div className="brand-mark">
            <img src={sipLogo} alt="Societal Innovation Portal" />
          </div>

          <div className="brand-text">
            <strong>
              Societal Innovation
            </strong>

            <span>
              Government of Jharkhand
            </span>
          </div>
        </Link>

        <nav>
          <Link to="/">
            Home
          </Link>

          <Link to="/explore">
            Explore
          </Link>

          <Link
            to="/register"
            className="btn btn-primary btn-small"
          >
            Join ecosystem
          </Link>
        </nav>

      </header>

      <section className="inner-hero">

        <span className="section-kicker">
          ABOUT THE PLATFORM
        </span>

        <h1>
          Building a connected
          innovation ecosystem
          for Jharkhand.
        </h1>

        <p>
          The Societal Innovation Portal
          connects real community needs
          with academic knowledge,
          technology, industry capability
          and government coordination.
        </p>

      </section>

      <section className="section">

        <div className="about-grid">

          <div>
            <span className="section-kicker">
              THE VISION
            </span>

            <h2>
              From isolated problems
              to collaborative solutions.
            </h2>
          </div>

          <div>
            <p>
              Citizens often understand local
              challenges better than anyone.
              Universities have research expertise.
              Industries bring technology,
              funding and implementation
              capabilities.
            </p>

            <p>
              This platform brings these
              capabilities together through a
              transparent digital workflow.
            </p>
          </div>

        </div>

      </section>

      <section className="section section-soft">

        <div className="section-heading">
          <span className="section-kicker">
            CORE PRINCIPLES
          </span>

          <h2>
            Designed around impact.
          </h2>
        </div>

        <div className="principles-grid">

          <div className="principle-card">
            <Users size={28} />
            <h3>
              Community First
            </h3>
            <p>
              Real challenges begin with
              the people experiencing them.
            </p>
          </div>

          <div className="principle-card">
            <Lightbulb size={28} />
            <h3>
              Innovation Driven
            </h3>
            <p>
              Problems are transformed into
              research and innovation projects.
            </p>
          </div>

          <div className="principle-card">
            <Building2 size={28} />
            <h3>
              Collaboration
            </h3>
            <p>
              HEIs, startups, MSMEs and
              industries work together.
            </p>
          </div>

          <div className="principle-card">
            <ShieldCheck size={28} />
            <h3>
              Transparency
            </h3>
            <p>
              Every stage of the solution
              lifecycle remains trackable.
            </p>
          </div>

        </div>

      </section>

      <section className="cta-section">

        <h2>
          Have a problem that
          deserves a solution?
        </h2>

        <p>
          Submit it to the innovation
          ecosystem.
        </p>

        <Link
          to="/register"
          className="btn btn-primary btn-large"
        >
          Get started
          <ArrowRight size={18} />
        </Link>

      </section>

      <Footer />

    </div>
  );
}
