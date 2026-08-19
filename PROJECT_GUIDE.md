# HireRight — Intern Project Guide

> A plain-English walkthrough of the entire codebase.
> Read this first before touching any code.

---

## What Is This Project?

HireRight is an **AI-powered interview platform**. Instead of a human recruiter,
an **AI conducts live video interviews** with candidates. It can also give
**live coding challenges** during the interview.

**The flow:**
1. Candidate signs up and builds a profile (resume, skills, experience)
2. Candidate schedules an interview
3. AI interviews the candidate over live video (WebRTC)
4. AI can switch to a coding challenge mid-interview
5. Results are evaluated and stored
6. Admin reviews everything on a dashboard

---

## Tech Stack at a Glance

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| Frontend | Next.js 16 + React 19 | Web app (pages, UI, API routes) |
| Styling | Tailwind CSS 4 | Utility-first CSS framework |
| Database | PostgreSQL (Neon) | Stores all data |
| ORM | Prisma 7 | Type-safe database queries |
| Auth | JWT + bcryptjs + speakeasy | Login, sessions, 2FA |
| AI | OpenAI GPT (gpt-5-nano) | Powers the interviewer |
| Real-time Video | LiveKit (WebRTC) | Live video/audio between candidate and AI |
| Speech-to-Text | Deepgram | Transcribes what the candidate says |
| Proctoring | MediaPipe | Detects cheating (eye movement, face) |
| Code Editor | Monaco Editor | In-browser code editor (like VS Code) |
| Code Sandbox | Docker + VM2 | Safely executes candidate code |
| Payments | Stripe | Billing and subscriptions |
| Email | Nodemailer | Sends verification emails |
| Background Jobs | Inngest | Scheduled tasks (reminders, etc.) |
| Monitoring | Sentry | Error tracking |
| Deployment | Vercel | Hosts the Next.js app |
| Backend | FastAPI (Python) | Agency/recruitment features |
| AI Agent | LiveKit Agent Framework | Python service for real-time voice AI |

---

## Project Structure — Every Folder Explained

```
hsbc/
├── src/                    # Next.js app (frontend + API routes)
│   ├── app/                #   Pages and API endpoints
│   ├── components/         #   Reusable UI components
│   ├── contexts/           #   React context (global state)
│   ├── lib/                #   Utility functions and services
│   ├── types/              #   TypeScript type declarations
│   └── middleware.ts       #   Request middleware (auth checks)
│
├── agent/                  # Python AI interview agent (LiveKit)
├── evaluator/              # Node.js code execution sandbox
├── backend/                # Python FastAPI backend (agency features)
├── prisma/                 # Database schema and migrations
├── public/                 # Static files (images, videos, WASM)
└── .github/workflows/      # CI/CD (GitHub Actions)
```

---

## `src/app/` — Pages & API Routes

### Pages (what users see)

| File | What It Does |
|------|-------------|
| `layout.tsx` | Root layout — wraps every page (navbar, providers, toasts) |
| `page.tsx` | Landing page — hero, features, pricing, CTA |
| `globals.css` | Global styles (scrollbar, animations, glare effects) |
| **Auth pages** | |
| `login/page.tsx` | Login form |
| `signup/page.tsx` | Registration form |
| `forgot-password/page.tsx` | Password reset request |
| `reset-password/page.tsx` | Password reset form |
| `verify-email/page.tsx` | Email verification |
| **Interview pages** | |
| `interview/page.tsx` | Interview dashboard — shows upcoming/completed interviews |
| `interview/setup/[id]/page.tsx` | Pre-interview setup — camera/mic check, proctoring consent |
| `interview/live/page.tsx` | **Main interview page** — where the AI interview happens |
| `interview/live/LiveInterviewContent.tsx` | **The big one** — 1700+ lines, handles all interview logic |
| `interview/[id]/page.tsx` | Interview detail page |
| `interview/[id]/results/page.tsx` | Post-interview results display |
| `interview/room/page.tsx` | Interview room (legacy) |
| **Admin pages** | |
| `admin/page.tsx` | Admin dashboard |
| `admin/enterprise/page.tsx` | Enterprise settings |
| **Other pages** | |
| `profile/page.tsx` | User profile editor |
| `settings/page.tsx` | Account settings |
| `pricing/page.tsx` | Pricing plans |
| `confirmation/page.tsx` | Post-action confirmation |
| `privacy/page.tsx` | Privacy policy |
| `terms/page.tsx` | Terms of service |
| `dpa/page.tsx` | Data processing agreement |

