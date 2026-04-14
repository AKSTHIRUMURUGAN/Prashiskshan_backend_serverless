# API Endpoints Reference

Complete list of all API endpoints in the Prashiskshan backend.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-vercel-domain.vercel.app`

## Health & Documentation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Root endpoint | No |
| GET | `/health` | Health check | No |
| GET | `/api/health` | API health check | No |
| GET | `/api-docs` | Swagger UI documentation | No |
| GET | `/api/docs` | OpenAPI documentation | No |
| GET | `/api/docs.json` | OpenAPI JSON spec | No |

## Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/students/register` | Register student | No |
| POST | `/api/auth/companies/register` | Register company | No |
| POST | `/api/auth/mentors/register` | Register mentor | No |
| POST | `/api/auth/admins/register` | Register admin | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/send-password-reset` | Send password reset email | No |
| POST | `/api/auth/send-verification-email` | Send email verification | Yes |
| GET | `/api/auth/verify-email` | Verify email | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PATCH | `/api/auth/me` | Update user profile | Yes |
| POST | `/api/auth/password` | Change password | Yes |
| POST | `/api/auth/profile/image` | Upload profile image | Yes |
| POST | `/api/auth/profile/resume` | Upload resume | Yes (Student) |
| DELETE | `/api/auth/account` | Delete account | Yes |

## Students (`/api/students`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/students/dashboard` | Get student dashboard | Yes (Student) |
| GET | `/api/students/profile` | Get student profile | Yes (Student) |
| GET | `/api/students/internships` | Browse internships | Yes (Student) |
| GET | `/api/students/internships/recommended` | Get recommended internships | Yes (Student) |
| GET | `/api/students/internships/completed` | Get completed internships | Yes (Student) |
| GET | `/api/students/internships/:internshipId` | Get internship details | Yes (Student) |
| POST | `/api/students/internships/:internshipId/apply` | Apply to internship | Yes (Student) |
| GET | `/api/students/applications` | List my applications | Yes (Student) |
| GET | `/api/students/applications/:applicationId` | Get application details | Yes (Student) |
| DELETE | `/api/students/applications/:applicationId` | Withdraw application | Yes (Student) |
| GET | `/api/students/modules/recommended` | Get recommended modules | Yes (Student) |
| POST | `/api/students/modules/start` | Start learning module | Yes (Student) |
| POST | `/api/students/modules/complete` | Complete learning module | Yes (Student) |
| POST | `/api/students/interviews/start` | Start interview practice | Yes (Student) |
| POST | `/api/students/interviews/answer` | Submit interview answer | Yes (Student) |
| POST | `/api/students/interviews/end` | End interview session | Yes (Student) |
| GET | `/api/students/interviews/history` | Get interview history | Yes (Student) |
| POST | `/api/students/logbooks` | Submit logbook | Yes (Student) |
| GET | `/api/students/logbooks` | Get my logbooks | Yes (Student) |
| GET | `/api/students/credits` | Get credits summary | Yes (Student) |
| POST | `/api/students/reports/nep` | Generate NEP report | Yes (Student) |
| POST | `/api/students/chatbot` | Chatbot query | Yes (Student) |
| POST | `/api/students/:studentId/credit-requests` | Create credit request | Yes (Student) |
| GET | `/api/students/:studentId/credit-requests` | Get credit requests | Yes (Student) |
| GET | `/api/students/:studentId/credit-requests/:requestId` | Get credit request details | Yes (Student) |
| PUT | `/api/students/:studentId/credit-requests/:requestId/resubmit` | Resubmit credit request | Yes (Student) |
| GET | `/api/students/:studentId/credit-requests/:requestId/status` | Get credit request status | Yes (Student) |
| POST | `/api/students/:studentId/credit-requests/:requestId/reminder` | Send review reminder | Yes (Student) |
| GET | `/api/students/:studentId/credits/history` | Get credit history | Yes (Student) |
| GET | `/api/students/:studentId/credits/certificate/:requestId` | Download certificate | Yes (Student) |

