import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  cb(allowed.includes(file.mimetype) ? null : new Error("Unsupported file type."), allowed.includes(file.mimetype));
};

export default multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024, files: 8 } });