### API Routes (what the frontend calls)

| Route | Method | Purpose |
|-------|--------|---------|
| **Auth** | | |
| `/api/auth/login` | POST | Log in, create session |
| `/api/auth/logout` | POST | Log out, destroy session |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/verify-email` | GET | Verify email token |
| `/api/auth/resend-verification` | POST | Resend verification email |
| `/api/auth/sso/callback` | POST | SSO login callback |
| `/api/auth/sso/metadata/[org]` | GET | SSO metadata |
| **Account** | | |
| `/api/account/me` | GET | Get current user |
| `/api/account/delete` | DELETE | Delete account |
| `/api/account/export` | GET | Export user data (GDPR) |
| `/api/account/onboarding` | POST | Complete onboarding |
| `/api/account/2fa/setup` | POST | Enable 2FA |
| `/api/account/2fa/verify` | POST | Verify 2FA code |
| `/api/account/2fa/disable` | POST | Disable 2FA |
| **Interviews** | | |
| `/api/interview` | GET/POST | Get or create interview |
| `/api/interviews` | GET | List all interviews |
| `/api/interviews/[id]` | GET | Get interview by ID |
| `/api/interviews/[id]/answer` | POST | Submit answer |
| `/api/interviews/[id]/end` | POST | End interview |
| `/api/interviews/[id]/next-question` | POST | Get next question |
| `/api/ai-interview` | POST | **AI interview engine** — start, respond, evaluate, coding_challenge, submit_code |
| `/api/ai-agent` | POST | **LiveKit agent dispatch** — creates room + token |
| `/api/livekit` | POST | Legacy LiveKit room creation |
| **AI & Sandbox** | | |
| `/api/sandbox` | POST | Execute code in Docker sandbox |
| `/api/proctor/validate` | POST | Validate proctoring report |
| `/api/transcribe` | POST | Transcribe audio (Deepgram) |
| **Admin** | | |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/analytics` | GET | Analytics data |
| `/api/admin/users` | GET | User management |
| `/api/admin/team` | GET/POST | Team management |
| `/api/admin/team/invite` | POST | Invite team member |
| `/api/admin/openai-metrics` | GET | AI usage metrics |
| `/api/admin/login-logs` | GET | Login audit trail |
| `/api/admin/feedback` | GET | User feedback |
| **Billing** | | |
| `/api/billing/checkout` | POST | Create Stripe checkout |
| `/api/billing/portal` | POST | Stripe customer portal |
| `/api/billing/webhook` | POST | Stripe webhook handler |
| **Enterprise** | | |
| `/api/enterprise/audit` | GET | Audit logs |
| `/api/enterprise/webhooks` | CRUD | Webhook management |
| `/api/enterprise/sso` | CRUD | SSO configuration |
| `/api/enterprise/branding` | CRUD | White-label branding |
| `/api/enterprise/api-keys` | CRUD | API key management |
| **Agency** | | |
| `/api/agency/candidates` | GET | List candidates |
| `/api/agency/clients` | GET | List clients |
| `/api/agency/jobs` | GET | List jobs |
| `/api/agency/screen` | POST | Screen candidate |
| `/api/agency/screen/bulk` | POST | Bulk screening |
| `/api/agency/placements` | GET/POST | Manage placements |
| `/api/agency/submissions` | GET/POST | Job submissions |
| `/api/agency/client-jds` | GET | Client job descriptions |
| **Other** | | |
| `/api/chat` | POST | AI chatbot |
| `/api/feedback` | POST | Submit feedback |
| `/api/files/[...path]` | GET | File serving |
| `/api/inngest` | POST | Inngest background jobs |
| `/api/match` | POST | Candidate matching |
| `/api/profile` | GET/PUT | Profile management |
| `/api/reminders` | GET | Interview reminders |
| `/api/upload` | POST | File upload |

---

## `src/components/` — UI Components

