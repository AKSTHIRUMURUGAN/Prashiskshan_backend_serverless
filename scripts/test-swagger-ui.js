import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Swagger UI Testing Script
 * Tests that Swagger UI is accessible and renders correctly
 */

class SwaggerUITester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async test() {
    console.log('🧪 Starting Swagger UI Tests...\n');
    console.log(`Base URL: ${this.baseUrl}\n`);
    
    await this.testHealthEndpoint();
    await this.testSwaggerUIEndpoint();
    await this.testOpenAPIJsonEndpoint();
    
    this.printResults();
    
    return this.results.failed.length === 0;
  }

  async testHealthEndpoint() {
    console.log('🏥 Testing health endpoint...');
    
    try {
      const response = await this.makeRequest('/api/health');
      
      if (response.statusCode === 200) {
        this.results.passed.push('Health endpoint is accessible');
        console.log('  ✅ Health endpoint responding');
      } else {
        this.results.failed.push(`Health endpoint returned ${response.statusCode}`);
        console.log(`  ❌ Health endpoint returned ${response.statusCode}`);
      }
    } catch (error) {
      this.results.failed.push(`Health endpoint error: ${error.message}`);
      console.log(`  ❌ Health endpoint error: ${error.message}`);
    }
  }

  async testSwaggerUIEndpoint() {
    console.log('📚 Testing Swagger UI endpoint...');
    
    try {
      const response = await this.makeRequest('/api/docs');
      
      if (response.statusCode === 200) {
        this.results.passed.push('Swagger UI endpoint is accessible');
        console.log('  ✅ Swagger UI endpoint responding');
        
        // Check if response contains Swagger UI HTML
        if (response.body.includes('swagger-ui') || response.body.includes('Swagger UI')) {
          this.results.passed.push('Swagger UI HTML is being served');
          console.log('  ✅ Swagger UI HTML detected');
        } else {
          this.results.warnings.push('Response does not appear to contain Swagger UI HTML');
          console.log('  ⚠️  Swagger UI HTML not detected in response');
        }
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        this.results.passed.push('Swagger UI endpoint redirects (likely to /api/docs/)');
        console.log('  ✅ Swagger UI endpoint redirects');
      } else {
        this.results.failed.push(`Swagger UI endpoint returned ${response.statusCode}`);
        console.log(`  ❌ Swagger UI endpoint returned ${response.statusCode}`);
      }
    } catch (error) {
      this.results.failed.push(`Swagger UI endpoint error: ${error.message}`);
      console.log(`  ❌ Swagger UI endpoint error: ${error.message}`);
    }
  }

  async testOpenAPIJsonEndpoint() {
    console.log('📄 Testing OpenAPI JSON endpoint...');
    
    try {
      // Try common OpenAPI JSON endpoints
      const endpoints = ['/api/docs/openapi.json', '/api/openapi.json', '/api/docs/swagger.json'];
      let found = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          
          if (response.statusCode === 200) {
            this.results.passed.push(`OpenAPI JSON available at ${endpoint}`);
            console.log(`  ✅ OpenAPI JSON found at ${endpoint}`);
            
            // Try to parse as JSON
            try {
              const spec = JSON.parse(response.body);
              if (spec.openapi && spec.info && spec.paths) {
                this.results.passed.push('OpenAPI JSON is valid');
                console.log('  ✅ OpenAPI JSON is valid');
                console.log(`     - OpenAPI version: ${spec.openapi}`);
                console.log(`     - API title: ${spec.info.title}`);
                console.log(`     - API version: ${spec.info.version}`);
                console.log(`     - Total paths: ${Object.keys(spec.paths).length}`);
              } else {
                this.results.warnings.push('OpenAPI JSON missing required fields');
                console.log('  ⚠️  OpenAPI JSON missing required fields');
              }
            } catch (parseError) {
              this.results.failed.push('OpenAPI JSON is not valid JSON');
              console.log('  ❌ OpenAPI JSON is not valid JSON');
            }
            
            found = true;
            break;
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }
      
      if (!found) {
        this.results.warnings.push('OpenAPI JSON endpoint not found at common locations');
        console.log('  ⚠️  OpenAPI JSON endpoint not found');
      }
    } catch (error) {
      this.results.failed.push(`OpenAPI JSON test error: ${error.message}`);
      console.log(`  ❌ OpenAPI JSON test error: ${error.message}`);
    }
  }

  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/json,*/*'
        }
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SWAGGER UI TEST RESULTS');
    console.log('='.repeat(60));
    
    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED:');
      this.results.passed.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED:');
      this.results.failed.forEach((failure, i) => {
        console.log(`  ${i + 1}. ${failure}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Summary: ${this.results.passed.length} passed, ${this.results.warnings.length} warnings, ${this.results.failed.length} failed`);
    console.log('='.repeat(60));
    
    if (this.results.failed.length === 0) {
      console.log('\n✅ All tests passed!');
      console.log('\n💡 Next steps:');
      console.log('   1. Visit http://localhost:5000/api/docs in your browser');
      console.log('   2. Test the "Try it out" functionality');
      console.log('   3. Configure authentication with a Bearer token');
      console.log('   4. Verify all tags and schemas render correctly');
    } else {
      console.log('\n❌ Some tests failed. Please ensure the server is running.');
      console.log('   Start the server with: npm run dev');
    }
  }
}

async function main() {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  
  const tester = new SwaggerUITester(baseUrl);
  const success = await tester.test();
  
  process.exit(success ? 0 : 1);
}

// Check if server is likely running
console.log('⚙️  Checking if server is running...');
console.log('   If the server is not running, start it with: npm run dev\n');

main();
