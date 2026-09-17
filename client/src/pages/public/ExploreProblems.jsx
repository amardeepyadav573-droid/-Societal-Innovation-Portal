import sipLogo from "../../assets/sip-logo.png";
import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProblemCard from "../../components/problems/ProblemCard";
import ProblemFilters from "../../components/problems/ProblemFilters";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import problemService from "../../services/problemService";
import Footer from "../../components/layout/Footer";
import "./ExploreProblems.css";

export default function ExploreProblems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [status, setStatus] = useState("");

  // Show only a few cards initially.
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    // Every time filters/search change, collapse the list again.
    setShowAll(false);

    (async () => {
      try {
        setLoading(true);

        const r = await problemService.getProblems({
          search,
          category: domain,
          state,
          district,
          block,
          status,
          limit: 50,
        });

        if (active) {
          setProblems(r.problems || []);
        }
      } catch {
        if (active) {
          setProblems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [search, domain, state, district, block, status]);

  const visibleProblems = showAll
    ? problems
    : problems.slice(0, 6);

  const hasMoreProblems = problems.length > 6;

  return (
    <div className="public-page explorer-page">
      <header className="public-navbar">
        <Link to="/" className="brand">
          <div className="brand-mark">
            <img
              src={sipLogo}
              alt="Societal Innovation Portal"
            />
          </div>

          <div className="brand-text">
            <strong>Societal Innovation</strong>
            <span>Government of Jharkhand</span>
          </div>
        </Link>

        <nav>
          <Link to="/">Home</Link>

          <Link to="/about">About</Link>

          <Link
            to="/login"
            className="btn btn-primary btn-small"
          >
            Login
          </Link>
        </nav>
      </header>

      <main className="explorer-container">
        <div className="explorer-hero">
          <div>
            <span className="section-kicker">
              PUBLIC CHALLENGE EXPLORER
            </span>

            <h1>Discover societal challenges</h1>

            <p>
              Explore validated and active community
              challenges across Jharkhand.
            </p>
          </div>

          <div className="explorer-icon">
            <Search size={28} />
          </div>
        </div>

        <div className="explorer-filters">
          <ProblemFilters
            search={search}
            setSearch={setSearch}
            domain={domain}
            setDomain={setDomain}
            state={state}
            setState={setState}
            district={district}
            setDistrict={setDistrict}
            block={block}
            setBlock={setBlock}
            status={status}
            setStatus={setStatus}
          />
        </div>

        {loading ? (
          <Loader />
        ) : !problems.length ? (
          <EmptyState
            title="No challenges found"
            description="Try changing your search or filters."
          />
        ) : (
          <>
            <div className="problem-grid">
              {visibleProblems.map((p) => (
                <ProblemCard
                  key={p._id || p.id}
                  problem={p}
                />
              ))}
            </div>

            {hasMoreProblems && (
              <div className="problems-more-wrapper">
                <button
                  type="button"
                  className="problems-more-button"
                  onClick={() => setShowAll((current) => !current)}
                  aria-label={
                    showAll
                      ? "Show fewer challenges"
                      : "Show more challenges"
                  }
                  title={
                    showAll
                      ? "Show fewer"
                      : "Show more"
                  }
                >
                  {showAll ? (
                    <X size={22} />
                  ) : (
                    <MoreHorizontal size={24} />
                  )}
                </button>
              </div>
            )}
          </>
        )}

        <div className="explorer-cta">
          <div>
            <SlidersHorizontal size={20} />

            <div>
              <strong>Want to contribute?</strong>

              <span>
                Register and submit a challenge from your
                community.
              </span>
            </div>
          </div>

          <Link
            className="btn btn-primary"
            to="/register"
          >
            Join the ecosystem
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}