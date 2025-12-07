# Route Coverage Validation Script

## Overview

The route coverage validation script (`validate-route-coverage.js`) automatically extracts all routes from Express routers and compares them to the OpenAPI specification to identify missing or undocumented routes.

## Purpose

This script ensures that:
1. All Express routes are documented in the OpenAPI specification
2. The API documentation stays in sync with the actual implementation
3. Developers are notified when new routes are added but not documented
4. The documentation coverage percentage is tracked over time

## Usage

### Basic Validation (Fails on Missing Routes)

```bash
npm run validate:routes
```

This command will:
- Extract all routes from Express routers
- Compare them to OpenAPI paths
- Report missing documentation
- Exit with code 1 if any routes are missing (useful for CI/CD)

### Report-Only Mode (Always Succeeds)

```bash
npm run validate:routes:report
```

This command will:
- Generate the same report
- Exit with code 0 even if routes are missing (useful for monitoring)

### Direct Execution

```bash
node scripts/validate-route-coverage.js           # Validation mode
node scripts/validate-route-coverage.js --report  # Report-only mode
```

## Output

The script provides a comprehensive report including:

### Summary Statistics
- Total Express Routes
- Documented Routes
- Missing Documentation
- Coverage Percentage

### Missing Routes
Routes defined in Express but not documented in OpenAPI, grouped by router file:
```
admin.js:
  GET    /admins/analytics/system
  POST   /admins/internships/{internshipId}/approve
```

### Extra OpenAPI Paths (if any)
Paths documented in OpenAPI but not found in Express routers (may indicate planned endpoints or documentation errors)

### Recommendations
Actionable steps to improve documentation coverage

## How It Works

### 1. Route Extraction

The script reads all router files in `backend/src/routes/` and extracts routes using regex patterns:

```javascript
router.get('/path', handler)
router.post('/path', handler)
router.put('/path', handler)
router.patch('/path', handler)
router.delete('/path', handler)
```

### 2. Path Normalization

Routes are normalized for comparison:
- Express `:param` → OpenAPI `{param}`
- Trailing slashes are removed
- Base paths are prepended based on router mounting

### 3. OpenAPI Path Extraction

The script dynamically imports `backend/src/docs/openapi.mjs` and extracts all documented paths.

### 4. Comparison

Routes are compared using normalized paths and HTTP methods to identify:
- **Missing**: Routes in Express but not in OpenAPI
- **Documented**: Routes present in both
- **Extra**: Paths in OpenAPI but not in Express

## Router Base Paths

The script knows how routers are mounted in `backend/src/routes/index.js`:

| Router File | Base Path |
|------------|-----------|
| auth.js | /auth |
| student.js | /students |
| mentor.js | /mentors |
| company.js | /companies |
| admin.js | /admins |
| internship.js | /internships |
| application.js | /applications |
| upload.js | /upload |
| logbook.js | /logbooks |
| notification.js | /notifications |
| interview.js | /interviews |
| tests.js | /tests |
| test.js | /test |
| metrics.js | /metrics |
| debug.js | /debug |
| status.js | /status |
| _tests.js | /_tests |

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Validate API Documentation Coverage
  run: npm run validate:routes
```

This will fail the build if routes are missing documentation.

### Pre-commit Hook Example

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run validate:routes:report"
    }
  }
}
```

This will show a report but won't block commits.

## Maintaining Documentation

When adding new routes:

1. **Add the route to the appropriate router file**
   ```javascript
   router.get('/new-endpoint', handler);
   ```

2. **Run the validation script**
   ```bash
   npm run validate:routes
   ```

3. **Add documentation to `backend/src/docs/openapi.mjs`**
   ```javascript
   "/students/new-endpoint": {
     get: {
       summary: "Description",
       tags: ["Students"],
       security: [{ BearerAuth: [] }],
       responses: { ... }
     }
   }
   ```

4. **Verify coverage**
   ```bash
   npm run validate:routes
   ```

## Coverage Goals

- **90%+**: Excellent - Most routes are documented
- **70-89%**: Good - Core routes documented, some gaps
- **<70%**: Needs improvement - Significant documentation gaps

Current coverage: **85.6%** (166/194 routes)

## Troubleshooting

### "Error: No paths found in OpenAPI spec"

The OpenAPI specification file is missing or malformed. Check `backend/src/docs/openapi.mjs`.

### "Extra OpenAPI Paths" reported

This may indicate:
1. Planned endpoints not yet implemented
2. Documentation errors (typos in paths)
3. Routes that were removed but documentation wasn't updated

Review each extra path to determine if it should be removed from documentation or implemented.

### Routes not detected

Ensure routes follow the standard Express pattern:
```javascript
router.METHOD('path', middleware, handler)
```

The script uses regex to detect routes, so non-standard patterns may not be recognized.

## Related Scripts

- `validate:openapi` - Validates OpenAPI spec structure
- `validate:examples` - Validates schema examples
- `test:swagger` - Tests Swagger UI rendering
- `validate:docs` - Runs all documentation validation scripts

## Future Enhancements

Potential improvements:
- [ ] Detect route parameters and validate they match OpenAPI
- [ ] Check for required vs optional parameters
- [ ] Validate HTTP methods match between Express and OpenAPI
- [ ] Generate stub OpenAPI documentation for missing routes
- [ ] Track coverage trends over time
- [ ] Validate middleware requirements (auth, validation, etc.)

## Requirements Validation

This script validates the following requirements from the spec:

- **11.1**: Document all routes from studentRouter
- **11.2**: Document all routes from mentorRouter
- **11.3**: Document all routes from companyRouter
- **11.4**: Document all routes from adminRouter
- **11.5**: Document all routes from notificationRouter
- **11.6**: Document all routes from uploadRouter
- **11.7**: Document all routes from metricsRouter
- **11.8**: Document all routes from debugRouter
