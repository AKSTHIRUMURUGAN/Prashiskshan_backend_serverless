import { Router } from "express";
import { firebaseAdmin } from "../config/firebase.js";
import config from "../config/index.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

const router = Router();

router.get("/firebase", async (req, res) => {
    try {
        const status = {
            initialized: !!firebaseAdmin,
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKeyValid: false,
            connectionTest: "Pending",
        };

        // Check Private Key Format
        if (config.firebase.privateKey) {
            const key = config.firebase.privateKey;
            const hasHeader = key.includes("-----BEGIN PRIVATE KEY-----");
            const hasFooter = key.includes("-----END PRIVATE KEY-----");
            const length = key.length;
            status.privateKeyValid = hasHeader && hasFooter && length > 100;
            status.privateKeyDetails = {
                hasHeader,
                hasFooter,
                length,
                preview: key.substring(0, 30) + "..." + key.substring(key.length - 20),
            };
        }

        // Test Connection
        try {
            if (firebaseAdmin) {
                // Try to list 1 user to verify credentials
                await firebaseAdmin.auth().listUsers(1);
                status.connectionTest = "Success";
            } else {
                status.connectionTest = "Failed: Admin not initialized";
            }
        } catch (connError) {
            status.connectionTest = `Failed: ${connError.message}`;
            status.errorDetails = connError;
        }

        res.json(apiSuccess(status, "Firebase Debug Status"));
    } catch (error) {
        res.status(500).json(apiError("Debug check failed", error));
    }
});

export default router;
