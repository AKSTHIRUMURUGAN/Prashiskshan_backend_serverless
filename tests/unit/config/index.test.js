import { jest } from "@jest/globals";

describe("Configuration Module", () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear module cache to allow fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("Example 1: Flash model uses gemini-2.0-flash", () => {
    it("should load gemini-2.0-flash as the flash model identifier when environment variables are properly set", async () => {
      // Set up environment with gemini-2.0-flash
      process.env.GEMINI_MODEL_FLASH = "gemini-2.0-flash";
      process.env.GEMINI_API_KEY = "test-api-key";
      
      // Set all other required environment variables to prevent validation errors
      process.env.NODE_ENV = "test";
      process.env.PORT = "5000";
      process.env.API_URL = "http://localhost:5000";
      process.env.FRONTEND_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/test";
      process.env.FIREBASE_PROJECT_ID = "test-project";
      process.env.FIREBASE_PRIVATE_KEY = "test-key";
      process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
      process.env.AWS_REGION = "us-east-1";
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
      process.env.S3_BUCKET = "test-bucket";
      process.env.IMAGEKIT_PUBLIC_KEY = "test-public";
      process.env.IMAGEKIT_PRIVATE_KEY = "test-private";
      process.env.IMAGEKIT_URL_ENDPOINT = "https://test.imagekit.io";
      process.env.TWILIO_ACCOUNT_SID = "test-sid";
      process.env.TWILIO_AUTH_TOKEN = "test-token";
      process.env.TWILIO_PHONE_NUMBER = "+1234567890";
      process.env.TWILIO_WHATSAPP_NUMBER = "+1234567890";
      process.env.SENTRY_DSN = "https://test@sentry.io/123";
      process.env.JWT_SECRET = "test-secret";
      process.env.RATE_LIMIT_WINDOW_MS = "900000";
      process.env.RATE_LIMIT_MAX_REQUESTS = "100";
      process.env.AI_INTERVIEW_DAILY_LIMIT = "20";
      process.env.AI_CHATBOT_DAILY_LIMIT = "50";
      process.env.AI_SUMMARY_DAILY_LIMIT = "10";
      process.env.R2_ACCOUNT_ID = "test-account";
      process.env.R2_ACCESS_KEY_ID = "test-key";
      process.env.R2_SECRET_ACCESS_KEY = "test-secret";
      process.env.R2_BUCKET = "test-bucket";
      process.env.R2_PUBLIC_URL = "https://test.r2.dev";

      // Dynamically import the config module
      const { default: config } = await import("../../../src/config/index.js");

      // Verify that the flash model is set to gemini-2.0-flash
      expect(config.gemini.flashModel).toBe("gemini-2.0-flash");
    });

    it("should maintain all specialized model properties in config.gemini object", async () => {
      // Set up environment with various model configurations
      process.env.GEMINI_MODEL_FLASH = "gemini-2.0-flash";
      process.env.GEMINI_MODEL_FLASH_LITE = "gemini-2.0-flash-lite";
      process.env.GEMINI_MODEL_FLASH_2_5 = "gemini-2.5-flash";
      process.env.GEMINI_MODEL_FLASH_2_0_LITE = "gemini-2.0-flash-lite";
      process.env.GEMINI_MODEL_FLASH_2_5_IMAGE = "gemini-2.5-flash-image";
      process.env.GEMINI_MODEL_FLASH_NATIVE_AUDIO = "gemini-flash-native-audio";
      process.env.GEMINI_MODEL_PRO = "gemini-2.0-pro";
      process.env.GEMINI_MODEL_PRO_IMAGE = "gemini-pro-image";
      process.env.GEMINI_MODEL_PRO_2_5 = "gemini-2.5-pro";
      process.env.GEMINI_IMAGE_FLASH = "gemini-image-flash";
      process.env.GEMINI_IMAGE_PRO = "gemini-image-pro";
      process.env.GEMINI_VIDEO_MODEL = "gemini-video";
      process.env.GEMINI_TTS_PRO = "gemini-tts-pro";
      process.env.GEMINI_TTS_FLASH = "gemini-tts-flash";
      process.env.GEMINI_AUDIO_NATIVE = "gemini-audio-native";
      process.env.GEMINI_API_KEY = "test-api-key";
      
      // Set all other required environment variables
      process.env.NODE_ENV = "test";
      process.env.PORT = "5000";
      process.env.API_URL = "http://localhost:5000";
      process.env.FRONTEND_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/test";
      process.env.FIREBASE_PROJECT_ID = "test-project";
      process.env.FIREBASE_PRIVATE_KEY = "test-key";
      process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
      process.env.AWS_REGION = "us-east-1";
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
      process.env.S3_BUCKET = "test-bucket";
      process.env.IMAGEKIT_PUBLIC_KEY = "test-public";
      process.env.IMAGEKIT_PRIVATE_KEY = "test-private";
      process.env.IMAGEKIT_URL_ENDPOINT = "https://test.imagekit.io";
      process.env.TWILIO_ACCOUNT_SID = "test-sid";
      process.env.TWILIO_AUTH_TOKEN = "test-token";
      process.env.TWILIO_PHONE_NUMBER = "+1234567890";
      process.env.TWILIO_WHATSAPP_NUMBER = "+1234567890";
      process.env.SENTRY_DSN = "https://test@sentry.io/123";
      process.env.JWT_SECRET = "test-secret";
      process.env.RATE_LIMIT_WINDOW_MS = "900000";
      process.env.RATE_LIMIT_MAX_REQUESTS = "100";
      process.env.AI_INTERVIEW_DAILY_LIMIT = "20";
      process.env.AI_CHATBOT_DAILY_LIMIT = "50";
      process.env.AI_SUMMARY_DAILY_LIMIT = "10";
      process.env.R2_ACCOUNT_ID = "test-account";
      process.env.R2_ACCESS_KEY_ID = "test-key";
      process.env.R2_SECRET_ACCESS_KEY = "test-secret";
      process.env.R2_BUCKET = "test-bucket";
      process.env.R2_PUBLIC_URL = "https://test.r2.dev";

      // Dynamically import the config module
      const { default: config } = await import("../../../src/config/index.js");

      // Verify all specialized model properties are maintained
      expect(config.gemini).toHaveProperty("flashModel");
      expect(config.gemini).toHaveProperty("flashLiteModel");
      expect(config.gemini).toHaveProperty("flash25Model");
      expect(config.gemini).toHaveProperty("flash20LiteModel");
      expect(config.gemini).toHaveProperty("flash25ImageModel");
      expect(config.gemini).toHaveProperty("flashNativeAudioModel");
      expect(config.gemini).toHaveProperty("proModel");
      expect(config.gemini).toHaveProperty("proImageModel");
      expect(config.gemini).toHaveProperty("pro25Model");
      expect(config.gemini).toHaveProperty("imageFlashModel");
      expect(config.gemini).toHaveProperty("imageProModel");
      expect(config.gemini).toHaveProperty("videoModel");
      expect(config.gemini).toHaveProperty("ttsProModel");
      expect(config.gemini).toHaveProperty("ttsFlashModel");
      expect(config.gemini).toHaveProperty("audioNativeModel");
      expect(config.gemini).toHaveProperty("maxOutputTokens");

      // Verify the values are correctly loaded
      expect(config.gemini.flashModel).toBe("gemini-2.0-flash");
      expect(config.gemini.flashLiteModel).toBe("gemini-2.0-flash-lite");
      expect(config.gemini.flash25Model).toBe("gemini-2.5-flash");
      expect(config.gemini.videoModel).toBe("gemini-video");
      expect(config.gemini.audioNativeModel).toBe("gemini-audio-native");
    });
  });
});
