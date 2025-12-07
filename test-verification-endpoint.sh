#!/bin/bash

# Test script for verification email endpoint
# Usage: ./test-verification-endpoint.sh <AUTH_TOKEN>

if [ -z "$1" ]; then
  echo "Usage: ./test-verification-endpoint.sh <AUTH_TOKEN>"
  echo ""
  echo "To get an auth token:"
  echo "1. Login via the API"
  echo "2. Copy the idToken from the response"
  echo "3. Run this script with that token"
  exit 1
fi

AUTH_TOKEN=$1
API_URL=${API_URL:-http://localhost:5000}

echo "Testing verification email endpoint..."
echo "API URL: $API_URL"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_URL/api/auth/send-verification-email")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "Response Status: $http_status"
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" = "200" ]; then
  echo "✅ API call successful!"
  echo ""
  echo "Next steps:"
  echo "1. Check your email inbox"
  echo "2. Check server logs for email sending details"
  echo "3. If no email received, run: node debug-email-config.js"
else
  echo "❌ API call failed!"
  echo ""
  echo "Troubleshooting:"
  echo "1. Verify your auth token is valid"
  echo "2. Check if the server is running"
  echo "3. Check server logs for errors"
fi
