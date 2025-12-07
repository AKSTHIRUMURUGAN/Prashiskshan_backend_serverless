/**
 * Password Reset Controller
 * Handles custom password reset token verification
 */

import { firebaseAdmin } from "../config/firebase.js";
import { verifyToken as verifyCustomToken } from "../utils/emailVerification.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError } from "./helpers/context.js";
import { logger } from "../utils/logger.js";

/**
 * Verify password reset token and allow password change
 */
export const verifyPasswordResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      throw createHttpError(400, "Reset token is required");
    }
    
    try {
      const decoded = verifyCustomToken(token);
      
      if (decoded.type !== 'password_reset') {
        throw createHttpError(400, "Invalid token type");
      }
      
      logger.info("Password reset token verified", { 
        email: decoded.email, 
        uid: decoded.uid 
      });
      
      res.json(apiSuccess({ 
        email: decoded.email, 
        uid: decoded.uid,
        valid: true 
      }, "Reset token is valid"));
      
    } catch (error) {
      logger.error("Password reset token verification failed", { error: error.message });
      throw createHttpError(400, "Invalid or expired reset token");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using verified token
 */
export const resetPasswordWithToken = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      throw createHttpError(400, "Reset token and new password are required");
    }
    
    try {
      const decoded = verifyCustomToken(token);
      
      if (decoded.type !== 'password_reset') {
        throw createHttpError(400, "Invalid token type");
      }
      
      // Update password in Firebase
      await firebaseAdmin.auth().updateUser(decoded.uid, {
        password: newPassword
      });
      
      logger.info("Password reset successfully", { 
        email: decoded.email, 
        uid: decoded.uid 
      });
      
      res.json(apiSuccess({}, "Password reset successfully"));
      
    } catch (error) {
      if (error.message.includes('Invalid or expired')) {
        throw createHttpError(400, "Invalid or expired reset token");
      }
      logger.error("Password reset failed", { error: error.message });
      throw createHttpError(500, "Failed to reset password");
    }
  } catch (error) {
    next(error);
  }
};