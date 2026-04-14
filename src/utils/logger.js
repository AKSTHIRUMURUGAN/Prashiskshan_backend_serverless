import winston from "winston";
import config from "../config/index.js";

const { combine, timestamp, errors, json, splat, colorize, printf } = winston.format;

const LOG_LEVEL = config.app.env === "production" ? "info" : "debug";

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaString = Object.keys(meta || {}).length ? ` ${JSON.stringify(meta)}` : "";
  const logMessage = stack || message;
  return `${ts} [${level}] ${logMessage}${metaString}`;
});

// In serverless environments, only use console transport
// File system is read-only in Vercel/Lambda
const transports = [
  new winston.transports.Console({
    level: LOG_LEVEL,
    handleExceptions: true,
    format: combine(
      colorize(),
      timestamp(),
      splat(),
      consoleFormat
    ),
  }),
];

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    json()
  ),
  transports,
  exitOnError: false,
});

export const createChildLogger = (defaultMeta = {}) => logger.child(defaultMeta);

export const logRequestError = (error, req) => {
  logger.error(error, {
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: req.user?.firebaseUid || "anonymous",
    },
  });
};
