import { Router } from "express";
import multer from "multer";
import {
  registerStudent,
  registerCompany,
  registerMentor,
  registerAdmin,
  login,
  refreshProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  uploadResume,
  deleteAccount,
  sendPasswordResetEmail,
  sendVerificationEmail,
  verifyEmail,
} from "../controllers/authController.js";
import { studentRegistration, handleValidationErrors } from "../middleware/validation.js";
import { authenticate, identifyUser } from "../middleware/auth.js";
import { authRateLimiter, uploadRateLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * /api/auth/students/register:
 *   post:
 *     summary: Register a new student
 *     description: Create a new student account with Firebase authentication
 *     tags: [Authentication]
 */
router.post(
  "/students/register",
  studentRegistration,
  handleValidationErrors,
  asyncHandler(registerStudent),
);

/**
 * @swagger
 * /api/auth/companies/register:
 *   post:
 *     summary: Register a new company
 *     description: Create a new company account with Firebase authentication
 *     tags: [Authentication]
 */
router.post("/companies/register", asyncHandler(registerCompany));

/**
 * @swagger
 * /api/auth/mentors/register:
 *   post:
 *     summary: Register a new mentor
 *     description: Create a new mentor account with Firebase authentication
 *     tags: [Authentication]
 */
router.post("/mentors/register", asyncHandler(registerMentor));

/**
 * @swagger
 * /api/auth/admins/register:
 *   post:
 *     summary: Register a new admin
 *     description: Create a new admin account with Firebase authentication (requires super_admin in production)
 *     tags: [Authentication]
 */
router.post("/admins/register", asyncHandler(registerAdmin));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with Firebase ID token and get user profile
 *     tags: [Authentication]
 */
router.post("/login", authRateLimiter, asyncHandler(login));

/**
 * @swagger
 * /api/auth/send-password-reset:
 *   post:
 *     summary: Send password reset email
 *     description: Send a password reset link to the user's email
 *     tags: [Authentication]
 */
router.post("/send-password-reset", authRateLimiter, asyncHandler(sendPasswordResetEmail));

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Send email verification
 *     description: Send an email verification link to the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post("/verify-email", authenticate, identifyUser, asyncHandler(sendVerificationEmail));

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email
 *     description: Verify user email using the verification code from email link
 *     tags: [Authentication]
 */
router.get("/verify-email", asyncHandler(verifyEmail));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", authenticate, identifyUser, asyncHandler(refreshProfile));

/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/me", authenticate, identifyUser, asyncHandler(updateProfile));

/**
 * @swagger
 * /api/auth/password:
 *   post:
 *     summary: Change password
 *     description: Change user password (requires re-authentication)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post("/password", authenticate, authRateLimiter, asyncHandler(changePassword));

/**
 * @swagger
 * /api/auth/profile/image:
 *   post:
 *     summary: Upload profile image
 *     description: Upload a profile image for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/profile/image",
  authenticate,
  identifyUser,
  uploadRateLimiter,
  imageUpload.single("file"),
  asyncHandler(uploadProfileImage),
);

/**
 * @swagger
 * /api/auth/profile/resume:
 *   post:
 *     summary: Upload resume
 *     description: Upload a resume document (students only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/profile/resume",
  authenticate,
  identifyUser,
  uploadRateLimiter,
  documentUpload.single("file"),
  asyncHandler(uploadResume),
);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete account
 *     description: Soft delete the authenticated user's account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/account", authenticate, identifyUser, asyncHandler(deleteAccount));

export default router;