## Companies (`/api/companies`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/companies/dashboard` | Get company dashboard | Yes (Company) |
| GET | `/api/companies/profile` | Get company profile | Yes (Company) |
| PATCH | `/api/companies/profile` | Update company profile | Yes (Company) |
| POST | `/api/companies/internships` | Create internship | Yes (Company) |
| GET | `/api/companies/internships` | Get all internships | Yes (Company) |
| GET | `/api/companies/internships/:internshipId` | Get internship by ID | Yes (Company) |
| PATCH | `/api/companies/internships/:internshipId` | Update internship | Yes (Company) |
| DELETE | `/api/companies/internships/:internshipId` | Delete internship | Yes (Company) |
| POST | `/api/companies/internships/:internshipId/complete` | Mark internship complete | Yes (Company) |
| GET | `/api/companies/internships/:internshipId/applicants` | Get applicants | Yes (Company) |
| GET | `/api/companies/internships/:internshipId/metrics` | Get internship metrics | Yes (Company) |
| GET | `/api/companies/applications` | Get company applications | Yes (Company) |
| GET | `/api/companies/applications/:applicationId` | Get application details | Yes (Company) |
| POST | `/api/companies/applications/review` | Review applications | Yes (Company) |
| POST | `/api/companies/applications/shortlist` | Shortlist candidates | Yes (Company) |
| POST | `/api/companies/applications/reject` | Reject candidates (bulk) | Yes (Company) |
| POST | `/api/companies/applications/approve` | Approve application | Yes (Company) |
| POST | `/api/companies/applications/reject-single` | Reject application | Yes (Company) |
| GET | `/api/companies/interns` | Get active interns | Yes (Company) |
| GET | `/api/companies/interns/progress` | Get intern progress | Yes (Company) |
| GET | `/api/companies/interns/:studentId/logbooks` | Get intern logbooks | Yes (Company) |
| POST | `/api/companies/interns/:applicationId/complete` | Mark internship complete | Yes (Company) |
| POST | `/api/companies/logbooks/:logbookId/feedback` | Provide logbook feedback | Yes (Company) |
| POST | `/api/companies/events` | Create event | Yes (Company) |
| POST | `/api/companies/challenges` | Create challenge | Yes (Company) |
| GET | `/api/companies/analytics` | Get company analytics | Yes (Company) |
| GET | `/api/companies/analytics/export` | Export analytics report | Yes (Company) |
| POST | `/api/companies/re-appeal` | Re-appeal rejection | Yes (Company) |
| POST | `/api/companies/reappeal` | Submit reappeal request | Yes (Company) |
| GET | `/api/companies/reappeal/status` | Get reappeal status | Yes (Company) |
| PUT | `/api/companies/completions/:completionId/mark-complete` | Mark completion complete | Yes (Company) |
| GET | `/api/companies/completions/completed` | Get completed internships | Yes (Company) |

