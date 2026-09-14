import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

const bucketName = "evidence";

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB is not connected.");
  return new GridFSBucket(db, { bucketName });
}

export async function storeEvidenceFile(file) {
  if (!file?.path) throw new Error("Evidence file is missing.");

  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(file.originalname || "evidence", {
    contentType: file.mimetype || "application/octet-stream",
    metadata: {
      originalName: file.originalname || "evidence",
      size: Number(file.size) || 0,
    },
  });

  const fs = await import("node:fs");
  await new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(file.path);
    readStream.on("error", reject);
    uploadStream.on("error", reject);
    uploadStream.on("finish", resolve);
    readStream.pipe(uploadStream);
  });

  return {
    id: String(uploadStream.id),
    url: `/api/problems/evidence/${uploadStream.id}`,
  };
}

export async function getEvidenceFile(fileId) {
  if (!ObjectId.isValid(fileId)) return null;
  const bucket = getBucket();
  const files = await bucket.find({ _id: new ObjectId(fileId) }).limit(1).toArray();
  return files[0] || null;
}

export async function streamEvidenceFile(fileId, res) {
  const file = await getEvidenceFile(fileId);
  if (!file) return false;

  res.setHeader("Content-Type", file.contentType || "application/octet-stream");
  res.setHeader("Content-Length", String(file.length));
  res.setHeader("Cache-Control", "public, max-age=86400");
  getBucket().openDownloadStream(file._id).on("error", () => {
    if (!res.headersSent) res.status(404).end();
  }).pipe(res);
  return true;
}

export async function deleteEvidenceFile(fileId) {
  if (!ObjectId.isValid(fileId)) return;
  try {
    await getBucket().delete(new ObjectId(fileId));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