### Landing Page
| File | What It Does |
|------|-------------|
| `Hero.tsx` | Big hero section at top of landing page |
| `Features.tsx` | Feature cards grid |
| `HowItWorks.tsx` | Step-by-step explanation |
| `Pricing.tsx` (in app/pricing) | Pricing table |
| `CTA.tsx` | Call-to-action banner |
| `Footer.tsx` | Page footer |
| `Navbar.tsx` | Top navigation bar |
| `CompanyLogos.tsx` | Trusted-by logo carousel |
| `VideoSection.tsx` | Demo video section |

### Interview System
| File | What It Does |
|------|-------------|
| `LiveKitInterviewRoom.tsx` | **LiveKit video room** — wraps WebRTC video/audio, renders candidate + AI panels, controls (mute, camera, end call). Uses `@livekit/components-react`. |
| `CodeEditor.tsx` | **Monaco Editor wrapper** — renders VS Code-like editor in the browser. Dynamic import with SSR disabled. |
| `CodingChallenge.tsx` | **Coding challenge UI** — split panel: left = problem description, right = code editor, bottom = test results. Has Run/Submit buttons. |

### Admin Dashboard
| File | What It Does |
|------|-------------|
| `admin/AdminSidebar.tsx` | Admin navigation sidebar |
| `admin/OverviewDashboard.tsx` | Main stats cards |
| `admin/AnalyticsDashboard.tsx` | Charts and graphs |
| `admin/DataTable.tsx` | Reusable data table |
| `admin/TeamManagement.tsx` | Team member list |
| `admin/CandidatePipeline.tsx` | Hiring pipeline view |
| `admin/CandidateProfileModal.tsx` | Candidate detail popup |
| `admin/EnterpriseSettings.tsx` | Enterprise config |
| `admin/LoginLogsTab.tsx` | Login audit logs |
| `admin/OpenAIMetrics.tsx` | AI usage dashboard |
| `admin/ProctoringDashboard.tsx` | Proctoring incidents |
| `admin/AgencyDashboard.tsx` | Agency features |

### Shared
| File | What It Does |
|------|-------------|
| `Providers.tsx` | Wraps app in context providers |
| `ToastProvider.tsx` | Toast notification setup |
| `Sidebar.tsx` | Main user sidebar |
| `StepIndicator.tsx` | Multi-step progress indicator |
| `AIChatbot.tsx` | Floating AI chat widget |
| `FeedbackWidget.tsx` | Feedback form widget |
| `ReminderChecker.tsx` | Checks for upcoming interviews |
| `Branding.tsx` | White-label branding |
| `CurrencySelector.tsx` | Currency picker |
| `CrispChat.tsx` | Crisp live chat integration |

---

## `src/lib/` — Services & Utilities

### Core (you'll use these every day)
| File | What It Does |
|------|-------------|
| `prisma.ts` | **Database client** — Prisma singleton. Import this to query the DB. |
| `auth.ts` | **Authentication** — `getActiveUser(req)` extracts user from session cookie. Used in almost every API route. |
| `authorization.ts` | **Permissions** — `getActiveUser()` for Next.js routes. Role-based access control. |
| `security.ts` | Password hashing, input sanitization |
| `rateLimit.ts` | Rate limiting with Upstash Redis |
| `tokens.ts` | JWT token generation/verification |
| `two-factor.ts` | TOTP 2FA (speakeasy + qrcode) |
| `sso.ts` | SAML SSO integration |
| `apikeys.ts` | API key management |

### AI & ML
| File | What It Does |
|------|-------------|
| `embeddings.ts` | Text embeddings for candidate matching |
| `proctor.ts` | **Client-side proctoring** — MediaPipe face/eye tracking, detects cheating |
| `proctor-server.ts` | Server-side proctoring validation |
| `openai-usage.ts` | Tracks OpenAI API usage |
| `challenges.ts` | **17 coding challenges** bank (JS, Python, Java, C++, Go) |
| `sandbox.ts` | Sandbox types and helpers |

### Integrations
| File | What It Does |
|------|-------------|
| `livekit.ts` | LiveKit room/token management |
| `deepgram.ts` | Deepgram speech-to-text |
| `stripe.ts` | Stripe billing integration |
| `email.ts` | Email sending (Nodemailer) |
| `whatsapp.ts` | WhatsApp notifications |
| `sentry.ts` | Sentry error reporting |
| `webhooks.ts` | Outgoing webhook system |
| `storage.ts` | S3 file storage |

