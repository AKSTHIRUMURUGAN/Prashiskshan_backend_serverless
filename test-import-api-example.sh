#!/bin/bash

# Example script to test the student bulk import API
# Replace YOUR_ADMIN_TOKEN with an actual admin JWT token

ADMIN_TOKEN="YOUR_ADMIN_TOKEN"
BASE_URL="http://localhost:5000/api/admins"

echo "=== Student Bulk Import API Test ==="
echo ""

# Step 1: Start import
echo "Step 1: Starting bulk import..."
RESPONSE=$(curl -s -X POST "$BASE_URL/students/import" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      {
        "email": "test.student1@example.com",
        "name": "Test Student One",
        "department": "Computer Science",
        "year": 3,
        "college": "Test College",
        "rollNumber": "CS2021001",
        "phone": "1234567890",
        "bio": "Test student for bulk import",
        "skills": "JavaScript,Python,React",
        "interests": "Web Development,AI"
      },
      {
        "email": "test.student2@example.com",
        "name": "Test Student Two",
        "department": "Electrical Engineering",
        "year": 2,
        "college": "Test College",
        "rollNumber": "EE2022001"
      }
    ]
  }')

echo "$RESPONSE"
echo ""

# Extract jobId from response
JOB_ID=$(echo "$RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "Error: Could not extract jobId from response"
  exit 1
fi

echo "Job ID: $JOB_ID"
echo ""

# Step 2: Check status (wait a bit for processing)
echo "Step 2: Checking import status..."
sleep 2

STATUS_RESPONSE=$(curl -s "$BASE_URL/students/import/$JOB_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$STATUS_RESPONSE"
echo ""

# Step 3: Download credentials
echo "Step 3: Downloading credentials..."
curl -s "$BASE_URL/students/import/$JOB_ID/credentials" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o "credentials-$JOB_ID.csv"

if [ -f "credentials-$JOB_ID.csv" ]; then
  echo "Credentials saved to: credentials-$JOB_ID.csv"
  echo ""
  echo "Contents:"
  cat "credentials-$JOB_ID.csv"
else
  echo "Error: Could not download credentials"
fi

echo ""
echo "=== Test Complete ==="
