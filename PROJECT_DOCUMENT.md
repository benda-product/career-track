# Career Track — Project Document

**Product name:** Career Track  
**Version:** 1.0  
**Last updated:** July 2026  
**Repository path:** `career-track/`  
**Owner:** Benda Infotech

---

## 1. Overview

**Career Track** is an enterprise **candidate platform** for job seekers. It is explicitly **not** an ATS — recruiting and hiring workflows live in **Talent Desk**. Career Track gives candidates one place to manage their career: profile, resumes, job search, applications, skill assessments, training courses, and notifications.

It is a core product in the **Benda ecosystem**, integrated with Benda Infotech (SSO and courses), Resume AI, Talent Desk ATS, and SkillCheck.

### Purpose

- Provide job seekers a **unified workspace** for career growth and job hunting
- **Proxy and orchestrate** Resume Builder, ATS, SkillCheck, and Benda courses behind one UI
- **Sync** applications and profile data with Talent Desk talent pool
- Support **Benda SSO** so one Benda account launches Career Track without re-registration

### Project structure

```
career-track/
├── frontend/     # Next.js App Router (port 3003)
├── backend/      # Express 5 + MongoDB API (port 5003)
├── docker-compose.yml
└── README.md
```

### URLs (development)

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3003` |
| Backend API | `http://localhost:5003/api/v1` |
| Swagger docs | `http://localhost:5003/api-docs` |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Career Track                             │
│  Next.js :3003  │  Express API :5003  │  MongoDB  │ Socket.io│
└──────────┬──────────────┬──────────────┬──────────┬───────────┘
           │              │              │          │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼────┐ ┌───▼────┐
    │ Benda Hub   │ │ Resume AI │ │ Talent    │ │Skill   │
    │ SSO/Courses │ │ :5001     │ │ Desk :5002│ │Check   │
    └─────────────┘ └───────────┘ └───────────┘ └────────┘
