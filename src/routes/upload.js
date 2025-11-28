
import { Router } from "express";
import multer from "multer";
import { storageService } from "../services/storageService.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError } from "../controllers/helpers/context.js";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post(
    "/",
    authenticate,
    upload.single("file"),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw createHttpError(400, "No file uploaded");
        }

        const result = await storageService.uploadFile(req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            provider: "r2", // Use R2 as requested
        });

        res.json(apiSuccess(result, "File uploaded successfully"));
    })
);

/**
 * @swagger
 * /api/upload:
 *   delete:
 *     summary: Delete a file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete(
    "/",
    authenticate,
    asyncHandler(async (req, res) => {
        const { url } = req.body;
        if (!url) throw createHttpError(400, "URL is required");

        // Extract key from URL
        // Assuming URL format: .../key
        const key = url.split("/").slice(3).join("/"); // Adjust based on URL structure
        // For R2 public URL, it might be just the last part or path after domain
        // Let's try to extract from the end
        // R2 URL: https://<custom-domain>/<key> or https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
        // Our storage service constructs it as: config.r2.publicUrl/key

        // Simple extraction: everything after the last slash is filename, but key includes date folder
        // Better: remove the publicUrl part
        // But we don't have easy access to config here without importing it.
        // Let's assume the key is the path part of the URL.

        const urlObj = new URL(url);
        const keyFromUrl = urlObj.pathname.substring(1); // Remove leading slash

        await storageService.deleteFile(keyFromUrl, "r2");

        res.json(apiSuccess(null, "File deleted successfully"));
    })
);

export default router;
