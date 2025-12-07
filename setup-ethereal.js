/**
 * Setup Ethereal Email for testing
 * Ethereal is a fake SMTP service for development
 * Run: node setup-ethereal.js
 */

import nodemailer from 'nodemailer';

async function setupEthereal() {
  try {
    console.log("Creating Ethereal test account...\n");
    
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log("✅ Ethereal test account created!\n");
    console.log("=== Add these to your .env file ===\n");
    console.log(`SMTP_HOST=${testAccount.smtp.host}`);
    console.log(`SMTP_PORT=${testAccount.smtp.port}`);
    console.log(`SMTP_SECURE=false`);
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASS=${testAccount.pass}`);
    console.log(`SMTP_FROM=${testAccount.user}`);
    console.log("\n=== Test Account Details ===\n");
    console.log(`Email: ${testAccount.user}`);
    console.log(`Password: ${testAccount.pass}`);
    console.log(`Web Interface: https://ethereal.email/messages`);
    console.log("\nAll emails sent will appear at: https://ethereal.email/messages");
    console.log("Login with the email and password above to see them.\n");
    
    // Test sending an email
    console.log("Testing email sending...\n");
    
    const transporter = nodemailer.createTransporter({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    const info = await transporter.sendMail({
      from: testAccount.user,
      to: testAccount.user,
      subject: "Test Email from Prashiskshan",
      text: "This is a test email to verify Ethereal setup.",
      html: "<p>This is a test email to verify Ethereal setup.</p>",
    });
    
    console.log("✅ Test email sent!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log("\nClick the preview URL above to see the email!\n");
    
  } catch (error) {
    console.error("❌ Failed to setup Ethereal:");
    console.error(error.message);
    
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      console.error("\n⚠️  Network connectivity issue detected!");
      console.error("You cannot reach ethereal.email");
      console.error("\nSolutions:");
      console.error("1. Check your internet connection");
      console.error("2. Try using a VPN");
      console.error("3. Use MailHog instead (local, no internet needed)");
      console.error("   See: backend/setup-local-email.md");
    }
  }
}

setupEthereal();
