import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in environment");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // For some reason listModels is not directly on genAI instance in some versions, 
    // but let's try the model manager if available or just try to instantiate a model.
    // Actually, the SDK doesn't have a listModels method on the main class easily accessible in all versions.
    // We can try to just run a simple generation with 'gemini-1.5-flash' and see if it works.

    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash Success:", result.response.text());
    } catch (error) {
        console.error("gemini-1.5-flash Failed:", error.message);
    }

    console.log("Testing gemini-1.5-flash-001...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash-001 Success:", result.response.text());
    } catch (error) {
        console.error("gemini-1.5-flash-001 Failed:", error.message);
    }

    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro Success:", result.response.text());
    } catch (error) {
        console.error("gemini-pro Failed:", error.message);
    }
}

listModels();
