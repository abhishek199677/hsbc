# Intern Guide — HireRight (Techcitta)

A complete background-screening / job-matching platform. Candidates sign up, build a
profile, schedule an interview, and get interviewed by an **AI** (OpenAI) instead of a
human recruiter. Admins review results on a dashboard.

Read this file top to bottom. It explains **every library, every folder, and how a
request travels through the app** — you should be able to contribute from day one.

---

## 1. The big picture

```
Browser (React UI)  ──fetch──▶  Next.js API Routes  ──Prisma──▶  SQLite (dev.db)
     │                                   │
     │                                   ├── OpenAI API (AI interviewer + evaluation)
     │                                   ├── Nodemailer (emails)
     │                                   └── WhatsApp Business API (reminders)
     └── localStorage (JWT token + user data)
```

**The #1 concept to understand:** Next.js is **both** the frontend and the backend in
one project.

- Files in `src/app/*/page.tsx` are **frontend pages** (rendered in the browser).
- Files in `src/app/api/*/route.ts` are **backend API endpoints** (run on the server).
- The browser calls an API endpoint with `fetch("/api/...")`, the server does the work,
  and returns JSON.

---

## 2. Tech stack and what each library does

| Library | Version | Purpose | Where it's used |
|---------|---------|---------|-----------------|
| **Next.js** | 16 | Full-stack framework (pages + APIs) | `src/app/` |
| **React** | 19 | UI components | `src/components/`, `src/app/*/page.tsx` |
| **TypeScript** | 5 | Type safety | everywhere |
| **Tailwind CSS** | 4 | Styling via class names | JSX class names |
| **Prisma** | 7 | ORM — talk to the DB with JS, not SQL | `src/lib/prisma.ts`, all API routes |
| **libSQL / SQLite** | — | The database itself (`dev.db` file) | `prisma/schema.prisma` |
| **bcryptjs** | 3 | Password hashing | `src/lib/auth.ts` |
| **jsonwebtoken** | 9 | Login tokens (JWT) | `src/lib/auth.ts` |
| **OpenAI** | 6 | The AI interviewer & evaluator | `src/app/api/ai-interview/route.ts` |
| **nodemailer** | 9 | Send emails | `src/lib/email.ts` |
| **date-fns** | 4 | Date formatting/parsing | UI pages |
| **lucide-react** | 1 | Icons | UI pages |
| **uuid** | 14 | Unique IDs | (Prisma can also generate its own) |

---

## 3. Folder structure (memorize this)

```
prisma/
  schema.prisma        ← THE database definition. All tables live here.
  config.ts            ← Prisma setup (reads DATABASE_URL from .env)

src/
  app/                 ← Next.js app router
    page.tsx           ← Landing page ("/")
    login/, signup/    ← Auth pages
    profile/           ← 6-step profile wizard
    interview/         ← Schedule + live AI interview ("/interview/live")
    admin/             ← Admin dashboard
    employer/enterprise/government/ ← Landing variants (all static, no real logic)
    api/               ← BACKEND. One folder per endpoint
      auth/signup/route.ts
      auth/login/route.ts
      profile/route.ts
      interview/route.ts
      ai-interview/route.ts   ← OpenAI logic (start / respond / evaluate)
      admin/stats/route.ts    ← dashboard numbers
      admin/users/route.ts    ← list of users
      reminders/route.ts      ← sends reminder emails/WhatsApp
      upload/route.ts, files/ ← file uploads
  components/          ← Reusable UI (Navbar, Hero, Sidebar, ...)
  contexts/
    AuthContext.tsx    ← Global login state (stores JWT in localStorage)
  lib/
    prisma.ts          ← Single shared Prisma client
    auth.ts            ← bcrypt hashing + JWT sign/verify
    email.ts           ← nodemailer + HTML email templates
    whatsapp.ts        ← WhatsApp Business API + message templates
```

---

## 4. Database — 4 tables

Defined in `prisma/schema.prisma`. Relationships:

```
Organization 1───many User      (every user belongs to a workspace/company)
User         1───1   Profile    (the 6-step profile wizard data)
User         1───1   Interview  (scheduled interview + evaluation results)
```

