# Swagger/OpenAPI Documentation Setup

## ✅ Swagger is Now Available!

Your API documentation is now accessible at multiple endpoints:

### 📚 Documentation Endpoints

1. **Swagger UI (Main)**
   - URL: `https://api.prashiskshan.com/api-docs`
   - Description: Interactive API documentation with Swagger UI
   - Features: Try out endpoints, view schemas, authentication

2. **Swagger UI (Alternative)**
   - URL: `https://api.prashiskshan.com/swagger`
   - Description: Same as /api-docs, alternative path

3. **OpenAPI Documentation**
   - URL: `https://api.prashiskshan.com/api/docs`
   - Description: OpenAPI 3.0 specification viewer

4. **Swagger JSON Spec**
   - URL: `https://api.prashiskshan.com/swagger.json`
   - URL: `https://api.prashiskshan.com/api-docs.json`
   - Description: Raw Swagger/OpenAPI JSON specification

5. **OpenAPI JSON Spec**
   - URL: `https://api.prashiskshan.com/api/docs.json`
   - Description: Raw OpenAPI 3.0 JSON specification

## 🚀 What Changed

### Updated Files:
- `backend/api/index.js` - Added Swagger UI routes for serverless

### Key Features:
1. ✅ Swagger UI at `/api-docs` and `/swagger`
2. ✅ OpenAPI UI at `/api/docs`
3. ✅ JSON specs available for import into Postman/Insomnia
4. ✅ No database connection required for docs
5. ✅ Lazy loading for optimal serverless performance

## 🔧 How It Works

### Serverless Optimization
The implementation uses lazy loading to minimize cold start times:

1. **Health checks** (`/`, `/health`) - No initialization needed
2. **Documentation routes** - Initialize app but skip database connection
3. **API routes** - Full initialization with database

### Route Priority
```javascript
// Fast routes (no DB)
/health
/api/health
/api-docs
/swagger
/api/docs
/swagger.json
/api-docs.json
/api/docs.json

// Full routes (with DB)
/api/*
```

## 📖 Using Swagger UI

### 1. Open Swagger UI
Visit: `https://api.prashiskshan.com/api-docs`

### 2. Authenticate
- Click "Authorize" button
- Enter your Firebase ID token: `Bearer YOUR_TOKEN`
- Click "Authorize"

### 3. Try Endpoints
- Expand any endpoint
- Click "Try it out"
- Fill in parameters
- Click "Execute"

## 🔐 Getting Authentication Token

### For Testing:
1. Login to your app (student/company/mentor/admin)
2. Open browser DevTools (F12)
3. Go to Application > Local Storage
4. Find Firebase token
5. Copy the token value
6. Use in Swagger UI: `Bearer YOUR_TOKEN`

### For Development:
```javascript
// In your frontend after login
const token = await firebase.auth().currentUser.getIdToken();
console.log('Token:', token);
```

## 📥 Import to Postman

### Option 1: Import from URL
1. Open Postman
2. Click "Import"
3. Select "Link"
4. Enter: `https://api.prashiskshan.com/swagger.json`
5. Click "Continue"

### Option 2: Import from File
1. Download: `https://api.prashiskshan.com/swagger.json`
2. Open Postman
3. Click "Import"
4. Select "File"
5. Choose downloaded file

## 📥 Import to Insomnia

1. Open Insomnia
2. Click "Create" > "Import From"
3. Select "URL"
4. Enter: `https://api.prashiskshan.com/swagger.json`
5. Click "Fetch and Import"

## 🧪 Testing Documentation

### Test Swagger UI is Working
```bash
curl https://api.prashiskshan.com/api-docs
# Should return HTML page with Swagger UI
```

### Test JSON Spec is Available
```bash
curl https://api.prashiskshan.com/swagger.json | jq .
# Should return JSON with API specification
```

### Test OpenAPI Spec
```bash
curl https://api.prashiskshan.com/api/docs.json | jq .
# Should return OpenAPI 3.0 JSON
```

## 🎨 Customization

The Swagger UI is customized with:
- Hidden top bar (cleaner look)
- Custom site title: "Prashiskshan API Documentation"
- Custom favicon support

### To Modify:
Edit `backend/api/index.js` in the `initializeApp()` function:

```javascript
app.get("/api-docs", swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Your Custom Title",
  customfavIcon: "/your-favicon.ico",
}));
```

## 📝 Adding New Endpoints to Swagger

### Using JSDoc Comments:
```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/your-endpoint", yourController);
```

### Rebuild Swagger Spec:
The spec is auto-generated from JSDoc comments in route files.
Just restart the server or redeploy to Vercel.

## 🐛 Troubleshooting

### Swagger UI Not Loading
1. Check if route is initialized: Visit `/health` first
2. Check browser console for errors
3. Verify `swagger-ui-express` is installed: `npm list swagger-ui-express`

### "Cannot GET /swagger"
- The route is `/api-docs` or `/swagger` (both work)
- Make sure you're using the correct URL

### Authentication Not Working
1. Get fresh Firebase token (they expire)
2. Use format: `Bearer YOUR_TOKEN` (with "Bearer " prefix)
3. Click "Authorize" button in Swagger UI

### JSON Spec Returns HTML
- Use `/swagger.json` not `/swagger`
- Use `/api/docs.json` not `/api/docs`

## 📊 Available Schemas

The Swagger spec includes these predefined schemas:
- `SuccessResponse` - Standard success format
- `Error` - Standard error format
- `Pagination` - Pagination metadata
- `Student` - Student entity
- `Company` - Company entity
- `Mentor` - Mentor entity
- `Internship` - Internship entity
- `Application` - Application entity
- `Logbook` - Logbook entity

Reference them in your endpoints:
```javascript
schema:
  $ref: '#/components/schemas/Student'
```

## 🎯 Next Steps

1. ✅ Visit `https://api.prashiskshan.com/api-docs`
2. ✅ Explore available endpoints
3. ✅ Get authentication token
4. ✅ Try out endpoints
5. ✅ Import to Postman for easier testing

## 📚 Additional Resources

- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)

---

**Your API documentation is now live and accessible!** 🎉
