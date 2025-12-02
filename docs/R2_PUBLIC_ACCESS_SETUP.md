# Cloudflare R2 Public Access Setup Guide

## Problem

When viewing uploaded documents, you're seeing an XML authorization error:
```xml
<Error>
  <Code>InvalidArgument</Code>
  <Message>Authorization</Message>
</Error>
```

This happens because the R2 URLs being generated use the internal storage endpoint which requires authentication, not a publicly accessible URL.

## Solution

You need to configure R2 for public access and update your `R2_PUBLIC_URL` environment variable.

### Option 1: Use R2.dev Subdomain (Quickest Setup)

1. **Enable Public Access in Cloudflare Dashboard:**
   - Go to Cloudflare Dashboard → R2 → Select your bucket
   - Click on "Settings" tab
   - Under "Public Access", click "Allow Access"
   - Copy the R2.dev URL (e.g., `https://pub-abc123xyz.r2.dev`)

2. **Update Backend .env File:**
   ```env
   R2_PUBLIC_URL=https://pub-abc123xyz.r2.dev
   ```

3. **Restart Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Use Custom Domain (Recommended for Production)

1. **Add Custom Domain in Cloudflare:**
   - Go to Cloudflare Dashboard → R2 → Select your bucket
   - Click on "Settings" tab
   - Under "Custom Domains", click "Connect Domain"
   - Enter your domain (e.g., `cdn.prashiskshan.com`)
   - Follow the DNS setup instructions

2. **Update Backend .env File:**
   ```env
   R2_PUBLIC_URL=https://cdn.prashiskshan.com
   ```

3. **Restart Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

### Option 3: Use Presigned URLs (For Private Documents)

If you need documents to remain private and only accessible to authenticated users, you can implement presigned URLs. This requires code changes.

**Note:** This is more complex and should only be used if documents must remain private.

## Verification

After updating the configuration:

1. **Upload a new document** through the company profile page
2. **Check the URL format** - it should start with your R2_PUBLIC_URL
3. **Click "View Document"** - it should open successfully without authorization errors

## Current vs. Correct URL Format

### ❌ Current (Internal - Requires Auth):
```
https://654fca3dbc24dd2b96fb32fd07429ab9.r2.cloudflarestorage.com/2025-12-01/file.pdf
```

### ✅ Correct (Public - R2.dev):
```
https://pub-abc123xyz.r2.dev/2025-12-01/file.pdf
```

### ✅ Correct (Public - Custom Domain):
```
https://cdn.prashiskshan.com/2025-12-01/file.pdf
```

## Important Notes

1. **Existing Documents:** Documents uploaded before this fix will still have the old internal URLs. You have two options:
   - Re-upload the documents (recommended)
   - Manually update the URLs in the database (advanced)

2. **Security:** Public R2 buckets mean anyone with the URL can access the files. If you need access control:
   - Use presigned URLs (Option 3)
   - Implement a proxy endpoint that checks authentication before serving files
   - Use Cloudflare Access to add authentication layer

3. **CORS Configuration:** If you encounter CORS errors, you may need to configure CORS settings in your R2 bucket:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourfrontend.com"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

## Troubleshooting

### Issue: Still seeing authorization errors after update

**Solution:**
1. Verify `R2_PUBLIC_URL` in `.env` is correct
2. Restart the backend server completely
3. Clear any cached URLs in your application
4. Upload a new test document to verify

### Issue: 404 errors on document URLs

**Solution:**
1. Verify the R2 bucket name matches in both `.env` and Cloudflare dashboard
2. Check that public access is enabled in R2 settings
3. Verify the custom domain DNS is properly configured (if using custom domain)

### Issue: CORS errors when viewing documents

**Solution:**
1. Add CORS configuration to your R2 bucket (see Important Notes above)
2. Ensure your frontend URL is in the AllowedOrigins list

## Testing

After configuration, test with this curl command:
```bash
# Replace with your actual R2_PUBLIC_URL and a file path
curl -I https://pub-abc123xyz.r2.dev/2025-12-01/test-file.pdf
```

You should see:
- Status: `200 OK` (not 403 Forbidden)
- No authorization errors

## Need Help?

If you continue to experience issues:
1. Check the Cloudflare R2 documentation: https://developers.cloudflare.com/r2/
2. Verify your R2 bucket settings in the Cloudflare dashboard
3. Check backend logs for any upload errors
