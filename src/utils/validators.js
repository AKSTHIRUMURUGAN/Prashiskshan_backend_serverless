import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX =
  /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;
const INDIAN_PHONE_REGEX = /^\+?91[6-9]\d{9}$/;

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || "").trim().toLowerCase());

export const isValidPhone = (value) => INDIAN_PHONE_REGEX.test(String(value || "").replace(/\s+/g, ""));

export const isValidUrl = (value) => URL_REGEX.test(String(value || "").trim());

export const isISODateString = (value) => !Number.isNaN(Date.parse(value));

export const isPositiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;

export const isEnumValue = (value, enumObject) => Object.values(enumObject || {}).includes(value);

export const isValidCreditRequestStatus = (value) => {
  const validStatuses = [
    "pending_student_action",
    "pending_mentor_review",
    "mentor_approved",
    "mentor_rejected",
    "pending_admin_review",
    "admin_approved",
    "admin_rejected",
    "credits_added",
    "completed",
  ];
  return validStatuses.includes(value);
};

export const isValidReviewDecision = (value) => ["approved", "rejected"].includes(value);

export const isValidQualityCriteria = (criteria) => {
  if (!criteria || typeof criteria !== "object") return false;
  const validKeys = ["logbookComplete", "reportQuality", "learningOutcomes", "companyEvaluation"];
  return Object.keys(criteria).every((key) => validKeys.includes(key) && typeof criteria[key] === "boolean");
};

export const isValidComplianceChecks = (checks) => {
  if (!checks || typeof checks !== "object") return false;
  const validKeys = ["nepCompliant", "documentationComplete", "feesCleared", "departmentApproved"];
  return Object.keys(checks).every((key) => validKeys.includes(key) && typeof checks[key] === "boolean");
};

export const validateInternshipDuration = (weeks) => {
  if (!isPositiveNumber(weeks)) return { valid: false, error: "Duration must be a positive number" };
  if (weeks < 1) return { valid: false, error: "Duration must be at least 1 week" };
  if (weeks > 52) return { valid: false, error: "Duration cannot exceed 52 weeks" };
  return { valid: true };
};

export const validateCreditAmount = (credits) => {
  if (!isPositiveNumber(credits)) return { valid: false, error: "Credits must be a positive number" };
  if (credits < 0.5) return { valid: false, error: "Credits must be at least 0.5" };
  if (credits > 20) return { valid: false, error: "Credits cannot exceed 20" };
  return { valid: true };
};
