# Deploy Swagger to Vercel - Quick Guide

## ✅ Changes Made

### Files Modified:
1. `backend/api/index.js` - Added Swagger UI routes and documentation landing page

### What's New:
- ✅ Swagger UI at `/api-docs` and `/swagger`
- ✅ OpenAPI UI at `/api/docs`
- ✅ JSON specs at `/swagger.json` and `/api/docs.json`
- ✅ Beautiful HTML landing page at `/`
- ✅ Optimized for serverless (no DB connection for docs)

## 🚀 Deploy to Vercel

### Option 1: Git Push (Recommended)
```bash
cd backend
git add .
git commit -m "Add Swagger UI for serverless"
git push
```

Vercel will automatically deploy the changes.

### Option 2: Vercel CLI
```bash
cd backend
vercel --prod
```

### Option 3: Manual Deploy
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click "Redeploy"

## 🧪 Test After Deployment

### 1. Test Root Page
```bash
curl https://api.prashiskshan.com/
```
Should return HTML page with documentation links.

### 2. Test Swagger UI
Visit in browser: `https://api.prashiskshan.com/api-docs`

### 3. Test JSON Spec
```bash
curl https://api.prashiskshan.com/swagger.json | jq .
```

### 4. Test All Endpoints
```powershell
# Run the test script
.\api-test-public.ps1
```

## 📋 Available URLs After Deployment

| URL | Description |
|-----|-------------|
| `https://api.prashiskshan.com/` | Documentation landing page (HTML) |
| `https://api.prashiskshan.com/api-docs` | Swagger UI (interactive) |
| `https://api.prashiskshan.com/swagger` | Swagger UI (alternative path) |
| `https://api.prashiskshan.com/api/docs` | OpenAPI UI |
| `https://api.prashiskshan.com/swagger.json` | Swagger JSON spec |
| `https://api.prashiskshan.com/api-docs.json` | Swagger JSON spec (alt) |
| `https://api.prashiskshan.com/api/docs.json` | OpenAPI JSON spec |
| `https://api.prashiskshan.com/health` | Health check |
| `https://api.prashiskshan.com/api/health` | API health check |

## 🔍 Verify Deployment

### Check Vercel Logs
```bash
vercel logs
```

### Check for Errors
Look for these console messages in Vercel logs:
- ✅ "Swagger UI configured at /api-docs"
- ✅ "Swagger UI configured at /swagger"
- ✅ "OpenAPI UI configured at /api/docs"
- ✅ "Swagger JSON spec available at /swagger.json"

## 🐛 Troubleshooting

### Swagger UI Not Loading
1. Check Vercel deployment logs
2. Verify `swagger-ui-express` is in `package.json` dependencies
3. Check if initialization is completing
4. Try accessing `/health` first to warm up the function

### "Cannot GET /swagger"
- Wait 30 seconds for cold start
- Try `/api-docs` instead
- Check Vercel function logs

### JSON Spec Returns HTML
- Make sure you're accessing `/swagger.json` not `/swagger`
- Clear browser cache
- Try in incognito mode

## 📊 Performance Notes

### Cold Start Optimization
- Health checks: ~100ms (no initialization)
- Documentation routes: ~2-3s (first request, includes initialization)
- Subsequent requests: ~200-500ms (warm function)

### What's Lazy Loaded
- Swagger UI module
- OpenAPI spec
- Database connection (not loaded for docs)
- API routes (not loaded for docs)

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Visit `https://api.prashiskshan.com/`
3. ✅ Click "Swagger UI" link
4. ✅ Explore your API documentation
5. ✅ Share the link with your team!

## 📝 Update Documentation

If you add new endpoints, they'll automatically appear in Swagger if you:
1. Add JSDoc comments to your route files
2. Redeploy to Vercel

Example:
```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/your-endpoint", controller);
```

---

**Ready to deploy!** 🚀

Just push to Git or run `vercel --prod` and your Swagger documentation will be live!
