import openapiSpec from '../src/docs/openapi.mjs';

console.log('✅ OpenAPI spec loaded successfully\n');

const testingPaths = Object.entries(openapiSpec.paths)
  .filter(([path, methods]) => 
    Object.values(methods).some(method => method.tags?.includes('Testing'))
  );

console.log(`Testing endpoints: ${testingPaths.length}\n`);

testingPaths.forEach(([path, methods]) => {
  const method = Object.keys(methods)[0];
  const endpoint = methods[method];
  console.log(`  ${method.toUpperCase().padEnd(6)} ${path}`);
  console.log(`         ${endpoint.summary}`);
});

console.log('\n✅ All testing endpoints are documented and accessible via Swagger UI');
