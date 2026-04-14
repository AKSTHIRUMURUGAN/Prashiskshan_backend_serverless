# Prashiskshan Backend - Serverless Edition

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless)

NEP 2020 compliant internship management system backend, optimized for Vercel serverless deployment.

## 🚀 Quick Deploy

### Option 1: One-Click Deploy

Click the button above to deploy directly to Vercel.

### Option 2: Manual Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Clone repository
git clone https://github.com/AKSTHIRUMURUGAN/Prashiskshan_backend_serverless.git
cd Prashiskshan_backend_serverless

# Deploy
vercel --prod
```

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Deploy in 5 minutes
- **[Complete Deployment Guide](VERCEL_DEPLOYMENT_GUIDE.md)** - Detailed instructions
- **[API Reference](API_ENDPOINTS_REFERENCE.md)** - All 150+ endpoints
- **[Local Testing](SERVERLESS_LOCAL_TESTING.md)** - Test before deployment
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

## ✨ Features

- **150+ API Endpoints** - Complete internship management system
- **Serverless Architecture** - Auto-scaling, zero maintenance
- **Background Jobs** - Automated tasks via Vercel Cron
- **Cloud Integration** - MongoDB Atlas, Redis Cloud, Firebase
- **File Storage** - AWS S3, Cloudflare R2, ImageKit
- **AI Features** - Interview practice, chatbot, recommendations
- **NEP 2020 Compliant** - Credit transfer system
- **Comprehensive Documentation** - 6 detailed guides

## 🔧 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js (serverless)
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **Auth**: Firebase Authentication
- **Queue**: BullMQ
- **Storage**: AWS S3, Cloudflare R2, ImageKit
- **Email**: Brevo, Mailgun
- **SMS**: Twilio
- **AI**: Google Gemini
- **Monitoring**: Sentry
- **Deployment**: Vercel

## 📋 Prerequisites

- Vercel account (free tier available)
- MongoDB Atlas database
- Redis Cloud instance
- Firebase project
- AWS S3 bucket (or Cloudflare R2)
- Email service (Brevo or Mailgun)
- Twilio account (for SMS)

## 🎯 Environment Variables

Required environment variables (add in Vercel dashboard):

```bash
# Server
NODE_ENV=production
API_URL=https://your-domain.vercel.app
FRONTEND_URL=https://your-frontend.com

# Database
MONGODB_URI=your_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# Authentication
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
JWT_SECRET=your_jwt_secret

# Cron Security
CRON_SECRET=your_random_secret

# ... (see .env.example for complete list)
```

## 🔄 API Endpoints

### Authentication
- POST `/api/auth/students/register` - Register student
- POST `/api/auth/companies/register` - Register company
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get profile
- And 10+ more...

### Students
- GET `/api/students/dashboard` - Student dashboard
- GET `/api/students/internships` - Browse internships
- POST `/api/students/internships/:id/apply` - Apply to internship
- And 30+ more...

### Companies
- GET `/api/companies/dashboard` - Company dashboard
- POST `/api/companies/internships` - Create internship
- GET `/api/companies/applications` - View applications
- And 35+ more...

### Admins
- GET `/api/admins/dashboard` - Admin dashboard
- POST `/api/admins/companies/:id/verify` - Verify company
- GET `/api/admins/internships/list` - List internships
- And 50+ more...

**Total**: 150+ endpoints

See [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) for complete list.

## 🔐 Security

- Firebase Authentication
- JWT token validation
- Rate limiting (Redis-backed)
- Helmet.js security headers
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Background Jobs

Automated tasks via Vercel Cron:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Metrics | Every hour | Calculate system metrics |
| Credit Reminders | Daily 9 AM | Send overdue reminders |
| Deadline Reminders | Daily 8 AM | Notify upcoming deadlines |
| Expired Internships | Daily midnight | Mark expired internships |
| Analytics Snapshot | Daily 2 AM | Create daily snapshots |

## 🧪 Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Test locally
vercel dev
```

## 📈 Performance

- Health check: < 100ms
- Simple API calls: < 300ms
- Database queries: < 500ms
- File uploads: < 3s
- AI operations: < 10s

## 🐛 Troubleshooting

### Common Issues

**Function Timeout**
- Optimize database queries
- Use connection pooling (already implemented)
- Consider upgrading Vercel plan

**Redis Connection**
- Set eviction policy to `noeviction`
- Check Redis Cloud firewall
- Verify credentials

**MongoDB Connection**
- Whitelist `0.0.0.0/0` in Atlas
- Verify connection string
- Check network access

See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for more troubleshooting.

## 📞 Support

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
- [Firebase](https://firebase.google.com/)

## 📝 License

MIT

## 🙏 Acknowledgments

Built for NEP 2020 compliance with modern serverless architecture.

---

**Status**: Production Ready ✅  
**Deployment**: Vercel Serverless  
**APIs**: 150+ endpoints  
**Documentation**: 6 comprehensive guides  

**Get Started**: Read [QUICK_START.md](QUICK_START.md) to deploy in 5 minutes!
