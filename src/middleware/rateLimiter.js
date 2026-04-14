import rateLimit from "express-rate-limit";
import config from "../config/index.js";

// Helper function to properly handle IPv6 addresses
const ipKeyGenerator = (req) => {
  // Use the built-in IP extraction that handles IPv6 properly
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const generalRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: process.env.NODE_ENV === 'development' ? 10000 : config.security.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 50, // Increased from 5 to 50 for production
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.AUTH_RATE_LIMIT_DISABLED === 'true',
  message: { success: false, error: "Too many login attempts, please try again later." },
});

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many uploads, please try again later." },
});

// In-memory AI feature limit tracking
const aiLimitStore = new Map();

const featureLimitKey = (userId, feature) => `ai_limit:${feature}:${userId}:${new Date().toISOString().slice(0, 10)}`;

const secondsUntilMidnight = () => {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((reset.getTime() - now.getTime()) / 1000));
};

// Clean up expired AI limit entries periodically
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [key] of aiLimitStore) {
    if (!key.includes(today)) {
      aiLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

export const aiFeatureLimit = (feature) => async (req, res, next) => {
  const userId = req.user?.mongoId?.toString() || req.firebase?.uid;
  if (!userId) return next();

  const limits = {
    interview: config.aiLimits.interviewDaily,
    chatbot: config.aiLimits.chatbotDaily,
    summary: config.aiLimits.summaryDaily,
  };
  const limit = limits[feature];
  if (!limit) return next();

  try {
    const key = featureLimitKey(userId, feature);
    const current = (aiLimitStore.get(key) || 0) + 1;
    aiLimitStore.set(key, current);
    
    if (current > limit) {
      return res.status(429).json({
        success: false,
        error: "AI daily limit reached",
        details: {
          feature,
          limit,
          resetInSeconds: secondsUntilMidnight(),
        },
      });
    }
    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      return next(error);
    }
    return next();
  }
};

// Rate limiter specifically for reappeal submissions
// Stricter limits to prevent abuse
const reappealRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 1000 : 3, // 3 submissions per hour in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: "TooManyReappealAttempts",
    message: "Too many reappeal submission attempts. Please try again later." 
  },
});

// Rate limiter for admin bulk operations
// Prevents abuse of bulk approval/rejection endpoints
const adminBulkOperationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 1000 : 10, // 10 bulk operations per minute in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: "TooManyBulkOperations",
    message: "Too many bulk operations. Please try again later." 
  },
  // Use admin ID as key for per-admin rate limiting
  keyGenerator: (req) => {
    return req.user?.adminId || req.user?.mongoId?.toString() || ipKeyGenerator(req);
  },
});

// Rate limiter for admin analytics endpoints
// Prevents excessive analytics queries
const adminAnalyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 1000 : 30, // 30 analytics requests per minute in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: "TooManyAnalyticsRequests",
    message: "Too many analytics requests. Please try again later." 
  },
  keyGenerator: (req) => {
    return req.user?.adminId || req.user?.mongoId?.toString() || ipKeyGenerator(req);
  },
});

export { 
  generalRateLimiter, 
  authRateLimiter, 
  uploadRateLimiter, 
  reappealRateLimiter,
  adminBulkOperationRateLimiter,
  adminAnalyticsRateLimiter,
};

