import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Comprehensive OpenAPI Specification Validator
 * Validates the OpenAPI spec structure, completeness, and correctness
 */

class OpenAPIValidator {
  constructor(spec) {
    this.spec = spec;
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalPaths: 0,
      totalSchemas: 0,
      totalTags: new Set(),
      endpointsWithExamples: 0,
      endpointsWithSecurity: 0,
      endpointsWithErrors: 0
    };
  }

  validate() {
    console.log('🔍 Starting OpenAPI Specification Validation...\n');
    
    this.validateStructure();
    this.validateInfo();
    this.validateServers();
    this.validateSecurity();
    this.validateSchemas();
    this.validatePaths();
    this.validateTags();
    this.validateExamples();
    
    this.printResults();
    
    return this.errors.length === 0;
  }

  validateStructure() {
    console.log('📋 Validating OpenAPI structure...');
    
    if (!this.spec.openapi) {
      this.errors.push('Missing required field: openapi');
    } else if (!this.spec.openapi.startsWith('3.0')) {
      this.errors.push(`Invalid OpenAPI version: ${this.spec.openapi} (expected 3.0.x)`);
    }
    
    const requiredFields = ['info', 'paths'];
    requiredFields.forEach(field => {
      if (!this.spec[field]) {
        this.errors.push(`Missing required field: ${field}`);
      }
    });
    
    if (!this.spec.components) {
      this.warnings.push('Missing components section (recommended for reusable schemas)');
    }
  }

  validateInfo() {
    console.log('ℹ️  Validating info section...');
    
    if (!this.spec.info) return;
    
    const requiredInfoFields = ['title', 'version'];
    requiredInfoFields.forEach(field => {
      if (!this.spec.info[field]) {
        this.errors.push(`Missing required info field: ${field}`);
      }
    });
    
    if (!this.spec.info.description) {
      this.warnings.push('Missing info.description (recommended)');
    }
  }

  validateServers() {
    console.log('🌐 Validating servers...');
    
    if (!this.spec.servers || this.spec.servers.length === 0) {
      this.warnings.push('No servers defined (recommended to specify API base URLs)');
    }
  }

  validateSecurity() {
    console.log('🔐 Validating security schemes...');
    
    if (!this.spec.components?.securitySchemes) {
      this.warnings.push('No security schemes defined');
      return;
    }
    
    const schemes = this.spec.components.securitySchemes;
    if (schemes.BearerAuth) {
      if (schemes.BearerAuth.type !== 'http' || schemes.BearerAuth.scheme !== 'bearer') {
        this.errors.push('BearerAuth security scheme is not properly configured');
      }
    }
  }

  validateSchemas() {
    console.log('📦 Validating schemas...');
    
    if (!this.spec.components?.schemas) {
      this.warnings.push('No schemas defined in components');
      return;
    }
    
    const schemas = this.spec.components.schemas;
    this.stats.totalSchemas = Object.keys(schemas).length;
    
    // Check for essential schemas
    const essentialSchemas = [
      'SuccessResponse',
      'Error',
      'Pagination',
      'Internship',
      'Application',
      'Student',
      'Company',
      'Mentor'
    ];
    
    essentialSchemas.forEach(schemaName => {
      if (!schemas[schemaName]) {
        this.warnings.push(`Missing essential schema: ${schemaName}`);
      }
    });
    
    // Validate schema references
    Object.entries(schemas).forEach(([name, schema]) => {
      this.validateSchemaReferences(name, schema);
    });
  }

  validateSchemaReferences(name, schema, path = []) {
    if (!schema || typeof schema !== 'object') return;
    
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '');
      if (!this.spec.components?.schemas?.[refPath]) {
        this.errors.push(`Broken schema reference in ${name}: ${schema.$ref}`);
      }
    }
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        this.validateSchemaReferences(name, propSchema, [...path, propName]);
      });
    }
    
    if (schema.items) {
      this.validateSchemaReferences(name, schema.items, [...path, 'items']);
    }
  }

  validatePaths() {
    console.log('🛣️  Validating paths...');
    
    if (!this.spec.paths) {
      this.errors.push('No paths defined');
      return;
    }
    
    this.stats.totalPaths = Object.keys(this.spec.paths).length;
    
    Object.entries(this.spec.paths).forEach(([path, pathItem]) => {
      this.validatePath(path, pathItem);
    });
  }

  validatePath(path, pathItem) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    
    methods.forEach(method => {
      if (pathItem[method]) {
        this.validateOperation(path, method, pathItem[method]);
      }
    });
  }

  validateOperation(path, method, operation) {
    const operationId = `${method.toUpperCase()} ${path}`;
    
    // Check required fields
    if (!operation.summary) {
      this.warnings.push(`${operationId}: Missing summary`);
    }
    
    if (!operation.tags || operation.tags.length === 0) {
      this.warnings.push(`${operationId}: No tags assigned`);
    } else {
      operation.tags.forEach(tag => this.stats.totalTags.add(tag));
    }
    
    // Check responses
    if (!operation.responses) {
      this.errors.push(`${operationId}: Missing responses`);
    } else {
      // Check for success response
      const hasSuccessResponse = Object.keys(operation.responses).some(
        code => code.startsWith('2')
      );
      if (!hasSuccessResponse) {
        this.warnings.push(`${operationId}: No success response (2xx) defined`);
      }
      
      // Check for error responses
      const hasErrorResponse = Object.keys(operation.responses).some(
        code => code.startsWith('4') || code.startsWith('5')
      );
      if (hasErrorResponse) {
        this.stats.endpointsWithErrors++;
      }
      
      // Check for examples in responses
      const hasExamples = Object.values(operation.responses).some(
        response => response.content?.['application/json']?.example ||
                   response.content?.['application/json']?.examples
      );
      if (hasExamples) {
        this.stats.endpointsWithExamples++;
      }
    }
    
    // Check security
    if (operation.security !== undefined) {
      this.stats.endpointsWithSecurity++;
      
      // Validate PUBLIC auth endpoints have empty security
      // Only registration, login, and password reset request should be public
      const publicAuthEndpoints = [
        '/auth/register/student',
        '/auth/register/company',
        '/auth/register/mentor',
        '/auth/register/admin',
        '/auth/login',
        '/auth/send-password-reset'
      ];
      
      const isPublicAuthEndpoint = publicAuthEndpoints.includes(path);
      const isVerifyEmailGet = path === '/auth/verify-email' && method === 'get';
      
      if ((isPublicAuthEndpoint || isVerifyEmailGet) && operation.security.length > 0) {
        this.warnings.push(`${operationId}: Public auth endpoint should have empty security array`);
      }
    }
    
    // Check request body for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(method)) {
      if (!operation.requestBody) {
        this.warnings.push(`${operationId}: Missing requestBody for ${method.toUpperCase()} operation`);
      } else {
        // Check if request body has schema
        const hasSchema = operation.requestBody.content?.['application/json']?.schema;
        if (!hasSchema) {
          this.warnings.push(`${operationId}: Request body missing schema`);
        }
      }
    }
    
    // Check parameters have examples
    if (operation.parameters) {
      operation.parameters.forEach(param => {
        if (!param.example && !param.schema?.example && !param.schema?.default) {
          this.warnings.push(`${operationId}: Parameter '${param.name}' missing example`);
        }
      });
    }
  }

  validateTags() {
    console.log('🏷️  Validating tags...');
    
    const expectedTags = [
      'Authentication',
      'Students',
      'Mentors',
      'Companies',
      'Admin',
      'Testing'
    ];
    
    expectedTags.forEach(tag => {
      if (!this.stats.totalTags.has(tag)) {
        this.warnings.push(`Expected tag not found: ${tag}`);
      }
    });
  }

  validateExamples() {
    console.log('📝 Validating examples...');
    
    const exampleCoverage = (this.stats.endpointsWithExamples / this.stats.totalPaths * 100).toFixed(1);
    
    if (exampleCoverage < 50) {
      this.warnings.push(`Low example coverage: ${exampleCoverage}% of endpoints have examples`);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n📈 Statistics:');
    console.log(`  Total Paths: ${this.stats.totalPaths}`);
    console.log(`  Total Schemas: ${this.stats.totalSchemas}`);
    console.log(`  Total Tags: ${this.stats.totalTags.size}`);
    console.log(`  Endpoints with Examples: ${this.stats.endpointsWithExamples} (${(this.stats.endpointsWithExamples / this.stats.totalPaths * 100).toFixed(1)}%)`);
    console.log(`  Endpoints with Security: ${this.stats.endpointsWithSecurity}`);
    console.log(`  Endpoints with Error Responses: ${this.stats.endpointsWithErrors}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All validations passed!');
    } else if (this.errors.length === 0) {
      console.log('\n✅ No errors found (warnings can be addressed for improvement)');
    } else {
      console.log('\n❌ Validation failed with errors');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

async function main() {
  try {
    // Import the OpenAPI spec
    const specPath = join(__dirname, '../src/docs/openapi.mjs');
    // Convert to file:// URL for Windows compatibility
    const specUrl = new URL(`file:///${specPath.replace(/\\/g, '/')}`);
    const module = await import(specUrl);
    const spec = module.default;
    
    if (!spec) {
      console.error('❌ Failed to load OpenAPI specification');
      process.exit(1);
    }
    
    const validator = new OpenAPIValidator(spec);
    const isValid = validator.validate();
    
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
