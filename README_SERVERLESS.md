# Prashiskshan Backend - Serverless Edition

NEP 2020 compliant internship management system backend, optimized for Vercel serverless deployment.

## 🚀 Quick Start

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd backend
vercel --prod
```

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
nano .env

# Run with Vercel dev (simulates serverless)
vercel dev

# OR run traditional server
npm run dev
```

## 📁 Project Structure

```
backend/
├── api/                      # Serverless functions
│   ├── index.js             # Main API handler
│   └── cron/                # Cron job handlers
│       ├── metrics.js
│       ├── credit-reminders.js
│       ├── deadline-reminders.js
│       ├── expired-internships.js
│       └── analytics-snapshot.js
├── src/                     # Application code
│   ├── routes/              # API routes
│   ├── controllers/         # Business logic
│   ├── models/              # Database models
│   ├── middleware/          # Express middleware
│   ├── services/            # Service layer
│   ├── utils/               # Utilities
│   ├── config/              # Configuration
│   ├── queues/              # BullMQ queues
│   └── workers/             # Background workers
├── vercel.json              # Vercel configuration
├── .vercelignore            # Deployment exclusions
└── package.json             # Dependencies
```

## 🔧 Configuration

### Environment Variables

Required environment variables (add to Vercel project settings):

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

# External Services
GEMINI_API_KEY=your_gemini_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
# ... (see .env.example for complete list)

# Cron Security
CRON_SECRET=your_random_secret
```

### Vercel Configuration

The `vercel.json` file configures:
- Serverless function routing
- Cron job schedules
- Environment settings

## 📊 Features

### All APIs Preserved ✅

- **Authentication**: Registration, login, profile management
- **Students**: Dashboard, internship browsing, applications, logbooks
- **Companies**: Internship posting, applicant management, analytics
- **Admins**: Company verification, internship approval, system analytics
- **Mentors**: Student supervision, credit request reviews
- **Credit Transfer**: NEP 2020 compliant credit management
- **AI Features**: Interview practice, chatbot, recommendations
- **File Uploads**: Profile images, resumes, documents
- **Notifications**: Email, SMS, in-app notifications
- **Analytics**: Comprehensive reporting and metrics

### Background Jobs (Cron)

Automated tasks run on schedule:
- **Metrics Calculation**: Hourly
- **Credit Reminders**: Daily at 9 AM
- **Deadline Reminders**: Daily at 8 AM
- **Expired Internships**: Daily at midnight
- **Analytics Snapshots**: Daily at 2 AM

### Queue Processing

BullMQ queues for async operations:
- Email sending
- SMS notifications
- Logbook processing
- Report generation
- AI processing
- Credit notifications

## 🔐 Security

- Firebase Authentication
- JWT token validation
- Rate limiting (Redis-backed)
- Helmet.js security headers
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

## 📈 Monitoring

### Vercel Dashboard
- Function execution logs
- Performance metrics
- Error tracking
- Deployment history

### Bull Board
Access queue monitoring at: `/admin/queues`

### Sentry Integration
Error tracking and performance monitoring configured.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Validate API documentation
npm run validate:docs
```

## 📚 Documentation

- [Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API Reference](./API_ENDPOINTS_REFERENCE.md) - All API endpoints
- [Local Testing](./SERVERLESS_LOCAL_TESTING.md) - Test before deployment
- [API Documentation](https://your-domain.vercel.app/api-docs) - Interactive Swagger UI

## 🔄 Deployment Workflow

### Automatic Deployment (Recommended)

1. Connect GitHub repository to Vercel
2. Push to main branch
3. Vercel automatically builds and deploys

### Manual Deployment

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## 🐛 Troubleshooting

### Common Issues

**Function Timeout**
- Optimize database queries
- Use connection pooling (already implemented)
- Consider upgrading Vercel plan

**Cold Starts**
- First request may be slower
- Subsequent requests are fast
- Use Vercel Pro for better performance

**Redis Connection**
- Ensure eviction policy is `noeviction`
- Check Redis Cloud firewall settings
- Verify credentials in environment variables

**MongoDB Connection**
- Whitelist `0.0.0.0/0` in Atlas
- Verify connection string
- Check network access settings

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for more troubleshooting tips.

## 📊 Performance

### Benchmarks

- Health check: < 100ms
- Simple API calls: < 300ms
- Database queries: < 500ms
- File uploads: < 3s
- AI operations: < 10s

### Optimization

- Database connection caching
- Redis connection pooling
- Compression enabled
- Response caching where appropriate
- Efficient query patterns

## 🔗 Links

- [Vercel Documentation](https://vercel.com/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
- [Firebase](https://firebase.google.com/)

## 📝 License

MIT

## 👥 Support

For issues and questions:
1. Check the documentation
2. Review Vercel deployment logs
3. Verify environment variables
4. Test locally with `vercel dev`

## 🎯 Roadmap

- [ ] WebSocket support for real-time features
- [ ] GraphQL API endpoint
- [ ] Enhanced caching strategies
- [ ] Multi-region deployment
- [ ] Advanced analytics dashboard

---

Built with ❤️ for NEP 2020 compliance

**Status**: Production Ready ✅
**Deployment**: Vercel Serverless
**Database**: MongoDB Atlas
**Cache**: Redis Cloud
**Auth**: Firebase
**Queue**: BullMQ
