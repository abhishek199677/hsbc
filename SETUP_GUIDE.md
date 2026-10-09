# HireRight — Local Setup Guide (for newcomers)

> Everything you need to run the whole project on your own machine.

---

## 1. How many `.env` files? Just ONE.

**`/hsbc/.env` (project root)** is the only env file. All 5 services read it:

| Service | How it reads the root `.env` |
|---------|------------------------------|
| Next.js frontend | Auto-loaded by Next.js from the root |
| Python backend (`backend/`) | `backend/config.py` loads `../.env` explicitly |
| LiveKit agent (`agent/`) | `agent/agent.py` calls `load_dotenv("../.env")` |
| Evaluator (`evaluator/`) | Only needs `SANDBOX_PORT` (has a default) |
| ML server (`ml/`) | Needs no env vars |

Start from the template:

```bash
cp .env.example .env
```

> **Security rule:** `.env` is listed in `.gitignore` — never commit it.
> It's already in your local `.env` (I created it for you).

---

## 2. What each variable is for and where to get it

### ✅ Must-have (app won't function without these)

| Variable | What it is | Where to get it |
|----------|-----------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Already set → local Postgres (`localhost:5432/hireright`). For a hosted DB, create a free project at **neon.tech** and copy its connection string. |
| `JWT_SECRET` | Secret that signs login sessions | Already generated for you. To rotate: `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Powers the AI interviewer, chatbot, resume parsing | **platform.openai.com → API Keys** (add billing first) |

### 🎥 Needed only for LIVE video interviews

| Variable | What it is | Where to get it |
|----------|-----------|-----------------|
| `LIVEKIT_URL` | LiveKit Cloud WebSocket URL | **cloud.livekit.io → your project → Settings → Keys** |
| `LIVEKIT_API_KEY` | LiveKit API key | Same page |
| `LIVEKIT_API_SECRET` | LiveKit API secret | Same page |
| `DEEPGRAM_API_KEY` | Real-time speech-to-text | **console.deepgram.com → API Keys** |
| `SIMLI_API_KEY` | Generates the live, lip-synced interviewer video | **app.simli.com → API key** |
| `SIMLI_FACE_ID` | Selects the ready-made interviewer face | Choose a face in the [Simli face library](https://app.simli.com/create/from-existing) and copy its face ID |

Without these the app runs fine and browser interviews remain available, but the live video avatar is disabled.

### ⚪ Optional (features degrade gracefully without them)

| Variable(s) | Feature | Where to get it |
|-------------|---------|-----------------|
| `SMTP_HOST/PORT/USER/PASS` | Verification & reminder emails | Gmail: use an [App Password](https://myaccount.google.com/apppasswords); set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587` |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | **dashboard.stripe.com → Developers → API keys** (test mode) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID/SECRET` | PayPal payments | **developer.paypal.com** |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Distributed rate limiting (falls back to in-memory locally) | **upstash.com** (free tier) |
| `SENTRY_DSN` | Error tracking | **sentry.io → Project → Settings → Client Keys** |
| `INNGEST_EVENT_KEY` | Background jobs (reminders) | **inngest.com** |
| `R2_*` / `AWS S3` | File storage | **dash.cloudflare.com → R2** |
| `COHERE_API_KEY` | Better candidate reranking | **dashboard.cohere.com** |
| `WHATSAPP_*` | WhatsApp notifications | **developers.facebook.com** |

---

## 3. One-time install steps (already done on this machine)

```bash
# 1. Node dependencies
npm install                      # root (Next.js)
cd evaluator && npm install      # code sandbox

# 2. Python dependencies (3 isolated virtualenvs)
/opt/homebrew/bin/python3.11 -m venv .venv          # backend
.venv/bin/pip install -r backend/requirements.txt
/opt/homebrew/bin/python3.11 -m venv .venv-agent     # LiveKit agent
.venv-agent/bin/pip install -r agent/requirements.txt
/opt/homebrew/bin/python3.11 -m venv .venv-ml        # ML server
.venv-ml/bin/pip install -r ml/requirements.txt

# 3. Database (local PostgreSQL 16 via Homebrew)
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE hireright;"
set -a; source .env; set +a       # load env for the Prisma CLI
npx prisma db push                # create all tables
```

---

## 4. Running the project

### Everything at once (recommended)

```bash
./dev-all.sh
```

Starts all 5 services with color-coded logs (`web`, `backend`, `evaluator`, `agent`, `ml`).
Press **Ctrl+C once** to stop them all.

### Or individually

```bash
npm run dev            # Next.js        → http://localhost:3000
npm run dev:backend    # FastAPI        → http://localhost:8001
npm run dev:evaluator  # Code sandbox   → http://localhost:8003
npm run dev:agent      # LiveKit agent  (needs LIVEKIT_* keys)
npm run dev:ml         # ML server
```

> Note: the plain `npm run dev:backend` / `dev:agent` / `dev:ml` scripts use
> whatever `python`/`uvicorn` is on your PATH. `./dev-all.sh` uses the project
> virtualenvs explicitly, so it always works.

---

## 5. Quick health checks

```bash
curl http://localhost:3000        # frontend
curl http://localhost:8001/docs   # FastAPI Swagger docs
curl http://localhost:8003/health # evaluator (if route exists)
```

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Environment variable not found: DATABASE_URL` in Prisma CLI | Prisma's config skips `.env` auto-load — run `set -a; source .env; set +a` first |
| Port already in use | `lsof -ti:3000 \| xargs kill` (likewise 8001, 8003) |
| LiveKit agent warns about missing env vars | Fill `LIVEKIT_*` + `DEEPGRAM_API_KEY` in `.env` — warnings are otherwise harmless |
| Pages that query the DB fail | Make sure Postgres is up: `brew services list \| grep postgres` |
| npm blocked a package script | `npm install-scripts approve <pkg>` |
| Reset the DB | `set -a; source .env; set +a; npx prisma db push --force-reset` |

---

*Last updated: October 2026*
