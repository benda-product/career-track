# CareerTrack API Documentation

Full interactive documentation available at `/api-docs` (Swagger UI).

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Token refresh:
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{ "refreshToken": "<refresh_token>" }
```

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

## Error Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Schema

### User
- email, password (hashed), firstName, lastName
- role: candidate | admin
- isEmailVerified, refreshTokens[]
- googleId (optional)

### Profile
- userId (1:1 with User)
- headline, summary, phone, location
- skills[], experience[], education[], projects[]
- certifications[], achievements[], portfolio[]
- socialLinks[], careerPreferences, completionScore

### Application
- userId, jobId, jobTitle, company
- stage: applied | screening | shortlisted | interview | offer | rejected | hired
- timeline[], recruiterFeedback, atsApplicationId

### Notification
- userId, type, title, message, isRead, data

### SavedJob / RecentlyViewed
- userId, jobId, job metadata, timestamps

## Integration Architecture

```
CareerTrack Frontend
        ↓
CareerTrack Backend API
        ↓                    ↓
Resume Builder API      ATS Job API
```

Resume and Job modules act as **proxies** — CareerTrack does not store resume content or job listings locally (except saved/recent metadata).