### Business Logic
| File | What It Does |
|------|-------------|
| `pricing.ts` | Pricing calculation |
| `plan.ts` | Subscription plan definitions |
| `recruitment-workflow.ts` | Agency recruitment pipeline |
| `resume-parser.ts` | Resume PDF/DOCX parsing |
| `branding.ts` | White-label configuration |
| `audit.ts` | Audit logging |

### Utilities
| File | What It Does |
|------|-------------|
| `uploadFile.ts` | File upload to S3 |
| `proxy.ts` | API proxy helper |
| `timezone.ts` | Timezone conversion |
| `useCurrency.ts` | Currency formatting hook |
| `useGlare.ts` | Mouse-following glare effect |

### Background Jobs
| File | What It Does |
|------|-------------|
| `inngest/client.ts` | Inngest client setup |
| `inngest/functions.ts` | Scheduled functions (reminders, cleanup) |

---

## `agent/` — Python AI Interview Agent

This is a **separate Python service** that runs the real-time AI interviewer.

| File | What It Does |
|------|-------------|
| `agent.py` | **Entry point** — starts the LiveKit agent server. Loads env vars, registers the agent, connects to LiveKit cloud. |
| `interview_agent.py` | **InterviewAgent class** — the actual AI interviewer. Handles conversation flow, generates questions, evaluates answers, manages difficulty. |
| `nextjs_client.py` | **HTTP client** — calls the Next.js `/api/ai-interview` API for LLM responses. Bridges the Python agent with the Node.js AI engine. |
| `requirements.txt` | Python dependencies (livekit-agents, httpx, python-dotenv) |

**How it works:**
1. Candidate joins a LiveKit room from the browser
2. `agent.py` receives the connection
3. `interview_agent.py` starts the conversation
4. It calls `nextjs_client.py` which hits `/api/ai-interview` for AI responses
5. The AI speaks via LiveKit's text-to-speech

---

## `evaluator/` — Code Execution Sandbox

A **Node.js Express server** that runs in Docker and safely executes candidate code.

| File | What It Does |
|------|-------------|
| `server.ts` | **Express server** (port 8003) — accepts code + test cases, routes to the right runner, returns results. |
| `runners/javascript.ts` | Runs JS in **VM2** sandbox (isolated, no access to system) |
| `runners/python.ts` | Runs Python via `child_process`, saves to temp file, executes, cleans up |
| `runners/java.ts` | Compiles and runs Java (javac + java) |
| `runners/cpp.ts` | Compiles and runs C++ (g++) |
| `runners/go.ts` | Compiles and runs Go |
| `Dockerfile` | Docker image with Node.js, Python, JDK, g++, Go |
| `package.json` | Dependencies (express, helmet, vm2, cors) |
| `tsconfig.json` | TypeScript config |

**How it works:**
1. Frontend calls `/api/sandbox` with code + test cases
2. Next.js API validates and proxies to evaluator (port 8003)
3. Evaluator picks the right runner based on language
4. Runner executes code in isolation (VM2 for JS, subprocess for others)
5. Results (pass/fail, output, errors) are returned

---

## `backend/` — Python FastAPI Backend

A separate **FastAPI service** for agency/recruitment features.

| File | What It Does |
|------|-------------|
| `main.py` | FastAPI app entry point |
| `config.py` | Configuration settings |
| `database.py` | SQLAlchemy async database setup |
| `resume_parser.py` | Resume parsing with pdfplumber/python-docx |
| `screener.py` | Candidate screening logic |
| `client_jds.py` | Job description processing |
| `middleware/auth.py` | Auth middleware |
| `models/` | SQLAlchemy models (core, interview, agency) |
| `routes/` | API endpoints (candidates, jobs, clients, placements, etc.) |
| `schemas/` | Pydantic validation schemas |
| `services/` | Business logic (auth, embeddings, interview engine, workflow) |

---

## `prisma/` — Database Schema

| File | What It Does |
|------|-------------|
| `schema.prisma` | **Database schema** — defines all 19 tables (User, Interview, Feedback, Job, etc.) |
| `prisma.config.ts` | Prisma configuration |
| `migrations/` | SQL migration files |

