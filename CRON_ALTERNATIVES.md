# Cron Job Alternatives for Vercel Free Tier

Vercel's Hobby (free) plan only allows daily cron jobs. Here are your options:

## Option 1: Use Daily Cron Jobs (Current Setup) ✅

**Updated Schedule (Free Tier Compatible):**

| Job | Schedule | Time | Purpose |
|-----|----------|------|---------|
| Expired Internships | `0 0 * * *` | Midnight | Mark expired internships |
| Analytics Snapshot | `0 2 * * *` | 2 AM | Create daily snapshots |
| Metrics | `0 3 * * *` | 3 AM | Calculate system metrics |
| Deadline Reminders | `0 8 * * *` | 8 AM | Notify upcoming deadlines |
| Credit Reminders | `0 9 * * *` | 9 AM | Send overdue reminders |

**This is already configured in `vercel.json`!**

### Pros:
- ✅ Free
- ✅ No additional setup
- ✅ Works on Vercel Hobby plan

### Cons:
- ❌ Metrics only calculated once per day (instead of hourly)
- ❌ Less frequent updates

## Option 2: Upgrade to Vercel Pro ($20/month)

Unlock hourly cron jobs and better performance.

**Benefits:**
- Hourly cron jobs
- 60-second function timeout (vs 10s on free)
- Better performance
- Priority support

**To upgrade:**
1. Go to https://vercel.com/account/billing
2. Select Pro plan
3. Update `vercel.json` to use hourly schedule:

```json
{
  "path": "/api/cron/metrics",
  "schedule": "0 * * * *"  // Every hour
}
```

## Option 3: Use External Cron Service (Free Alternative)

Use a free external service to trigger your cron endpoints.

### 3a. Cron-Job.org (Free)

1. Sign up at https://cron-job.org
2. Create jobs for each endpoint:

**Metrics (Hourly):**
- URL: `https://your-app.vercel.app/api/cron/metrics`
- Schedule: Every hour
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**Credit Reminders (Daily 9 AM):**
- URL: `https://your-app.vercel.app/api/cron/credit-reminders`
- Schedule: Daily at 9:00
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

Repeat for all cron jobs.

### 3b. EasyCron (Free Tier)

1. Sign up at https://www.easycron.com
2. Create cron jobs with your endpoints
3. Free tier: 20 jobs, 1-minute intervals

### 3c. GitHub Actions (Free)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Cron Jobs

on:
  schedule:
    # Metrics - Every hour
    - cron: '0 * * * *'
    # Credit Reminders - Daily at 9 AM
    - cron: '0 9 * * *'
    # Deadline Reminders - Daily at 8 AM
    - cron: '0 8 * * *'
    # Expired Internships - Daily at midnight
    - cron: '0 0 * * *'
    # Analytics Snapshot - Daily at 2 AM
    - cron: '0 2 * * *'

jobs:
  trigger-crons:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Metrics
        if: github.event.schedule == '0 * * * *'
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/metrics \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      
      - name: Trigger Credit Reminders
        if: github.event.schedule == '0 9 * * *'
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/credit-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      
      - name: Trigger Deadline Reminders
        if: github.event.schedule == '0 8 * * *'
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/deadline-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      
      - name: Trigger Expired Internships
        if: github.event.schedule == '0 0 * * *'
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/expired-internships \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      
      - name: Trigger Analytics Snapshot
        if: github.event.schedule == '0 2 * * *'
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/analytics-snapshot \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to GitHub repository secrets.

### 3d. Render Cron Jobs (Free)

1. Sign up at https://render.com
2. Create Cron Jobs (free tier available)
3. Point to your Vercel endpoints

## Option 4: Manual Trigger API

Create an admin endpoint to manually trigger cron jobs when needed.

Add to `backend/src/routes/admin.js`:

```javascript
/**
 * @swagger
 * /api/admins/cron/trigger:
 *   post:
 *     summary: Manually trigger cron jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/cron/trigger", adminAuth, asyncHandler(async (req, res) => {
  const { job } = req.body;
  
  const jobs = {
    metrics: metricsQueue,
    creditReminders: creditReminderQueue,
    deadlineReminders: deadlineReminderQueue,
    expiredInternships: expiredInternshipQueue,
    analyticsSnapshot: analyticsSnapshotQueue,
  };
  
  if (!jobs[job]) {
    return res.status(400).json({ error: "Invalid job name" });
  }
  
  await jobs[job].add(job, { timestamp: new Date().toISOString() });
  
  res.json({ success: true, message: `${job} triggered successfully` });
}));
```

Then trigger from admin dashboard or API call.

## Option 5: Hybrid Approach (Recommended for Free Tier)

Combine daily Vercel crons with external service for critical hourly tasks:

**Vercel Crons (Daily - Free):**
- Credit Reminders (9 AM)
- Deadline Reminders (8 AM)
- Expired Internships (Midnight)
- Analytics Snapshot (2 AM)

**External Service (Hourly - Free):**
- Metrics calculation (every hour via Cron-Job.org or GitHub Actions)

This gives you the best of both worlds!

## Recommendation

### For Development/Testing:
**Use Option 1** (Daily crons) - It's free and sufficient for most use cases.

### For Production with Budget:
**Use Option 2** (Vercel Pro) - Best integration, most reliable.

### For Production without Budget:
**Use Option 5** (Hybrid) - Daily Vercel crons + GitHub Actions for hourly metrics.

## Current Configuration

Your `vercel.json` is now configured for **Option 1** (daily crons, free tier compatible).

All cron jobs run once per day at different times:
- ✅ Compatible with Vercel Hobby plan
- ✅ No additional cost
- ✅ No external dependencies

## Updating Configuration

If you choose a different option:

1. **For Option 2 (Vercel Pro):**
   - Upgrade your Vercel plan
   - Update `vercel.json` with hourly schedules
   - Redeploy

2. **For Option 3 (External Service):**
   - Remove crons from `vercel.json` (optional)
   - Set up external service
   - Use your `CRON_SECRET` for authentication

3. **For Option 5 (Hybrid):**
   - Keep current `vercel.json`
   - Set up GitHub Actions for metrics only
   - Add `CRON_SECRET` to GitHub secrets

## Testing Cron Endpoints

You can manually test any cron endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/cron/metrics \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Summary

| Option | Cost | Complexity | Frequency | Recommended For |
|--------|------|------------|-----------|-----------------|
| 1. Daily Vercel Crons | Free | Low | Daily | Development, Small apps |
| 2. Vercel Pro | $20/mo | Low | Any | Production apps |
| 3. External Service | Free | Medium | Any | Budget-conscious production |
| 4. Manual Trigger | Free | Low | On-demand | Testing, Admin control |
| 5. Hybrid | Free | Medium | Mixed | Best free option |

**Current Setup: Option 1 (Daily Crons)** ✅

You're ready to deploy with the free tier!

---

Need help setting up any of these options? Check the documentation or reach out for support.
