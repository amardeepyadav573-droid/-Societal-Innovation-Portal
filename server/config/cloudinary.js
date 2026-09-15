import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

const configureCloudinary = () => {
  if (
    !env.cloudinary.cloudName ||
    !env.cloudinary.apiKey ||
    !env.cloudinary.apiSecret
  ) {
    console.warn("Cloudinary not configured.");
    return;
  }

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });

  console.log("Cloudinary configured.");
};

export { cloudinary };
export default configureCloudinary;