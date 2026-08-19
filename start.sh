#!/bin/bash
echo "Starting Techcitta..."
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:8001"
echo "Agent:     LiveKit (dev mode)"
echo "Evaluator: http://localhost:8003"
echo ""

# Start Python backend
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
cd ..

# Start Code Evaluator (Node.js)
cd evaluator
npm install --silent 2>/dev/null
npx tsx watch server.ts &
EVALUATOR_PID=$!
cd ..

# Start LiveKit Agent (Python)
cd agent
pip install -r requirements.txt -q
python agent.py dev &
AGENT_PID=$!
cd ..

# Start Next.js frontend
npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to kill all
trap "kill $BACKEND_PID $AGENT_PID $EVALUATOR_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