```

### Technology stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | Tailwind CSS 4, ShadCN/Base UI, Framer Motion, Recharts |
| **State** | Zustand (auth), TanStack Query (server state) |
| **Forms** | React Hook Form + Zod |
| **HTTP** | Axios with JWT refresh interceptor |
| **Real-time** | Socket.io client |
| **Google sign-in** | Firebase (shared Benda project) |
| **Backend** | Node.js 20, Express 5, TypeScript |
| **Database** | MongoDB via Mongoose 9 |
| **Auth** | JWT access + refresh, bcrypt, `@benda/ecosystem-auth` |
| **Validation** | Zod middleware |
| **Files** | Multer + Cloudinary |
| **Email** | Nodemailer |
| **API docs** | Swagger at `/api-docs` |

### Backend architecture

Clean layered design:

```
routes → controllers → services → repositories → models
```

Integration logic lives in `backend/src/services/` (Resume Builder, ATS, SkillCheck, Benda courses, ecosystem auth).

### Frontend API proxy

`next.config.ts` rewrites `/api/v1/*` → backend (`BACKEND_URL`, default `http://localhost:5003`). Browser calls same-origin `/api/v1`; SSR uses `NEXT_PUBLIC_API_URL`.

### Key MongoDB models

| Model | Purpose |
|-------|---------|
| **User** | Auth, roles, Benda linkage |
| **Profile** | Candidate profile, skills, experience, assessments |
| **Application** | Job applications and timeline |
| **Notification** | In-app notifications |
| **SavedJob** | Bookmarked jobs |
| **RecentlyViewed** | Job view history |
| **SkillCheckAssignment** | Recruiter-assigned skill tests |

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **candidate** | Job seeker (default) — all protected routes use `authorize('candidate')` |
| **admin** | Defined in schema — **no admin UI or admin-only routes implemented** |

### Account types

- `authProvider`: `local` | `benda_infotech`
- `bendaLinked`: linked to Benda Infotech hub
- **Recruiters are blocked** at Google login and Benda provision → redirect to `/auth/role-mismatch` (Talent Desk)

Ecosystem role synced from Benda: `JOB_SEEKER`.

---

## 4. Features by Module

### 4.1 Public / Marketing

| Route | Feature |
|-------|---------|
| `/` | Landing page with product demo (resume score, jobs, pipeline tabs) |

---

### 4.2 Authentication

| Route | Feature |
|-------|---------|
| `/auth/login` | Email/password, Google sign-in, link to Benda Infotech |
| `/auth/register` | Local registration (8+ char password rules) |
| `/auth/forgot-password` | Request password reset email |
| `/auth/sso-login` | Central-auth SSO token exchange → JWT |
| `/auth/benda-sso` | Token handoff from Benda hub |
| `/auth/role-mismatch` | Recruiter blocked; links to Talent Desk |
| `/sso-login` | Alias → `/auth/sso-login` |

**Backend auth capabilities:**

- Register, login, refresh, logout
- Email verification (token emailed)
- Forgot / reset password
- Google login via Firebase → Benda `ecosystem-google-verify`
- Ecosystem password fallback → Benda `ecosystem-verify`
- SSO via `@benda/ecosystem-auth` `verifyCentralAuthToken`
- Auto-provision local user + profile + ATS talent-pool sync on first ecosystem login

---

### 4.3 Workspace

| Route | Feature |
|-------|---------|
| `/dashboard` | Aggregated widgets: profile completion, application analytics, saved jobs, recommended jobs, recent notifications |

---

### 4.4 Profile

| Route | Feature |
|-------|---------|
| `/profile` | View candidate profile |
| `/profile/edit` | Edit profile |

**Profile data:** headline, summary, contact, location, experience, education, projects, certifications, skills, career preferences, skill assessments, resume linkage, completion score.

**Features:**
- Profile photo upload (Cloudinary; JPG/PNG/WEBP, 2 MB max)
- Completion score (9 weighted checks via `computeProfileCompletion`)
- Sync to ATS talent pool on registration and profile updates

---

### 4.5 Resume Builder (Resume AI proxy)

| Route | Feature |
|-------|---------|
| `/resume` | List resumes |
| `/resume/create` | Create resume |
| `/resume/edit` | Edit resume |
| `/resume/templates` | Browse templates |
| `/resume/score` | ATS score for saved resume |
| `/resume/ats` | ATS check (upload or select resume + optional job description) |

**Backend (proxied to Resume AI `:5001`):**
- CRUD via internal resume API (email-scoped)
- SSO deep-link to Resume Builder UI
- ATS score, ATS check, upload check (PDF/DOCX, 5 MB)
- PDF download, set resume “viewable” flag
- Templates list and detail

**Not implemented (returns 501):** analytics, suggestions, versions, preview proxies.

---

### 4.6 SkillCheck

| Route | Feature |
|-------|---------|
| `/skill-check/take` | SSO into SkillCheck to take tests |
| `/skill-check/my-tests` | Test history |
| `/skill-check` | Results and performance summary |
| `/skill-check/certificates` | Earned certificates and verification |

**Backend (proxied to SkillCheck `:5005`):**
- SSO session creation
- Summary (profile skill assessments + certifications)
- History, certificates, certificate detail
- Certificate verify (hard level + ≥80% eligibility rule)
- Refresh assessments from platform
- Recruiter-assigned tests via internal `POST /internal/skill-check/assign`
- Result sync via `POST /api/v1/skill-check/sync` (internal key)

---

### 4.7 Courses (Benda Infotech proxy)

| Route | Feature |
|-------|---------|
| `/courses` | Browse categories and course list |
| `/courses/[slug]` | Course detail, PDF view/download |

Proxied to Benda Infotech API (`:5004/api/courses`).

---

### 4.8 Job Pipeline (Talent Desk proxy)

| Route | Feature |
|-------|---------|
| `/jobs` | Search and filter jobs |
| `/jobs/[id]` | Job detail (tracks recently viewed) |
| `/jobs/saved` | Saved jobs |
| `/jobs/recommended` | Skill/profile/resume-based recommendations |

**Actions:**
- Save / unsave job
- Apply with selected resume (syncs to ATS `/external/sync-application`)
- Recently viewed jobs
- Recommended jobs (local scoring + optional ATS endpoint)

---

### 4.9 Applications

| Route | Feature |
|-------|---------|
| `/applications` | Kanban-style job tracker |
| `/applications/status` | Application status list with search |

**Stages:** `applied` → `screening` → `shortlisted` → `interview` → `offer` → `rejected` → `hired`

- Candidate can PATCH stage locally
- ATS sync pushes recruiter updates via `POST /internal/applications/stage-sync`
- Real-time notifications via Socket.io on stage changes

---

### 4.10 Notifications

| Route | Feature |
|-------|---------|
| `/notifications` | List, mark one read, mark all read |

**Types:** `job_match`, `application_update`, `resume_score`, `interview_invite`, `profile_suggestion`, `system`

Real-time push via Socket.io (`notification`, `application_update` events).

---

### 4.11 Settings

| Route | Feature |
|-------|---------|
| `/settings` | Password, notification prefs, privacy toggles, delete account |

**Note:** Settings UI is partially wired — password change, notification preferences, and account deletion are **UI placeholders** without full backend integration.

---

## 5. Sidebar Navigation

| Group | Items |
|-------|-------|
| **Workspace** | Dashboard, My Profile |
| **Resume Builder** | My Resumes, Create Resume, Check ATS Score |
| **Skillcheck** | Take Test, Test History, View Result, My Certificate |
| **Courses** | Browse Courses |
| **Job pipeline** | Job Search, Saved Jobs, Recommended Jobs, Application Status, Job Tracker |
| **System** | Notifications, Settings |

---

## 6. API Reference

**Base path:** `/api/v1`  
**Auth:** Bearer JWT unless noted.

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API health check |

### Auth (`/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register candidate |
| POST | `/login` | Login (local + Benda ecosystem fallback) |
| POST | `/refresh-token` | Refresh JWT |
| POST | `/logout` | Invalidate refresh token |
| GET | `/verify-email` | Verify email token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset password |
| POST | `/google` | Google/Firebase login |
| POST | `/sso-login` | Central auth SSO token exchange |

### Profile (`/profile`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get profile |
| PUT | `/` | Update profile |
| POST | `/photo` | Upload profile photo |
| GET | `/completion` | Profile completion score |

### Resume (`/resume`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List resumes |
| GET | `/sso-url` | Resume Builder SSO URL |
| POST | `/create` | Create resume |
| GET | `/templates` | List templates |
| GET | `/templates/:id` | Template detail |
| POST | `/ats/check-upload` | ATS check uploaded file |
| POST | `/ats/check/:id` | ATS check existing resume |
| PATCH | `/:id/viewable` | Set viewable flag |
| GET | `/:id/pdf` | Download PDF |
| GET | `/:id` | Get resume |
| PUT | `/update/:id` | Update resume |
| DELETE | `/:id` | Delete resume |
| GET | `/score/:id` | ATS score |
| GET | `/:id/analytics` | **501 — not proxied** |
| GET | `/:id/suggestions` | **501 — not proxied** |

### Jobs (`/jobs`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Search jobs |
| GET | `/saved` | Saved jobs |
| GET | `/recent` | Recently viewed |
| GET | `/recommended` | Recommended jobs |
| GET | `/:id` | Job detail |
| POST | `/:id/apply` | Apply to job |
| POST | `/save` | Save job |
| DELETE | `/:id/save` | Unsave job |

### Applications (`/applications`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List applications |
| GET | `/analytics` | Application analytics |
| GET | `/:id` | Application detail |
| PATCH | `/:id/stage` | Update stage |

### Notifications (`/notifications`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| PATCH | `/:id/read` | Mark read |
| PATCH | `/read-all` | Mark all read |

### Dashboard (`/dashboard`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Dashboard aggregate data |

### Skill Check (`/skill-check`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sync` | Internal key | Sync test results from SkillCheck |
| GET | `/sso-url` | Candidate | SkillCheck SSO URL |
| GET | `/summary` | Candidate | Skill summary |
| GET | `/history` | Candidate | Test history |
| GET | `/certificates` | Candidate | List certificates |
| GET | `/certificates/verify/:certificateId` | Candidate | Verify certificate |
| GET | `/certificates/:testId` | Candidate | Certificate detail |
| GET | `/assignments` | Candidate | Recruiter assignments |
| POST | `/refresh` | Candidate | Refresh from platform |

### Courses (`/courses`) — candidate only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | Course categories |
| GET | `/` | List courses |
| GET | `/:slug` | Course detail |
| GET | `/:slug/pdf-url` | Resolved PDF URL |
| GET | `/:slug/pdf` | PDF redirect/proxy |

### Internal (`/internal`) — `x-benda-key` header

| Method | Path | Description |
|--------|------|-------------|
| POST | `/skill-check/assign` | ATS assigns skill test to candidate |
| POST | `/applications/stage-sync` | ATS pushes application stage updates |
| GET | `/benda-infotech/account-lookup` | Check if Career Track account exists |
| POST | `/benda-infotech/verify-credentials` | Verify credentials for Benda hub |
| POST | `/benda-infotech/link-account` | Link existing account to Benda |
| POST | `/benda-infotech/provision` | Provision job seeker from Benda signup |

---

## 7. Integrations

### 7.1 Benda Infotech (SSO & identity)

| Mechanism | Details |
|-----------|---------|
| Package | `@benda/ecosystem-auth` — central JWT verify, user sync |
| SSO login | `POST /auth/sso-login` + `/auth/sso-login?token=...` |
| Benda handoff | `/auth/benda-sso` |
| Password verify | `POST {BENDA_AUTH_URL}/api/auth/ecosystem-verify` |
| Google verify | `POST {BENDA_AUTH_URL}/api/auth/ecosystem-google-verify` |
| Reverse APIs | `/internal/benda-infotech/*` for hub onboarding |
| Frontend links | `NEXT_PUBLIC_BENDA_URL` (default `:3004`) |
| Firebase | Shared Benda Infotech Firebase project |

### 7.2 Talent Desk (ATS)

| Integration | Details |
|-------------|---------|
| Base URL | `ATS_API_URL` → default `http://localhost:5002/api` |
| Job search/detail | `GET /jobs`, `GET /jobs/:id` |
| Apply sync | `POST /external/sync-application` |
| Candidate sync | `POST /external/sync-candidate` on register/profile update |
| Stage sync (inbound) | `POST /internal/applications/stage-sync` |
| Skill test assign | `POST /internal/skill-check/assign` (from ATS) |
| Stage mapping | `atsStageMapper.ts` maps ATS stages → Career Track stages |

### 7.3 Resume AI (Resume Builder)

| Integration | Details |
|-------------|---------|
| Base URL | `RESUME_BUILDER_API_URL` → default `http://localhost:5001/api/v1` |
| Client URL | `RESUME_BUILDER_CLIENT_URL` → `:3001` |
| Auth | `x-benda-key` = `INTERNAL_SYNC_KEY` |
| Operations | Resume CRUD, ATS score/check, PDF, templates, SSO session |

### 7.4 SkillCheck

| Integration | Details |
|-------------|---------|
| Base URL | `SKILL_TEST_API_URL` → default `http://localhost:5005/api` |
| Client URL | `SKILL_TEST_CLIENT_URL` → `:3005` |
| Operations | SSO, test history, certificates, verify |
| Profile sync | Writes `skillAssessments` on candidate profile |
| Certificate rules | Hard level + score ≥ 80% for eligibility |

### 7.5 Benda Infotech Courses

| Integration | Details |
|-------------|---------|
| Base URL | `BENDA_INFOTECH_API_URL` → default `http://localhost:5004/api` |
| Operations | Course categories, list, detail, PDF proxy |

---

## 8. Authentication & SSO Flow

### Standalone Career Track login

1. User registers or signs in at `/auth/login` or `/auth/register`
2. Career Track issues JWT access (15m) + refresh (7d) tokens
3. User lands on `/dashboard`

### Benda hub SSO

1. User signs in on Benda Infotech (`localhost:3004`) as Job Seeker
2. Clicks **Career Track** in workspace
3. Hub calls `product-sso` → redirect with token
4. Career Track `/auth/benda-sso` or `/auth/sso-login` exchanges token
5. Local user provisioned if first visit; profile + talent pool synced

### Role mismatch protection

- Recruiter Benda accounts blocked from Career Track
- Shown at `/auth/role-mismatch` with link to Talent Desk

---

## 9. Security

| Feature | Implementation |
|---------|----------------|
| JWT auth | Access (15m) + refresh (7d); refresh token rotation on user |
| RBAC | `authenticate` + `authorize('candidate')` on protected routes |
| Password hashing | bcrypt (12 rounds) |
| Password policy | 8+ chars, upper, lower, number (Zod on register) |
| Helmet | HTTP security headers |
| CORS | Restricted to `CLIENT_URL` |
| Rate limiting | 100 req/15min (prod), 1000 (dev) |
| Mongo sanitization | Custom express-mongo-sanitize middleware |
| Input validation | Zod schemas on auth/profile |
| Internal API key | `x-benda-key` for `/internal/*` and cross-service calls |
| File upload limits | Resume 5 MB (PDF/DOCX); photo 2 MB (images) |
| Socket auth | JWT verified on Socket.io handshake |
| Role separation | Recruiters blocked from Career Track |
| Email enumeration guard | Forgot-password returns generic success |

---

## 10. Local Development

### Quick start

```bash
# Backend
cd career-track/backend
cp .env.example .env
npm install
npm run dev          # API :5003

# Frontend
cd career-track/frontend
cp .env.example .env.local
npm install
npm run dev          # UI :3003
```

### Docker (from monorepo root)

```bash
# Career Track + ATS + SkillCheck + Benda + Resume (for full integrations)
docker compose --profile career-track up
```

### Port reference

| Service | Port |
|---------|------|
| Career Track frontend | **3003** |
| Career Track backend | **5003** |
| Resume AI | 3001 / 5001 |
| Talent Desk ATS | 3002 / 5002 |
| Benda Infotech | 3004 / 5004 |
| SkillCheck | 3005 / 5005 |
| MongoDB | 27017 |

### Ecosystem dependency

Full functionality requires:
- Benda Infotech (SSO, courses)
- Resume Builder (resumes)
- Talent Desk ATS (jobs, applications)
- SkillCheck (assessments)

Services return explicit 502/503 errors when dependencies are offline. `INTERNAL_SYNC_KEY` must match across all services.

---

## 11. Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5003`) |
| `MONGO_URI` | MongoDB connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token TTL |
| `CLIENT_URL` | CORS origin (`http://localhost:3003`) |
| `RESUME_BUILDER_API_URL` | Resume AI API |
| `RESUME_BUILDER_CLIENT_URL` | Resume AI UI |
| `ATS_API_URL` / `ATS_BACKEND_URL` | Talent Desk API |
| `SKILL_TEST_API_URL` | SkillCheck API |
| `SKILL_TEST_CLIENT_URL` | SkillCheck UI |
| `BENDA_INFOTECH_API_URL` | Benda courses API |
| `BENDA_AUTH_URL` / `BENDA_AUTH_FALLBACK_URL` | Ecosystem auth |
| `BENDA_AUTH_ISSUER` / `BENDA_AUTH_AUDIENCE` | JWT validation |
| `INTERNAL_SYNC_KEY` / `BENDA_INTERNAL_KEY` | Service-to-service auth |
| `CLOUDINARY_*` | File uploads |
| `EMAIL_*` | Nodemailer (verification, password reset) |

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | SSR API base |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io |
| `NEXT_PUBLIC_BENDA_URL` | Benda hub links |
| `NEXT_PUBLIC_TALENT_DESK_URL` | Role mismatch redirect |
| `NEXT_PUBLIC_RESUME_BUILDER_URL` | Resume AI UI |
| `NEXT_PUBLIC_SKILL_TEST_URL` | SkillCheck UI |
| `NEXT_PUBLIC_FIREBASE_*` | Google sign-in |
| `BACKEND_URL` | Next.js rewrite target |

---

## 12. Production Deployment

1. Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
2. Configure MongoDB Atlas or managed MongoDB
3. Set integration URLs to production services (Resume AI, ATS, SkillCheck, Benda)
4. Configure Cloudinary for file uploads
5. Set up SMTP for email (verification, password reset)
6. Deploy backend (Railway, Render, AWS ECS, Docker, etc.)
7. Deploy frontend (Vercel, Netlify, Docker, etc.)
8. Set `CLIENT_URL` and `NEXT_PUBLIC_API_URL` to production domains
9. Enable HTTPS and update CORS origins
10. Align `INTERNAL_SYNC_KEY` across all ecosystem services

---

## 13. Known Limitations & Roadmap

### UI / frontend gaps

| Area | Status |
|------|--------|
| Settings page | Password change, notification prefs, delete account — UI only |
| Email verify / reset password | Backend exists; **no dedicated frontend pages** |
| Sidebar profile strength | Hardcoded percentage; not from `/profile/completion` |
| Footer legal links | Placeholder `#` links |

### Backend stubs

| Area | Status |
|------|--------|
| Resume analytics, suggestions, versions, preview | Returns **501** |
| SkillCheck catalog, rankings, compare | Service methods exist; **no HTTP routes** |
| Admin role | Defined in schema; **no admin panel** |

### Operational notes

- Email skipped when `EMAIL_USER` unset (logged warning)
- Cloudinary optional; required for profile photo flows
- ATS/talent-pool sync failures logged; some paths fail silently
- Docker `career-track` profile includes ATS + SkillCheck + Benda for integrations

### Possible future work

- Wire settings to backend APIs
- Add verify-email and reset-password frontend pages
- Expose SkillCheck catalog APIs if needed
- Dynamic profile completion in sidebar
- Implement admin role and management UI
- Complete or remove stub resume proxy endpoints

---

## 14. Frontend Route Map

```
/                              Landing page
/auth/login                    Sign in
/auth/register                 Register
/auth/forgot-password          Password reset request
/auth/sso-login                Benda SSO
/auth/benda-sso                Benda token handoff
/auth/role-mismatch            Recruiter blocked

/dashboard                     Dashboard home
/profile, /profile/edit        Candidate profile
/resume/*                      Resume Builder module
/skill-check/*                 SkillCheck module
/courses/*                     Training courses
/jobs/*                        Job search module
/applications/*                Application tracker
/notifications                 Notifications
/settings                      Account settings
```

---

## 15. Glossary

| Term | Meaning |
|------|---------|
| **Career Track** | Candidate platform (this product) |
| **Talent Desk** | Benda ATS for recruiters (separate product) |
| **Resume AI** | Resume Builder product |
| **SkillCheck** | Skill assessment platform (internal ID `HORG`) |
| **Job Tracker** | Kanban application board |
| **Application Status** | List view of application stages |
| **Benda SSO** | Single sign-on from Benda Infotech hub |
| **Talent pool** | ATS candidate database synced from Career Track profile |

---

## 16. Document History

| Date | Change |
|------|--------|
| Jul 2026 | Initial Career Track project document |

---

*For Benda ecosystem overview, see `benda-infotech/PROJECT_DOCUMENT.md`. For recruiter/hiring features, see `ats/PROJECT_DOCUMENT.md` (Talent Desk).*
