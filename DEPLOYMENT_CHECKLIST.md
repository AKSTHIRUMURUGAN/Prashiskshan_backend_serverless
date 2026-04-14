# Vercel Deployment Checklist

Complete this checklist before and after deploying to Vercel.

## Pre-Deployment

### 1. Code Preparation
- [ ] All code committed to Git
- [ ] No sensitive data in code (API keys, passwords)
- [ ] All imports use `.js` extensions
- [ ] No console.logs in production code (use logger)
- [ ] Error handling implemented for all routes
- [ ] Input validation on all endpoints

### 2. Dependencies
- [ ] `package.json` has all required dependencies
- [ ] No dev dependencies in production code
- [ ] All packages are up to date
- [ ] No security vulnerabilities (`npm audit`)

### 3. Configuration Files
- [ ] `vercel.json` configured correctly
- [ ] `.vercelignore` excludes unnecessary files
- [ ] `.env.example` updated with all variables
- [ ] No `.env` file in Git repository

### 4. Environment Variables
- [ ] `NODE_ENV` set to production
- [ ] `API_URL` configured
- [ ] `FRONTEND_URL` configured
- [ ] `MONGODB_URI` configured
- [ ] `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` configured
- [ ] `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` configured
- [ ] `JWT_SECRET` generated (strong random string)
- [ ] `CRON_SECRET` generated (strong random string)
- [ ] All AWS/S3 credentials configured
- [ ] All Cloudflare R2 credentials configured
- [ ] ImageKit credentials configured
- [ ] Email service credentials configured (Brevo/Mailgun)
- [ ] Twilio credentials configured
- [ ] Sentry DSN configured
- [ ] Gemini API key configured
- [ ] All AI model names configured

### 5. External Services

#### MongoDB Atlas
- [ ] Database created
- [ ] User created with appropriate permissions
- [ ] Network access configured (whitelist `0.0.0.0/0`)
- [ ] Connection string tested
- [ ] Indexes created (run migration scripts)

#### Redis Cloud
- [ ] Redis instance created
- [ ] Eviction policy set to `noeviction`
- [ ] Connection tested
- [ ] Password secured

#### Firebase
- [ ] Project created
- [ ] Service account created
- [ ] Private key downloaded
- [ ] Authentication enabled
- [ ] Security rules configured

#### AWS S3
- [ ] Bucket created
- [ ] IAM user created with S3 permissions
- [ ] CORS configured
- [ ] Public access settings configured

#### Cloudflare R2
- [ ] Bucket created
- [ ] API tokens generated
- [ ] Public URL configured

#### ImageKit
- [ ] Account created
- [ ] API keys generated
- [ ] URL endpoint configured

#### Email Services
- [ ] Brevo account created and API key generated
- [ ] Mailgun account created and domain verified
- [ ] From email addresses verified

#### Twilio
- [ ] Account created
- [ ] Phone number purchased
- [ ] WhatsApp number configured

#### Sentry
- [ ] Project created
- [ ] DSN obtained

### 6. Testing
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Local server runs (`vercel dev`)
- [ ] All API endpoints tested
- [ ] Authentication flow tested
- [ ] File upload tested
- [ ] Database operations tested
- [ ] Redis operations tested
- [ ] Queue processing tested

### 7. Documentation
- [ ] API documentation up to date
- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment guide reviewed

## Deployment

### 1. Vercel Setup
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged in to Vercel (`vercel login`)
- [ ] Project created on Vercel dashboard

### 2. Initial Deployment
- [ ] Run `vercel` for preview deployment
- [ ] Test preview deployment
- [ ] Fix any issues
- [ ] Run `vercel --prod` for production

### 3. Environment Variables in Vercel
- [ ] All environment variables added to Vercel project
- [ ] Variables verified (no typos)
- [ ] Sensitive variables marked as sensitive
- [ ] Variables applied to production environment

### 4. Cron Jobs
- [ ] Cron jobs configured in `vercel.json`
- [ ] `CRON_SECRET` added to environment variables
- [ ] Cron job endpoints tested manually
- [ ] Verify cron jobs are on paid plan (required for Vercel Cron)