**Key tables:**
- `User` — candidates, admins, recruiters
- `Organization` — companies/tenants
- `Interview` — AI interview sessions
- `Feedback` — interview evaluations
- `Profile` — candidate profiles (skills, experience)
- `Job` / `JobRequisition` — job postings
- `AgencyCandidate` / `CandidateSubmission` — agency pipeline
- `Session` — active login sessions
- `LoginLog` — audit trail
- `OpenAIUsageLog` — AI API cost tracking

---

## How the Services Connect

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Candidate)                   │
│  Next.js React App                                      │
│  ├── Pages (app/)                                       │
│  ├── Components (components/)                           │
│  │   ├── LiveKitInterviewRoom ←──→ LiveKit Cloud        │
│  │   ├── CodeEditor (Monaco)                            │
│  │   └── CodingChallenge                                │
│  └── API calls → /api/*                                 │
└───────────┬──────────────┬──────────────┬───────────────┘
            │              │              │
            ▼              ▼              ▼
┌───────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Next.js API  │ │  Python Agent│ │  Code Evaluator  │
│  (port 3000)  │ │  (port 8002) │ │  (port 8003)     │
│               │ │              │ │                  │
│ /api/ai-      │ │ agent.py     │ │ server.ts        │
│   interview   │ │   ↓          │ │   ↓              │
│   → OpenAI    │ │ interview_   │ │ runners/         │
│               │ │   agent.py   │ │   javascript.ts  │
│ /api/sandbox  │ │   ↓          │ │   python.ts      │
│   → evaluator │ │ nextjs_      │ │   java.ts        │
│               │ │   client.py  │ │   cpp.ts         │
│ /api/livekit  │ │   ↓          │ │   go.ts          │
│   → LiveKit   │ │ /api/ai-     │ │                  │
│               │ │   interview  │ │ Docker           │
└───────┬───────┘ └──────┬───────┘ └──────────────────┘
        │                │
        ▼                ▼
┌───────────────┐ ┌──────────────┐
│  PostgreSQL   │ │  LiveKit     │
│  (Neon)       │ │  Cloud       │
│               │ │  (WebRTC)    │
│ 19 tables     │ │              │
└───────────────┘ └──────────────┘
```

---

## How to Run Locally

```bash
# 1. Install all dependencies
npm install

# 2. Set up database
npx prisma generate
npx prisma db push

# 3. Start everything (frontend + backend + agent + evaluator)
./start.sh

# OR start individually:
npm run dev              # Next.js (port 3000)
npm run dev:backend      # FastAPI (port 8001)
npm run dev:agent        # LiveKit agent
npm run dev:evaluator    # Code sandbox (port 8003)
```

---

## Key Files to Read First (In Order)

1. `src/app/layout.tsx` — how the app is structured
2. `src/lib/auth.ts` — how authentication works
3. `src/lib/prisma.ts` — how to query the database
4. `src/app/api/ai-interview/route.ts` — how the AI interview works
5. `src/app/interview/live/LiveInterviewContent.tsx` — the main interview UI
6. `src/components/LiveKitInterviewRoom.tsx` — how video calls work
7. `src/components/CodingChallenge.tsx` — how coding challenges work
8. `agent/interview_agent.py` — how the AI agent works
9. `evaluator/server.ts` — how code execution works
10. `prisma/schema.prisma` — the database schema

---

## Common Patterns You'll See

### API Route Pattern
Every API route follows this pattern:
```typescript
import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getActiveUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... do work
  return NextResponse.json({ success: true, data });
}
```

### Rate Limiting Pattern
```typescript
const limit = await rateLimit(request, "endpoint-name", {
  limit: 60,        // max requests
  windowMs: 60_000, // per minute
});
if (!limit.allowed) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

### Dynamic Import Pattern (for browser-only components)
```typescript
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,  // Required — Monaco needs window/document
  loading: () => <Spinner />,
});
```

---

## Environment Variables

All in root `.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Session token secret |
| `OPENAI_API_KEY` | OpenAI API access |
| `LIVEKIT_URL` | LiveKit WebSocket URL |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `DEEPGRAM_API_KEY` | Deepgram STT access |
| `STRIPE_SECRET_KEY` | Stripe billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe frontend |
| `AWS_S3_BUCKET` | File storage |
| `AWS_ACCESS_KEY_ID` | AWS access |
| `AWS_SECRET_ACCESS_KEY` | AWS secret |

---

*Last updated: August 2026*
