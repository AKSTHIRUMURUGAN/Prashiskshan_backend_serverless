/**
 * Debug script to check email configuration
 * Run with: node debug-email-config.js
 */

import config from "./src/config/index.js";

console.log("=== Email Configuration Debug ===\n");

console.log("Brevo Configuration:");
console.log("  API Key:", config.email.brevo.apiKey ? "✅ Set" : "❌ Not set");
console.log("  From Email:", config.email.brevo.fromEmail || "❌ Not set");
console.log("  From Name:", config.email.brevo.fromName || "❌ Not set");
console.log("  Enabled:", Boolean(config.email.brevo.apiKey) ? "✅ Yes" : "❌ No");

console.log("\nMailgun Configuration:");
console.log("  API Key:", config.email.mailgun.apiKey ? "✅ Set" : "❌ Not set");
console.log("  Domain:", config.email.mailgun.domain || "❌ Not set");
console.log("  From Email:", config.email.mailgun.fromEmail || "❌ Not set");

console.log("\nFirebase Configuration:");
console.log("  Project ID:", config.firebase.projectId || "❌ Not set");
console.log("  Web API Key:", config.firebase.webApiKey ? "✅ Set" : "❌ Not set");
console.log("  Client Email:", config.firebase.clientEmail || "❌ Not set");

console.log("\nApp Configuration:");
console.log("  Environment:", config.app.env);
console.log("  Frontend URL:", config.app.frontendUrl);
console.log("  API URL:", config.app.apiUrl);

console.log("\n=== Configuration Check Complete ===");
