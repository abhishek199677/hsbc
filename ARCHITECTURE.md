# Techcitta — System Architecture

> AI-Powered Job Screening & Interview Platform
> Designed for Global Scale | Multi-Tenant SaaS

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Jobseeker│  │ Employer │  │  Admin   │  │  Mobile  │           │
│  │  Browser  │  │ Browser  │  │ Browser  │  │   PWA    │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                 │
└───────┼──────────────┼──────────────┼──────────────┼─────────────────┘
        │              │              │              │
        └──────────────┴──────┬───────┴──────────────┘
                              │ HTTPS / WSS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EDGE / CDN LAYER                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Vercel Edge Network                       │   │
│  │  • SSL Termination (auto-provisioned)                       │   │
│  │  • DDoS Protection (Cloudflare backbone)                    │   │
│  │  • Static Asset Caching (JS, CSS, Images)                   │   │
│  │  • Middleware: Security Headers, CSP, CORS, Rate Limits     │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                                │
│                  (Next.js 16 — Serverless)                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   API ROUTES (Serverless Functions)          │   │
│  │                                                             │   │
│  │  /api/auth/*        Authentication (JWT + bcrypt)           │   │
│  │  /api/profile       Candidate profile CRUD                  │   │
│  │  /api/interview     Interview scheduling                    │   │
│  │  /api/ai-interview  AI interview engine (OpenAI)            │   │
│  │  /api/upload        File uploads (presigned R2 URLs)        │   │
│  │  /api/admin/*       Dashboard, analytics, team management   │   │
│  │  /api/billing/*     Stripe payments & webhooks              │   │
│  │  /api/feedback      User feedback collection                │   │
│  │  /api/account/*     GDPR, 2FA, onboarding                  │   │
│  │  /api/inngest       Background job queue endpoints          │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │                   MIDDLEWARE PIPELINE                        │   │
│  │                                                             │   │
│  │  Request → Security Headers → CORS → Rate Limit (Upstash)  │   │
│  │         → JWT Auth → Route Handler → Response              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   REACT SERVER COMPONENTS                    │   │
│  │                                                             │   │
│  │  Landing Pages (SEO) │ Dashboard (SSR) │ API Docs          │   │
│  │  Terms │ Privacy │ DPA │ Pricing                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   CLIENT COMPONENTS                          │   │
│  │                                                             │   │
│  │  Auth Context │ Onboarding Wizard │ Analytics Dashboard     │   │
│  │  Team Management │ Feedback Widget │ Live Interview Room    │   │
│  │  Proctoring (MediaPipe) │ Toast Notifications │ Crisp Chat  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   AI ENGINE     │ │  FILE STORAGE   │ │  PAYMENTS       │
│   (OpenAI)      │ │  (Cloudflare R2)│ │  (Stripe)       │
│                 │ │                 │ │                 │
│ • GPT-5-nano    │ │ • Video Recordings│ │ • Subscriptions│
│ • Interview Gen │ │ • Resumes (PDF) │ │ • Multi-Currency│
│ • Evaluation    │ │ • Captions (.vtt)│ │ • Tax Handling  │
│ • Scoring       │ │ • Presigned URLs │ │ • Webhooks      │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────d───┐
│                     DATA LAYER                                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Turso / libSQL (Edge Database)                  │   │
│  │                                                             │   │
│  │  • Replicated to 30+ global regions                         │   │
│  │  • Read latency: <10ms from any location                    │   │
│  │  • Multi-tenant: every query scoped by organizationId       │   │
│  │                                                             │   │
│  │  Models:                                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │ Organization │  │     User     │  │   Profile    │     │   │
│  │  │ • plan       │  │ • role       │  │ • skills     │     │   │
│  │  │ • stripe     │  │ • 2FA        │  │ • resume     │     │   │
│  │  │ • onboarding │  │ • orgId      │  │ • experience │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │  Interview   │  │  TeamMember  │  │   Feedback   │     │   │
│  │  │ • videoUrl   │  │ • role       │  │ • type       │     │   │
│  │  │ • evaluation │  │ • inviteToken│  │ • message    │     │   │
│  │  │ • proctoring │  │ • acceptedAt │  │ • status     │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Upstash Redis (Global Cache)                    │   │
│  │                                                             │   │
│  │  • Rate limiting (sliding window)                           │   │
│  │  • Session caching                                          │   │
│  │  • Shared across all serverless instances                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKGROUND JOBS (Inngest)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Email Queue  │  │ Reminder     │  │ AI Evaluate  │             │
│  │ • Welcome    │  │ Cron (60s)   │  │ Background   │             │
│  │ • Verify     │  │ • 24h before │  │ • Score      │             │
│  │ • Confirm    │  │ • 1h before  │  │ • Feedback   │             │
│  │ • Reset      │  │ • 15m before │  │ • Report     │             │
│  └──────────────┘  │ • Now        │  └──────────────┘             │
│                     └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  MONITORING & OBSERVABILITY                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Sentry     │  │  Vercel      │  │  Logs        │             │
│  │   Errors     │  │  Analytics   │  │  (Structured)│             │
│  │   Traces     │  │  Speed       │  │  Request ID  │             │
│  │   Alerts     │  │  Insights    │  │  Duration    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow — AI Interview Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Candidate│     │ Frontend │     │ Backend  │     │ OpenAI   │
│          │     │ (React)  │     │ (API)    │     │ (GPT-5)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  1. Start      │                │                │
     │  Interview     │                │                │
     │───────────────►│  POST          │                │
     │                │ /ai-interview  │                │
     │                │───────────────►│                │
     │                │                │  Generate      │
     │                │                │  Questions     │
     │                │                │───────────────►│
     │                │                │                │
     │                │                │  AI Response   │
     │                │                │◄───────────────│
     │                │  { message }   │                │
     │                │◄───────────────│                │
     │  "Hello,       │                │                │
     │   let's start" │                │                │
     │◄───────────────│                │                │
     │                │                │                │
     │  2. Answer     │                │                │
     │  (Speech-to-   │                │                │
     │   Text)        │                │                │
     │───────────────►│  POST          │                │
     │                │ /ai-interview  │                │
     │                │───────────────►│                │
     │                │                │  Evaluate      │
     │                │                │  Answer        │
     │                │                │───────────────►│
     │                │                │  Next Question │
     │                │                │◄───────────────│
     │                │  { message }   │                │
     │                │◄───────────────│                │
     │  Next question │                │                │
     │◄───────────────│                │                │
     │                │                │                │
     │  3. Repeat     │                │                │
     │  (5-6 rounds)  │                │                │
     │     ···        │     ···        │     ···        │
     │                │                │                │
     │  4. Complete   │                │                │
     │───────────────►│  POST          │                │
     │                │ /ai-interview  │                │
     │                │  action: eval  │                │
     │                │───────────────►│                │
     │                │                │  Full          │
     │                │                │  Evaluation    │
     │                │                │───────────────►│
     │                │                │                │
     │                │                │  Score +       │
     │                │                │  Feedback      │
     │                │                │◄───────────────│
     │                │                │                │
     │                │                │  Save to DB    │
     │                │                │  + Upload      │
     │                │                │  Video to R2   │
     │                │  { evaluation }│                │
     │                │◄───────────────│                │
     │  Results       │                │                │
     │◄───────────────│                │                │
     │                │                │                │
```

---

## 3. Multi-Tenant Data Isolation

```
┌─────────────────────────────────────────────────┐
│              Turso Edge Database                 │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           ORGANIZATION A                  │   │
│  │  org-uuid-a                              │   │
│  │  ├── Users (filtered by orgId)           │   │
│  │  ├── Profiles                            │   │
│  │  ├── Interviews                          │   │
│  │  └── TeamMembers                         │   │
│  │                                          │   │
│  │  Files: /org-uuid-a/resumes/*.pdf        │   │
│  │         /org-uuid-a/interviews/*.webm    │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           ORGANIZATION B                  │   │
│  │  org-uuid-b                              │   │
│  │  ├── Users (filtered by orgId)           │   │
│  │  ├── Profiles                            │   │
│  │  ├── Interviews                          │   │
│  │  └── TeamMembers                         │   │
│  │                                          │   │
│  │  Files: /org-uuid-b/resumes/*.pdf        │   │
│  │         /org-uuid-b/interviews/*.webm    │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  SECURITY: Every query includes WHERE orgId = ?  │
│            File access validates JWT org claim    │
└─────────────────────────────────────────────────┘
```

---

## 4. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
│                                                             │
│  Layer 1: EDGE (Vercel)                                     │
│  ├── SSL/TLS (auto-provisioned)                            │
│  ├── DDoS Protection (Cloudflare)                          │
│  └── IP Blocking                                           │
│                                                             │
│  Layer 2: MIDDLEWARE                                        │
│  ├── Security Headers (CSP, HSTS, X-Frame-Options)         │
│  ├── CORS (allowed origins)                                │
│  ├── Rate Limiting (Upstash Redis, sliding window)         │
│  └── Request Logging                                       │
│                                                             │
│  Layer 3: AUTHENTICATION                                    │
│  ├── JWT (7-day expiry, Bearer token)                      │
│  ├── bcrypt password hashing (12 rounds)                   │
│  ├── Email verification                                    │
│  └── Two-Factor Auth (TOTP, admin only)                    │
│                                                             │
│  Layer 4: AUTHORIZATION                                     │
│  ├── Role-based (owner > admin > interviewer > member)     │
│  ├── Org-scoped queries (every DB query filtered)          │
│  └── File access validation (JWT org vs path)              │
│                                                             │
│  Layer 5: DATA PROTECTION                                   │
│  ├── GDPR compliance (export, delete)                      │
│  ├── Prompt injection defense (XML delimiters)             │
│  └── Input validation (email, password, file types)        │
│                                                             │
│  Layer 6: MONITORING                                        │
│  ├── Sentry (error tracking + alerts)                      │
│  ├── Structured logging (request ID, duration)             │
│  └── Anomaly detection (rate limit breaches)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Scaling Strategy

```
                    USERS
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
      1-100       100-1K       1K-10K
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ FREE    │ │ STARTER │ │ PRO     │
    │ TIERS   │ │         │ │         │
    └────┬────┘ └────┬────┘ └────┬────┘
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ SQLite  │ │ Turso   │ │ Turso   │
    │ (local) │ │ (edge)  │ │ + Redis │
    │ In-mem  │ │ Upstash │ │ Queue   │
    │ rate    │ │ rate    │ │ Workers │
    │ limit   │ │ limit   │ │ CDN     │
    └─────────┘ └─────────┘ └─────────┘
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Sync    │ │ Inngest │ │ Inngest │
    │ email   │ │ bg jobs │ │ + Bull  │
    │         │ │         │ │ MQ      │
    └─────────┘ └─────────┘ └─────────┘
```

---

## 6. Deployment Pipeline

```
┌──────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Git  │───►│  GitHub   │───►│  Vercel  │───►│Production│
│ Push │    │  Actions  │    │  Build   │    │  Deploy  │
└──────┘    └──────────┘    └──────────┘    └──────────┘
                │                │                │
                ▼                ▼                ▼
           ┌─────────┐    ┌─────────┐    ┌─────────┐
           │ Lint +  │    │ Prisma  │    │ SSL     │
           │ Type    │    │ Generate│    │ Auto    │
           │ Check   │    │ + Build │    │ Provision│
           └─────────┘    └─────────┘    └─────────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ Preview URL │
                          │ (PR checks) │
                          └─────────────┘
```

---

## 7. Cost at Scale

| Users | Vercel | Turso | Upstash | Sentry | Inngest | OpenAI | Total/mo |
|-------|--------|-------|---------|--------|---------|--------|----------|
| 100 | $0 | $0 | $0 | $0 | $0 | ~$50 | ~$50 |
| 500 | $20 | $25 | $10 | $0 | $0 | ~$200 | ~$255 |
| 1,000 | $20 | $50 | $10 | $26 | $0 | ~$400 | ~$506 |
| 5,000 | $20 | $100 | $10 | $26 | $25 | ~$2,000 | ~$2,181 |

*At 1,000 users paying $99/mo = $99,000 revenue vs $506 cost = **99.5% margin***

---

## 8. Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 + React 19 | SSR/SSG, App Router, Server Components |
| **Styling** | Tailwind CSS 4 | Utility-first, fast UI development |
| **Language** | TypeScript 5 (strict) | Type safety, better DX |
| **Database** | Turso (libSQL/SQLite) | Edge-replicated, low latency globally |
| **ORM** | Prisma 7 | Type-safe queries, migrations |
| **Auth** | JWT + bcrypt | Stateless, scalable, no session store |
| **AI** | OpenAI GPT-5-nano | Interview generation + evaluation |
| **Storage** | Cloudflare R2 | S3-compatible, no egress fees |
| **Payments** | Stripe | Multi-currency, tax compliance |
| **Email** | Nodemailer (SMTP) | Reliable delivery, any provider |
| **Rate Limiting** | Upstash Redis | Global, serverless-compatible |
| **Background Jobs** | Inngest | Durable, serverless-native |
| **Error Tracking** | Sentry | Real-time alerts, stack traces |
| **Live Chat** | Crisp | Customer support widget |
| **Hosting** | Vercel | Auto-scale, zero-config |
| **Proctoring** | MediaPipe (client-side) | Face detection, anti-cheating |
| **PWA** | Service Worker | Offline support, installable |

---

*Document prepared by: AI Architect*
*Version: 1.0 | Date: August 2026*
