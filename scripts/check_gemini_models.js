import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testCurrentModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ ERROR: GEMINI_API_KEY not found in environment");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let testsPassed = 0;
    let testsFailed = 0;

    console.log("=".repeat(50));
    console.log("Testing Gemini API Model Availability");
    console.log("=".repeat(50));
    console.log();

    // Test gemini-2.0-flash (current model)
    console.log("Testing gemini-2.0-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello");
        const responseText = result.response.text();
        console.log("✅ SUCCESS: gemini-2.0-flash is available");
        console.log(`   Response: ${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}`);
        testsPassed++;
    } catch (error) {
        console.error("❌ FAILED: gemini-2.0-flash");
        console.error(`   Error: ${error.message}`);
        testsFailed++;
    }

    console.log();
    console.log("=".repeat(50));
    console.log("Test Summary");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log();

    if (testsFailed > 0) {
        console.error("⚠️  Some tests failed. Please check your API key and model availability.");
        process.exit(1);
    } else {
        console.log("🎉 All tests passed! Gemini API is configured correctly.");
        process.exit(0);
    }
}

testCurrentModels();
