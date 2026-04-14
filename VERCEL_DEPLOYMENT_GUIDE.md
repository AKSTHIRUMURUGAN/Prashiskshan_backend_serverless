# Vercel Serverless Deployment Guide

This guide will help you deploy the Prashiskshan backend to Vercel as a serverless application.

## 📋 Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm install -g vercel`
3. Cloud Redis instance (already configured)
4. MongoDB Atlas (already configured)
5. All external services configured (Firebase, AWS S3, etc.)

## 🚀 Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Navigate to Backend Directory

```bash
cd backend
```

### 4. Deploy to Vercel

For the first deployment:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **prashiskshan-backend** (or your preferred name)
- In which directory is your code located? **./**
- Want to override settings? **N**

For production deployment:

```bash
vercel --prod
```

### 5. Configure Environment Variables

Go to your Vercel project dashboard and add all environment variables from your `.env` file:

**Required Environment Variables:**

```bash
# Server
NODE_ENV=production
PORT=5000
API_URL=https://your-vercel-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.com

# MongoDB
MONGODB_URI=your_mongodb_uri
MONGODB_TEST_URI=your_mongodb_test_uri

# Redis (Cloud)
REDIS_HOST=redis-15863.c99.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=15863
REDIS_PASSWORD=your_redis_password

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_WEB_API_KEY=your_web_api_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_FLASH=gemini-flash-latest
GEMINI_MODEL_PRO=gemini-pro

# AWS S3
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your_bucket_name

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_PUBLIC_URL=your_public_url

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=your_url_endpoint

# Email (Brevo)
BREVO_API_KEY=your_api_key
BREVO_FROM_EMAIL=your_email
BREVO_FROM_NAME=Prashiskshan

# Mailgun
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain
MAILGUN_FROM_EMAIL=your_email

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number

# Sentry
SENTRY_DSN=your_sentry_dsn

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Limits
AI_INTERVIEW_DAILY_LIMIT=3
AI_CHATBOT_DAILY_LIMIT=50
AI_SUMMARY_DAILY_LIMIT=10

# Cron Security (Generate a random secret)
CRON_SECRET=your_random_secret_for_cron_jobs

# Optional: Enable Bull Board in production
ENABLE_BULL_BOARD=false
```

### 6. Set Up Cron Jobs

Vercel Cron jobs are configured in `vercel.json`. They will automatically run at specified intervals:

- **Metrics**: Every hour
- **Credit Reminders**: Daily at 9 AM
- **Deadline Reminders**: Daily at 8 AM
- **Expired Internships**: Daily at midnight
- **Analytics Snapshot**: Daily at 2 AM

**Important:** Generate a secure `CRON_SECRET` and add it to your environment variables:

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this secret to Vercel environment variables as `CRON_SECRET`.

### 7. Configure Redis Eviction Policy

Your Redis Cloud instance needs the correct eviction policy for BullMQ:

1. Log in to Redis Labs (https://app.redislabs.com)
2. Select your database
3. Go to Configuration
4. Change "Eviction policy" from `volatile-lru` to `noeviction`
5. Save changes

## 📁 Project Structure

```
backend/
├── api/
│   ├── index.js              # Main serverless handler
│   └── cron/                 # Cron job handlers
│       ├── metrics.js
│       ├── credit-reminders.js
│       ├── deadline-reminders.js
│       ├── expired-internships.js
│       └── analytics-snapshot.js
├── src/
│   ├── routes/               # All API routes (preserved)
│   ├── controllers/          # Business logic
│   ├── models/               # Database models
│   ├── middleware/           # Express middleware
│   ├── services/             # Service layer
│   ├── utils/                # Utilities
│   ├── config/               # Configuration
│   ├── queues/               # BullMQ queues
│   └── workers/              # Background workers
├── vercel.json               # Vercel configuration
├── .vercelignore             # Files to ignore
└── package.json              # Dependencies
```

## 🔄 All APIs Preserved

All your existing APIs are preserved and will work exactly the same:

### Authentication Routes (`/api/auth`)
- POST `/api/auth/students/register`
- POST `/api/auth/companies/register`
- POST `/api/auth/mentors/register`
- POST `/api/auth/admins/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- PATCH `/api/auth/me`
- And all other auth endpoints...

### Student Routes (`/api/students`)
- GET `/api/students/dashboard`
- GET `/api/students/profile`
- GET `/api/students/internships`
- POST `/api/students/internships/:internshipId/apply`
- And all other student endpoints...

### Company Routes (`/api/companies`)
- GET `/api/companies/dashboard`
- POST `/api/companies/internships`
- GET `/api/companies/applications`
- And all other company endpoints...

### Admin Routes (`/api/admins`)
- GET `/api/admins/dashboard`
- GET `/api/admins/companies/pending`
- POST `/api/admins/companies/:companyId/verify`
- GET `/api/admins/internships/list`
- And all other admin endpoints...

### Other Routes
- `/api/mentors` - Mentor endpoints
- `/api/internships` - Internship endpoints
- `/api/applications` - Application endpoints
- `/api/logbooks` - Logbook endpoints
- `/api/notifications` - Notification endpoints
- `/api/interviews` - Interview endpoints
- `/api/metrics` - Metrics endpoints
- `/api/upload` - File upload endpoints

## 🔍 Testing Your Deployment

### 1. Test Health Endpoint

```bash
curl https://your-vercel-domain.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "Prashiskshan API is healthy",
  "uptime": 123.45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test API Endpoint

```bash
curl https://your-vercel-domain.vercel.app/api/health
```

### 3. Test Authentication

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 4. View API Documentation

Visit: `https://your-vercel-domain.vercel.app/api-docs`

## 🐛 Troubleshooting

### Issue: Function timeout

**Solution:** Vercel has a 10-second timeout for Hobby plan, 60 seconds for Pro. Optimize long-running operations or upgrade your plan.

### Issue: Cold starts

**Solution:** Serverless functions have cold starts. First request may be slower. Consider:
- Using Vercel Pro for better performance
- Implementing warming strategies
- Optimizing database connections (already implemented with connection caching)

### Issue: Redis connection errors

**Solution:** 
- Verify Redis credentials in environment variables
- Ensure Redis eviction policy is set to `noeviction`
- Check Redis Cloud firewall settings

### Issue: MongoDB connection errors

**Solution:**
- Verify MongoDB URI in environment variables
- Check MongoDB Atlas network access settings
- Ensure IP whitelist includes `0.0.0.0/0` for Vercel

### Issue: Cron jobs not running

**Solution:**
- Verify `CRON_SECRET` is set in environment variables
- Check Vercel deployment logs
- Ensure you're on a paid Vercel plan (cron jobs require Pro plan)

## 📊 Monitoring

### View Logs

```bash
vercel logs your-deployment-url
```

Or view in Vercel dashboard: Project → Deployments → Select deployment → Logs

### Monitor Performance

- Vercel Dashboard → Analytics
- Check function execution times
- Monitor error rates

### Bull Board (Queue Monitoring)

Access at: `https://your-vercel-domain.vercel.app/admin/queues`

(Only available if `ENABLE_BULL_BOARD=true` in environment variables)

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CRON_SECRET**: Use a strong random secret for cron job authentication
3. **CORS**: Update `FRONTEND_URL` to your actual frontend domain
4. **Rate Limiting**: Already configured, adjust limits in environment variables
5. **Firebase**: Ensure Firebase security rules are properly configured

## 🚀 Continuous Deployment

Vercel automatically deploys when you push to your Git repository:

1. Connect your GitHub/GitLab/Bitbucket repository to Vercel
2. Push changes to your main branch
3. Vercel automatically builds and deploys

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📝 Important Notes

1. **Background Workers**: Workers are replaced by Vercel Cron jobs. Jobs are queued and processed by the same serverless functions.

2. **File Uploads**: File uploads work through memory storage and are immediately uploaded to S3/R2/ImageKit. No local file system storage.

3. **Database Connections**: Connection pooling is handled automatically with caching for serverless functions.

4. **Redis**: Must use cloud Redis (already configured). Local Redis won't work in serverless.

5. **Logs**: Use Vercel logs or integrate with external logging services (Sentry already configured).

## 🎯 Next Steps

1. Deploy to Vercel
2. Configure all environment variables
3. Test all API endpoints
4. Update frontend to use new API URL
5. Monitor logs and performance
6. Set up custom domain (optional)

## 📞 Support

If you encounter issues:
- Check Vercel documentation: https://vercel.com/docs
- Review deployment logs
- Verify all environment variables are set correctly
- Ensure external services (MongoDB, Redis, Firebase) are accessible

## ✅ Deployment Checklist

- [ ] Vercel CLI installed
- [ ] Logged in to Vercel
- [ ] All environment variables configured
- [ ] CRON_SECRET generated and set
- [ ] Redis eviction policy set to `noeviction`
- [ ] MongoDB Atlas network access configured
- [ ] First deployment successful
- [ ] Health endpoint tested
- [ ] API endpoints tested
- [ ] Cron jobs verified
- [ ] Frontend updated with new API URL
- [ ] Custom domain configured (optional)

---

Your backend is now serverless and ready for production! 🎉
