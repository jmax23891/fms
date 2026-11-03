# Student Feedback System PWA

A modular Node.js + Express API, PostgreSQL database, and installable HTML/CSS/JavaScript PWA for anonymous-to-teacher student feedback, teacher replies, admin account/tag management, and department-scoped analytics.

## Requirements
- Node.js 20+ (tested with Node 22 in the build workspace; your Node 24 is suitable)
- PostgreSQL 15+ (your PostgreSQL 18 is suitable)
- npm
- pgAdmin is optional and is only a database administration tool

## Project layout
- `Backend/` — Express API, SQL migration, seed utility, tests
- `Frontend/` — responsive multi-page PWA static application

## 1. Create the database
In pgAdmin, create a database named `student_feedback_system`, or run:

```sql
CREATE DATABASE student_feedback_system;
```

## 2. Configure the backend
Open PowerShell in `Backend`:

```powershell
Copy-Item .env.example .env
notepad .env
npm install
npm run migrate
```

Set `DATABASE_URL` to your local PostgreSQL connection string. Set a long random `JWT_ACCESS_SECRET` (at least 32 characters), `INVITATION_PEPPER`, and the four seed passwords. Do not reuse the example values. Example connection string:

`postgresql://postgres:YOUR_DATABASE_PASSWORD@localhost:5432/student_feedback_system`

The seed accounts are `aqdas@gmail.com`, `affan@gmail.com`, `fiza@gmail.com`, and `nida@gmail.com`. Their passwords are supplied only through `.env`; no default passwords are shipped. Set `SEED_*_PASSWORD` values before running `npm run seed`. Seed reruns do not reset existing passwords.

Set `SEED_DEPARTMENT_NAME` to the initial department. The two admins and two teachers are assigned to that department by the seed utility. You can add more departments directly in PostgreSQL or through a future admin department-management screen; initial department CRUD is intentionally not included in this version.

## 3. Start the API

```powershell
npm run dev
```

API health check: `http://localhost:4000/api/health`

## 4. Run the frontend
For local development, serve the `Frontend` directory on a local HTTP server (the service worker requires localhost or HTTPS). For example, from `Frontend`:

```powershell
npx http-server . -p 5500
```

Then open `http://localhost:5500`. The default API address for port 5500 is `http://localhost:4000/api`. Use the **API settings** button in the top bar if your API runs on another address.

For a single-origin deployment, serve `Frontend` from the same origin as the API or configure `CORS_ORIGIN` to the exact frontend origin. Production must use HTTPS. If frontend and backend are cross-site, configure `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`; ensure your host supports third-party cookies. Same-site deployment is recommended.

## Frontend pages

The frontend is a role-based multi-page PWA. Open `http://localhost:5500` to sign in or register. After sign-in, the app routes to the correct workspace.

- Student: `student/dashboard.html`, `student/give-feedback.html`, `student/history.html`, and `profile.html`.
- Teacher: `teacher/dashboard.html`, `teacher/inbox.html`, and `profile.html`.
- Admin: `admin/dashboard.html`, `admin/analytics.html`, `admin/feedback.html`, `admin/accounts.html`, `admin/tags.html`, and `profile.html`.
- Shared frontend assets: `assets/css/styles.css` and modular scripts in `assets/js/`.

The service worker caches only public HTML/CSS/JS/icon application-shell files. It does not cache API responses or private feedback, profile, reply, account, or analytics data. Offline mode displays a notice; private operations require a connection.

Some account capabilities are intentionally limited to what the current backend exposes: users can update supported profile fields; email changes and self-deactivation are not exposed by the API. Admin account management supports listing, invitations, and disabling; it does not expose account email/role editing.

## 5. Run tests

```powershell
npm test
```

The unit tests run without a database. Integration tests run only when `TEST_DATABASE_URL` is configured; otherwise they are explicitly skipped. To run them, create a separate empty test database and set `TEST_DATABASE_URL` in your environment before running `npm test`.

## Optional Docker deployment
Copy `.env.compose.example` to `.env` at the project root (`Copy-Item .env.compose.example .env`) and set `POSTGRES_PASSWORD`. Configure `Backend/.env` as described above, but use `DATABASE_URL=postgresql://sfs_app:PLACEHOLDER@db:5432/student_feedback_system` only if you are not overriding it through Compose; Compose supplies the database URL automatically. Build and start with `docker compose up --build`. Open `http://localhost:8080`. The Nginx frontend proxies `/api` to the backend. After the containers start, run `docker compose exec api npm run seed` to create the four initial staff accounts (their passwords must already be configured in `Backend/.env`). Before production, configure HTTPS, secure cookies, a trusted origin, and managed secrets; the included Compose file is for local demonstration, not a hardened public deployment.

## Important first-run security steps
1. Replace all example secrets in `.env`.
2. Set unique, strong seed passwords and keep `.env` private.
3. Do not commit `.env` or share the seed credentials.
4. Use HTTPS in production and set a strict `CORS_ORIGIN`.
5. Create a fresh database backup before applying migrations to an existing database.
6. The Gmail/Outlook domain check is only a format/domain policy; it does not verify mailbox ownership or university enrollment.

## Main API routes
- `POST /api/auth/register`, `/login`, `/refresh`, `/logout`, `/redeem-invitation`
- `GET /api/auth/me`, `PATCH /api/profiles/me`
- `GET /api/departments`, `GET /api/teachers`, `GET /api/tags`
- `POST /api/feedback`, `GET /api/feedback/mine`, `GET /api/feedback/inbox`, `GET /api/feedback/admin`, `PATCH /api/feedback/:id`
- `POST /api/feedback/:id/reply`, `PATCH /api/replies/:id`
- `GET /api/analytics/overview`, `GET /api/analytics/teachers/:teacherId`
- `GET /api/admin/accounts`, `POST /api/admin/invitations`, `PATCH /api/admin/accounts/:id/disable`
- `POST /api/admin/tags`, `PATCH /api/admin/tags/:id`

All protected operations are authorized server-side. Teacher feedback responses deliberately omit student identity. Admin access is restricted to teachers currently assigned to the admin's department. Feedback records remain associated with teachers and follow their current department after a transfer.

## Scope notes
This is a functional semester-project baseline, not a production-certified institutional evaluation platform. Email verification, password reset, formal university roster verification, multi-factor authentication, advanced department administration, and hosted deployment configuration are outside the supplied initial scope. No private API responses or queued submissions are cached by the service worker.


## Latest account and feedback updates

Run `cd Backend` then `npm run migrate` before starting the updated app. Migration `002_per_tag_ratings_and_account_controls` adds per-tag 1–5 ratings and a revocation flag while preserving all historical feedback. Students can select multiple active teaching dimensions (up to 50 per submission) and rate each dimension independently; the existing overall rating is calculated as the rounded mean of the selected tag ratings.

Department administrators can disable accounts, re-enable disabled accounts, permanently revoke disabled accounts (soft revocation; historical feedback is retained), and change roles. Role changes are audited and revoke existing refresh sessions. When changing a student to staff, a globally unique Staff ID is required. When changing staff to student, CMS ID, semester, and section are required. Administrators cannot change their own role or revoke/disable themselves, and the last active administrator cannot be downgraded.