### Organization
The company a user belongs to. **Each signup auto-creates one** ("John's Workspace"),
so every user is their own "company". That's how the employer / enterprise /
government pages work without extra tables.

### User
Email + hashed password + role (`jobseeker`, `employer`, `admin`) + organization link.

### Profile
6-step wizard data: resume, about-you text, current role/experience/location, skills,
job preferences, interview preferences. `step` tracks how far the user got;
`isComplete` marks a finished profile.

### Interview
Date/time/timezone, status (`scheduled` / `completed` / `cancelled`), plus AI results:
`transcript`, `evaluation` (JSON string), `evaluationScore`. Also 6 boolean flags
tracking which reminders were already sent (`reminder24hSent`, etc.).

> **When you change the schema**, run `npx prisma migrate dev` (creates a migration)
> and `npx prisma generate` (updates the Prisma client).

---

## 5. How a request travels (read this carefully)

1. User clicks **Login**.
2. React component calls `fetch("/api/auth/login", { method: "POST", body: ... })`.
3. Next.js routes this to `src/app/api/auth/login/route.ts` (runs **on the server**).
4. The route:
   - reads the JSON body,
   - looks up the user with Prisma: `prisma.user.findUnique({ where: { email } })`,
   - verifies the password with bcrypt: `verifyPassword(password, user.password)`,
   - creates a JWT: `generateToken(user.id, user.email, user.organizationId)`,
   - returns JSON `{ success, user, organization, token }`.
5. The browser stores `token` in `localStorage` via `AuthContext.tsx`.
6. For every later API call, the browser sends header `Authorization: Bearer <token>`.
7. Server routes verify it with `getUserFromRequest(request)` from `src/lib/auth.ts`.
   If the token is invalid, the call is rejected.

### The "anatomy" of every API route

```
1.  read the request body          → request.json()
2.  authenticate the caller        → getUserFromRequest(request)
3.  query the database             → prisma.someModel.findMany/create/update(...)
4.  do any side effects            → OpenAI / sendEmail / sendWhatsApp
5.  return JSON                    → NextResponse.json({ ... })
```

Follow this pattern when you write a new endpoint.

---

## 6. API endpoints reference

| Endpoint | Method | What it does |
|----------|--------|--------------|
| `/api/auth/signup` | POST | Create org + user + empty profile, hash password, send welcome email, return JWT |
| `/api/auth/login` | POST | Verify credentials, return JWT + user + organization |
| `/api/profile` | GET/PUT | Read / save the 6-step profile |
| `/api/interview` | GET/POST | Schedule an interview (also sends confirmation email + WhatsApp) |
| `/api/upload` | POST | Upload a resume file |
| `/api/files/[...path]` | GET | Serve uploaded files |
| `/api/ai-interview` | POST | AI logic — see actions below |
| `/api/admin/stats` | GET | Dashboard numbers (users, interviews, etc.) |
| `/api/admin/users` | GET | List all users |
| `/api/reminders` | GET | Check interviews and send 24h/1h/15m/now reminders |

### `/api/ai-interview` — the 3 "actions"

The body must include an `action` field:

- `action: "start"` — AI introduces itself and asks the first question, using the
  candidate's profile (name, role, experience, skills) as context.
- `action: "respond"` — the chat loop. Sends the whole conversation history + the
  candidate's answer to OpenAI. After 6 Q&A rounds it signals `isComplete: true`.
- `action: "evaluate"` — sends the entire transcript to OpenAI and asks for a JSON
  result: `score`, `strengths`, `weaknesses`, `topicsToLearn`, `recommendation`
  (Hire/Consider/Reject).

The model used is `gpt-5-nano` and the interviewer is told to speak in simple,
friendly "desi English" so non-native speakers feel comfortable.

---

## 7. Key files an intern should read (in this order)

**Backend:**
1. `src/lib/prisma.ts` — one shared Prisma client for the whole app.
2. `src/lib/auth.ts` — password hashing + JWT helpers. No file handles auth better than this.
3. `src/app/api/auth/signup/route.ts` — cleanest full example of a route.
4. `src/app/api/ai-interview/route.ts` — the core AI feature.
5. `src/lib/email.ts` — HTML email templates (edit styling here).

