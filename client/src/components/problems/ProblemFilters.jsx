import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { DOMAINS } from "../../utils/constants";
import locationService from "../../services/locationService";
import "./ProblemFilters.css";

export default function ProblemFilters({
  search,
  setSearch,
  domain,
  setDomain,
  state,
  setState,
  district,
  setDistrict,
  status,
  setStatus,
  block,
  setBlock,
}) {
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
    setDistrict("");
    setBlock("");
    if (!state) {
      setDistricts([]);
      setBlocks([]);
      return;
    }
    locationService
      .getDistricts(state)
      .then((r) => setDistricts(r.data || []))
      .catch(() => setDistricts([]));
  }, [state]);
  useEffect(() => {
    setBlock("");
    if (!state || !district) {
      setBlocks([]);
      return;
    }
    locationService
      .getBlocks(state, district)
      .then((r) => setBlocks(r.data || []))
      .catch(() => setBlocks([]));
  }, [state, district]);

  const clearFilters = () => {
    setSearch("");
    setState("");
    setDistrict("");
    setBlock("");
    setStatus("");
  };
  return (
    <div className="filters-panel">
      <div className="search-box">
        <Search size={19} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges..."
        />
      </div>
      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">All states</option>
        {states.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        disabled={!state}
      >
        <option value="">All districts</option>
        {districts.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        value={block}
        onChange={(e) => setBlock(e.target.value)}
        disabled={!district}
      >
        <option value="">All blocks</option>
        {blocks.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select value={domain} onChange={(e) => setDomain(e.target.value)}>
        <option value="">All domains</option>
        {DOMAINS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All status</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="VALIDATED">Validated</option>
        <option value="ASSIGNED">Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Resolved</option>
      </select>
      <button className="filter-clear" onClick={clearFilters}>
        <X size={16} />
        Clear
      </button>
    </div>
  );
}
