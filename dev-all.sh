#!/bin/bash
# ============================================================
# dev-all.sh — start the ENTIRE HireRight stack with one command
#
#   ./dev-all.sh
#
# Starts all 5 services with colored, prefixed logs:
#   [web]       Next.js frontend        http://localhost:3000
#   [backend]   FastAPI backend         http://localhost:8001
#   [evaluator] Code sandbox            http://localhost:8003
#   [ml]        ML scoring server       http://localhost:8004
#   [agent]     LiveKit voice agent     (only if LIVEKIT_API_KEY is set in .env)
#
# Press Ctrl+C once to stop everything.
# ============================================================
set -e
cd "$(dirname "$0")"

# --- preflight checks -------------------------------------------------------
if [ ! -f .env ]; then
  echo "ERROR: no .env file found. Copy .env.example to .env and fill it in."
  exit 1
fi

for v in .venv .venv-agent .venv-ml; do
  if [ ! -d "$v" ]; then
    echo "ERROR: missing $v — Python dependencies not installed yet."
    echo "See SETUP_GUIDE.md for install commands."
    exit 1
  fi
done

if [ ! -d node_modules ]; then
  echo "ERROR: node_modules missing — run 'npm install' first."
  exit 1
fi

if [ ! -d evaluator/node_modules ]; then
  echo "ERROR: evaluator/node_modules missing — run 'npm install' in evaluator/ first."
  exit 1
fi

# --- decide which services can start ----------------------------------------
# The LiveKit voice agent needs real credentials; skip it cleanly if absent.
AGENT_CMD="cd agent && ../.venv-agent/bin/python agent.py dev"
NAMES="web,backend,evaluator,ml"
COLORS="blue,magenta,yellow,green"
SERVICES=(
  "npm run dev"
  "cd backend && ../.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
  "npm run dev:evaluator"
  "cd ml && ../.venv-ml/bin/python server.py"
)

if grep -qE '^LIVEKIT_API_KEY=.+' .env; then
  NAMES="$NAMES,agent"
  COLORS="$COLORS,red"
  SERVICES+=("$AGENT_CMD")
else
  echo "NOTE: skipping the LiveKit voice agent — LIVEKIT_API_KEY is empty in .env."
  echo "      All other services will start. (See SETUP_GUIDE.md for LiveKit keys.)"
  echo ""
fi

# --- start everything -------------------------------------------------------
echo "Starting HireRight..."
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8001"
echo "  Evaluator: http://localhost:8003"
echo "  ML:        http://localhost:8004"
echo ""

# No --kill-others: one optional service failing must not take the stack down.
exec npx concurrently \
  --names "$NAMES" \
  --prefix-colors "$COLORS" \
  --handle-input \
  "${SERVICES[@]}"
