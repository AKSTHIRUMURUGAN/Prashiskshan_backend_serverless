/**
 * Test Firebase Admin SDK functionality
 * Run: node test-firebase-admin.js
 */

import { firebaseAdmin } from "./src/config/firebase.js";
import config from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";

const testFirebaseAdmin = async () => {
  try {
    console.log("=== Firebase Admin SDK Test ===\n");

    // Test 1: Check Firebase initialization
    console.log("Test 1: Firebase Admin initialization");
    console.log("  Project ID:", config.firebase.projectId);
    console.log("  Client Email:", config.firebase.clientEmail);
    console.log("  Private Key:", config.firebase.privateKey ? "✅ Set" : "❌ Not set");
    console.log("  Web API Key:", config.firebase.webApiKey ? "✅ Set" : "❌ Not set");
    console.log("");

    // Test 2: Try to access Firebase Auth
    console.log("Test 2: Firebase Auth access");
    try {
      const auth = firebaseAdmin.auth();
      console.log("✅ Firebase Auth instance created");
    } catch (error) {
      console.log("❌ Firebase Auth instance failed:", error.message);
      return;
    }

    // Test 3: Try to generate email verification link
    console.log("\nTest 3: Generate email verification link");
    const testEmail = "test@example.com";
    const actionCodeSettings = {
      url: `${config.app.frontendUrl}/auth/verify?uid=test123`,
      handleCodeInApp: true,
    };

    try {
      console.log("  Attempting to generate verification link...");
      const link = await firebaseAdmin.auth().generateEmailVerificationLink(testEmail, actionCodeSettings);
      console.log("✅ Verification link generated successfully!");
      console.log("  Link:", link.substring(0, 100) + "...");
    } catch (error) {
      console.log("❌ Verification link generation failed:");
      console.log("  Error:", error.message);
      console.log("  Code:", error.code);
      
      if (error.code === 'auth/user-not-found') {
        console.log("\n💡 This is expected - the test email doesn't exist in Firebase");
        console.log("   Let's try with a real user email...");
        
        // Test with a real user
        try {
          console.log("\nTest 3b: List existing users");
          const listUsersResult = await firebaseAdmin.auth().listUsers(5);
          
          if (listUsersResult.users.length > 0) {
            const realUser = listUsersResult.users[0];
            console.log(`  Found user: ${realUser.email} (${realUser.uid})`);
            
            const realActionSettings = {
              url: `${config.app.frontendUrl}/auth/verify?uid=${realUser.uid}`,
              handleCodeInApp: true,
            };
            
            const realLink = await firebaseAdmin.auth().generateEmailVerificationLink(realUser.email, realActionSettings);
            console.log("✅ Verification link generated for real user!");
            console.log("  Link:", realLink.substring(0, 100) + "...");
          } else {
            console.log("  No users found in Firebase project");
          }
        } catch (listError) {
          console.log("❌ Could not list users:", listError.message);
        }
      }
    }

    // Test 4: Try to generate password reset link
    console.log("\nTest 4: Generate password reset link");
    try {
      const resetActionSettings = {
        url: `${config.app.frontendUrl}/auth/reset-password`,
        handleCodeInApp: true,
      };
      
      const resetLink = await firebaseAdmin.auth().generatePasswordResetLink(testEmail, resetActionSettings);
      console.log("✅ Password reset link generated successfully!");
      console.log("  Link:", resetLink.substring(0, 100) + "...");
    } catch (error) {
      console.log("❌ Password reset link generation failed:");
      console.log("  Error:", error.message);
      console.log("  Code:", error.code);
    }

    // Test 5: Check project configuration
    console.log("\nTest 5: Project configuration check");
    try {
      const projectConfig = await firebaseAdmin.auth().getProjectConfig();
      console.log("✅ Project config retrieved");
      console.log("  Sign-in providers:", Object.keys(projectConfig.signInOptions || {}));
    } catch (error) {
      console.log("❌ Could not get project config:", error.message);
    }

    console.log("\n=== Test Complete ===");
    
  } catch (error) {
    console.error("\n❌ Firebase Admin test failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    console.error("\nFull error:", error);
    
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      console.error("\n⚠️  Network connectivity issue detected!");
      console.error("Cannot reach Firebase APIs");
      console.error("\nThis explains why verification emails don't work!");
      console.error("Welcome emails work because they use Brevo/Mailgun directly,");
      console.error("but verification emails need Firebase Admin SDK APIs.");
    }
  }
};

testFirebaseAdmin();