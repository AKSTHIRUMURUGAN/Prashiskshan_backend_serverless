#!/usr/bin/env node
/**
 * Validation script for OpenAPI entity schemas
 * Validates that all core entity schemas are complete and properly defined
 */

import openapiSpec from '../src/docs/openapi.mjs';

const REQUIRED_ENTITY_SCHEMAS = [
  'Student',
  'Company',
  'Mentor',
  'Internship',
  'Application',
  'Logbook',
  'CreditRequest'
];

const REQUIRED_FIELDS = {
  Student: ['studentId', 'firebaseUid', 'email', 'profile', 'readinessScore', 'credits'],
  Company: ['companyId', 'firebaseUid', 'companyName', 'email', 'website', 'phone', 'address', 'documents', 'pointOfContact', 'status'],
  Mentor: ['mentorId', 'firebaseUid', 'email', 'profile'],
  Internship: ['internshipId', 'companyId', 'title', 'description', 'department', 'requiredSkills', 'duration', 'workMode', 'status', 'slots', 'startDate', 'applicationDeadline', 'adminReview', 'mentorApproval', 'aiTags', 'auditTrail'],
  Application: ['applicationId', 'studentId', 'internshipId', 'companyId', 'department', 'status', 'coverLetter', 'mentorApproval', 'companyFeedback', 'aiRanking'],
  Logbook: ['logbookId', 'studentId', 'internshipId', 'companyId', 'weekNumber', 'startDate', 'endDate', 'hoursWorked', 'activities', 'status', 'aiSummary', 'mentorReview'],
  CreditRequest: ['creditRequestId', 'studentId', 'internshipCompletionId', 'internshipId', 'mentorId', 'requestedCredits', 'calculatedCredits', 'internshipDurationWeeks', 'status', 'mentorReview', 'adminReview']
};

console.log('🔍 Validating OpenAPI Entity Schemas...\n');

let hasErrors = false;

// Check that all required schemas exist
console.log('✓ Checking schema existence...');
for (const schemaName of REQUIRED_ENTITY_SCHEMAS) {
  if (!openapiSpec.components.schemas[schemaName]) {
    console.error(`  ✗ Missing schema: ${schemaName}`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${schemaName} schema exists`);
  }
}

console.log('\n✓ Checking schema completeness...');
// Check that each schema has required fields
for (const [schemaName, requiredFields] of Object.entries(REQUIRED_FIELDS)) {
  const schema = openapiSpec.components.schemas[schemaName];
  if (!schema) continue;

  const schemaProperties = schema.properties || {};
  const missingFields = requiredFields.filter(field => !schemaProperties[field]);
  
  if (missingFields.length > 0) {
    console.error(`  ✗ ${schemaName} missing fields: ${missingFields.join(', ')}`);
    hasErrors = true;
  } else {
    console.log(`  ✓ ${schemaName} has all required fields (${requiredFields.length} fields)`);
  }
}

console.log('\n✓ Checking workflow fields...');
// Check specific workflow fields
const workflowChecks = [
  { schema: 'Internship', field: 'auditTrail', description: 'audit trail' },
  { schema: 'Internship', field: 'aiTags', description: 'AI tags' },
  { schema: 'Application', field: 'aiRanking', description: 'AI ranking' },
  { schema: 'Logbook', field: 'aiSummary', description: 'AI summary' },
  { schema: 'CreditRequest', field: 'mentorReview', description: 'mentor review workflow' },
  { schema: 'CreditRequest', field: 'adminReview', description: 'admin review workflow' }
];

for (const check of workflowChecks) {
  const schema = openapiSpec.components.schemas[check.schema];
  if (schema && schema.properties[check.field]) {
    console.log(`  ✓ ${check.schema} has ${check.description}`);
  } else {
    console.error(`  ✗ ${check.schema} missing ${check.description}`);
    hasErrors = true;
  }
}

console.log('\n✓ Checking nested object structures...');
// Check nested structures
const nestedChecks = [
  { schema: 'Student', path: ['profile', 'properties'], description: 'profile properties' },
  { schema: 'Student', path: ['credits', 'properties'], description: 'credits properties' },
  { schema: 'Company', path: ['documents', 'properties'], description: 'documents properties' },
  { schema: 'Company', path: ['pointOfContact', 'properties'], description: 'point of contact properties' },
  { schema: 'Mentor', path: ['profile', 'properties'], description: 'profile properties' },
  { schema: 'Internship', path: ['adminReview', 'properties'], description: 'admin review properties' },
  { schema: 'Internship', path: ['mentorApproval', 'properties'], description: 'mentor approval properties' },
  { schema: 'Internship', path: ['aiTags', 'properties'], description: 'AI tags properties' },
  { schema: 'Application', path: ['mentorApproval', 'properties'], description: 'mentor approval properties' },
  { schema: 'Application', path: ['companyFeedback', 'properties'], description: 'company feedback properties' },
  { schema: 'Application', path: ['aiRanking', 'properties'], description: 'AI ranking properties' },
  { schema: 'Logbook', path: ['aiSummary', 'properties'], description: 'AI summary properties' },
  { schema: 'Logbook', path: ['mentorReview', 'properties'], description: 'mentor review properties' },
  { schema: 'CreditRequest', path: ['mentorReview', 'properties'], description: 'mentor review properties' },
  { schema: 'CreditRequest', path: ['adminReview', 'properties'], description: 'admin review properties' }
];

for (const check of nestedChecks) {
  const schema = openapiSpec.components.schemas[check.schema];
  if (!schema) continue;

  let current = schema.properties;
  let found = true;
  
  for (const key of check.path) {
    if (!current || !current[key]) {
      found = false;
      break;
    }
    current = current[key];
  }

  if (found) {
    console.log(`  ✓ ${check.schema} has ${check.description}`);
  } else {
    console.error(`  ✗ ${check.schema} missing ${check.description}`);
    hasErrors = true;
  }
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Validation FAILED - Some schemas are incomplete');
  process.exit(1);
} else {
  console.log('✅ Validation PASSED - All entity schemas are complete!');
  console.log(`\nValidated ${REQUIRED_ENTITY_SCHEMAS.length} entity schemas with all required fields.`);
  process.exit(0);
}
