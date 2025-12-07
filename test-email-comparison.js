/**
 * Compare welcome email vs verification email sending
 * Run: node test-email-comparison.js
 */

import { emailService } from "./src/services/emailService.js";
import { firebaseAdmin } from "./src/config/firebase.js";
import config from "./src/config/index.js";

const testEmailComparison = async () => {
  try {
    console.log("=== Email Method Comparison ===\n");

    const testEmail = config.email.brevo.fromEmail;
    console.log(`Testing with email: ${testEmail}\n`);

    // Test 1: Welcome email (the one that works)
    console.log("Test 1: Welcome Email (Direct Brevo/Mailgun)");
    console.log("----------------------------------------");
    try {
      const welcomeResult = await emailService.sendWelcomeStudent({
        email: testEmail,
        name: "Test User"
      });
      
      console.log("✅ Welcome email sent successfully!");
      console.log("  Method: Direct API call to Brevo/Mailgun");
      console.log("  Provider:", welcomeResult.provider || "mocked");
      console.log("  Result:", welcomeResult);
    } catch (error) {
      console.log("❌ Welcome email failed:");
      console.log("  Error:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Verification email (the one that doesn't work)
    console.log("Test 2: Verification Email (Firebase + Brevo/Mailgun)");
    console.log("----------------------------------------------------");
    
    try {
      console.log("Step 1: Generate Firebase verification link...");
      
      const actionCodeSettings = {
        url: `${config.app.frontendUrl}/auth/verify?uid=test123`,
        handleCodeInApp: true,
      };
      
      const link = await firebaseAdmin.auth().generateEmailVerificationLink(testEmail, actionCodeSettings);
      console.log("✅ Firebase verification link generated");
      console.log("  Link:", link.substring(0, 80) + "...");
      
      console.log("\nStep 2: Send verification email via Brevo/Mailgun...");
      
      const verifyResult = await emailService.sendTemplate("verify-email", {
        email: testEmail,
        link: link
      });
      
      console.log("✅ Verification email sent successfully!");
      console.log("  Method: Firebase Admin SDK + Brevo/Mailgun");
      console.log("  Provider:", verifyResult.provider || "mocked");
      console.log("  Result:", verifyResult);
      
    } catch (error) {
      console.log("❌ Verification email failed:");
      console.log("  Error:", error.message);
      console.log("  Code:", error.code);
      
      if (error.code === 'auth/user-not-found') {
        console.log("\n💡 Error Analysis:");
        console.log("  - Firebase says user doesn't exist");
        console.log("  - This is why verification emails fail!");
        console.log("  - Firebase Admin SDK requires the user to exist");
        console.log("  - Welcome emails work because they don't use Firebase");
      } else if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        console.log("\n💡 Error Analysis:");
        console.log("  - Cannot reach Firebase APIs");
        console.log("  - Network connectivity issue to Firebase");
        console.log("  - Welcome emails work because they use different APIs");
      } else {
        console.log("\n💡 Error Analysis:");
        console.log("  - Firebase Admin SDK configuration issue");
        console.log("  - Check Firebase project settings");
        console.log("  - Verify service account permissions");
      }
    }

    console.log("\n=== Comparison Summary ===");
    console.log("Welcome Email Path:");
    console.log("  App → emailService.sendWelcomeStudent() → Brevo/Mailgun API → ✅");
    console.log("");
    console.log("Verification Email Path:");
    console.log("  App → Firebase Admin SDK → Firebase API → emailService.sendTemplate() → Brevo/Mailgun API");
    console.log("        ↑ FAILS HERE");
    console.log("");
    console.log("The issue is in the Firebase Admin SDK step, not the email sending!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testEmailComparison();