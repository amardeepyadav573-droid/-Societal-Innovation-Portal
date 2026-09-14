import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.resolve(
  __dirname,
  "../uploads/profiles"
);

fs.mkdirSync(
  uploadDirectory,
  {
    recursive: true
  }
);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(
      null,
      uploadDirectory
    );
  },

  filename: (_req, file, callback) => {
    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();

    const safeName =
      path
        .basename(
          file.originalname,
          extension
        )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        )
        .slice(0, 60);

    const filename =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}-${safeName}${extension}`;

    callback(
      null,
      filename
    );
  }
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const fileFilter = (
  _req,
  file,
  callback
) => {
  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    callback(
      null,
      true
    );
  } else {
    callback(
      new Error(
        "Only JPG, PNG and WEBP images are allowed."
      ),
      false
    );
  }
};

const profileUpload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
    files: 1
  }
});

export default profileUpload;