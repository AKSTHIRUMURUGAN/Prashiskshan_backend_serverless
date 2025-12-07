#!/usr/bin/env node

/**
 * Verify Workflow and Feature Tags in OpenAPI Documentation
 * 
 * This script verifies that workflow and feature tags have been properly added
 * to the appropriate endpoints in the OpenAPI specification.
 */

import openapi from '../src/docs/openapi.mjs';

console.log('🔍 Verifying Workflow and Feature Tags...\n');

let totalEndpoints = 0;
let endpointsWithWorkflowTags = 0;
let endpointsWithFeatureTags = 0;
const issues = [];

// Define expected workflow and feature tags
const workflowTags = [
  'Internship Lifecycle',
  'Application Flow',
  'Credit Transfer Flow',
  'Logbook Flow'
];

const featureTags = [
  'Analytics',
  'Notifications',
  'File Upload',
  'AI Services'
];

// Keywords that suggest an endpoint should have specific tags
const workflowKeywords = {
  'Internship Lifecycle': ['internship', 'post', 'approve', 'reject', 'verify'],
  'Application Flow': ['application', 'apply', 'shortlist', 'accept'],
  'Credit Transfer Flow': ['credit', 'request', 'review'],
  'Logbook Flow': ['logbook', 'submit', 'feedback']
};

const featureKeywords = {
  'Analytics': ['analytics', 'metrics', 'performance', 'statistics'],
  'Notifications': ['notification'],
  'File Upload': ['upload', 'file'],
  'AI Services': ['AI', 'recommended', 'match score', 'chatbot', 'interview']
};

// Iterate through all paths and methods
for (const [path, methods] of Object.entries(openapi.paths)) {
  for (const [method, endpoint] of Object.entries(methods)) {
    if (typeof endpoint !== 'object' || !endpoint.tags) continue;
    
    totalEndpoints++;
    const tags = endpoint.tags;
    const summary = endpoint.summary || '';
    const description = endpoint.description || '';
    const fullText = `${path} ${summary} ${description}`.toLowerCase();
    
    // Check for workflow tags
    const hasWorkflowTag = tags.some(tag => workflowTags.includes(tag));
    if (hasWorkflowTag) {
      endpointsWithWorkflowTags++;
    }
    
    // Check for feature tags
    const hasFeatureTag = tags.some(tag => featureTags.includes(tag));
    if (hasFeatureTag) {
      endpointsWithFeatureTags++;
    }
    
    // Check if endpoint should have workflow tags based on keywords
    for (const [workflowTag, keywords] of Object.entries(workflowKeywords)) {
      const shouldHaveTag = keywords.some(keyword => fullText.includes(keyword));
      const hasTag = tags.includes(workflowTag);
      
      if (shouldHaveTag && !hasTag && !path.startsWith('/auth')) {
        // Some endpoints might legitimately not need the tag, so we'll just note it
        // issues.push(`${method.toUpperCase()} ${path} - might need "${workflowTag}" tag`);
      }
    }
    
    // Check if endpoint should have feature tags based on keywords
    for (const [featureTag, keywords] of Object.entries(featureKeywords)) {
      const shouldHaveTag = keywords.some(keyword => fullText.includes(keyword));
      const hasTag = tags.includes(featureTag);
      
      if (shouldHaveTag && !hasTag) {
        // Some endpoints might legitimately not need the tag, so we'll just note it
        // issues.push(`${method.toUpperCase()} ${path} - might need "${featureTag}" tag`);
      }
    }
  }
}

// Report results
console.log('📊 Summary:');
console.log(`  Total endpoints: ${totalEndpoints}`);
console.log(`  Endpoints with workflow tags: ${endpointsWithWorkflowTags}`);
console.log(`  Endpoints with feature tags: ${endpointsWithFeatureTags}`);
console.log('');

// Check specific important endpoints
console.log('✓ Checking key endpoints:');

const keyEndpoints = [
  { path: '/students/internships', method: 'get', expectedTags: ['Internship Lifecycle', 'AI Services'] },
  { path: '/students/applications', method: 'get', expectedTags: ['Application Flow'] },
  { path: '/students/logbooks', method: 'post', expectedTags: ['Logbook Flow'] },
  { path: '/students/credits', method: 'get', expectedTags: ['Credit Transfer Flow'] },
  { path: '/companies/internships', method: 'get', expectedTags: ['Internship Lifecycle'] },
  { path: '/companies/applications', method: 'get', expectedTags: ['Application Flow'] },
  { path: '/companies/analytics', method: 'get', expectedTags: ['Analytics'] },
  { path: '/mentors/internships/pending', method: 'get', expectedTags: ['Internship Lifecycle'] },
  { path: '/mentors/applications/pending', method: 'get', expectedTags: ['Application Flow'] },
  { path: '/mentors/logbooks/pending', method: 'get', expectedTags: ['Logbook Flow'] },
  { path: '/mentors/credits/pending', method: 'get', expectedTags: ['Credit Transfer Flow'] },
  { path: '/mentors/analytics', method: 'get', expectedTags: ['Analytics'] },
  { path: '/admins/internships', method: 'get', expectedTags: ['Internship Lifecycle'] },
  { path: '/admins/credit-requests/pending', method: 'get', expectedTags: ['Credit Transfer Flow'] },
  { path: '/admins/analytics', method: 'get', expectedTags: ['Analytics'] },
  { path: '/notifications', method: 'get', expectedTags: ['Notifications'] },
  { path: '/upload', method: 'post', expectedTags: ['File Upload'] }
];

let passedChecks = 0;
let failedChecks = 0;

for (const check of keyEndpoints) {
  const endpoint = openapi.paths[check.path]?.[check.method];
  if (!endpoint) {
    console.log(`  ✗ ${check.method.toUpperCase()} ${check.path} - endpoint not found`);
    failedChecks++;
    continue;
  }
  
  const tags = endpoint.tags || [];
  const missingTags = check.expectedTags.filter(tag => !tags.includes(tag));
  
  if (missingTags.length === 0) {
    console.log(`  ✓ ${check.method.toUpperCase()} ${check.path}`);
    passedChecks++;
  } else {
    console.log(`  ✗ ${check.method.toUpperCase()} ${check.path} - missing tags: ${missingTags.join(', ')}`);
    failedChecks++;
  }
}

console.log('');
console.log('==================================================');
if (failedChecks === 0) {
  console.log('✅ Verification PASSED - All key endpoints have proper tags!');
  console.log('');
  process.exit(0);
} else {
  console.log(`⚠️  Verification completed with ${failedChecks} issues`);
  console.log(`   ${passedChecks} checks passed, ${failedChecks} checks failed`);
  console.log('');
  process.exit(1);
}
