/**
 * Test script to verify email sending functionality
 * Run with: node test-email-verification.js
 */

import { emailService } from "./src/services/emailService.js";
import { logger } from "./src/utils/logger.js";
import config from "./src/config/index.js";

const testEmail = async () => {
  try {
    console.log("=== Email Service Test ===\n");

    // Check configuration
    console.log("Configuration Check:");
    console.log("  Brevo API Key:", config.email.brevo.apiKey ? "✅ Set" : "❌ Not set");
    console.log("  Brevo From Email:", config.email.brevo.fromEmail || "❌ Not set");
    console.log("  Mailgun API Key:", config.email.mailgun.apiKey ? "✅ Set" : "❌ Not set");
    console.log("  Mailgun Domain:", config.email.mailgun.domain || "❌ Not set");
    console.log("");

    // IMPORTANT: Use your actual email address here to receive the test email
    const testEmailAddress = config.email.brevo.fromEmail || "test@example.com";
    
    console.log(`⚠️  Test emails will be sent to: ${testEmailAddress}`);
    console.log("   Make sure this is YOUR email address to verify delivery!\n");

    // Test 1: Send a verification email
    console.log("Test 1: Sending verification email template...");
    const testLink = `${config.app.frontendUrl}/auth/verify?code=test123`;

    const result = await emailService.sendTemplate("verify-email", {
      email: testEmailAddress,
      link: testLink,
    });

    if (result.mocked) {
      console.log("⚠️  Email was MOCKED (not actually sent)");
      console.log("   No email provider is configured.");
      console.log("   Check your .env file for BREVO_API_KEY or MAILGUN_API_KEY\n");
    } else {
      console.log("✅ Verification email sent successfully!");
      console.log("   Provider used:", result.provider);
      console.log("   Check your inbox at:", testEmailAddress);
      console.log("");
    }

    // Test 2: Send a welcome email
    console.log("Test 2: Sending welcome email template...");
    const welcomeResult = await emailService.sendTemplate("welcome-student", {
      email: testEmailAddress,
      name: "Test User",
    });

    if (welcomeResult.mocked) {
      console.log("⚠️  Email was MOCKED (not actually sent)\n");
    } else {
      console.log("✅ Welcome email sent successfully!");
      console.log("   Provider used:", welcomeResult.provider);
      console.log("   Check your inbox at:", testEmailAddress);
      console.log("");
    }

    console.log("=== Test Complete ===");
    console.log("\nNext steps:");
    console.log("1. Check your email inbox at:", testEmailAddress);
    console.log("2. Check spam/junk folder if not in inbox");
    console.log("3. Check server logs for detailed error messages");
    console.log("4. Run 'node debug-email-config.js' to verify configuration\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Email test failed:");
    console.error("Error:", error.message);
    console.error("\nFull error details:");
    console.error(error);
    console.error("\nTroubleshooting:");
    console.error("1. Verify your email provider API keys in .env");
    console.error("2. Check if your email provider account is active");
    console.error("3. Verify the sender email is authorized in your provider");
    console.error("4. Check server logs for more details\n");
    process.exit(1);
  }
};

testEmail();
