# Test script for verification email endpoint (PowerShell)
# Usage: .\test-verification-endpoint.ps1 -AuthToken "YOUR_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$AuthToken,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:5000"
)

Write-Host "Testing verification email endpoint..." -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $AuthToken"
    }
    
    $response = Invoke-WebRequest `
        -Uri "$ApiUrl/api/auth/send-verification-email" `
        -Method POST `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API call successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Check your email inbox"
        Write-Host "2. Check server logs for email sending details"
        Write-Host "3. If no email received, run: node debug-email-config.js"
    }
} catch {
    Write-Host "❌ API call failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "1. Verify your auth token is valid"
    Write-Host "2. Check if the server is running"
    Write-Host "3. Check server logs for errors"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Response Body:"
        Write-Host $responseBody
    }
}
