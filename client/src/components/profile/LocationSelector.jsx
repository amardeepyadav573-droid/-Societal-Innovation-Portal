import { useEffect, useState } from "react";
import locationService from "../../services/locationService";
import "./LocationSelector.css";

export default function LocationSelector({
  value = {},
  onChange,
  disabled = false,
  required = true,
  showExtra = true,
}) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingStates(true);
        const response = await locationService.getStates();
        if (active) setStates(response?.data || response?.states || []);
      } catch (err) {
        if (active)
          setError(err.response?.data?.message || "Unable to load states.");
      } finally {
        if (active) setLoadingStates(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!value.state) {
      setDistricts([]);
      setBlocks([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        setLoadingDistricts(true);
        const response = await locationService.getDistricts(value.state);
        if (active) setDistricts(response?.data || response?.districts || []);
      } catch (err) {
        if (active) {
          setDistricts([]);
          setError(err.response?.data?.message || "Unable to load districts.");
        }
      } finally {
        if (active) setLoadingDistricts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [value.state]);

  useEffect(() => {
    if (!value.state || !value.district) {
      setBlocks([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        setLoadingBlocks(true);
        const response = await locationService.getBlocks(
          value.state,
          value.district,
        );
        if (active) setBlocks(response?.data || response?.blocks || []);
      } catch (err) {
        if (active) {
          setBlocks([]);
          setError(err.response?.data?.message || "Unable to load blocks.");
        }
      } finally {
        if (active) setLoadingBlocks(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [value.state, value.district]);

  const update = (field, fieldValue) => {
    setError("");
    onChange?.({ ...value, [field]: fieldValue });
  };

  const handleStateChange = (event) => {
    const state = event.target.value;
    setError("");
    onChange?.({ ...value, state, district: "", block: "" });
  };

  const handleDistrictChange = (event) => {
    setError("");
    onChange?.({ ...value, district: event.target.value, block: "" });
  };

  const names = (items) =>
    items
      .map((item) =>
        typeof item === "string"
          ? item
          : item.name || item.state || item.district || item.block,
      )
      .filter(Boolean);

  return (
    <div className="location-selector">
      <div className="location-grid">
        <div className="profile-field">
          <label>State{required && <span> *</span>}</label>
          <select
            value={value.state || ""}
            onChange={handleStateChange}
            disabled={disabled || loadingStates}
            required={required}
          >
            <option value="">
              {loadingStates ? "Loading states..." : "Select State"}
            </option>
            {names(states).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="profile-field">
          <label>District{required && <span> *</span>}</label>
          <select
            value={value.district || ""}
            onChange={handleDistrictChange}
            disabled={disabled || !value.state || loadingDistricts}
            required={required}
          >
            <option value="">
              {loadingDistricts ? "Loading districts..." : "Select District"}
            </option>
            {names(districts).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="profile-field">
          <label>Block</label>
          <select
            value={value.block || ""}
            onChange={(e) => update("block", e.target.value)}
            disabled={
              disabled || !value.state || !value.district || loadingBlocks
            }
          >
            <option value="">
              {loadingBlocks
                ? "Loading blocks..."
                : blocks.length
                  ? "Select Block"
                  : "No block data"}
            </option>
            {names(blocks).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {showExtra && (
          <>
            <div className="profile-field">
              <label>City / Town</label>
              <input
                value={value.city || value.town || ""}
                onChange={(e) => update("city", e.target.value)}
                disabled={disabled}
                placeholder="Enter city or town"
              />
            </div>
            <div className="profile-field">
              <label>Village</label>
              <input
                value={value.village || ""}
                onChange={(e) => update("village", e.target.value)}
                disabled={disabled}
                placeholder="Enter village"
              />
            </div>
            <div className="profile-field">
              <label>Pincode</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={value.pincode || ""}
                onChange={(e) =>
                  update(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                disabled={disabled}
                placeholder="6 digit pincode"
              />
            </div>
            <div className="profile-field location-full-width">
              <label>Full Address</label>
              <textarea
                rows={3}
                value={value.address || ""}
                onChange={(e) => update("address", e.target.value)}
                disabled={disabled}
                placeholder="House no., street, locality..."
              />
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="location-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
