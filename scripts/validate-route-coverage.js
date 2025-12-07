/**
 * Route Coverage Validation Script
 * 
 * This script extracts all routes from Express routers and compares them
 * to the OpenAPI specification to identify missing or undocumented routes.
 * 
 * Usage: 
 *   node scripts/validate-route-coverage.js           # Fail if routes are missing
 *   node scripts/validate-route-coverage.js --report  # Report only, always exit 0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Extract routes from a router file
 * @param {string} filePath - Path to the router file
 * @returns {Array<{method: string, path: string, file: string}>}
 */
function extractRoutesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const routes = [];
  const fileName = path.basename(filePath);
  
  // Match router.METHOD(path, ...) patterns
  // Handles: router.get(), router.post(), router.put(), router.patch(), router.delete()
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    
    routes.push({
      method,
      path: routePath,
      file: fileName,
    });
  }
  
  return routes;
}

/**
 * Get the base path for a router based on how it's mounted in index.js
 * @param {string} routerName - Name of the router file (e.g., 'student.js')
 * @returns {string} - Base path (e.g., '/students')
 */
function getBasePath(routerName) {
  const basePaths = {
    'auth.js': '/auth',
    'student.js': '/students',
    'mentor.js': '/mentors',
    'company.js': '/companies',
    'admin.js': '/admins',
    'internship.js': '/internships',
    'application.js': '/applications',
    'upload.js': '/upload',
    'logbook.js': '/logbooks',
    'notification.js': '/notifications',
    'interview.js': '/interviews',
    'tests.js': '/tests',
    'test.js': '/test',
    'metrics.js': '/metrics',
    'debug.js': '/debug',
    'status.js': '/status',
    '_tests.js': '/_tests',
  };
  
  return basePaths[routerName] || '';
}

/**
 * Extract all routes from the routes directory
 * @returns {Array<{method: string, path: string, fullPath: string, file: string}>}
 */
function extractAllRoutes() {
  const routesDir = path.join(__dirname, '../src/routes');
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  const allRoutes = [];
  
  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const routes = extractRoutesFromFile(filePath);
    const basePath = getBasePath(file);
    
    for (const route of routes) {
      // Construct full path
      let fullPath = basePath + route.path;
      
      // Normalize path (remove double slashes, ensure starts with /)
      fullPath = fullPath.replace(/\/+/g, '/');
      if (!fullPath.startsWith('/')) {
        fullPath = '/' + fullPath;
      }
      
      allRoutes.push({
        ...route,
        fullPath,
      });
    }
  }
  
  // Add health endpoint from index.js
  allRoutes.push({
    method: 'GET',
    path: '/health',
    fullPath: '/health',
    file: 'index.js',
  });
  
  return allRoutes;
}

/**
 * Extract paths from OpenAPI specification
 * @returns {Array<{method: string, path: string}>}
 */
function extractOpenAPIPaths() {
  const openapiPath = path.join(__dirname, '../src/docs/openapi.mjs');
  
  // Convert to file:// URL for Windows compatibility
  const openapiUrl = new URL(`file:///${openapiPath.replace(/\\/g, '/')}`);
  
  // Dynamic import to load the OpenAPI spec
  return import(openapiUrl.href).then(module => {
    const openapi = module.default;
    const paths = [];
    
    if (!openapi.paths) {
      console.error(`${colors.red}Error: No paths found in OpenAPI spec${colors.reset}`);
      return paths;
    }
    
    for (const [pathKey, pathValue] of Object.entries(openapi.paths)) {
      for (const method of Object.keys(pathValue)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          paths.push({
            method: method.toUpperCase(),
            path: pathKey,
          });
        }
      }
    }
    
    return paths;
  });
}

/**
 * Normalize path for comparison (convert :param to {param})
 * @param {string} path - Express-style path
 * @returns {string} - OpenAPI-style path
 */
