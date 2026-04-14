# Quick Start - Vercel Deployment

Get your backend deployed to Vercel in 5 minutes!

## Prerequisites

- Vercel account (free at https://vercel.com)
- All environment variables ready (from `.env` file)

## Step 1: Install Vercel CLI (1 minute)

```bash
npm install -g vercel
```

## Step 2: Login (30 seconds)

```bash
vercel login
```

## Step 3: Deploy (2 minutes)

```bash
cd backend
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- Project name? **prashiskshan-backend**
- In which directory is your code located? **./**
- Want to override settings? **N**

## Step 4: Add Environment Variables (2 minutes)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from your `.env` file

**Critical variables:**
```bash
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
JWT_SECRET=your_jwt_secret
CRON_SECRET=generate_random_secret
# ... add all others from .env
```

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Test (30 seconds)

```bash
# Replace with your Vercel URL
curl https://your-project.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "Prashiskshan API is healthy"
}
```

## Done! 🎉

Your backend is now live at: `https://your-project.vercel.app`

## Next Steps

1. **Update Frontend**: Change API URL to your Vercel URL
2. **Test APIs**: Visit `https://your-project.vercel.app/api-docs`
3. **Monitor**: Check Vercel dashboard for logs
4. **Fix Redis**: Set eviction policy to `noeviction` in Redis Cloud

## Important Notes

⚠️ **Cron Jobs**: Require Vercel Pro plan ($20/month)  
⚠️ **Redis**: Must set eviction policy to `noeviction`  
⚠️ **MongoDB**: Whitelist `0.0.0.0/0` in Atlas network access  

## Troubleshooting

**Deployment failed?**
```bash
vercel logs
```

**Environment variable missing?**
- Check Vercel dashboard → Settings → Environment Variables
- Redeploy after adding variables

**API not responding?**
- Check logs: `vercel logs`
- Verify MongoDB and Redis connections
- Test locally: `vercel dev`

## Full Documentation

For detailed instructions, see:
- `VERCEL_DEPLOYMENT_GUIDE.md` - Complete guide
- `API_ENDPOINTS_REFERENCE.md` - All endpoints
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

## Support

- Vercel Docs: https://vercel.com/docs
- Issues? Check logs: `vercel logs`
- Rollback: `vercel rollback`

---

**Time to deploy**: ~5 minutes  
**Difficulty**: Easy  
**Cost**: Free tier available (Pro recommended for cron jobs)

Happy deploying! 🚀
