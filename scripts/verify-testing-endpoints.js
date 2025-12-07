import openapiSpec from '../src/docs/openapi.mjs';

console.log('🔍 Verifying Testing Endpoints Documentation...\n');

const requiredEndpoints = [
  { path: '/health', method: 'get', description: 'Health check endpoint' },
  { path: '/tests/email', method: 'post', description: 'Email service test endpoint' },
  { path: '/tests/s3', method: 'post', description: 'S3/R2 storage test endpoint' },
  { path: '/tests/queue', method: 'post', description: 'Queue test endpoint' },
  { path: '/tests/gemini', method: 'post', description: 'Gemini AI test endpoint' },
  { path: '/tests/status', method: 'get', description: 'Service status endpoint' },
  { path: '/debug/firebase', method: 'get', description: 'Firebase debug endpoint' },
  { path: '/test/firebase-users', method: 'delete', description: 'Clear Firebase users (non-prod)' },
  { path: '/test/mongo-data', method: 'delete', description: 'Clear MongoDB data (non-prod)' }
];

let allPassed = true;

// Check 1: All required endpoints exist
console.log('✓ Checking endpoint existence...');
requiredEndpoints.forEach(({ path, method, description }) => {
  const endpoint = openapiSpec.paths[path];
  if (!endpoint || !endpoint[method]) {
    console.error(`  ✗ Missing: ${method.toUpperCase()} ${path} - ${description}`);
    allPassed = false;
  } else {
    console.log(`  ✓ ${method.toUpperCase()} ${path}`);
  }
});

// Check 2: All endpoints have "Testing" tag
console.log('\n✓ Checking Testing tag assignment...');
requiredEndpoints.forEach(({ path, method }) => {
  const endpoint = openapiSpec.paths[path];
  if (endpoint && endpoint[method]) {
    const tags = endpoint[method].tags || [];
    if (!tags.includes('Testing')) {
      console.error(`  ✗ Missing Testing tag: ${method.toUpperCase()} ${path}`);
      allPassed = false;
    } else {
      console.log(`  ✓ ${method.toUpperCase()} ${path} has Testing tag`);
    }
  }
});

// Check 3: All endpoints have descriptions
console.log('\n✓ Checking endpoint descriptions...');
requiredEndpoints.forEach(({ path, method }) => {
  const endpoint = openapiSpec.paths[path];
  if (endpoint && endpoint[method]) {
    const description = endpoint[method].description;
    if (!description || description.length < 20) {
      console.error(`  ✗ Missing or short description: ${method.toUpperCase()} ${path}`);
      allPassed = false;
    } else {
      console.log(`  ✓ ${method.toUpperCase()} ${path} has description (${description.length} chars)`);
    }
  }
});

// Check 4: POST endpoints have request body examples
console.log('\n✓ Checking request body examples...');
const postEndpoints = requiredEndpoints.filter(e => e.method === 'post');
postEndpoints.forEach(({ path, method }) => {
  const endpoint = openapiSpec.paths[path];
  if (endpoint && endpoint[method]) {
    const requestBody = endpoint[method].requestBody;
    if (!requestBody) {
      console.error(`  ✗ Missing request body: ${method.toUpperCase()} ${path}`);
      allPassed = false;
    } else {
      const content = requestBody.content;
      // For multipart/form-data, having a schema reference is sufficient
      const hasMultipartSchema = content['multipart/form-data']?.schema?.$ref;
      const hasExample = Object.values(content).some(c => c.example || c.schema?.example);
      if (!hasExample && !hasMultipartSchema) {
        console.error(`  ✗ Missing request example: ${method.toUpperCase()} ${path}`);
        allPassed = false;
      } else {
        console.log(`  ✓ ${method.toUpperCase()} ${path} has request ${hasMultipartSchema ? 'schema' : 'example'}`);
      }
    }
  }
});

// Check 5: All endpoints have response examples
console.log('\n✓ Checking response examples...');
requiredEndpoints.forEach(({ path, method }) => {
  const endpoint = openapiSpec.paths[path];
  if (endpoint && endpoint[method]) {
    const responses = endpoint[method].responses;
    const successResponse = responses['200'];
    if (!successResponse) {
      console.error(`  ✗ Missing 200 response: ${method.toUpperCase()} ${path}`);
      allPassed = false;
    } else {
      const content = successResponse.content;
      if (content && content['application/json']) {
        const hasExample = content['application/json'].example || content['application/json'].schema?.example;
        if (!hasExample) {
          console.error(`  ✗ Missing response example: ${method.toUpperCase()} ${path}`);
          allPassed = false;
        } else {
          console.log(`  ✓ ${method.toUpperCase()} ${path} has response example`);
        }
      }
    }
  }
});

// Check 6: Endpoints have error responses
console.log('\n✓ Checking error response documentation...');
const authenticatedEndpoints = requiredEndpoints.filter(e => 
  e.path.startsWith('/tests/') && !e.path.includes('status')
);
authenticatedEndpoints.forEach(({ path, method }) => {
  const endpoint = openapiSpec.paths[path];
  if (endpoint && endpoint[method]) {
    const responses = endpoint[method].responses;
    const hasErrorResponses = responses['400'] || responses['401'] || responses['403'] || responses['500'];
    if (!hasErrorResponses) {
      console.error(`  ✗ Missing error responses: ${method.toUpperCase()} ${path}`);
      allPassed = false;
    } else {
      const errorCodes = Object.keys(responses).filter(code => parseInt(code) >= 400);
      console.log(`  ✓ ${method.toUpperCase()} ${path} has error responses (${errorCodes.join(', ')})`);
    }
  }
});

// Check 7: Required schemas exist
console.log('\n✓ Checking test schemas...');
const requiredSchemas = [
  'TestEmailRequest',
  'TestS3UploadRequest',
  'TestQueueJobRequest',
  'TestGeminiRequest',
  'TestServicesStatusResponse',
  'HealthCheckResponse',
  'FirebaseDebugResponse'
];

requiredSchemas.forEach(schemaName => {
  if (!openapiSpec.components.schemas[schemaName]) {
    console.error(`  ✗ Missing schema: ${schemaName}`);
    allPassed = false;
  } else {
    console.log(`  ✓ Schema exists: ${schemaName}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ Verification PASSED - All testing endpoints are properly documented!');
  console.log(`\nDocumented ${requiredEndpoints.length} testing endpoints with complete examples.`);
  process.exit(0);
} else {
  console.log('❌ Verification FAILED - Some requirements are not met.');
  process.exit(1);
}
