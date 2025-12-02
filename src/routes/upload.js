
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
        fileSize: 10 * 1024 * 1024, // 10MB limit for documents
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF and image files for document uploads
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
        }
    }
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
    // authenticate, // Allow unauthenticated uploads for registration
    upload.single("file"),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw createHttpError(400, "No file uploaded");
        }

        const provider = req.query.provider || "r2"; // Default to r2 if not specified

        const result = await storageService.uploadFile(req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            provider: provider,
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
    // authenticate, // Allow unauthenticated delete for registration cleanup
    asyncHandler(async (req, res) => {
        const { url, fileId, provider = "r2" } = req.body;

        if (provider === "imagekit") {
            if (!fileId) throw createHttpError(400, "File ID is required for ImageKit deletion");
            await storageService.deleteFile(fileId, "imagekit");
            return res.json(apiSuccess(null, "File deleted successfully"));
        }

        if (!url) throw createHttpError(400, "URL is required");

        // Extract key from URL
        // Assuming URL format: .../key
        const urlObj = new URL(url);
        const keyFromUrl = urlObj.pathname.substring(1); // Remove leading slash

        await storageService.deleteFile(keyFromUrl, provider);

        res.json(apiSuccess(null, "File deleted successfully"));
    })
);

export default router;
