import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import "./MultiSelectField.css";

export default function MultiSelectField({
  label,
  value = [],
  options = [],
  onChange,
  disabled = false,
  placeholder = "Select options",
}) {
  const [open, setOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const selected = Array.isArray(value) ? value : [];
  const labels = useMemo(
    () => new Set(options.map((o) => (typeof o === "string" ? o : o.label))),
    [options],
  );

  const update = (next) => onChange?.([...new Set(next.filter(Boolean))]);
  const addOther = () => {
    const item = otherText.trim();
    if (!item || selected.includes(item)) return;
    update([...selected, item]);
    setOtherText("");
  };

  return (
    <div className="profile-field multi-select-field">
      <label>{label}</label>
      <div
        className={`multi-select ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
      >
        <button
          type="button"
          className="multi-select-trigger"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
        >
          <span>
            {selected.length ? `${selected.length} selected` : placeholder}
          </span>
          <ChevronDown size={17} />
        </button>
        {selected.length > 0 && (
          <div className="selected-chips">
            {selected.map((item) => (
              <span className="selected-chip" key={item}>
                {item}
                <button
                  type="button"
                  onClick={() => update(selected.filter((v) => v !== item))}
                  aria-label={`Remove ${item}`}
                  disabled={disabled}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
        {open && !disabled && (
          <div className="multi-select-menu">
            {options.map((option) => {
              const item = typeof option === "string" ? option : option.label;
              const checked = selected.includes(item);
              return (
                <button
                  type="button"
                  className={`multi-select-option ${checked ? "selected" : ""}`}
                  key={item}
                  onClick={() =>
                    update(
                      checked
                        ? selected.filter((v) => v !== item)
                        : [...selected, item],
                    )
                  }
                >
                  <span>{item}</span>
                  {checked && <Check size={15} />}
                </button>
              );
            })}
            <div className="multi-other">
              <span className="multi-other-label">Other</span>
              <div>
                <input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOther();
                    }
                  }}
                  placeholder="Enter custom option"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={addOther}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {!open && selected.some((v) => !labels.has(v)) && (
        <small className="field-hint">
          Custom options are included in your saved profile.
        </small>
      )}
    </div>
  );
}
