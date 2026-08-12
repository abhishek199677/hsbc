# Techcitta - Architecture Workflow Diagram

## System Overview

```
                            ┌─────────────────────────────┐
                            │     1000s OF USERS ONLINE    │
                            │   (Jobseekers + Employers)   │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: FRONTEND                                    │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Landing     │  │   Signup    │  │   Profile   │  │   Admin     │        │
│   │   Pages      │  │   & Login   │  │   Wizard    │  │  Dashboard  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Interview   │  │  AI Live    │  │   Pricing   │  │   Settings  │        │
│   │  Schedule    │  │   Room      │  │   & Billing  │  │  & GDPR     │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│   Tech: React 19 + Next.js 16 + Tailwind CSS + TypeScript                   │
│   Runs in: User's Browser (Mobile / Desktop)                                 │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: MIDDLEWARE (Security Gate)                      │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐       │
│   │                                                                  │       │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │       │
│   │   │  RATE        │  │  JWT AUTH     │  │  CORS        │          │       │
│   │   │  LIMITER     │  │  VERIFIER     │  │  PROTECTOR   │          │       │
│   │   │              │  │              │  │              │          │       │
│   │   │ Max 20 req/  │  │ Validates    │  │ Only allows  │          │       │
│   │   │ min per IP   │  │ login tokens │  │ trusted      │          │       │
│   │   │              │  │ (7-day exp)  │  │ domains      │          │       │
│   │   └──────────────┘  └──────────────┘  └──────────────┘          │       │
│   │                                                                  │       │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │       │
│   │   │  INPUT       │  │  ORG         │  │  PLAN        │          │       │
│   │   │  VALIDATOR   │  │  ISOLATOR    │  │  ENFORCER    │          │       │
│   │   │              │  │              │  │              │          │       │
│   │   │ Sanitizes    │  │ Each company │  │ Checks       │          │       │
│   │   │ email,       │  │ sees ONLY    │  │ interview    │          │       │
│   │   │ password,    │  │ their own    │  │ limits per   │          │       │
│   │   │ phone inputs │  │ data         │  │ plan tier    │          │       │
│   │   └──────────────┘  └──────────────┘  └──────────────┘          │       │
│   │                                                                  │       │
│   └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: BACKEND (API Routes)                             │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                     16 API ENDPOINTS                                │    │
│   ├─────────────────────────────────────────────────────────────────────┤    │
│   │                                                                     │    │
│   │  AUTH              PROFILE           INTERVIEW          AI ENGINE   │    │
│   │  ─────             ───────           ─────────          ─────────   │    │
│   │  POST /signup      GET  /profile     GET  /interview    POST /ai   │    │
│   │  POST /login       PUT  /profile     POST /interview    (generates │    │
│   │                                                  PATCH  /interview │    │
│   │                                                 questions & scores)│    │
│   │                                                                     │    │
│   │  UPLOAD            BILLING           ADMIN              ACCOUNT    │    │
│   │  ──────            ───────           ─────              ───────    │    │
│   │  POST /upload      POST /checkout    GET  /admin/stats  GET  /me  │    │
│   │  GET  /files/*     POST /webhook     GET  /admin/users  GET  /exp │    │
│   │                    POST /portal                       POST /delete  │    │
│   │                                                                     │    │
│   │  REMINDERS                                                 GDPR    │    │
│   │  ─────────                                                  ────    │    │
│   │  GET /reminders (auto email + WhatsApp at 24h, 1h, 15min)         │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   Tech: Next.js API Routes (Serverless Functions on Vercel)                  │
│   Each request = isolated function (auto-scales with traffic)                │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 4: DATABASE                                       │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐       │
│   │                    Turso (libSQL Cloud)                          │       │
│   │                    + Prisma ORM (Type-safe)                      │       │
│   │                                                                  │       │
│   │   ┌──────────────┐     ┌──────────────┐                         │       │
│   │   │ Organization │────▶│     User     │                         │       │
│   │   │              │     │              │                         │       │
│   │   │ • name       │     │ • email      │──┐                      │       │
│   │   │ • plan       │     │ • password   │  │                      │       │
│   │   │ • stripeId   │     │ • role       │  │                      │       │
│   │   │ • colors     │     └──────┬───────┘  │                      │       │
│   │   └──────────────┘            │          │                      │       │
│   │                          ┌────┴────┐  ┌──┴──────────┐          │       │
│   │                          │ Profile │  │ Interview   │          │       │
│   │                          │         │  │             │          │       │
│   │                          │ • skills│  │ • videoUrl  │          │       │
│   │                          │ • resume│  │ • evaluate  │          │       │
│   │                          │ • prefs │  │ • proctor   │          │       │
│   │                          └─────────┘  │ • reminders │          │       │
│   │                                       └─────────────┘          │       │
│   │                                                                  │       │
│   │   ┌──────────────────┐                                          │       │
│   │   │ VerificationToken│                                          │       │
│   │   │ • email verify   │                                          │       │
│   │   │ • password reset │                                          │       │
│   │   └──────────────────┘                                          │       │
│   └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   LAYER 5: EXTERNAL SERVICES                                │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  Cloudflare  │  │   Stripe    │  │   OpenAI    │  │  Nodemailer │        │
│   │     R2       │  │             │  │   GPT-5     │  │   (SMTP)    │        │
│   │              │  │             │  │             │  │             │        │
│   │ Video &      │  │ Subscription│  │ AI Questions│  │ Transactional│       │
│   │ Resume       │  │ Billing &   │  │ & Answer    │  │ Emails:     │        │
│   │ Storage      │  │ Payments    │  │ Evaluation  │  │ • Verify    │        │
│   │ (Free tier)  │  │ (2.9%+$0.30)│  │ (~$0.01/int)│  │ • Reset pwd │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  │ • Confirm   │        │
│                                                       │ • Reminders │        │
│   ┌─────────────┐                                     └─────────────┘        │
│   │  WhatsApp   │                                                            │
│   │  Business   │  Interview reminders via WhatsApp                          │
│   │  API        │                                                            │
│   └─────────────┘                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## How 1000s of Users Are Handled Simultaneously

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SCALING STRATEGY                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SERVERLESS ARCHITECTURE (Auto-Scales)                                    │
│  ─────────────────────────────────────────                                   │
│                                                                              │
│     10 users ──▶ 10 serverless functions spin up                             │
│     100 users ──▶ 100 functions spin up                                      │
│     1000 users ──▶ 1000 functions spin up                                    │
│     10000 users ──▶ 10000 functions spin up                                  │
│                                                                              │
│     No manual server management needed!                                      │
│     Vercel handles this automatically.                                       │
│                                                                              │
│  2. DATABASE SCALING                                                         │
│  ──────────────────                                                          │
│                                                                              │
│     Turso (libSQL) = Edge Database                                           │
│     ├── Replicates to 30+ locations worldwide                                │
│     ├── Users connect to NEAREST region (low latency)                        │
│     ├── Handles 1000s of concurrent reads                                    │
│     └── Automatic failover if one region goes down                           │
│                                                                              │
│  3. FILE STORAGE (Video/Resumes)                                             │
│  ────────────────────────────────                                            │
│                                                                              │
│     Cloudflare R2                                                            │
│     ├── 100+ edge locations worldwide                                        │
│     ├── Videos upload DIRECTLY from browser (bypasses server)                │
│     ├── No bandwidth limit on server                                         │
│     └── Automatic CDN = fast video playback globally                         │
│                                                                              │
│  4. AI ENGINE (Bottleneck Solution)                                          │
│  ───────────────────────────────────                                         │
│                                                                              │
│     OpenAI API                                                               │
│     ├── Rate limit: ~500 requests/min                                        │
│     ├── Queue system: If 1000 users hit AI at once:                          │
│     │   ┌─────────┐    ┌──────────┐    ┌─────────┐                          │
│     │   │ Request │───▶│  Queue   │───▶│ Process │                          │
│     │   │  1      │    │ (Wait)   │    │  1 by 1 │                          │
│     │   │  2      │    │          │    │         │                          │
│     │   │  3      │    │          │    │         │                          │
│     │   └─────────┘    └──────────┘    └─────────┘                          │
│     │   Users see "Processing..." while waiting                              │
│     └── Can upgrade to GPT-5 for higher rate limits                          │
│                                                                              │
│  5. EMAIL DELIVERY                                                           │
│  ────────────────                                                            │
│                                                                              │
│     Nodemailer + SMTP                                                        │
│     ├── 1000 emails = batched in background                                  │
│     ├── Runs in serverless function (non-blocking)                           │
│     └── Can upgrade to SendGrid/AWS SES for 10k+ emails/day                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Request Flow (One User Action)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXAMPLE: Candidate Completes an AI Interview                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: User's Browser                                                     │
│  ──────────────────────                                                      │
│  ┌──────────────┐                                                           │
│  │  Candidate   │──▶ Clicks "Start Interview"                               │
│  │  (Laptop)    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 2: Middleware (Security Check)                                         │
│  ──────────────────────────────────                                          │
│  ┌──────────────┐                                                           │
│  │  Check Rate  │──▶ Is this IP blocked? (>20 req/min = blocked)            │
│  │  Limit       │                                                           │
│  └──────┬───────┘                                                           │
│         │ ✅ Pass                                                           │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │  Verify JWT  │──▶ Is token valid? Is user logged in?                     │
│  │  Token       │                                                           │
│  └──────┬───────┘                                                           │
│         │ ✅ Valid                                                           │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │  Check Plan  │──▶ Does org have interview slots left?                     │
│  │  Limits      │    Starter: 3/month, Pro: 100, Enterprise: Unlimited      │
│  └──────┬───────┘                                                           │
│         │ ✅ Allowed                                                         │
│         ▼                                                                   │
│  Step 3: Backend API                                                        │
│  ──────────────────                                                          │
│  ┌──────────────┐                                                           │
│  │  POST        │──▶ /api/ai-interview                                      │
│  │  /api/ai     │    { userId, interviewId }                                │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │  Database    │──▶ Fetch user profile + interview details                  │
│  │  Query       │    SELECT * FROM "Interview" WHERE id = ?                  │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │  OpenAI API  │──▶ Generate 6 interview questions based on:                │
│  │  Request     │    • User's skills (React, Node.js, etc.)                  │
│  │              │    • Job type (Full-time, Part-time)                       │
│  │              │    • Experience level                                      │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 4: User's Browser (AI Interview Room)                                 │
│  ──────────────────────────────────────────                                  │
│  ┌──────────────┐                                                           │
│  │  AI Asks     │──▶ "Tell me about your experience with..."                │
│  │  Question 1  │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │  Candidate   │──▶ Records video answer (1-2 min)                         │
│  │  Records     │    Camera + Mic capture                                   │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 5: Video Upload (Direct to Cloud)                                     │
│  ───────────────────────────────────────                                     │
│  ┌──────────────┐                                                           │
│  │  Video       │──▶ Uploads DIRECTLY to Cloudflare R2                      │
│  │  Upload      │    (Never hits our server = no bandwidth cost)             │
│  └──────┬───────┘                                                           │
│         │ ✅ Saved                                                           │
│         ▼                                                                   │
│  Step 6: AI Evaluation                                                      │
│  ────────────────────                                                        │
│  ┌──────────────┐                                                           │
│  │  OpenAI      │──▶ Analyzes:                                              │
│  │  Evaluates   │    • Transcript accuracy                                   │
│  │  Answer      │    • Relevance to question                                 │
│  │              │    • Communication clarity                                 │
│  │              │    • Technical depth                                       │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │  Score: 7.5  │──▶ Recommendation: "HIRE"                                 │
│  │  /10         │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 7: Anti-Cheating (Proctoring)                                         │
│  ──────────────────────────────────                                          │
│  ┌──────────────┐                                                           │
│  │  Face Land-  │──▶ Detects:                                               │
│  │  mark API    │    • Is candidate looking away?                            │
│  │  (MediaPipe) │    • Is face hidden?                                       │
│  │              │    • Multiple faces detected?                              │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 8: Save Results                                                       │
│  ────────────────────                                                        │
│  ┌──────────────┐                                                           │
│  │  Database    │──▶ UPDATE "Interview" SET                                  │
│  │  Update      │    evaluation = 'HIRE',                                   │
│  │              │    evaluationScore = 7.5,                                 │
│  │              │    proctoringReport = {...},                               │
│  │              │    status = 'completed'                                    │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 9: Notifications                                                      │
│  ────────────────────                                                        │
│  ┌──────────────┐                                                           │
│  │  Email       │──▶ Sends to candidate: "Your interview is complete!"       │
│  │  Sent        │    Sends to admin: "New interview ready for review"        │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  Step 10: Admin Dashboard                                                   │
│  ────────────────────────                                                    │
│  ┌──────────────┐                                                           │
│  │  Admin       │──▶ Views: Video playback + AI score + Proctoring report    │
│  │  Reviews     │    Can approve / reject / download                         │
│  └──────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW MAP                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│                         ┌─────────────────┐                                 │
│                         │   USER DATA     │                                 │
│                         │   (Browser)     │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│                    ┌─────────────┼─────────────┐                            │
│                    │             │             │                            │
│                    ▼             ▼             ▼                            │
│            ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│            │  Auth    │  │ Profile  │  │ Video    │                         │
│            │  Data    │  │  Data    │  │  Data    │                         │
│            └────┬─────┘  └────┬─────┘  └────┬─────┘                         │
│                 │             │             │                               │
│                 ▼             ▼             ▼                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                   DATABASE (Turso)                       │               │
│  │                                                          │               │
│  │  Users ──▶ Profiles ──▶ Interviews ──▶ Evaluations     │               │
│  └──────────────────────────────────────────────────────────┘               │
│                 │             │             │                               │
│                 ▼             ▼             ▼                               │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │                   EXTERNAL SERVICES                      │               │
│  │                                                          │               │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │                │
│  │  │ Stripe   │  │ OpenAI   │  │ R2       │  │ Email    │ │                │
│  │  │ (Money)  │  │ (Brain)  │  │ (Files)  │  │ (Alerts) │ │                │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │                │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Isolation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPANY A (e.g., "Google")                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  Org: Google                                                    │        │
│  │  Users: user1@google.com, user2@google.com                      │        │
│  │  Interviews: Only Google's interviews                           │        │
│  │  Plan: Pro ($99/month, 100 interviews)                          │        │
│  │  Branding: Google colors + logo                                 │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌──────────────────────────────────┐                                       │
│  │  SAME DATABASE                   │                                       │
│  │  (Isolated by organizationId)    │                                       │
│  └──────────────────────────────────┘                                       │
│                                                                             │
│  COMPANY B (e.g., "Microsoft")                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  Org: Microsoft                                                 │        │
│  │  Users: user1@microsoft.com, user2@microsoft.com                │        │
│  │  Interviews: Only Microsoft's interviews                        │        │
│  │  Plan: Enterprise (unlimited)                                   │        │
│  │  Branding: Microsoft colors + logo                              │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ⚠️  Google CANNOT see Microsoft's data                                     │
│  ⚠️  Microsoft CANNOT see Google's data                                     │
│  ✅  Each company is completely isolated                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cost & Scalability Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COST AT SCALE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Users          Cost/Month      Infrastructure                            │
│   ─────          ──────────      ──────────────                             │
│   1-100          ~$0            Vercel Free + Turso Free + R2 Free          │
│   100-500        ~$20           Turso Pro (database scaling)                │
│   500-1000       ~$50           Vercel Pro + Turso Pro                      │
│   1000-5000      ~$150          Vercel Pro + Turso Scale + Queue            │
│   5000-10000     ~$400          Enterprise DB + CDN + Queue System          │
│                                                                             │
│   Per-Interview Cost:                                                       │
│   ├── OpenAI API:     ~$0.01 per interview evaluation                       │
│   ├── Video Storage:  ~$0.005 per GB (R2)                                   │
│   ├── Email:          ~$0.001 per email                                     │
│   └── TOTAL:          ~$0.02 per interview                                  │
│                                                                             │
│   Revenue per interview (Pro plan): $99 / 100 = ~$0.99                      │
│   Profit margin: ~97%                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Techcitta - Architecture Workflow Document*
