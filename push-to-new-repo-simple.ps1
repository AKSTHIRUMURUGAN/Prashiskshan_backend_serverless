# PowerShell script to push backend to new serverless repository
# Repository: https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless.git

Write-Host "Pushing backend to new serverless repository..." -ForegroundColor Cyan

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Not in backend directory. Please run from backend folder." -ForegroundColor Red
    exit 1
}

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Creating commit..." -ForegroundColor Yellow
$commitMessage = @"
Initial commit: Serverless backend for Vercel deployment

- Converted Express app to serverless functions
- Added Vercel configuration with cron jobs
- Created comprehensive deployment documentation
- All 150+ API endpoints preserved
- Background workers converted to cron jobs
- Redis and MongoDB cloud integration
- Complete deployment guides and checklists
"@

git commit -m $commitMessage

# Add remote
Write-Host "Adding remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless.git

# Push to main branch
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main --force

Write-Host ""
Write-Host "Successfully pushed to new repository!" -ForegroundColor Green
Write-Host "Repository: https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://vercel.com/new"
Write-Host "2. Import the repository"
Write-Host "3. Configure environment variables"
Write-Host "4. Deploy!"
