---

## What Is It?

An **AI-powered hiring platform** where candidates record video interviews that are automatically evaluated by AI, and admins review results on a dashboard.

---

## How It Works (User Flow)

```
Signup → Fill Profile (7 steps) → Schedule Interview → AI Interview (6 questions)
                                                              ↓
                                                    AI Scores & Recommends
                                                              ↓
                                                    Admin Reviews Dashboard
```

---

## 4-Layer Architecture

```
┌────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Next.js)                                │
│  Landing pages, signup, profile forms, video recording,    │
│  admin dashboard, pricing page                             │
├────────────────────────────────────────────────────────────┤
│  BACKEND (Next.js API Routes)                              │
│  Auth (JWT), profile management, interview scheduling,     │
│  AI question generation, file upload, billing, reminders   │
├────────────────────────────────────────────────────────────┤
│  DATABASE (SQLite/Turso via Prisma ORM)                    │
│  Users, organizations, profiles, interviews, tokens        │
├────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                         │
│  OpenAI (AI brain), Stripe (payments), Cloudflare R2       │
│  (file storage), Nodemailer (email), WhatsApp API          │
└────────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | What It Does |
|---------|-------------|
| **AI Video Interview** | AI asks 6 questions, records candidate, scores answers, recommends Hire/Consider/Reject |
| **Anti-Cheating** | Detects if candidate looks away, hides face, or another person appears |
| **Multi-Tenant** | Each company gets isolated workspace with separate data |
| **Plan System** | Starter (3 interviews/mo), Pro (100), Enterprise (unlimited) |
| **Auto Reminders** | Sends email + WhatsApp at 24h, 1h, 15min before interview |
| **GDPR Compliant** | Users can export or delete all their data |

---

## Tech Stack (Simple)

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend + Backend | Next.js 16 | One framework for everything, fast development |
| UI | React 19 + Tailwind CSS | Modern, responsive design |
| Database | SQLite / Turso | Free, lightweight, easy to scale |
| ORM | Prisma 7 | Type-safe database queries |
| AI | OpenAI GPT-5-nano | Powers question generation + evaluation |
| Payments | Stripe | Subscription billing, multi-currency |
| Storage | Cloudflare R2 | Free cloud storage for videos |
| Auth | JWT + bcrypt | Secure, stateless authentication |

---

## Database (5 Tables)

```
Organization ──1:many──> User ──1:1──> Profile
                       User ──1:1──> Interview
                       User ─:many──> VerificationToken
```

---

## API Endpoints (14 Routes)

| Domain | Endpoints | Purpose |
|--------|-----------|---------|
| Auth | signup, login, verify-email, forgot-password, reset-password | User authentication |
| Profile | GET/PUT /api/profile | 7-step onboarding wizard |
| Interview | GET/POST/PATCH /api/interview | Scheduling + completion |
| AI | POST /api/ai-interview | Question generation + evaluation |
| Upload | POST /api/upload, GET /api/files/[...path] | File handling |
| Billing | checkout, webhook, portal | Stripe subscription management |
| Admin | stats, users | Dashboard data |
| Account | me, export, delete | GDPR compliance |
| Reminders | GET /api/reminders | Auto email/WhatsApp notifications |

---

## Security

- JWT tokens (7-day expiry) for authentication
- bcrypt password hashing (12 rounds)
- Per-IP rate limiting on sensitive endpoints
- Org-level data isolation (users can only see their org's data)
- Email verification required before full access
- Video uploads go directly to cloud (never hits our server body)

---

## Cost Model

| Service | Cost |
|---------|------|
| Vercel (hosting) | Free tier |
| Turso (database) | Free tier |
| Cloudflare R2 (storage) | Free tier |
| OpenAI | Pay-per-use (~$0.01/interview) |
| Stripe | 2.9% + $0.30 per transaction |


---

## Scalability

- **Current:** Handles hundreds of users
- **Growth path:** Migrate SQLite → Turso (cloud DB) for thousands
- **Bottleneck:** OpenAI API rate limits (can add queue system)
- **File storage:** Already cloud-based (R2), scales automatically

---

*Techcitta Project*
