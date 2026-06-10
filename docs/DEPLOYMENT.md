# CareerTrack Production Deployment Guide

## 1. Infrastructure Requirements

| Service | Recommendation |
|---------|----------------|
| Database | MongoDB Atlas M10+ |
| Backend | AWS ECS, Railway, Render, or DigitalOcean App Platform |
| Frontend | Vercel or Netlify |
| File Storage | Cloudinary |
| Email | SendGrid, AWS SES, or Gmail SMTP |

## 2. Environment Setup

### Backend Production Variables

```env
NODE_ENV=production
PORT=5003
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/careertrack
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
CLIENT_URL=https://app.careertrack.com
RESUME_BUILDER_API_URL=https://resume-api.yourdomain.com/api
ATS_API_URL=https://ats-api.yourdomain.com/api
```

### Frontend Production Variables

```env
NEXT_PUBLIC_API_URL=https://api.careertrack.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.careertrack.com
```

## 3. Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f backend
```

## 4. Security Checklist

- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable MongoDB authentication and IP whitelist
- [ ] Configure HTTPS/TLS on all endpoints
- [ ] Set restrictive CORS (`CLIENT_URL` only)
- [ ] Enable rate limiting (configured in backend)
- [ ] Verify Resume Builder and ATS service URLs are reachable
- [ ] Never commit `.env` files

## 5. Monitoring

- Backend logs: `backend/logs/combined.log` and `error.log`
- Health check: `GET /api/v1/health`
- Swagger docs: `/api-docs` (disable in production or protect with auth)

## 6. Scaling

- **Backend**: Horizontal scaling behind load balancer; ensure sticky sessions for Socket.io or use Redis adapter
- **MongoDB**: Use replica set for production
- **Frontend**: Static deployment on CDN (Vercel handles this automatically)

## 7. CI/CD Pipeline (Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci && npm run build
      - run: docker build -t careertrack-api ./backend
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd frontend && npm ci && npm run build
```

## 8. Post-Deployment Verification

1. `curl https://api.careertrack.com/api/v1/health`
2. Register a test account
3. Verify email flow (if SMTP configured)
4. Test Resume Builder proxy connectivity
5. Test ATS job search connectivity
6. Verify WebSocket notifications
