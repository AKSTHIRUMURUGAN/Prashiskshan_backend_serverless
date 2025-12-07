#!/bin/bash

# Pre-commit hook for validating OpenAPI documentation
# This hook runs before each commit to ensure API documentation is valid

echo "🔍 Validating OpenAPI documentation..."

# Change to backend directory
cd backend || exit 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any validation fails
VALIDATION_FAILED=0

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        VALIDATION_FAILED=1
    fi
}

# Check if openapi.mjs has been modified
if git diff --cached --name-only | grep -q "backend/src/docs/openapi.mjs"; then
    echo -e "${YELLOW}OpenAPI spec modified, running validations...${NC}\n"
    
    # 1. Validate OpenAPI spec structure
    echo "1. Validating OpenAPI spec structure..."
    node scripts/validate-openapi-spec.js > /dev/null 2>&1
    print_status $? "OpenAPI spec structure validation"
    
    # 2. Validate schema examples
    echo "2. Validating schema examples..."
    node scripts/validate-schema-examples.js > /dev/null 2>&1
    print_status $? "Schema examples validation"
    
    # 3. Validate route coverage
    echo "3. Validating route coverage..."
    node scripts/validate-route-coverage.js > /dev/null 2>&1
    print_status $? "Route coverage validation"
    
    echo ""
    
    # If any validation failed, prevent commit
    if [ $VALIDATION_FAILED -eq 1 ]; then
        echo -e "${RED}❌ OpenAPI validation failed!${NC}"
        echo ""
        echo "Please fix the issues above before committing."
        echo "Run the following commands for detailed error messages:"
        echo "  npm run validate:openapi"
        echo "  npm run validate:examples"
        echo "  npm run validate:routes"
        echo ""
        echo "To bypass this check (not recommended), use:"
        echo "  git commit --no-verify"
        exit 1
    else
        echo -e "${GREEN}✅ All OpenAPI validations passed!${NC}"
    fi
else
    echo -e "${YELLOW}OpenAPI spec not modified, skipping validation${NC}"
fi

exit 0
