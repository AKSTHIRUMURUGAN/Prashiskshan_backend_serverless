import mongoose from "mongoose";
import config from "./index.js";
import { logger } from "../utils/logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

mongoose.set("strictQuery", true);

// Serverless-optimized connection options
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  maxIdleTimeMS: 10000, // Close idle connections after 10s
  retryWrites: true,
  retryReads: true,
};

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected");
});

mongoose.connection.on("error", (error) => {
  logger.error("MongoDB connection error", error);
});

mongoose.connection.on("disconnected", () => {
  logger.info("MongoDB disconnected");
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async (attempt = 1) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      logger.info("MongoDB already connected, reusing connection");
      return mongoose.connection;
    }
    
    // Check if connecting
    if (mongoose.connection.readyState === 2) {
      logger.info("MongoDB connection in progress, waiting...");
      // Wait for connection to complete
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
      });
      return mongoose.connection;
    }
    
    logger.info(`Connecting to MongoDB (attempt ${attempt})...`);
    await mongoose.connect(config.mongo.uri, connectionOptions);
    logger.info("MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    logger.error(`MongoDB connection attempt ${attempt} failed`, error);
    if (attempt >= MAX_RETRIES) {
      throw error;
    }
    await sleep(RETRY_DELAY_MS * attempt);
    return connectDB(attempt + 1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, closing MongoDB connection`);
  await mongoose.connection.close();
  process.exit(0);
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.once(signal, () => {
    gracefulShutdown(signal);
  });
});

