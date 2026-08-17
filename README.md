<div align="center">

<img src="/logo.jpeg" alt="Techcitta logo" width="120" />

# Techcitta

**AI-powered background screening, job matching & video interviews**


Runs free on Vercel + Cloudflare R2 + Turso. Stripe billing, email verification, GDPR, timezone-aware reminders, and plan-based limits built in.

</div>

---

# Full Stack Application

A complete background screening and job matching platform with Admin Portal and AI Video Interview.

## Features

### Job Seeker Features
- User authentication (signup/login) with **email verification** and **password reset**
- Multi-step profile creation
- Resume upload
- Interview scheduling (dynamic calendar, weekend/past dates disabled)
- **AI Video Interview** with real-time chat, voice recognition and captions
- Automated email + WhatsApp confirmations and reminders (shown in the user's timezone)
- Interview evaluation, per-question scores and downloadable transcript
- Plan-based limits (Starter / Pro / Enterprise via Stripe)
- **GDPR**: export your data or permanently delete your account

### Admin Portal Features
- Dashboard with statistics
- User management
- Interview management with recordings, captions and scores
- Organization-isolated data and media

### AI Video Interview
- Pre-interview device check room (camera, mic, speaker, voice recognition, connection)
- Real-time video feed (user's camera) with voice-to-text answer capture
- AI-powered interview questions (OpenAI gpt-5-nano)
- Live captions and on-screen transcript
- Automatic interview evaluation
- Exact score (with one decimal), strengths, areas for improvement
- Per-question score breakdown
- Topics to learn & grow
- Hire/Consider/Pass recommendation
- Recorded video with generated .vtt captions
- **Anti-cheating (AI proctoring)**: on-device face & gaze detection (MediaPipe).
  Turning your head, looking away from the screen, hiding your face, or a second
  person in frame triggers a live red-flag warning, is logged as an incident, and
  is factored into the evaluation (`integrity: clean/flagged/failed`). Admins see
  a per-interview proctoring badge with incident counts.

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Homepage |
| Login | `/login` | User login |
| Signup | `/signup` | Create account |
| Verify Email | `/verify-email` | Email verification (link from email) |
| Forgot Password | `/forgot-password` | Request a password reset |
| Reset Password | `/reset-password` | Set a new password |
| Pricing | `/pricing` | Plan pricing |
| Settings | `/settings` | Verification, billing, timezone, GDPR |
| Profile | `/profile` | Multi-step profile |
| Interview | `/interview` | Schedule interview |
| Interview Room | `/interview/room` | Pre-interview device check |
| Live Interview | `/interview/live` | AI video interview |
| Confirmation | `/confirmation` | Booking confirmation |
| Admin | `/admin` | Admin dashboard |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/auth/verify-email` | POST | Verify email via token |
| `/api/auth/resend-verification` | POST | Resend verification email |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Set new password |
| `/api/profile` | GET/PUT | User profile |
| `/api/interview` | GET/POST/PATCH | Interview scheduling & results (plan-gated) |
| `/api/upload` | POST | Resume / video / captions upload (videos via presigned PUT) |
| `/api/files/[...path]` | GET | Authenticated, org-isolated media serving |
| `/api/ai-interview` | POST | AI interview (start/respond/evaluate, rate-limited) |
| `/api/reminders` | GET | Send due interview reminders |
| `/api/account/me` | GET | Current user + plan info |
| `/api/account/export` | GET | GDPR data export (JSON download) |
| `/api/account/delete` | POST | GDPR account deletion |
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Open Stripe billing portal |
| `/api/billing/webhook` | POST | Stripe webhook (subscription events) |
| `/api/admin/stats` | GET | Dashboard stats |
| `/api/admin/users` | GET | All users |

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```
Minimal local setup:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-key"
```

### 3. Setup Database
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run
```bash
npm run dev
```

## Production Deployment (Free Tier)

Techcitta is designed to run on free hosting with near-zero running cost:
**Vercel** (hosting) + **Cloudflare R2** (video/files) + **Turso** (database).

### 1. Cloudflare R2 (free video storage — 10GB, zero egress)
1. Create a Cloudflare account (free).
2. Dashboard → **R2** → **Create bucket** (e.g. `techcitta-videos`).
3. **Manage R2 API Tokens** → create a token with *Object Read & Write* on that bucket.
4. Copy the Account ID, Access Key ID and Secret Access Key into your env:
   ```env
   R2_ACCOUNT_ID="..."
   R2_ACCESS_KEY_ID="..."
   R2_SECRET_ACCESS_KEY="..."
   R2_BUCKET_NAME="techcitta-videos"
   ```
   > Without these vars the app falls back to local `public/uploads` (dev only).
5. (Optional) On the R2 bucket → **Settings → CORS**: add a rule allowing `GET`/`PUT`/`HEAD`
   from your app origin so browser direct-uploads and playback work in all cases.

How videos flow: the browser requests a short-lived **presigned PUT URL** from `/api/upload`,
uploads the recording directly to R2 (bypassing the hosting function body limit), and the URL
saved in the database is a canonical path. Playback uses fresh presigned GET URLs — so video
bytes never go through your hosting function or count against its bandwidth.

### 2. Turso (free database)
1. Create a database at https://turso.tech (free).
2. Put the `libsql://...` URL and token in `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`.
3. Push the schema:
   ```bash
   npx prisma migrate deploy --url "$TURSO_DATABASE_URL?authToken=$TURSO_AUTH_TOKEN"
   ```

### 3. Vercel (free hosting)
1. Push this repo to GitHub and import it at https://vercel.com.
2. Add all env vars (from `.env.example`) in Project → Settings → Environment Variables.
3. Deploy. `npm run build` runs `prisma generate` automatically.

### Free-tier limitations to know
- **Vercel Hobby** doesn't support scheduled jobs — the reminder cron endpoint
  (`/api/reminders`) must be triggered externally (e.g. a free cron service like cron-job.org
  hitting `https://your-app.vercel.app/api/reminders` with an `Authorization: Bearer` token).
- **OpenAI** is the only real cost: `gpt-5-nano` charges a fraction of a cent per interview.
- Storage is capped at R2's free 10GB; Vercel Hobby bandwidth is 100GB/month (video is served
  from R2 directly, so this is rarely hit).
- The rate limiter is in-memory (per instance) — fine on Vercel Hobby. For serverless scale,
  swap the store in `src/lib/rateLimit.ts` for a shared Redis/Upstash store.

## Stripe Billing Setup

1. Create a Stripe account (free).
2. Add env vars: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`.
3. Create two recurring **Prices** in the Stripe dashboard and put their Price IDs in the env vars.
4. Register a webhook endpoint: `https://your-app.vercel.app/api/billing/webhook` with events
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   and put the signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Plans: **Starter** (free, 3 interviews/month), **Pro** (₹999/mo), **Enterprise** (₹2,999/mo).
   Limits are enforced when scheduling interviews; subscriptions are tracked per organization.

### Selling worldwide (multi-currency + tax)

- Prices are configured in USD (`src/lib/pricing.ts`) and displayed in the visitor's currency
  (INR, EUR, GBP, AED, SGD, CAD, AUD) with a currency selector on `/pricing`, `/settings` and
  `/enterprise`. The visitor's choice is sent to checkout.
- To actually charge in that currency, create a matching recurring **Price** in Stripe and set the
  ID as `STRIPE_PRICE_PRO_USD`, `STRIPE_PRICE_PRO_EUR`, `STRIPE_PRICE_PRO_INR`, etc. (and the
  `ENTERPRISE` equivalents). Checkout falls back to the default price when no currency-specific
  price exists.
- **Sales tax / VAT**: enable Stripe Tax in the dashboard, then set `STRIPE_TAX_ENABLED="true"` in
  your environment. Checkout then collects and remits tax automatically based on the customer's
  billing address.
- Currency conversion rates are indicative and only used for display — the Stripe Prices are
  always the source of truth for what is charged.

## Email Verification & Password Reset

- On signup, a verification link is emailed; users must verify before using the app.
- "Forgot password?" on the login page emails a one-time reset link (valid 1 hour).
- Set `NEXT_PUBLIC_APP_URL` so links point at the right domain.

## Running Tests

```bash
npm test          # vitest unit tests
npm run lint      # eslint
npm run build     # typecheck + production build
```

## AI Interview Setup

1. Get OpenAI API key from https://platform.openai.com
2. Add to `.env`: `OPENAI_API_KEY="sk-..."`
3. Interview uses OpenAI gpt-5-nano for questions and evaluation

> **Note:** `JWT_SECRET` is required in production. Without it, the app falls back to a
> development-only secret for local testing.

## Email Setup (Gmail)

1. Enable 2-Factor Authentication
2. Generate App Password at Google Account → Security
3. Add to `.env`:
   - `SMTP_USER="your-email@gmail.com"`
   - `SMTP_PASS="your-app-password"`

## User Flow

1. **Signup** → Create account (welcome email sent)
2. **Complete Profile** → 6-step wizard
3. **Schedule Interview** → Pick date/time
4. **Device Check** → Run camera/mic/speaker checks in the interview room
5. **AI Interview** → Speak answers, see live captions/transcript
6. **Get Evaluation** → Exact score, per-question breakdown and feedback
7. **Admin Reviews** → Check recordings, scores and stats in admin dashboard

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS
- TypeScript
- Prisma (PostgreSQL via Neon)
- Cloudflare R2 (video & file storage, presigned URLs)
- OpenAI gpt-5-nano
- MediaPipe FaceLandmarker (on-device anti-cheating / proctoring)
- Nodemailer
- LiveKit (real-time WebRTC video)
- Deepgram (server-side transcription)
- Inngest (background jobs)
- Upstash Redis (rate limiting)
- Sentry (error tracking)
- Stripe (billing)

---

## Project File Structure — Intern Reference

This section explains **every file and folder** and what it does.
Read this before touching any code.

---

### Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts (`dev`, `build`, `lint`, `test`) |
| `next.config.ts` | Next.js config — CSP headers, R2 image domains, Sentry plugin |
| `tsconfig.json` | TypeScript config — path aliases (`@/` → `src/`) |
| `prisma.config.ts` | Prisma config — DB URL from env, migration path |
| `vitest.config.ts` | Test runner config (Vitest) |
| `eslint.config.mjs` | Linting rules |
| `postcss.config.mjs` | Tailwind CSS PostCSS plugin |
| `.env` | **Secrets** — DB URL, API keys, JWT secret (never commit) |

---

### `prisma/`

| File | Purpose |
|------|---------|
| `schema.prisma` | **Database schema** — all tables (User, Profile, Interview, Organization, etc.). Edit this to change the DB structure. |
| `migrations/` | Auto-generated SQL migration files. Never edit manually. |

---

### `src/middleware.ts`

**Route protection.** Runs on every request. Checks JWT token, blocks unauthenticated users from protected routes (`/admin`, `/api/profile`, `/api/interview`, etc.). Sets CSP security headers.

---

### `src/contexts/AuthContext.tsx`

**Global auth state.** Provides `user`, `token`, `organization`, and `login()`/`logout()` functions to the entire app via React Context. Wraps all pages in `Providers.tsx`.

---

### `src/lib/` — Core Business Logic

This is the **most important folder**. Every file here is a utility/module used across the app.

| File | Purpose |
|------|---------|
| `auth.ts` | JWT token creation/verification. `getUserFromRequest()` extracts the logged-in user from any API request. |
| `prisma.ts` | Singleton Prisma client. Import this everywhere you need DB access. |
| `storage.ts` | **File storage layer** — Cloudflare R2 (production) or local `public/uploads/` (dev). Functions: `saveFile()`, `getFile()`, `deleteFile()`, `getPresignedUploadUrl()`, `getPresignedUrl()`. |
| `uploadFile.ts` | **Client-side upload helper.** Used by the browser to upload videos/resumes. Tries presigned PUT to R2 first, falls back to multipart. |
| `email.ts` | Nodemailer transporter. Sends verification emails, password resets, interview confirmations. |
| `whatsapp.ts` | WhatsApp Business API integration for sending interview reminders. |
| `rateLimit.ts` | In-memory rate limiter. Protects API endpoints from abuse. |
| `security.ts` | Security helpers — input sanitization, etc. |
| `tokens.ts` | Random token generation for email verification and password reset links. |
| `plan.ts` | Plan enforcement logic — checks user's plan (Starter/Pro/Enterprise) and interview limits. |
| `pricing.ts` | Multi-currency pricing — converts USD prices to INR/EUR/GBP/AED/SGD/CAD/AUD for display. |
| `timezone.ts` | Timezone conversion — ensures interview times display correctly in the user's local timezone. |
| `livekit.ts` | LiveKit integration — room creation, token generation for real-time WebRTC video calls. |
| `deepgram.ts` | Deepgram API client — server-side audio transcription of interview recordings. |
| `proctor.ts` | **Client-side proctoring** — MediaPipe face/gaze detection. Detects looking away, multiple faces, hidden face. |
| `proctor-server.ts` | Server-side proctoring logic — processes proctoring flags and generates reports. |
| `stripe.ts` | Stripe client — checkout sessions, subscription management, billing portal. |
| `two-factor.ts` | Two-factor authentication (TOTP) helpers. |
| `sentry.ts` | Sentry error tracking initialization. |
| `embeddings.ts` | OpenAI embeddings for resume/candidate matching. |
| `useCurrency.ts` | React hook — currency selection state and formatting. |
| `inngest/client.ts` | Inngest client — triggers background jobs (e.g. scheduled reminders). |
| `inngest/functions.ts` | Inngest function definitions — background workflows. |

---

### `src/components/` — Shared UI Components

| File | Purpose |
|------|---------|
| `Navbar.tsx` | Global top navigation bar — logo, links, auth menu, mobile hamburger. |
| `Footer.tsx` | Site-wide footer. |
| `Sidebar.tsx` | **Candidate-facing sidebar** (profile/interview/confirmation pages) — progress steps, org branding. NOT the admin sidebar. |
| `Hero.tsx` | Landing page hero section. |
| `Features.tsx` | Landing page features section. |
| `HowItWorks.tsx` | Landing page "how it works" section. |
| `CTA.tsx` | Call-to-action section. |
| `CompanyLogos.tsx` | Trusted-by company logos section. |
| `VideoSection.tsx` | Landing page video demo section. |
| `StepIndicator.tsx` | Multi-step progress indicator (used in profile wizard). |
| `Providers.tsx` | Root provider wrapper — AuthContext, ToastProvider, CrispChat, Branding. |
| `ToastProvider.tsx` | Toast notification system. |
| `Branding.tsx` | Dynamic org branding (colors, logo) based on URL params. |
| `CrispChat.tsx` | Crisp live chat widget integration. |
| `AIChatbot.tsx` | AI chatbot widget. |
| `FeedbackWidget.tsx` | User feedback submission widget (floating button). |
| `ReminderChecker.tsx` | Checks for upcoming interviews and shows reminders. |
| `CurrencySelector.tsx` | Currency picker dropdown (INR/USD/EUR/etc.). |
| `AnalyticsDashboard.tsx` | Analytics charts — used in admin analytics tab. |

---

### `src/components/admin/` — Admin Panel Components

| File | Purpose |
|------|---------|
| `AdminSidebar.tsx` | **Admin sidebar + layout** — navigation, user info, org details, collapse toggle. Wraps all admin content. |
| `OverviewDashboard.tsx` | Admin overview tab — stats cards (total users, interviews, scores, hire rate), charts. |
| `CandidatePipeline.tsx` | Candidates tab — pipeline view of all candidates with status tracking. |
| `ProctoringDashboard.tsx` | Proctoring tab — integrity monitoring, flagged interviews, incident reports. |
| `TeamManagement.tsx` | Team tab — invite/remove team members, role management. |
| `DataTable.tsx` | Reusable data table — sorting, filtering, search, CSV export. Used across all admin tabs. |

---

### `src/app/` — Pages (Next.js App Router)

Each folder is a route. `page.tsx` = the page component. `layout.tsx` = shared layout for that route group.

#### Public Pages

| Folder | Route | Purpose |
|--------|-------|---------|
| `page.tsx` | `/` | Landing page |
| `login/` | `/login` | User login |
| `signup/` | `/signup` | User registration |
| `verify-email/` | `/verify-email` | Email verification (link from email) |
| `forgot-password/` | `/forgot-password` | Request password reset |
| `reset-password/` | `/reset-password` | Set new password (via token link) |
| `pricing/` | `/pricing` | Plan pricing page |
| `terms/` | `/terms` | Terms of service |
| `privacy/` | `/privacy` | Privacy policy |
| `dpa/` | `/dpa` | Data processing agreement |
| `enterprise/` | `/enterprise` | Enterprise plan page |
| `government/` | `/government` | Government plan page |

#### Authenticated User Pages

| Folder | Route | Purpose |
|--------|-------|---------|
| `profile/` | `/profile` | Multi-step profile creation wizard |
| `interview/` | `/interview` | Interview scheduling page |
| `interview/room/` | `/interview/room` | Pre-interview device check (camera, mic, speaker) |
| `interview/live/` | `/interview/live` | **Live AI video interview** — the main interview experience |
| `confirmation/` | `/confirmation` | Booking confirmation page |
| `settings/` | `/settings` | Account settings — verification, billing, timezone, GDPR |
| `employer/` | `/employer` | Employer portal pages |

#### Admin Pages

| Folder | Route | Purpose |
|--------|-------|---------|
| `admin/` | `/admin` | Admin dashboard — managed by `AdminSidebar` + tab components |

#### Root Layout

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout — wraps all pages with `<Providers>`, fonts, metadata |
| `globals.css` | Global styles + Tailwind imports |

---

### `src/app/api/` — API Endpoints

Every folder is a route handler. `route.ts` = the handler file.

#### Auth

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create new account + send verification email |
| `/api/auth/login` | POST | Authenticate user, return JWT |
| `/api/auth/verify-email` | POST | Verify email via token |
| `/api/auth/resend-verification` | POST | Resend verification email |

#### User

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/profile` | GET/PUT | Read/update user profile |
| `/api/account/me` | GET | Current user info + plan details |
| `/api/account/export` | GET | GDPR data export (JSON download) |
| `/api/account/delete` | POST | GDPR account deletion (removes DB + R2 files) |
| `/api/account/onboarding` | POST | Onboarding completion |
| `/api/account/2fa` | POST | Two-factor auth setup/verify |

#### Interview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/interview` | GET/POST/PATCH | Schedule, view, and complete interviews |
| `/api/ai-interview` | POST | AI interview engine — start, respond to answers, evaluate |
| `/api/transcribe` | POST | Audio transcription via Deepgram |
| `/api/reminders` | GET | Cron-triggered — sends due interview reminders via email/WhatsApp |

#### File Storage

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload files — videos (presigned R2 PUT), resumes, captions |
| `/api/files/[...path]` | GET | Authenticated file serving — reads from R2, enforces org isolation |

#### AI / Matching

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/match` | POST | AI candidate-job matching |
| `/api/chat` | POST | AI chat endpoint |
| `/api/proctor` | POST | Server-side proctoring analysis |

#### Billing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Open Stripe billing portal |
| `/api/billing/webhook` | POST | Stripe webhook — handles subscription events |

#### Admin

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/users` | GET | All users with interview data |
| `/api/admin/feedback` | GET | User feedback submissions |
| `/api/admin/analytics` | GET | Analytics data |
| `/api/admin/team` | GET/POST | Team member management |

#### Integrations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/livekit` | POST | LiveKit room/token management |
| `/api/feedback` | POST | Submit user feedback |
| `/api/inngest` | POST | Inngest background job endpoints |
| `/api/sentry-example` | GET | Sentry test endpoint |

---

### `src/generated/` — Auto-Generated

| Folder | Purpose |
|--------|---------|
| `prisma/` | Prisma Client — auto-generated from `schema.prisma`. **Never edit manually.** Re-generated on `npx prisma generate`. |

---

### Key Flows to Understand

#### Video Recording → Upload → DB Save
```
Browser (MediaRecorder) → src/app/interview/live/LiveInterviewContent.tsx
  → src/lib/uploadFile.ts (client upload helper)
    → POST /api/upload (get presigned R2 URL)
      → src/lib/storage.ts (saveFile / getPresignedUploadUrl)
        → Cloudflare R2 (actual storage)
  → PATCH /api/interview (save videoUrl to DB)
    → src/app/api/interview/route.ts
      → Prisma → PostgreSQL
```

#### Authentication Flow
```
Login → POST /api/auth/login → src/lib/auth.ts (create JWT)
  → Cookie stored in browser
  → Every request → src/middleware.ts (verify JWT, protect routes)
  → src/lib/auth.ts getUserFromRequest() (extract user in API handlers)
```

#### Interview AI Flow
```
Start → POST /api/ai-interview (action: "start") → OpenAI generates questions
  → Client displays question
  → User speaks → Voice-to-text captured
  → Submit answer → POST /api/ai-interview (action: "respond") → AI evaluates
  → Final → POST /api/ai-interview (action: "evaluate") → Score + feedback
  → Video uploaded to R2 → Caption file uploaded → DB updated
```
