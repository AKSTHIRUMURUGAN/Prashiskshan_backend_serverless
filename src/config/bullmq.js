import Redis from "ioredis";
import config from "./index.js";
import { logger } from "../utils/logger.js";

// Singleton pattern for serverless - reuse connection across invocations
let bullConnection = null;

const createBullConnection = () => {
  if (bullConnection && bullConnection.status === 'ready') {
    logger.info("Reusing existing BullMQ Redis connection");
    return bullConnection;
  }

  logger.info("Creating new BullMQ Redis connection");
  
  bullConnection = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null, // BullMQ requirement
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 3) {
        logger.error(`BullMQ Redis connection failed after ${times} attempts`);
        return null;
      }
      const delay = Math.min(times * 200, 1000);
      logger.warn(`BullMQ Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
  });

  bullConnection.on("ready", () => logger.info("BullMQ Redis ready"));
  bullConnection.on("connect", () => logger.info("BullMQ Redis connected"));
  bullConnection.on("error", (error) => {
    logger.error("BullMQ Redis error", { message: error.message, code: error.code });
    if (error.message.includes('max number of clients reached')) {
      logger.error("BullMQ Redis max clients reached - connection pool exhausted");
    }
  });
  bullConnection.on("close", () => logger.warn("BullMQ Redis connection closed"));
  bullConnection.on("reconnecting", () => logger.info("BullMQ Redis reconnecting"));

  return bullConnection;
};

// Initialize connection
const connection = createBullConnection();

// Graceful shutdown
export const closeBullConnection = async () => {
  if (bullConnection) {
    logger.info("Closing BullMQ Redis connection");
    await bullConnection.quit();
    bullConnection = null;
  }
};

export default connection;

