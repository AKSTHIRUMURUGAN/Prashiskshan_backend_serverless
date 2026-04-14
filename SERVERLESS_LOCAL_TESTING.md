# Local Testing for Serverless Deployment

Test your serverless setup locally before deploying to Vercel.

## Prerequisites

```bash
npm install -g vercel
```

## 1. Test Locally with Vercel Dev

Vercel CLI provides a local development server that simulates the serverless environment:

```bash
cd backend
vercel dev
```

This will:
- Start a local server (usually on port 3000)
- Simulate Vercel's serverless environment
- Hot reload on file changes
- Use your local `.env` file

### Test Endpoints

```bash
# Health check
curl http://localhost:3000/health

# API health
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 2. Test Cron Jobs Locally

Cron jobs can be tested by calling them directly with the cron secret:

```bash
# Set your cron secret
export CRON_SECRET="your-test-secret"

# Test metrics cron
curl -X POST http://localhost:3000/api/cron/metrics \
  -H "Authorization: Bearer your-test-secret"

# Test credit reminders
curl -X POST http://localhost:3000/api/cron/credit-reminders \
  -H "Authorization: Bearer your-test-secret"

# Test deadline reminders
curl -X POST http://localhost:3000/api/cron/deadline-reminders \
  -H "Authorization: Bearer your-test-secret"

# Test expired internships
curl -X POST http://localhost:3000/api/cron/expired-internships \
  -H "Authorization: Bearer your-test-secret"

# Test analytics snapshot
curl -X POST http://localhost:3000/api/cron/analytics-snapshot \
  -H "Authorization: Bearer your-test-secret"
```

## 3. Test with Traditional Server (Alternative)

You can still run the traditional Express server for development:

```bash
# Start the main server
npm run dev

# In another terminal, start workers
npm run workers:dev
```

This runs on `http://localhost:5000` and includes all background workers.

## 4. Environment Variables

Create a `.env` file in the backend directory with all required variables:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your values
nano .env
```

## 5. Database Connection Testing

Test MongoDB connection:

```bash
node -e "
import('./src/config/database.js').then(async ({ connectDB }) => {
  await connectDB();
  console.log('MongoDB connected successfully');
  process.exit(0);
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});
"
```

Test Redis connection:

```bash
node -e "
import('./src/config/redis.js').then(async (redis) => {
  const pong = await redis.default.ping();
  console.log('Redis connected successfully:', pong);
  process.exit(0);
}).catch(err => {
  console.error('Redis connection failed:', err);
  process.exit(1);
});
"
```

## 6. API Testing with Postman/Thunder Client

Import the OpenAPI spec into your API testing tool:

1. Start the server: `vercel dev` or `npm run dev`
2. Download the spec: `curl http://localhost:3000/api/docs.json > openapi.json`
3. Import into Postman/Thunder Client
4. Test all endpoints

## 7. Load Testing

Test serverless function performance:

```bash
# Install Apache Bench
# On Windows: Download from Apache website
# On Mac: brew install httpd
# On Linux: sudo apt-get install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test API endpoint
ab -n 1000 -c 10 http://localhost:3000/api/health
```

## 8. Check Bundle Size

Vercel has deployment size limits. Check your bundle:

```bash
# Install size analyzer
npm install -g @vercel/ncc

# Analyze main function
ncc build api/index.js -o dist

# Check size
du -sh dist
```

## 9. Verify All Routes

Run the route validation script:

```bash
npm run validate:routes
```

## 10. Test Queue Processing

Test that jobs are properly queued and processed:

```bash
# Start server
vercel dev

# In another terminal, trigger a job
curl -X POST http://localhost:3000/api/students/chatbot \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello"}'

# Check Bull Board
open http://localhost:3000/admin/queues
```

## Common Issues & Solutions

### Issue: Module not found

**Solution:** Ensure all imports use `.js` extensions:
```javascript
// Good
import config from './config/index.js';

// Bad
import config from './config/index';
```

### Issue: Environment variables not loaded

**Solution:** 
```bash
# Vercel dev uses .env automatically
# For npm run dev, ensure dotenv is configured
```

### Issue: Redis connection timeout

**Solution:**
```bash
# Check Redis is accessible
redis-cli -h your-redis-host -p your-redis-port -a your-password ping
```

### Issue: MongoDB connection failed

**Solution:**
```bash
# Check MongoDB URI is correct
# Ensure IP whitelist includes your IP
# Test connection with mongosh
mongosh "your-mongodb-uri"
```

## Pre-Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Local server runs: `vercel dev`
- [ ] All API endpoints respond correctly
- [ ] Cron jobs can be triggered manually
- [ ] Database connections work
- [ ] Redis connections work
- [ ] File uploads work
- [ ] Authentication works
- [ ] Rate limiting works
- [ ] Error handling works
- [ ] Logs are generated correctly

## Performance Benchmarks

Expected response times (local):
- Health check: < 50ms
- Simple API calls: < 200ms
- Database queries: < 500ms
- File uploads: < 2s
- AI operations: < 5s

## Next Steps

Once local testing is complete:

1. Commit your changes
2. Deploy to Vercel: `vercel --prod`
3. Test production deployment
4. Monitor logs and performance

---

Happy testing! 🚀
