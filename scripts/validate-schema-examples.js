import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Schema-Example Consistency Validator
 * Validates that examples match their schema definitions
 */

class SchemaExampleValidator {
  constructor(spec) {
    this.spec = spec;
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalExamples: 0,
      validExamples: 0,
      invalidExamples: 0
    };
  }

  validate() {
    console.log('🔍 Starting Schema-Example Validation...\n');
    
    this.validateSchemaExamples();
    this.validateResponseExamples();
    this.validateRequestExamples();
    
    this.printResults();
    
    return this.errors.length === 0;
  }

  validateSchemaExamples() {
    console.log('📦 Validating schema examples...');
    
    if (!this.spec.components?.schemas) {
      this.warnings.push('No schemas defined');
      return;
    }
    
    Object.entries(this.spec.components.schemas).forEach(([name, schema]) => {
      this.validateSchema(name, schema, schema);
    });
  }

  validateSchema(name, schema, rootSchema, path = []) {
    if (!schema || typeof schema !== 'object') return;
    
    // Check if schema has an example
    if (schema.example !== undefined) {
      this.stats.totalExamples++;
      const isValid = this.validateExample(schema.example, schema, `Schema ${name}${path.length > 0 ? '.' + path.join('.') : ''}`);
      if (isValid) {
        this.stats.validExamples++;
      } else {
        this.stats.invalidExamples++;
      }
    }
    
    // Recursively check properties
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        this.validateSchema(name, propSchema, rootSchema, [...path, propName]);
      });
    }
    
    // Check array items
    if (schema.items) {
      this.validateSchema(name, schema.items, rootSchema, [...path, 'items']);
    }
  }

  validateExample(example, schema, context) {
    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(example) ? 'array' : typeof example;
      const expectedType = schema.type;
      
      if (actualType !== expectedType && !(actualType === 'number' && expectedType === 'integer')) {
        this.errors.push(`${context}: Example type mismatch. Expected ${expectedType}, got ${actualType}`);
        return false;
      }
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(example)) {
      this.errors.push(`${context}: Example value "${example}" not in enum [${schema.enum.join(', ')}]`);
      return false;
    }
    
    // Required fields validation for objects
    if (schema.type === 'object' && schema.required && typeof example === 'object') {
      const missingFields = schema.required.filter(field => !(field in example));
      if (missingFields.length > 0) {
        this.warnings.push(`${context}: Example missing required fields: ${missingFields.join(', ')}`);
      }
    }
    
    // Array validation
    if (schema.type === 'array' && Array.isArray(example)) {
      if (schema.minItems && example.length < schema.minItems) {
        this.warnings.push(`${context}: Example array has ${example.length} items, minimum is ${schema.minItems}`);
      }
      if (schema.maxItems && example.length > schema.maxItems) {
        this.warnings.push(`${context}: Example array has ${example.length} items, maximum is ${schema.maxItems}`);
      }
    }
    
    // String validation
    if (schema.type === 'string' && typeof example === 'string') {
      if (schema.minLength && example.length < schema.minLength) {
        this.warnings.push(`${context}: Example string length ${example.length} is less than minimum ${schema.minLength}`);
      }
      if (schema.maxLength && example.length > schema.maxLength) {
        this.warnings.push(`${context}: Example string length ${example.length} exceeds maximum ${schema.maxLength}`);
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(example)) {
          this.warnings.push(`${context}: Example string does not match pattern ${schema.pattern}`);
        }
      }
    }
    
    // Number validation
    if ((schema.type === 'number' || schema.type === 'integer') && typeof example === 'number') {
      if (schema.minimum !== undefined && example < schema.minimum) {
        this.warnings.push(`${context}: Example value ${example} is less than minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && example > schema.maximum) {
        this.warnings.push(`${context}: Example value ${example} exceeds maximum ${schema.maximum}`);
      }
    }
    
    return true;
  }

  validateResponseExamples() {
    console.log('📤 Validating response examples...');
    
    if (!this.spec.paths) return;
    
    Object.entries(this.spec.paths).forEach(([path, pathItem]) => {
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      
      methods.forEach(method => {
        if (pathItem[method]?.responses) {
          Object.entries(pathItem[method].responses).forEach(([statusCode, response]) => {
            if (response.content?.['application/json']) {
              const content = response.content['application/json'];
              const context = `${method.toUpperCase()} ${path} [${statusCode}]`;
              
              if (content.example) {
                this.stats.totalExamples++;
                if (content.schema) {
                  const isValid = this.validateExample(content.example, content.schema, context);
                  if (isValid) {
                    this.stats.validExamples++;
                  } else {
                    this.stats.invalidExamples++;
                  }
                }
              }
              
              if (content.examples) {
                Object.entries(content.examples).forEach(([exampleName, exampleObj]) => {
                  this.stats.totalExamples++;
                  if (content.schema && exampleObj.value) {
                    const isValid = this.validateExample(
                      exampleObj.value,
                      content.schema,
                      `${context} (${exampleName})`
                    );
                    if (isValid) {
                      this.stats.validExamples++;
                    } else {
                      this.stats.invalidExamples++;
                    }
                  }
                });
              }
            }
          });
        }
      });
    });
  }

  validateRequestExamples() {
    console.log('📥 Validating request examples...');
    
    if (!this.spec.paths) return;
    
    Object.entries(this.spec.paths).forEach(([path, pathItem]) => {
      const methods = ['post', 'put', 'patch'];
      
      methods.forEach(method => {
        if (pathItem[method]?.requestBody?.content?.['application/json']) {
          const content = pathItem[method].requestBody.content['application/json'];
          const context = `${method.toUpperCase()} ${path} [request body]`;
          
          if (content.example) {
            this.stats.totalExamples++;
            if (content.schema) {
              const isValid = this.validateExample(content.example, content.schema, context);
              if (isValid) {
                this.stats.validExamples++;
              } else {
                this.stats.invalidExamples++;
              }
            }
          }
          
          if (content.examples) {
            Object.entries(content.examples).forEach(([exampleName, exampleObj]) => {
              this.stats.totalExamples++;
              if (content.schema && exampleObj.value) {
                const isValid = this.validateExample(
                  exampleObj.value,
                  content.schema,
                  `${context} (${exampleName})`
                );
                if (isValid) {
                  this.stats.validExamples++;
                } else {
                  this.stats.invalidExamples++;
                }
              }
            });
          }
        }
      });
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCHEMA-EXAMPLE VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n📈 Statistics:');
    console.log(`  Total Examples: ${this.stats.totalExamples}`);
    console.log(`  Valid Examples: ${this.stats.validExamples}`);
    console.log(`  Invalid Examples: ${this.stats.invalidExamples}`);
    
    if (this.stats.totalExamples > 0) {
      const validPercentage = (this.stats.validExamples / this.stats.totalExamples * 100).toFixed(1);
      console.log(`  Validity Rate: ${validPercentage}%`);
    }
    
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
      console.log('\n✅ All examples are valid!');
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
    
    const validator = new SchemaExampleValidator(spec);
    const isValid = validator.validate();
    
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
