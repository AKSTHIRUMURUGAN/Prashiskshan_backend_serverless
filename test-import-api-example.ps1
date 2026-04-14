# PowerShell script to test the student bulk import API
# Replace YOUR_ADMIN_TOKEN with an actual admin JWT token

$ADMIN_TOKEN = "YOUR_ADMIN_TOKEN"
$BASE_URL = "http://localhost:5000/api/admins"

Write-Host "=== Student Bulk Import API Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start import
Write-Host "Step 1: Starting bulk import..." -ForegroundColor Yellow

$body = @{
    students = @(
        @{
            email = "test.student1@example.com"
            name = "Test Student One"
            department = "Computer Science"
            year = 3
            college = "Test College"
            rollNumber = "CS2021001"
            phone = "1234567890"
            bio = "Test student for bulk import"
            skills = "JavaScript,Python,React"
            interests = "Web Development,AI"
        },
        @{
            email = "test.student2@example.com"
            name = "Test Student Two"
            department = "Electrical Engineering"
            year = 2
            college = "Test College"
            rollNumber = "EE2022001"
        }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $ADMIN_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/students/import" -Method Post -Headers $headers -Body $body
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    
    $jobId = $response.data.jobId
    Write-Host "Job ID: $jobId" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Check status (wait a bit for processing)
    Write-Host "Step 2: Checking import status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    $statusResponse = Invoke-RestMethod -Uri "$BASE_URL/students/import/$jobId" -Method Get -Headers $headers
    Write-Host ($statusResponse | ConvertTo-Json -Depth 10)
    Write-Host ""
    
    # Step 3: Download credentials
    Write-Host "Step 3: Downloading credentials..." -ForegroundColor Yellow
    $credentialsFile = "credentials-$jobId.csv"
    
    Invoke-WebRequest -Uri "$BASE_URL/students/import/$jobId/credentials" -Headers $headers -OutFile $credentialsFile
    
    if (Test-Path $credentialsFile) {
        Write-Host "Credentials saved to: $credentialsFile" -ForegroundColor Green
        Write-Host ""
        Write-Host "Contents:" -ForegroundColor Yellow
        Get-Content $credentialsFile
    } else {
        Write-Host "Error: Could not download credentials" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
