import sipLogo from "../../assets/sip-logo.png";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import ProblemCard from "../../components/problems/ProblemCard";
import ProblemFilters from "../../components/problems/ProblemFilters";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import problemService from "../../services/problemService";
import Footer from "../../components/layout/Footer";
import "./ExploreProblems.css";
export default function ExploreProblems() {
  const [problems, setProblems] = useState([]),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [domain, setDomain] = useState(""),
    [state, setState] = useState(""),
    [district, setDistrict] = useState(""),
    [block, setBlock] = useState(""),
    [status, setStatus] = useState("");
  useEffect(() => {
    let active = true;
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
        if (active) setProblems(r.problems || []);
      } catch {
        if (active) setProblems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search, domain, state, district, block, status]);
  return (
    <div className="public-page explorer-page">
      <header className="public-navbar">
        <Link to="/" className="brand">
          <div className="brand-mark"><img src={sipLogo} alt="Societal Innovation Portal" /></div>
          <div className="brand-text">
            <strong>Societal Innovation</strong>
            <span>Government of Jharkhand</span>
          </div>
        </Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/login" className="btn btn-primary btn-small">
            Login
          </Link>
        </nav>
      </header>
      <main className="explorer-container">
        <div className="explorer-hero">
          <div>
            <span className="section-kicker">PUBLIC CHALLENGE EXPLORER</span>
            <h1>Discover societal challenges</h1>
            <p>
              Explore validated and active community challenges across Jharkhand.
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
          <div className="problem-grid">
            {problems.map((p) => (
              <ProblemCard key={p._id || p.id} problem={p} />
            ))}
          </div>
        )}
        <div className="explorer-cta">
          <div>
            <SlidersHorizontal size={20} />
            <div>
              <strong>Want to contribute?</strong>
              <span>Register and submit a challenge from your community.</span>
            </div>
          </div>
          <Link className="btn btn-primary" to="/register">
            Join the ecosystem
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
