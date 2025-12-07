/**
 * Custom email verification system
 * Bypasses Firebase Admin SDK issues
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate a secure verification token
 * @param {string} email - User email
 * @param {string} uid - Firebase UID
 * @returns {string} Verification token
 */
export const generateVerificationToken = (email, uid) => {
  const payload = {
    email,
    uid,
    type: 'email_verification',
    timestamp: Date.now()
  };
  
  // Create JWT token that expires in 24 hours
  return jwt.sign(payload, config.security.jwtSecret, { 
    expiresIn: '24h',
    issuer: 'prashiskshan-api',
    audience: 'prashiskshan-users'
  });
};

/**
 * Generate a secure password reset token
 * @param {string} email - User email
 * @param {string} uid - Firebase UID
 * @returns {string} Reset token
 */
export const generatePasswordResetToken = (email, uid) => {
  const payload = {
    email,
    uid,
    type: 'password_reset',
    timestamp: Date.now()
  };
  
  // Create JWT token that expires in 1 hour
  return jwt.sign(payload, config.security.jwtSecret, { 
    expiresIn: '1h',
    issuer: 'prashiskshan-api',
    audience: 'prashiskshan-users'
  });
};

/**
 * Verify a token (verification or reset)
 * @param {string} token - Token to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.security.jwtSecret, {
      issuer: 'prashiskshan-api',
      audience: 'prashiskshan-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate verification link
 * @param {string} email - User email
 * @param {string} uid - Firebase UID
 * @returns {string} Complete verification URL
 */
export const generateVerificationLink = (email, uid) => {
  const token = generateVerificationToken(email, uid);
  return `${config.app.frontendUrl}/auth/verify-email?token=${token}`;
};

/**
 * Generate password reset link
 * @param {string} email - User email
 * @param {string} uid - Firebase UID
 * @returns {string} Complete reset URL
 */
export const generatePasswordResetLink = (email, uid) => {
  const token = generatePasswordResetToken(email, uid);
  return `${config.app.frontendUrl}/auth/reset-password?token=${token}`;
};