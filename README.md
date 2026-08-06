# Techcitta - Full Stack Application

A complete background screening and job matching platform with Admin Portal and AI Video Interview.

## Features

### Job Seeker Features
- User authentication (signup/login)
- Multi-step profile creation
- Resume upload
- Interview scheduling (dynamic calendar, weekend/past dates disabled)
- **AI Video Interview** with real-time chat, voice recognition and captions
- Automated email + WhatsApp confirmations and reminders
- Interview evaluation, per-question scores and downloadable transcript

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

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Homepage |
| Login | `/login` | User login |
| Signup | `/signup` | Create account |
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
| `/api/profile` | GET/PUT | User profile |
| `/api/interview` | GET/POST/PATCH | Interview scheduling & results |
| `/api/upload` | POST | Resume / video / captions upload (videos via presigned PUT) |
| `/api/files/[...path]` | GET | Authenticated, org-isolated media serving |
| `/api/ai-interview` | POST | AI interview (start/respond/evaluate) |
| `/api/reminders` | GET | Send due interview reminders |
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
- Nodemailer