## Admins (`/api/admins`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admins/dashboard` | Get admin dashboard | Yes (Admin) |
| GET | `/api/admins/companies/pending` | Get pending companies | Yes (Admin) |
| GET | `/api/admins/companies` | Get companies | Yes (Admin) |
| GET | `/api/admins/companies/:companyId` | Get company details | Yes (Admin) |
| POST | `/api/admins/companies/:companyId/verify` | Verify company | Yes (Admin) |
| POST | `/api/admins/companies/:companyId/reject` | Reject company | Yes (Admin) |
| POST | `/api/admins/companies/:companyId/block` | Block company | Yes (Admin) |
| POST | `/api/admins/companies/:companyId/suspend` | Suspend company | Yes (Admin) |
| GET | `/api/admins/students/import/template` | Download student import template | Yes (Admin) |
| POST | `/api/admins/students/import` | Bulk import students | Yes (Admin) |
| GET | `/api/admins/students/import/:jobId` | Get import job status | Yes (Admin) |
| GET | `/api/admins/students/import/:jobId/credentials` | Download import credentials | Yes (Admin) |
| GET | `/api/admins/mentors/import/template` | Download mentor import template | Yes (Admin) |
| POST | `/api/admins/mentors/import` | Bulk import mentors | Yes (Admin) |
| GET | `/api/admins/mentors/import/:jobId` | Get mentor import job status | Yes (Admin) |
| GET | `/api/admins/mentors/import/:jobId/credentials` | Download mentor credentials | Yes (Admin) |
| POST | `/api/admins/mentors/assign` | Assign mentor to students | Yes (Admin) |
| GET | `/api/admins/credit-requests/pending` | Get pending credit requests | Yes (Admin) |
| GET | `/api/admins/credit-requests/:requestId` | Get credit request details | Yes (Admin) |
| POST | `/api/admins/credit-requests/:requestId/review` | Submit admin review | Yes (Admin) |
| POST | `/api/admins/credit-requests/:requestId/resolve` | Resolve admin hold | Yes (Admin) |
| GET | `/api/admins/credit-requests/analytics` | Get credit analytics | Yes (Admin) |
| GET | `/api/admins/credit-requests/export` | Export credit report | Yes (Admin) |
| GET | `/api/admins/credit-requests/bottlenecks` | Get bottleneck analysis | Yes (Admin) |
| GET | `/api/admins/credit-requests/overdue` | Get overdue credit requests | Yes (Admin) |
| GET | `/api/admins/credit-requests/reminders/stats` | Get reminder statistics | Yes (Admin) |
| POST | `/api/admins/credit-requests/reminders/send` | Send overdue reminders | Yes (Admin) |
| POST | `/api/admins/credit-requests/reminders/schedule` | Schedule reminder job | Yes (Admin) |
| POST | `/api/admins/reports/system` | Generate system report | Yes (Admin) |
| GET | `/api/admins/analytics/system` | Get system analytics | Yes (Admin) |
| GET | `/api/admins/analytics/college` | Get college analytics | Yes (Admin) |
| GET | `/api/admins/system/health` | Get system health | Yes (Admin) |
| GET | `/api/admins/ai/usage` | Get AI usage statistics | Yes (Admin) |
| GET | `/api/admins/internships` | Get internships | Yes (Admin) |
| GET | `/api/admins/internships/list` | List internships with filters | Yes (Admin) |
| GET | `/api/admins/internships/pending` | Get pending verifications | Yes (Admin) |
| GET | `/api/admins/internships/analytics` | Get internship analytics | Yes (Admin) |
| POST | `/api/admins/internships/bulk-approve` | Bulk approve internships | Yes (Admin) |
| POST | `/api/admins/internships/bulk-reject` | Bulk reject internships | Yes (Admin) |
| GET | `/api/admins/internships/:id` | Get internship details | Yes (Admin) |
| GET | `/api/admins/internships/:id/details` | Get detailed internship info | Yes (Admin) |
| POST | `/api/admins/internships/:id/approve` | Approve internship | Yes (Admin) |
| POST | `/api/admins/internships/:id/reject` | Reject internship | Yes (Admin) |
| POST | `/api/admins/internships/:id/approve-posting` | Approve internship posting | Yes (Admin) |
| POST | `/api/admins/internships/:id/reject-posting` | Reject internship posting | Yes (Admin) |
| PATCH | `/api/admins/internships/:id` | Update internship | Yes (Admin) |
| PATCH | `/api/admins/internships/:id/edit` | Edit internship (legacy) | Yes (Admin) |
| GET | `/api/admins/analytics` | Get system analytics | Yes (Admin) |
| GET | `/api/admins/analytics/companies` | Get company performance | Yes (Admin) |
| GET | `/api/admins/analytics/departments` | Get department performance | Yes (Admin) |
| GET | `/api/admins/analytics/mentors` | Get mentor performance | Yes (Admin) |
| GET | `/api/admins/analytics/students` | Get student performance | Yes (Admin) |
| GET | `/api/admins/reappeals` | Get reappeal requests | Yes (Admin) |
| POST | `/api/admins/reappeals/:companyId/approve` | Approve reappeal | Yes (Admin) |
| POST | `/api/admins/reappeals/:companyId/reject` | Reject reappeal | Yes (Admin) |

