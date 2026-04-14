import crypto from "crypto";

/**
 * Generates a secure random password for bulk imported users
 * Password requirements:
 * - Minimum 12 characters
 * - Contains uppercase letters
 * - Contains lowercase letters
 * - Contains numbers
 * - Contains special characters
 * 
 * @returns {string} A secure random password
 */
export function generateSecurePassword() {
  const length = 16;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  
  // Ensure at least one character from each category
  const password = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    special[crypto.randomInt(0, special.length)],
    special[crypto.randomInt(0, special.length)],
  ];
  
  // Fill remaining characters randomly from all categories
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password.push(allChars[crypto.randomInt(0, allChars.length)]);
  }
  
  // Shuffle the password array to randomize character positions
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join("");
}

/**
 * Validates if a password meets security requirements
 * 
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets all requirements
 */
export function validatePasswordStrength(password) {
  if (!password || password.length < 12) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}
