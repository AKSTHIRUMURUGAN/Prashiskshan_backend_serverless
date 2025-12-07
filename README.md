# Prashiskshan Backend

This repository contains an Express.js backend scaffold for the Prashiskshan internship management platform. The current version includes placeholder modules so we can progressively flesh out each feature area.

## Getting Started

```
npm install
npm run dev
```

The above commands install dependencies and start the development server with hot reload.

## Project Layout

The `src` directory mirrors the target architecture documented in the specification. Each file currently exports a minimal placeholder implementation that will be expanded in subsequent phases.

## Firebase (emulator vs real project)

Development can use the Firebase Auth emulator or a real Firebase project. The project will prefer the emulator when `FIREBASE_AUTH_EMULATOR_HOST` is set. To force the server to use your real Firebase project instead:

- Set the Google service account credentials (recommended) by downloading the JSON from the Firebase console and setting `GOOGLE_APPLICATION_CREDENTIALS` to its path, or export the individual `config.firebase.*` environment variables used by the project.
- If `FIREBASE_AUTH_EMULATOR_HOST` is present but you still want to use the real Firebase, set `FIREBASE_FORCE_REAL=true` in your environment. This will ignore the emulator host and initialize the Admin SDK with your service account.

Verify the active Firebase mode at runtime using the diagnostic endpoint `/api/_status` (see OpenAPI docs at `/api/docs`).

### Development: logging in with a raw `firebaseUid`

For local testing only, you can log in by passing an existing `firebaseUid` in the login request body instead of an `idToken`. This is strictly a development helper and is disabled in production.

- To enable the fallback in non-production environments, nothing is required — the server allows `firebaseUid` when `NODE_ENV` is not `production`.
- To enable it explicitly in any environment (not recommended), set `ALLOW_UID_LOGIN=true` in your environment.

Example request body for dev login:

```
{ "firebaseUid": "i5aA60v5wZOEfXpvkcwCdQP83Oj2" }
```

Security note: Do NOT enable `ALLOW_UID_LOGIN` in production. This bypasses Firebase authentication and should only be used during local development or automated tests.

## API Documentation

The Prashiskshan API is documented using OpenAPI 3.0 specification. The documentation is available at `/api/docs` when the server is running.

### Viewing Documentation

1. Start the development server: `npm run dev`
2. Open your browser to: http://localhost:5000/api/docs
3. Use the interactive Swagger UI to explore and test endpoints

### Updating Documentation

When adding or modifying API endpoints, update the documentation in `src/docs/openapi.mjs`. See the [API Documentation Maintenance Guide](src/docs/README.md) for detailed instructions.

### Validation Scripts

Before committing changes to the API documentation, run these validation scripts:

```bash
# Validate OpenAPI spec structure
npm run validate:openapi

# Validate examples match schemas
npm run validate:examples

# Check all routes are documented
npm run validate:routes

# Run all validations
npm run validate:docs
```

### Pre-Commit Hook

Install the pre-commit hook to automatically validate documentation before commits:

```bash
cd backend
bash scripts/install-hooks.sh
```

The hook will prevent commits if documentation validation fails.

### Documentation Guidelines

- **Naming Conventions**: Use PascalCase for schemas, camelCase for parameters
- **Examples**: Use realistic data with Indian context (names, colleges, locations)
- **Completeness**: Document all request/response schemas, error cases, and workflows
- **Testing**: Test endpoints in Swagger UI before committing

For complete guidelines, see [src/docs/README.md](src/docs/README.md).

