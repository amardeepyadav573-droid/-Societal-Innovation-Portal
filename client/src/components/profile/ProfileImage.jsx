import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Image as ImageIcon,
  Minus,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { resolveMediaUrl } from "../../utils/media";
import "./ProfileImage.css";

export default function ProfileImage({
  src,
  onChange,
  editable = true,
  size = "large",
  fallbackType = "profile",
}) {
  const [selected, setSelected] = useState(null);
  const [displaySrc, setDisplaySrc] = useState(src || "");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    setDisplaySrc(src || "");
  }, [src]);
  const inputRef = useRef(null);

  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      onChange?.({
        file: null,
        error: "Only JPG, PNG and WEBP images are allowed.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onChange?.({ file: null, error: "Image size must be 5MB or less." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelected({ file, preview: reader.result });
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const move = (axis, amount) => {
    setPosition((p) => ({
      ...p,
      [axis]: Math.max(-100, Math.min(100, p[axis] + amount)),
    }));
  };

  const crop = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const image = await loadImage(selected.preview);
      const size = 720;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";

      const scale = Math.max(size / image.width, size / image.height) * zoom;
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      const x = (size - drawW) / 2 + (position.x / 100) * size * 0.45;
      const y = (size - drawH) / 2 + (position.y / 100) * size * 0.45;
      ctx.drawImage(image, x, y, drawW, drawH);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) throw new Error("Unable to process image.");
      const file = new File(
        [blob],
        `${selected.file.name.replace(/\.[^.]+$/, "")}-cropped.jpg`,
        { type: "image/jpeg" },
      );
      const previewUrl = URL.createObjectURL(file);
      setDisplaySrc(previewUrl);
      onChange?.({ file, error: "" });
      setSelected(null);
    } catch (error) {
      onChange?.({
        file: null,
        error: error.message || "Unable to crop image.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const cancel = () => setSelected(null);
  const reset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      <div className={`profile-image profile-image-${size}`}>
        <div className="profile-image-frame">
          {displaySrc ? (
            <img
              src={resolveMediaUrl(displaySrc)}
              alt={fallbackType === "logo" ? "Organization logo" : "Profile"}
              onError={() => {
                // Fall back to the placeholder when a stored URL is stale/unreachable.
                setDisplaySrc("");
              }}
            />
          ) : (
            <ImageIcon size={38} />
          )}
          {editable && (
            <label className="profile-image-edit" title="Change image">
              <Camera size={16} />
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={chooseFile}
              />
            </label>
          )}
        </div>
        {editable && <small>JPG, PNG or WEBP · Max 5MB</small>}
      </div>

      {selected && (
        <div className="crop-overlay" role="dialog" aria-modal="true">
          <div className="crop-dialog">
            <header>
              <div>
                <span className="section-kicker">IMAGE EDITOR</span>
                <h3>Crop & position image</h3>
              </div>
              <button type="button" onClick={cancel}>
                <X size={19} />
              </button>
            </header>
            <div className="crop-workspace">
              <div className="crop-preview">
                <img
                  src={selected.preview}
                  alt="Crop preview"
                  style={{
                    transform: `translate(${position.x * 0.45}%, ${position.y * 0.45}%) scale(${zoom})`,
                  }}
                />
                <span className="crop-guide" />
              </div>
              <div className="crop-controls">
                <label>
                  Zoom <strong>{zoom.toFixed(1)}×</strong>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </label>
                <div className="move-controls">
                  <button type="button" onClick={() => move("y", -10)}>
                    <MoveUp size={16} />
                  </button>
                  <div>
                    <button type="button" onClick={() => move("x", -10)}>
                      <MoveLeft size={16} />
                    </button>
                    <button type="button" onClick={reset}>
                      <RotateCcw size={15} />
                    </button>
                    <button type="button" onClick={() => move("x", 10)}>
                      <MoveRight size={16} />
                    </button>
                  </div>
                  <button type="button" onClick={() => move("y", 10)}>
                    <MoveDown size={16} />
                  </button>
                </div>
                <div className="zoom-buttons">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
            <footer>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancel}
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={processing}
                onClick={crop}
              >
                <Check size={16} />{" "}
                {processing ? "Processing..." : "Use this image"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image."));
    image.src = src;
  });
}
