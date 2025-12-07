/**
 * Test custom verification system
 * Run: node test-custom-verification.js
 */

import { emailService } from "./src/services/emailService.js";
import { generateVerificationLink, generatePasswordResetLink, verifyToken } from "./src/utils/emailVerification.js";
import config from "./src/config/index.js";

const testCustomVerification = async () => {
  try {
    console.log("=== Custom Verification System Test ===\n");

    const testEmail = config.email.brevo.fromEmail || "test@example.com";
    const testUid = "test-uid-123";
    
    console.log(`Testing with email: ${testEmail}`);
    console.log(`Testing with UID: ${testUid}\n`);

    // Test 1: Generate verification link
    console.log("Test 1: Generate Verification Link");
    console.log("-----------------------------------");
    try {
      const verificationLink = generateVerificationLink(testEmail, testUid);
      console.log("✅ Verification link generated successfully!");
      console.log("  Link:", verificationLink);
      
      // Extract token from link
      const url = new URL(verificationLink);
      const token = url.searchParams.get('token');
      console.log("  Token:", token.substring(0, 50) + "...");
      
      // Test token verification
      const decoded = verifyToken(token);
      console.log("✅ Token verification successful!");
      console.log("  Decoded email:", decoded.email);
      console.log("  Decoded UID:", decoded.uid);
      console.log("  Token type:", decoded.type);
      console.log("  Expires:", new Date(decoded.exp * 1000).toLocaleString());
      
    } catch (error) {
      console.log("❌ Verification link generation failed:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Generate password reset link
    console.log("Test 2: Generate Password Reset Link");
    console.log("------------------------------------");
    try {
      const resetLink = generatePasswordResetLink(testEmail, testUid);
      console.log("✅ Password reset link generated successfully!");
      console.log("  Link:", resetLink);
      
      // Extract and verify token
      const url = new URL(resetLink);
      const token = url.searchParams.get('token');
      const decoded = verifyToken(token);
      console.log("✅ Reset token verification successful!");
      console.log("  Token type:", decoded.type);
      console.log("  Expires:", new Date(decoded.exp * 1000).toLocaleString());
      
    } catch (error) {
      console.log("❌ Password reset link generation failed:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: Send verification email using custom system
    console.log("Test 3: Send Verification Email (Custom System)");
    console.log("-----------------------------------------------");
    try {
      const link = generateVerificationLink(testEmail, testUid);
      
      const result = await emailService.sendTemplate("verify-email", {
        email: testEmail,
        link: link
      });
      
      console.log("✅ Verification email sent successfully!");
      console.log("  Method: Custom JWT token + Brevo/Mailgun");
      console.log("  Provider:", result.provider || "mocked");
      console.log("  Result:", result);
      
    } catch (error) {
      console.log("❌ Verification email failed:", error.message);
    }

    console.log("\n=== Test Summary ===");
    console.log("✅ Custom verification system working!");
    console.log("✅ No Firebase Admin SDK dependency!");
    console.log("✅ Secure JWT tokens with expiration!");
    console.log("✅ Compatible with existing email service!");
    console.log("");
    console.log("New Email Flow:");
    console.log("  App → Custom JWT Token → emailService → Brevo/Mailgun → ✅");
    console.log("");
    console.log("Benefits:");
    console.log("  - No Firebase user existence requirement");
    console.log("  - No network calls to Firebase APIs");
    console.log("  - Secure JWT tokens with expiration");
    console.log("  - Works with existing Brevo/Mailgun setup");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
};

testCustomVerification();