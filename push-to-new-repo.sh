#!/bin/bash

# Script to push backend to new serverless repository
# Repository: https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless.git

echo "🚀 Pushing backend to new serverless repository..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in backend directory. Please run from backend folder."
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files..."
git add .

# Create .gitignore if it doesn't exist or update it
echo "🔒 Updating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.development

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/

# Testing
coverage/
.nyc_output/
*.lcov

# Build
dist/
build/
tmp/
temp/

# Vercel
.vercel

# Misc
*.pem
.cache
.next
out

# Firebase
.firebase/
firebase-debug.log

# Local files
response.json
response_short.json
response_utf8.json
error.txt
EOF

# Commit
echo "💾 Creating commit..."
git add .
git commit -m "Initial commit: Serverless backend for Vercel deployment

- Converted Express app to serverless functions
- Added Vercel configuration with cron jobs
- Created comprehensive deployment documentation
- All 150+ API endpoints preserved
- Background workers converted to cron jobs
- Redis and MongoDB cloud integration
- Complete deployment guides and checklists"

# Add remote
echo "🔗 Adding remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless.git

# Push to main branch
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "✅ Successfully pushed to new repository!"
echo "📍 Repository: https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless"
echo ""
echo "🎯 Next steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import the repository"
echo "3. Configure environment variables"
echo "4. Deploy!"
echo ""
echo "📚 Documentation:"
echo "- Quick Start: QUICK_START.md"
echo "- Full Guide: VERCEL_DEPLOYMENT_GUIDE.md"
echo "- API Reference: API_ENDPOINTS_REFERENCE.md"
