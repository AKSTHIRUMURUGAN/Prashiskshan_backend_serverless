import openapi from '../src/docs/openapi.mjs';

console.log('🔍 Verifying Workflow Documentation...\n');

const schemas = openapi.components.schemas;
const workflows = [
  'InternshipStatus',
  'ApplicationStatus', 
  'CreditRequestStatus',
  'LogbookStatus',
  'CompanyVerificationStatus'
];

let allPassed = true;

workflows.forEach(workflowName => {
  const schema = schemas[workflowName];
  const desc = schema.description;
  
  console.log(`\n📋 ${workflowName}:`);
  
  const checks = [
    { name: 'State Diagram', test: desc.includes('State Diagram:') },
    { name: 'Status Definitions', test: desc.includes('Status Definitions:') },
    { name: 'Transition Rules', test: desc.includes('Transition Rules:') },
    { name: 'Required Actions', test: desc.includes('Required Actions') },
    { name: 'Error Cases', test: desc.includes('Error Cases:') }
  ];
  
  checks.forEach(check => {
    const status = check.test ? '✓' : '✗';
    console.log(`  ${status} ${check.name}: ${check.test}`);
    if (!check.test) allPassed = false;
  });
  
  console.log(`  📏 Length: ${desc.length} characters`);
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All workflow documentation is complete!');
} else {
  console.log('❌ Some workflow documentation is missing required sections');
  process.exit(1);
}