**Frontend:**
6. `src/contexts/AuthContext.tsx` — how the app remembers "who is logged in".
7. `src/app/interview/live/LiveInterviewContent.tsx` — the AI chat + camera screen.
8. `src/components/ReminderChecker.tsx` — a tiny component that calls `/api/reminders`
   every 60 seconds. **This is how the app sends reminders without a cron job.**

---

## 8. Run it locally

```bash
# 1. install dependencies
npm install

# 2. copy env config (ask a teammate for the values if missing)
#    you need: DATABASE_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
#              JWT_SECRET, OPENAI_API_KEY, SMTP_USER, SMTP_PASS

# 3. set up the database (first time only)
npx prisma generate
npx prisma migrate dev

# 4. start the dev server
npm run dev
# → open http://localhost:3000
```

Useful commands:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run lint` | Lint all files |
| `npx prisma studio` | Opens a browser UI to inspect/edit the database |
| `npx prisma migrate dev` | Apply schema changes (create a migration) |
| `npx prisma generate` | Regenerate the Prisma client after schema edits |

---

## 9. Common tasks you'll be asked to do

### "Add a new API endpoint" (e.g. a "reset password" endpoint)
1. Create folder `src/app/api/auth/reset-password/`.
2. Create `route.ts` with `export async function POST(request: Request)`.
3. Follow the 5-step anatomy from section 5.
4. Test with `curl` or from a page.

### "Change the database" (add a column or table)
1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name describe_change`.
3. Run `npx prisma generate`.
4. Use the new field in code with autocomplete.

### "Fix a UI page"
1. Find the page in `src/app/.../page.tsx`.
2. Most styling is Tailwind classes like `className="flex gap-4 text-lg"`.
3. Layouts (Navbar, Footer) live in `src/components/` or `layout.tsx`.

---

## 10. Gotchas & conventions

- **Never commit `.env`** — it contains real secrets (OpenAI key, Turso token).
  It is already in `.gitignore`. If you see credentials committed, alert a lead.
- **`"use client"`** at the top of a file makes it a browser component. Files without
  it run on the server. Don't put secret logic in a client file.
- **All passwords must go through `hashPassword`/`verifyPassword`** — never store or
  compare raw passwords.
- **Auth pattern:** read the `Authorization: Bearer ...` header with
  `getUserFromRequest()`; it returns `null` if the token is bad.
- **Prisma client is generated** into `src/generated/prisma` (gitignored). After any
  schema change you must run `npx prisma generate`.
- **The DB is SQLite locally** (`dev.db`) but the app also supports Turso (a hosted
  libSQL database) via `TURSO_DATABASE_URL`. `src/lib/prisma.ts` decides which one
  to use from the environment.
- **Naming:** route files must be named `route.ts` and export handlers named
  `GET`, `POST`, `PUT`, `DELETE`.
- **Emails:** edit the HTML inside `src/lib/email.ts`. Email sending fails silently
  (returns `{ success: false }`), so the app keeps working if SMTP is down.
- **Reminders:** no cron job exists — `ReminderChecker.tsx` triggers
  `/api/reminders` every minute from an open browser tab. If nobody has the app
  open, no reminders fire.

---

## 11. Security notes (must-know)

- JWT secret and API keys come from `.env`; never hardcode them.
- The OpenAI API key must **only** be used in server files
  (`src/app/api/...`, `src/lib/...`), never in client components.
- Passwords are hashed with bcrypt (12 rounds) before storing.
- Tokens expire after 7 days (`expiresIn: "7d"`).

---

## 12. Learning path (if you want to go deeper)

1. Next.js App Router basics: `page.tsx`, `layout.tsx`, `route.ts`, `"use client"`.
2. Prisma: models, queries (`findUnique`, `create`, `update`), migrations.
3. JWT + bcrypt: how stateless auth works.
4. React Context (`AuthContext.tsx`) + `useState`/`useEffect` hooks.
5. OpenAI Chat Completions: system prompts, conversation history, JSON output.
6. HTTP basics: request/response, headers, status codes (200/400/401/500).