## Post-Deployment

### 1. Verification
- [ ] Deployment successful (check Vercel dashboard)
- [ ] No build errors
- [ ] No runtime errors in logs
- [ ] Health endpoint responds: `https://your-domain.vercel.app/health`
- [ ] API health responds: `https://your-domain.vercel.app/api/health`

### 2. API Testing
- [ ] Authentication endpoints work
- [ ] Student endpoints work
- [ ] Company endpoints work
- [ ] Admin endpoints work
- [ ] Mentor endpoints work
- [ ] File upload works
- [ ] Notifications work

### 3. Database Connectivity
- [ ] MongoDB connection successful (check logs)
- [ ] Redis connection successful (check logs)
- [ ] No connection errors in logs

### 4. External Services
- [ ] Firebase authentication works
- [ ] S3 file uploads work
- [ ] R2 file uploads work
- [ ] ImageKit uploads work
- [ ] Email sending works (Brevo/Mailgun)
- [ ] SMS sending works (Twilio)
- [ ] Gemini AI works
- [ ] Sentry error tracking works

### 5. Background Jobs
- [ ] Queues are processing jobs
- [ ] Bull Board accessible (if enabled)
- [ ] Cron jobs running on schedule
- [ ] No job failures in logs

### 6. Performance
- [ ] Response times acceptable (< 1s for most endpoints)
- [ ] No timeout errors
- [ ] Cold start times acceptable
- [ ] Database queries optimized

### 7. Security
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] Authentication required for protected routes
- [ ] No sensitive data exposed in responses
- [ ] Security headers present (Helmet.js)

### 8. Monitoring
- [ ] Vercel logs accessible
- [ ] Error tracking in Sentry
- [ ] Performance metrics visible
- [ ] Alerts configured (optional)

### 9. Documentation
- [ ] API documentation accessible: `https://your-domain.vercel.app/api-docs`
- [ ] OpenAPI spec accessible: `https://your-domain.vercel.app/api/docs.json`
- [ ] README updated with production URL

### 10. Frontend Integration
- [ ] Frontend updated with new API URL
- [ ] Frontend deployed
- [ ] End-to-end testing completed
- [ ] User flows tested

## Ongoing Maintenance

### Daily
- [ ] Check Vercel logs for errors
- [ ] Monitor Sentry for new errors
- [ ] Verify cron jobs ran successfully

### Weekly
- [ ] Review performance metrics
- [ ] Check database usage
- [ ] Check Redis usage
- [ ] Review API usage patterns

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Security audit (`npm audit`)
- [ ] Review and optimize slow queries
- [ ] Clean up old logs and data
- [ ] Review and update documentation

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # Rollback to previous deployment
   vercel rollback
   ```

2. **Check Logs**
   ```bash
   vercel logs
   ```

3. **Fix Issues Locally**
   - Test with `vercel dev`
   - Fix errors
   - Test again

4. **Redeploy**
   ```bash
   vercel --prod
   ```

## Emergency Contacts

- Vercel Support: https://vercel.com/support
- MongoDB Atlas Support: https://www.mongodb.com/cloud/atlas/support
- Redis Cloud Support: https://redis.com/company/support/
- Firebase Support: https://firebase.google.com/support

## Success Criteria

Deployment is successful when:
- [ ] All health checks pass
- [ ] All API endpoints respond correctly
- [ ] No errors in logs
- [ ] Database connections stable
- [ ] External services working
- [ ] Background jobs running
- [ ] Frontend can communicate with backend
- [ ] Users can register, login, and use the system

## Notes

- Vercel Cron requires a paid plan (Pro or Enterprise)
- Free tier has function execution limits
- Monitor usage to avoid unexpected charges
- Keep environment variables secure
- Regular backups of MongoDB recommended
- Document any custom configurations

---

## Deployment Status

- [ ] Pre-deployment checklist completed
- [ ] Deployment successful
- [ ] Post-deployment verification completed
- [ ] Production ready

**Deployed by:** _________________  
**Date:** _________________  
**Deployment URL:** _________________  
**Notes:** _________________

---

Good luck with your deployment! 🚀
