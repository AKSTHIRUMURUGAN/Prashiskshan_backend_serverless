import express from "express";
import { clearFirebaseUsers, clearMongoData } from "../controllers/testController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Middleware to ensure these routes only run in non-production
const ensureNonProduction = (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
            success: false,
            error: "Test endpoints are disabled in production",
        });
    }
    next();
};

router.use(ensureNonProduction);

router.delete("/firebase-users", asyncHandler(clearFirebaseUsers));
router.delete("/mongo-data", asyncHandler(clearMongoData));

export default router;