## Mentors (`/api/mentors`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/mentors/dashboard` | Get mentor dashboard | Yes (Mentor) |
| GET | `/api/mentors/profile` | Get mentor profile | Yes (Mentor) |
| GET | `/api/mentors/students` | Get assigned students | Yes (Mentor) |
| GET | `/api/mentors/credit-requests/pending` | Get pending credit requests | Yes (Mentor) |
| GET | `/api/mentors/credit-requests/:requestId` | Get credit request details | Yes (Mentor) |
| POST | `/api/mentors/credit-requests/:requestId/review` | Review credit request | Yes (Mentor) |
| GET | `/api/mentors/analytics` | Get mentor analytics | Yes (Mentor) |

## Internships (`/api/internships`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/internships` | Browse internships | No |
| GET | `/api/internships/:id` | Get internship details | No |
| GET | `/api/internships/:id/applications` | Get internship applications | Yes |

## Applications (`/api/applications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/applications/:id` | Get application details | Yes |
| PATCH | `/api/applications/:id` | Update application | Yes |
| DELETE | `/api/applications/:id` | Delete application | Yes |

## Logbooks (`/api/logbooks`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/logbooks` | Create logbook entry | Yes |
| GET | `/api/logbooks` | Get logbook entries | Yes |
| GET | `/api/logbooks/:id` | Get logbook entry | Yes |
| PATCH | `/api/logbooks/:id` | Update logbook entry | Yes |
| DELETE | `/api/logbooks/:id` | Delete logbook entry | Yes |

## Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get notifications | Yes |
| GET | `/api/notifications/:id` | Get notification | Yes |
| PATCH | `/api/notifications/:id/read` | Mark as read | Yes |
| DELETE | `/api/notifications/:id` | Delete notification | Yes |

## Interviews (`/api/interviews`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/interviews` | Create interview | Yes |
| GET | `/api/interviews` | Get interviews | Yes |
| GET | `/api/interviews/:id` | Get interview | Yes |
| PATCH | `/api/interviews/:id` | Update interview | Yes |

## Metrics (`/api/metrics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/metrics/system` | Get system metrics | Yes (Admin) |
| GET | `/api/metrics/user` | Get user metrics | Yes |

## Upload (`/api/upload`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/upload/image` | Upload image | Yes |
| POST | `/api/upload/document` | Upload document | Yes |
| POST | `/api/upload/resume` | Upload resume | Yes (Student) |

## Debug (`/api/debug`) - Non-production only

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/debug/config` | Get configuration | No |
| GET | `/api/debug/redis` | Test Redis connection | No |
| GET | `/api/debug/mongodb` | Test MongoDB connection | No |

## Test (`/api/test`) - Non-production only

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/test/cleanup` | Cleanup test data | No |
| POST | `/api/test/seed` | Seed test data | No |

## Cron Jobs (Internal - Vercel Cron)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/cron/metrics` | Run metrics calculation | Cron Secret |
| POST | `/api/cron/credit-reminders` | Send credit reminders | Cron Secret |
| POST | `/api/cron/deadline-reminders` | Send deadline reminders | Cron Secret |
| POST | `/api/cron/expired-internships` | Check expired internships | Cron Secret |
| POST | `/api/cron/analytics-snapshot` | Create analytics snapshot | Cron Secret |

## Admin Queue Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/queues` | Bull Board UI | Yes (Admin) |

---

## Authentication

Most endpoints require authentication using Firebase ID tokens:

```bash
Authorization: Bearer <firebase-id-token>
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Upload endpoints: 10 requests per 15 minutes
- AI features: Daily limits per user

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Pagination

Endpoints that return lists support pagination:

```
?page=1&limit=10
```

## Filtering

Many endpoints support filtering:

```
?status=active&department=CSE&search=keyword
```

## Sorting

Some endpoints support sorting:

```
?sortBy=createdAt&order=desc
```

---

**Total Endpoints:** 150+

All endpoints are preserved and functional in the serverless deployment! 🎉
