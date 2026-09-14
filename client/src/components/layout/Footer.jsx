import {
  Mail,
  ShieldCheck,
  MapPin,
  Phone,

} from "lucide-react";

import { Link } from "react-router-dom";

import "./Footer.css";
import sipLogo from "../../assets/sip-logo.png";

/* =========================================================
   SOCIAL LINKS
   Edit these URLs directly here
========================================================= */

const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/",
  github: "https://github.com/",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  youtube: "https://www.youtube.com/"
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="si-footer">

      {/* =====================================================
          MAIN FOOTER
      ===================================================== */}

      <div className="si-footer-container">

        {/* ===================================================
            COLUMN 1 - BRAND
        =================================================== */}

        <div className="si-footer-brand">

          <Link
            to="/"
            className="si-footer-logo-link"
            aria-label="Societal Innovation Portal Home"
          >
            <div className="si-footer-logo">
              <img src={sipLogo} alt="Societal Innovation Portal" />
            </div>

            <div className="si-footer-brand-name">
              Societal Innovation
            </div>
          </Link>

          <p className="si-footer-tagline">
            AI-powered platform connecting citizens,
            universities, industry and government to solve
            real societal challenges.
          </p>

          <div className="si-footer-contact">

            <div className="si-contact-item">
              <Phone size={15} />
              <span>+91 0000000000</span>
            </div>

            <div className="si-contact-item">
              <Mail size={15} />
              <span>support@societalinnovation.in</span>
            </div>

            <div className="si-contact-item">
              <MapPin size={15} />
              <span>Jharkhand, India</span>
            </div>

          </div>

          {/* Social icons */}

          <div
            className="si-footer-socials"
            aria-label="Social media links"
          >

            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="si-social"
            >
              in
            </a>

            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="si-social"
            >
              GH
            </a>

            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="si-social"
            >
              IG
            </a>

            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="si-social"
            >
              f
            </a>

            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="si-social"
            >
              ▶
            </a>

          </div>

        </div>


        {/* ===================================================
            COLUMN 2 - PLATFORM
        =================================================== */}

        <div className="si-footer-column">

          <h3>PLATFORM</h3>

          <Link to="/">Home</Link>

          <Link to="/about">
            About Portal
          </Link>

          <Link to="/explore">
            Explore Challenges
          </Link>

          <Link to="/projects">
            Innovation Projects
          </Link>

          <Link to="/register">
            Create Account
          </Link>

          <Link to="/login">
            Login
          </Link>

        </div>


        {/* ===================================================
            COLUMN 3 - ECOSYSTEM
        =================================================== */}

        <div className="si-footer-column">

          <h3>ECOSYSTEM</h3>

          <Link to="/citizen">
            Citizens
          </Link>

          <Link to="/university">
            Universities / HEIs
          </Link>

          <Link to="/industry">
            Industry / Startups
          </Link>

          <Link to="/government">
            Government
          </Link>

          <Link to="/projects">
            Research & Innovation
          </Link>

          <Link to="/support">
            Collaboration
          </Link>

        </div>


        {/* ===================================================
            COLUMN 4 - RESOURCES
        =================================================== */}

        <div className="si-footer-column">

          <h3>RESOURCES</h3>

          <Link to="/about">
            About Us
          </Link>

          <Link to="/explore">
            Societal Challenges
          </Link>

          <Link to="/projects">
            Innovation Projects
          </Link>

          <Link to="/support">
            Help & Support
          </Link>

          <Link to="/notifications">
            Notifications
          </Link>

          <Link to="/settings">
            Account Settings
          </Link>

        </div>

      </div>


      {/* =====================================================
          FOOTER BOTTOM
      ===================================================== */}

      <div className="si-footer-bottom">

        <div className="si-footer-bottom-container">

          <div className="si-footer-copyright">
            © {currentYear} Societal Innovation Portal.
            All rights reserved.
          </div>

          <div className="si-footer-legal">

            <Link to="/about">
              About
            </Link>

            <Link to="/support">
              Support
            </Link>

            <Link to="/login">
              Login
            </Link>

            <span className="si-footer-secure">
              <ShieldCheck size={13} />
              Secure Platform
            </span>

          </div>

        </div>

      </div>

    </footer>
  );
}