import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listModelsRaw() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Fetching models from:", url.replace(apiKey, "HIDDEN_KEY"));

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("Error fetching models:", data);
            return;
        }

        console.log(`Found ${data.models ? data.models.length : 0} models.`);
        if (data.models) {
            const modelNames = data.models.map(m => m.name);

            console.log("\n--- Flash Models ---");
            const flashModels = modelNames.filter(n => n.toLowerCase().includes("flash"));
            flashModels.forEach(name => console.log(name));

            console.log("\n--- Pro Models ---");
            const proModels = modelNames.filter(n => n.toLowerCase().includes("pro"));
            proModels.slice(0, 10).forEach(name => console.log(name));
        } else {
            console.log("No models found in response:", data);
        }
    } catch (error) {
        console.error("Request failed:", error.message);
    }
}

listModelsRaw();