function normalizePathForComparison(path) {
  // Convert Express :param to OpenAPI {param}
  let normalized = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
  
  // Remove trailing slash for consistency (except for root path)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Compare routes and find missing documentation
 * @param {Array} expressRoutes - Routes from Express routers
 * @param {Array} openapiPaths - Paths from OpenAPI spec
 * @returns {Object} - Comparison results
 */
function compareRoutes(expressRoutes, openapiPaths) {
  const missing = [];
  const documented = [];
  const extra = [];
  
  // Normalize OpenAPI paths for comparison
  const normalizedOpenapiPaths = openapiPaths.map(p => ({
    ...p,
    normalizedPath: normalizePathForComparison(p.path),
  }));
  
  // Create a set of OpenAPI paths for quick lookup
  const openapiSet = new Set(
    normalizedOpenapiPaths.map(p => `${p.method}:${p.normalizedPath}`)
  );
  
  // Create a set of Express routes for quick lookup
  const expressSet = new Set(
    expressRoutes.map(r => `${r.method}:${normalizePathForComparison(r.fullPath)}`)
  );
  
  // Find missing routes (in Express but not in OpenAPI)
  for (const route of expressRoutes) {
    const normalizedPath = normalizePathForComparison(route.fullPath);
    const key = `${route.method}:${normalizedPath}`;
    
    if (openapiSet.has(key)) {
      documented.push({
        ...route,
        normalizedPath,
      });
    } else {
      missing.push({
        ...route,
        normalizedPath,
      });
    }
  }
  
  // Find extra routes (in OpenAPI but not in Express)
  for (const path of normalizedOpenapiPaths) {
    const key = `${path.method}:${path.normalizedPath}`;
    
    if (!expressSet.has(key)) {
      extra.push(path);
    }
  }
  
  return { missing, documented, extra };
}

/**
 * Group routes by router file
 * @param {Array} routes - Routes to group
 * @returns {Object} - Routes grouped by file
 */
function groupByFile(routes) {
  const grouped = {};
  
  for (const route of routes) {
    if (!grouped[route.file]) {
      grouped[route.file] = [];
    }
    grouped[route.file].push(route);
  }
  
  return grouped;
}

/**
 * Print results in a formatted way
 * @param {Object} results - Comparison results
 * @param {Array} expressRoutes - All Express routes
 * @param {boolean} reportOnly - If true, always exit with code 0
 */
function printResults(results, expressRoutes, reportOnly = false) {
  const { missing, documented, extra } = results;
  
  console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  Route Coverage Validation Report${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}\n`);
  
  // Summary statistics
  const totalRoutes = expressRoutes.length;
  const documentedCount = documented.length;
  const missingCount = missing.length;
  const coveragePercent = ((documentedCount / totalRoutes) * 100).toFixed(1);
  
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Express Routes: ${colors.cyan}${totalRoutes}${colors.reset}`);
  console.log(`  Documented Routes: ${colors.green}${documentedCount}${colors.reset}`);
  console.log(`  Missing Documentation: ${colors.red}${missingCount}${colors.reset}`);
  console.log(`  Coverage: ${coveragePercent >= 90 ? colors.green : coveragePercent >= 70 ? colors.yellow : colors.red}${coveragePercent}%${colors.reset}`);
  
  if (extra.length > 0) {
    console.log(`  Extra OpenAPI Paths: ${colors.yellow}${extra.length}${colors.reset} (documented but not in routers)`);
  }
  
  // Missing routes by file
  if (missingCount > 0) {
    console.log(`\n${colors.bright}${colors.red}Missing Documentation:${colors.reset}`);
    console.log(`${colors.red}The following routes are defined in Express but not documented in OpenAPI:${colors.reset}\n`);
    
    const groupedMissing = groupByFile(missing);
    
    for (const [file, routes] of Object.entries(groupedMissing)) {
      console.log(`  ${colors.bright}${file}:${colors.reset}`);
      for (const route of routes) {
        console.log(`    ${colors.yellow}${route.method.padEnd(6)}${colors.reset} ${route.normalizedPath}`);
      }
      console.log();
    }
  } else {
    console.log(`\n${colors.green}✓ All Express routes are documented in OpenAPI!${colors.reset}\n`);
  }
  
  // Extra OpenAPI paths
  if (extra.length > 0) {
    console.log(`${colors.bright}${colors.yellow}Extra OpenAPI Paths:${colors.reset}`);
    console.log(`${colors.yellow}The following paths are documented in OpenAPI but not found in Express routers:${colors.reset}\n`);
    
    for (const path of extra) {
      console.log(`  ${colors.yellow}${path.method.padEnd(6)}${colors.reset} ${path.path}`);
    }
    console.log();
    console.log(`${colors.yellow}Note: These may be intentional (e.g., planned endpoints) or errors in documentation.${colors.reset}\n`);
  }
  
  // Recommendations
  if (missingCount > 0) {
    console.log(`${colors.bright}Recommendations:${colors.reset}`);
    console.log(`  1. Add missing routes to ${colors.cyan}backend/src/docs/openapi.mjs${colors.reset}`);
    console.log(`  2. Ensure each route has:`);
    console.log(`     - Complete request/response schemas`);
    console.log(`     - Appropriate tags for organization`);
    console.log(`     - Realistic examples`);
    console.log(`     - Error response documentation`);
    console.log(`  3. Run this script again to verify coverage\n`);
  }
  
  // Exit code
  if (missingCount > 0) {
    if (reportOnly) {
      console.log(`${colors.yellow}⚠ Report mode: ${missingCount} route(s) missing documentation (exit code 0)${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}✗ Validation failed: ${missingCount} route(s) missing documentation${colors.reset}\n`);
      process.exit(1);
    }
  } else {
    console.log(`${colors.green}✓ Validation passed: All routes are documented${colors.reset}\n`);
    process.exit(0);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check for --report flag
    const reportOnly = process.argv.includes('--report');
    
    console.log(`${colors.cyan}Extracting routes from Express routers...${colors.reset}`);
    const expressRoutes = extractAllRoutes();
    
    console.log(`${colors.cyan}Extracting paths from OpenAPI specification...${colors.reset}`);
    const openapiPaths = await extractOpenAPIPaths();
    
    console.log(`${colors.cyan}Comparing routes...${colors.reset}`);
    const results = compareRoutes(expressRoutes, openapiPaths);
    
    printResults(results, expressRoutes, reportOnly);
  } catch (error) {
    console.error(`${colors.red}Error during validation:${colors.reset}`, error);
    process.exit(1);
  }
}

main();
