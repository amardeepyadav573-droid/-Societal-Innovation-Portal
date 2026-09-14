import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Play,
  X,
} from "lucide-react";
import { getEvidenceType, resolveMediaUrl } from "../../utils/media";
import "./EvidenceViewer.css";

export default function EvidenceViewer({ evidence = [] }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!evidence.length) return null;

  return (
    <>
      <div className="evidence-viewer-grid">
        {evidence.map((item, index) => {
          const type = getEvidenceType(item);
          const url = resolveMediaUrl(item.url);
          return (
            <button
              type="button"
              className="evidence-tile"
              key={item._id || `${item.url}-${index}`}
              onClick={() => setActive({ item, url, type })}
            >
              <div className="evidence-tile-preview">
                {type === "IMAGE" ? (
                  <img src={url} alt={item.name || `Evidence ${index + 1}`} />
                ) : type === "VIDEO" ? (
                  <span className="evidence-video-icon">
                    <Play size={22} fill="currentColor" />
                  </span>
                ) : (
                  <FileText size={28} />
                )}
              </div>
              <span className="evidence-tile-name">
                {item.name || `Evidence ${index + 1}`}
              </span>
              <span className="evidence-tile-type">{type}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="evidence-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Evidence viewer"
          onMouseDown={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="evidence-modal-card">
            <header className="evidence-modal-header">
              <div>
                <strong>{active.item.name || "Evidence"}</strong>
                <span>{active.type}</span>
              </div>
              <div className="evidence-modal-actions">
                {active.url && (
                  <>
                    <a
                      href={active.url}
                      target="_blank"
                      rel="noreferrer"
                      className="evidence-action"
                    >
                      <ExternalLink size={16} /> Open
                    </a>
                    <a href={active.url} download className="evidence-action">
                      <Download size={16} /> Download
                    </a>
                  </>
                )}
                <button
                  type="button"
                  className="evidence-close"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="evidence-modal-content">
              {active.type === "IMAGE" ? (
                <img src={active.url} alt={active.item.name || "Evidence"} />
              ) : active.type === "VIDEO" ? (
                <video src={active.url} controls playsInline preload="metadata">
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="evidence-document">
                  <FileText size={54} />
                  <h3>{active.item.name || "Document"}</h3>
                  <p>This file is available to open or download.</p>
                  <a
                    href={active.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    <Maximize2 size={16} /> Open document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
