import Internship from "../src/models/Internship.js";
import Application from "../src/models/Application.js";
import AnalyticsSnapshot from "../src/models/AnalyticsSnapshot.js";

console.log("=== Verifying Schema Updates ===\n");

// Verify Internship Model
console.log("1. Internship Model:");
const internshipSchema = Internship.schema;
const internshipPaths = internshipSchema.paths;

const requiredFields = [
  "internshipId",
  "companyId",
  "title",
  "description",
  "department",
  "requiredSkills",
  "duration",
  "workMode",
  "startDate",
  "applicationDeadline",
  "slots",
  "slotsRemaining",
  "status",
  "adminReview",
  "mentorApproval",
  "aiTags",
  "auditTrail",
  "postedBy"
];

console.log("   Checking required fields:");
requiredFields.forEach(field => {
  const exists = internshipPaths[field] !== undefined;
  console.log(`   ${exists ? "✓" : "✗"} ${field}`);
});

console.log("\n   Status enum values:");
const statusEnum = internshipPaths.status.enumValues;
console.log(`   ${statusEnum.join(", ")}`);

console.log("\n   Indexes:");
const internshipIndexes = internshipSchema.indexes();
internshipIndexes.forEach((index, i) => {
  console.log(`   ${i + 1}. ${JSON.stringify(index[0])}`);
});

// Verify Application Model
console.log("\n2. Application Model:");
const applicationSchema = Application.schema;
console.log("   Indexes:");
const applicationIndexes = applicationSchema.indexes();
applicationIndexes.forEach((index, i) => {
  console.log(`   ${i + 1}. ${JSON.stringify(index[0])}`);
});

// Verify AnalyticsSnapshot Model
console.log("\n3. AnalyticsSnapshot Model:");
const analyticsSchema = AnalyticsSnapshot.schema;
const analyticsPaths = analyticsSchema.paths;

const analyticsFields = [
  "snapshotId",
  "entityType",
  "entityId",
  "period",
  "date",
  "metrics"
];

console.log("   Checking required fields:");
analyticsFields.forEach(field => {
  const exists = analyticsPaths[field] !== undefined;
  console.log(`   ${exists ? "✓" : "✗"} ${field}`);
});

console.log("\n   Indexes:");
const analyticsIndexes = analyticsSchema.indexes();
analyticsIndexes.forEach((index, i) => {
  console.log(`   ${i + 1}. ${JSON.stringify(index[0])}`);
});

console.log("\n✅ Schema verification complete!");
