import openapi from '../src/docs/openapi.mjs';

console.log('🔍 Verifying Task 9 Endpoints Documentation...\n');

const requiredEndpoints = {
  'Notification Endpoints': [
    '/notifications',
    '/notifications/{id}/read',
    '/notifications/read-all'
  ],
  'File Upload Endpoints': [
    '/upload'
  ],
  'Metrics Endpoints': [
    '/metrics',
    '/metrics/summary',
    '/metrics/health',
    '/metrics/reset'
  ]
};

let allPassed = true;

// Check if endpoints exist
for (const [category, endpoints] of Object.entries(requiredEndpoints)) {
  console.log(`\n📋 ${category}:`);
  
  for (const endpoint of endpoints) {
    const exists = openapi.paths[endpoint] !== undefined;
    const icon = exists ? '✓' : '✗';
    console.log(`  ${icon} ${endpoint}`);
    
    if (!exists) {
      allPassed = false;
      continue;
    }
    
    // Check methods
    const path = openapi.paths[endpoint];
    const methods = Object.keys(path).filter(k => ['get', 'post', 'put', 'patch', 'delete'].includes(k));
    
    for (const method of methods) {
      const operation = path[method];
      
      // Check required fields
      const hasDescription = operation.description !== undefined;
      const hasTags = operation.tags !== undefined && operation.tags.length > 0;
      const hasResponses = operation.responses !== undefined;
      const hasExamples = JSON.stringify(operation).includes('example');
      
      console.log(`    ${method.toUpperCase()}:`);
      console.log(`      ${hasDescription ? '✓' : '✗'} Has description`);
      console.log(`      ${hasTags ? '✓' : '✗'} Has tags: ${hasTags ? operation.tags.join(', ') : 'none'}`);
      console.log(`      ${hasResponses ? '✓' : '✗'} Has responses`);
      console.log(`      ${hasExamples ? '✓' : '✗'} Has examples`);
      
      if (!hasDescription || !hasTags || !hasResponses || !hasExamples) {
        allPassed = false;
      }
    }
  }
}

// Check Notification schema
console.log('\n\n📋 Schema Verification:');
const hasNotificationSchema = openapi.components.schemas.Notification !== undefined;
console.log(`  ${hasNotificationSchema ? '✓' : '✗'} Notification schema exists`);

if (!hasNotificationSchema) {
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All Task 9 endpoints are properly documented!');
  process.exit(0);
} else {
  console.log('❌ Some endpoints are missing or incomplete');
  process.exit(1);
}
