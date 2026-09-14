import mongoose from "mongoose";
import app from "./app.js";
import env from "./config/env.js";
import { seedDefaultLocations } from "./scripts/seedDefaultLocations.js";
import configureCloudinary from "./config/cloudinary.js";

configureCloudinary();

const startServer = async () => {
  try {
    await mongoose.connect(env.mongoUri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 50,
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 5,
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
      heartbeatFrequencyMS: 10000,
    });

    console.log("MongoDB connected successfully.");
    await seedDefaultLocations();

    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(`Server listening on port ${env.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close(false);
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
