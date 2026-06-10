# CareerTrack

Enterprise AI-powered Candidate Platform built with Next.js 15, React 19, Express.js, TypeScript, and MongoDB.

CareerTrack is a **candidate platform** (not an ATS) that integrates with:
- **Resume Builder API** — resume creation, scoring, templates, PDF export
- **ATS Job API** — job search, applications, recommendations

## Project Structure

```
career-track/
├── frontend/          # Next.js 15 App Router
├── backend/           # Express.js + MongoDB API
├── docker-compose.yml
└── README.md
```

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- MongoDB 7+ (or use Docker)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5003`
Swagger: `http://localhost:5003/api-docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3003`

### Docker (Production)

```bash
cp backend/.env.example .env
docker-compose up -d --build
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register candidate |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh-token` | Refresh JWT |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/forgot-password` | Request reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| POST | `/api/v1/auth/google` | Google OAuth |
| GET | `/api/v1/auth/verify-email` | Verify email |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profile` | Get profile |
| PUT | `/api/v1/profile` | Update profile |
| GET | `/api/v1/profile/completion` | Profile completion score |

### Resume (Proxy → Resume Builder)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/resume` | List resumes |
| POST | `/api/v1/resume/create` | Create resume |
| PUT | `/api/v1/resume/update/:id` | Update resume |
| GET | `/api/v1/resume/score/:id` | ATS score |
| GET | `/api/v1/resume/templates` | List templates |

### Jobs (Proxy → ATS)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/jobs` | Search jobs |
| GET | `/api/v1/jobs/:id` | Job details |
| POST | `/api/v1/jobs/:id/apply` | Apply to job |
| POST | `/api/v1/jobs/save` | Save job |
| GET | `/api/v1/jobs/recommended` | Recommended jobs |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/applications` | List applications |
| GET | `/api/v1/applications/:id` | Application detail |
| GET | `/api/v1/applications/analytics` | Analytics |
| PATCH | `/api/v1/applications/:id/stage` | Update stage |

### Dashboard & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard` | Dashboard widgets |
| GET | `/api/v1/notifications` | Notifications |
| PATCH | `/api/v1/notifications/:id/read` | Mark read |

## Environment Variables

### Backend (`backend/.env`)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — JWT signing keys
- `RESUME_BUILDER_API_URL`
- `ATS_API_URL`
- `CLOUDINARY_*` — File uploads
- `EMAIL_*` — Nodemailer config

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` — Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` — WebSocket URL

## Architecture

### Backend (Clean Architecture)
- **Modules**: auth, profile, resume, jobs, applications, notifications
- **Layers**: controllers → services → repositories → models
- **Integrations**: Resume Builder proxy, ATS proxy
- **Security**: JWT, RBAC, Helmet, rate limiting, input validation
- **Real-time**: Socket.io for notifications

### Frontend (Feature-Based)
- **App Router** with route groups for dashboard
- **Services**: Centralized API layer with token refresh
- **State**: Zustand (auth) + TanStack Query (server state)
- **UI**: ShadCN + Tailwind CSS + Framer Motion

## Production Deployment

1. Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
2. Configure MongoDB Atlas or managed MongoDB
3. Set `RESUME_BUILDER_API_URL` and `ATS_API_URL` to production services
4. Configure Cloudinary for file uploads
5. Set up SMTP for email (verification, password reset)
6. Deploy backend (Railway, Render, AWS ECS, etc.)
7. Deploy frontend (Vercel, Netlify, etc.)
8. Set `CLIENT_URL` and `NEXT_PUBLIC_API_URL` to production domains
9. Enable HTTPS and update CORS origins

## License

Proprietary — CareerTrack Enterprise Platform
