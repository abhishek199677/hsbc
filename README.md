<div align="center">

<img src="/logo.jpeg" alt="Techcitta logo" width="120" />

# Techcitta

**AI-powered background screening, job matching & video interviews**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--5--nano-412991?logo=openai&logoColor=white)](https://openai.com)

Runs free on Vercel + Cloudflare R2 + Turso. Stripe billing, email verification, GDPR, timezone-aware reminders, and plan-based limits built in.

</div>

---

# Techcitta - Full Stack Application

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
- Prisma (SQLite / Turso)
- Cloudflare R2 (video & file storage, presigned URLs)
- OpenAI gpt-5-nano
- MediaPipe FaceLandmarker (on-device anti-cheating / proctoring)
- Nodemailer
