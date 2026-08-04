# HireRight - Full Stack Application

A complete background screening and job matching platform with Admin Portal and AI Video Interview.

## Features

### Job Seeker Features
- User authentication (signup/login)
- Multi-step profile creation
- Resume upload
- Interview scheduling
- **AI Video Interview** with real-time chat
- Interview evaluation and feedback

### Admin Portal Features
- Dashboard with statistics
- User management
- Interview management
- Start/monitor live interviews

### AI Video Interview
- Real-time video feed (user's camera)
- AI-powered interview questions (OpenAI GPT-4)
- Text-based chat interface
- Automatic interview evaluation
- Score, strengths, areas for improvement
- Hire/Consider/Pass recommendation

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Homepage |
| Login | `/login` | User login |
| Signup | `/signup` | Create account |
| Profile | `/profile` | Multi-step profile |
| Interview | `/interview` | Schedule interview |
| Live Interview | `/interview/live` | AI video interview |
| Confirmation | `/confirmation` | Booking confirmation |
| Admin | `/admin` | Admin dashboard |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/profile` | GET/PUT | User profile |
| `/api/interview` | GET/POST | Interview scheduling |
| `/api/upload` | POST | Resume upload |
| `/api/ai-interview` | POST | AI interview |
| `/api/admin/stats` | GET | Dashboard stats |
| `/api/admin/users` | GET | All users |

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
OPENAI_API_KEY="your-openai-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
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

## AI Interview Setup

1. Get OpenAI API key from https://platform.openai.com
2. Add to `.env`: `OPENAI_API_KEY="sk-..."`
3. Interview uses GPT-4 for questions and evaluation

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
4. **Start Live Interview** → Click "Start Live Interview"
5. **AI Interview** → Chat with AI interviewer
6. **Get Evaluation** → Score and feedback
7. **Admin Reviews** → Check admin dashboard

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS
- TypeScript
- Prisma (SQLite)
- OpenAI GPT-4
- Nodemailer
