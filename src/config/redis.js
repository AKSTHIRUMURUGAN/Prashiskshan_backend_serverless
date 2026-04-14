import Redis from "ioredis";
import config from "./index.js";
import { logger } from "../utils/logger.js";

// Singleton pattern for serverless - reuse connection across invocations
let redisClient = null;

const createRedisClient = () => {
  if (redisClient && redisClient.status === 'ready') {
    logger.info("Reusing existing Redis connection");
    return redisClient;
  }

  logger.info("Creating new Redis connection");
  
  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false, // Connect immediately
    retryStrategy(times) {
      if (times > 3) {
        logger.error(`Redis connection failed after ${times} attempts`);
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 1000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      return false;
    },
  });

  redisClient.on("connect", () => logger.info("Redis connected"));
  redisClient.on("ready", () => logger.info("Redis ready"));
  redisClient.on("error", (error) => {
    logger.error("Redis error", { message: error.message, code: error.code });
    // Don't crash on connection errors
    if (error.message.includes('max number of clients reached')) {
      logger.error("Redis max clients reached - connection pool exhausted");
    }
  });
  redisClient.on("close", () => logger.warn("Redis connection closed"));
  redisClient.on("reconnecting", () => logger.info("Redis reconnecting"));
  redisClient.on("end", () => logger.warn("Redis connection ended"));

  return redisClient;
};

// Initialize client
const client = createRedisClient();

// Helper functions with error handling
export const get = async (key) => {
  try {
    return await client.get(key);
  } catch (error) {
    logger.error("Redis GET error", { key, error: error.message });
    throw error;
  }
};

export const set = async (key, value, expirationInSeconds) => {
  try {
    if (expirationInSeconds) {
      await client.set(key, value, "EX", expirationInSeconds);
      return;
    }
    await client.set(key, value);
  } catch (error) {
    logger.error("Redis SET error", { key, error: error.message });
    throw error;
  }
};

export const setex = async (key, seconds, value) => {
  try {
    return await client.setex(key, seconds, value);
  } catch (error) {
    logger.error("Redis SETEX error", { key, error: error.message });
    throw error;
  }
};

export const del = async (key) => {
  try {
    return await client.del(key);
  } catch (error) {
    logger.error("Redis DEL error", { key, error: error.message });
    throw error;
  }
};

export const exists = async (key) => {
  try {
    return await client.exists(key);
  } catch (error) {
    logger.error("Redis EXISTS error", { key, error: error.message });
    throw error;
  }
};

export const hset = async (key, field, value) => {
  try {
    return await client.hset(key, field, value);
  } catch (error) {
    logger.error("Redis HSET error", { key, field, error: error.message });
    throw error;
  }
};

export const hget = async (key, field) => {
  try {
    return await client.hget(key, field);
  } catch (error) {
    logger.error("Redis HGET error", { key, field, error: error.message });
    throw error;
  }
};

export const hincrby = async (key, field, increment) => {
  try {
    return await client.hincrby(key, field, increment);
  } catch (error) {
    logger.error("Redis HINCRBY error", { key, field, error: error.message });
    throw error;
  }
};

// Graceful shutdown
export const closeRedisConnection = async () => {
  if (redisClient) {
    logger.info("Closing Redis connection");
    await redisClient.quit();
    redisClient = null;
  }
};

export default client;

