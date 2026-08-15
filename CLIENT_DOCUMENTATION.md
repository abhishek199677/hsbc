# HireRight - Client Documentation

## What is HireRight?

**HireRight** is a modern AI-powered background screening, job matching, and video interview platform. It connects talented professionals with the right opportunities and gives employers verified, trustworthy candidates — powered by AI. Tagline: **"Right People. Right Decisions."** / **"Talent to Talent."**

---

## How It Works

### For Job Seekers

HireRight makes the job search process faster, more secure, and more transparent. Here's the step-by-step journey:

---

### Step 1: Create Your Profile

You start by building your professional profile:

- **Upload Your Resume** - Simply drag and drop your resume (PDF, DOC, or DOCX format, max 5MB). Our system will parse and analyze your resume to understand your background.

- **Tell Us About Yourself** - Share a brief introduction about who you are, what drives you in your career, and your key strengths. This helps us understand your personality and career goals.

- **Current Snapshot** - Provide details about your current role, total years of experience, current location, and notice period. This helps us match you with opportunities that fit your timeline.

> **Your Privacy Matters**: All your information is encrypted and secure. We never share your data without your consent.

---

### Step 2: Upload Resume

- Upload your latest resume
- Our AI analyzes your skills, experience, and qualifications
- You receive instant confirmation once uploaded successfully

**Supported Formats**: PDF, DOC, DOCX (Maximum file size: 5MB)

---

### Step 3: About You

- List your primary technical skills
- Specify your total years of professional experience
- Add your current company information
- Include your educational background

---

### Step 4: Availability

Tell us what you're looking for:

- **Job Type**: Full-time, Part-time, Contract, or Freelance
- **Expected Salary Range**: Your desired compensation
- **Preferred Location**: Where you want to work
- **Work Mode**: Remote, Hybrid, or On-site

---

### Step 5: AI Interview Scheduling

Schedule your 15-minute AI-powered video interview:

- **Select a Date**: Choose from available dates on the calendar
- **Pick a Time Slot**: Morning, Afternoon, or Evening slots available
- **Confirmation**: Receive instant confirmation via Email and WhatsApp

#### Interview Features:
| Feature | Description |
|---------|-------------|
| Duration | 15 minutes |
| Mode | AI Video Interview (live video + voice) |
| Assessment | Technical + Behavioral |
| Security | Encrypted and private, AI proctored |

---

### Step 6: Confirmation & Reminders

Once your interview is scheduled:

- **Email Confirmation**: Detailed email sent to your registered email address
- **WhatsApp Confirmation**: Quick confirmation via WhatsApp
- **Calendar Reminder**: Add to your calendar with one click
- **Automated Reminders**:
  - 24 hours before the interview
  - 1 hour before the interview
  - 15 minutes before the interview

---

## AI Video Interview

The core of the HireRight experience — a fully AI-run interview room:

- **Device Check Room**: Pre-interview camera, microphone, speaker and connection checks
- **Live Video Interview**: Real-time AI interviewer (LiveKit WebRTC) with voice-to-text answer capture
- **Live Captions**: Real-time speech recognition with on-screen transcript
- **Anti-Cheating (AI Proctoring)**: On-device face & gaze detection (MediaPipe). Turning your head, looking away from the screen, hiding your face, or a second person in frame triggers a live red-flag warning, is logged as an incident, and is factored into the evaluation (`integrity: clean/flagged/failed`).
- **Instant Evaluation**: Exact score (one decimal), strengths, areas for improvement, per-question breakdown, topics to learn & grow, and a Hire/Consider/Pass recommendation
- **Transcript & Recording**: Recorded video with generated captions; searchable transcript

---

## AI Job Matching

HireRight uses semantic AI matching to pair the right talent with the right roles:

- **For Job Seekers**: Your profile and resume are indexed into a searchable vector database
- **For Employers**: Post jobs and instantly get AI-ranked candidate matches with match scores
- **Match Breakdown**: Each match shows an overall score plus skill, experience and semantic similarity breakdowns, matched vs. missing skills, and an AI explanation

---

## For Employers

HireRight isn't just for candidates — it's a complete employer hiring platform:

| Feature | Benefit |
|---------|---------|
| Trusted Candidates | Accurate background checks build employer trust |
| AI Candidate Matching | Post a job, get ranked candidates with match scores |
| Faster Hiring | Quick turnaround on verification reports and interviews |
| Admin Dashboard | Stats, interviews, recordings, scores, proctoring reports, and CSV export |
| Team Management | Invite team members with owner/admin/interviewer/member/viewer roles |
| Candidate Feedback | In-platform notes on candidates (suggested/reviewed/shortlisted/rejected) |

---

## Key Features

### For Job Seekers

| Feature | Benefit |
|---------|---------|
| AI-Powered Matching | Get matched with roles that fit your skills and experience |
| Verified Profile | Stand out to employers with a verified background |
| Secure & Private | Your data is protected with industry-leading security |
| Fast Process | Quick digital screening keeps you ahead in the hiring race |
| Global Standards | Screening aligned with global compliance and quality |
| 2-Factor Authentication | Optional TOTP app-based 2FA for extra account security |
| AI Assistant | In-app chat assistant for profile help and interview prep |
| GDPR Control | Export or permanently delete your data anytime |

### For Employers

| Feature | Benefit |
|---------|---------|
| Trusted Candidates | Accurate background checks build employer trust |
| Faster Hiring | Quick turnaround on verification reports |
| Verified Reports | Seamless sharing of verification results |
| Compliance | Aligned with global hiring standards |
| AI Matching | Semantic, skill-based candidate ranking |
| Analytics | Interview analytics and proctoring insights |

---

## Solutions Pages

### Enterprise Solutions
HRIS/ATS/ERP integration, bulk background verification, custom branding, SOC 2 Type II readiness, and dedicated support. Plans: Startup ($120/mo), Business ($600/mo) and Custom.

### Government Solutions
Security clearance and document verification, data sovereignty, and multi-language support (22+ Indian / 50+ global languages). Trusted by 50+ government departments.

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Homepage with features, how-it-works and testimonials |
| Login / Signup | `/login`, `/signup` | Auth with role-based redirect |
| Verify Email | `/verify-email` | Email verification (link from email) |
| Forgot / Reset Password | `/forgot-password`, `/reset-password` | Password recovery |
| Pricing | `/pricing` | Starter / Pro / Enterprise plans |
| Settings | `/settings` | 2FA, billing, timezone, currency, GDPR export/delete |
| Profile | `/profile` | 6-step profile wizard + AI Assistant |
| Interview | `/interview` | Schedule AI interview |
| Interview Room | `/interview/room` | Pre-interview device check |
| Live Interview | `/interview/live` | AI video interview |
| Confirmation | `/confirmation` | Booking confirmation & reminders |
| Employer | `/employer` | Employer dashboard: post jobs, view matches, candidates |
| Admin | `/admin` | Admin portal: overview, candidates, interviews, analytics, feedback, team, proctoring |
| Enterprise | `/enterprise` | Enterprise solutions |
| Government | `/government` | Government solutions |
| API Docs | `/api-docs` | Full REST API reference |
| Legal | `/terms`, `/privacy`, `/dpa` | Terms of Service, Privacy Policy, Data Processing Agreement |

---

## Pricing

| Plan | Price | Includes |
|------|-------|----------|
| Starter | Free forever | 3 interviews/mo, 1 candidate profile, email confirmation, basic AI evaluation |
| Pro | $12/mo | 100 interviews/mo, full video & analytics, email + WhatsApp reminders, priority AI evaluations, 6-month video retention |
| Enterprise | $36/mo | Unlimited interviews, everything in Pro, custom branding & roles, 1-year video retention, priority support |

- Prices are shown in the visitor's currency (USD, INR, EUR, GBP, AED, SGD, CAD, AUD) with a currency selector on the pricing page.
- Billing is handled securely by Stripe; sales tax/VAT can be collected automatically.

---

## Trusted By

HireRight is trusted by leading companies worldwide:

- TATA
- Wipro
- Infosys
- Accenture
- Amazon
- Deloitte
- Reliance
- HDFC

---

## User Ratings

| Category | Rating |
|----------|--------|
| Job Seekers | 4.9/5 |
| Employers | 4.8/5 |

---

## Security & Privacy

- All data is encrypted in transit and at rest
- We never share your information without explicit consent
- GDPR compliant data handling (export / delete / DPA)
- Optional 2-factor authentication (TOTP)
- AI decisions are transparent — evaluations include per-question breakdowns and proctoring reports
- Regular security audits

---

## FAQ

**Q: Is my data secure?**
A: Yes, all your information is protected with industry-leading encryption and security measures.

**Q: How long does the verification take?**
A: Our AI-powered system provides quick turnaround, typically within 24-48 hours.

**Q: Can I update my profile after submission?**
A: Yes, you can update your profile at any time through your account settings.

**Q: What if I need to reschedule my interview?**
A: You can reschedule your interview anytime before the scheduled slot.

**Q: Is the AI interview recorded?**
A: The interview is recorded with your consent. Recordings, transcripts and proctoring reports are available to you and to the employers you match with.

**Q: How does AI matching work?**
A: Your profile and resume are converted into a searchable semantic index. Employers' job posts are compared against it to surface the best-fit candidates, with a transparent score breakdown.

**Q: How does anti-cheating work?**
A: MediaPipe on-device face and gaze detection runs locally in the browser during your interview. It only flags behavior (looking away, covering your face, a second person) — no video leaves your device during detection.

---

## Support

For any questions or assistance:

- **Email**: care@hireright.com
- **Phone**: +91 1800-123-4567
- **Location**: Bangalore, India

---

## Technical Overview

### Technology Stack

- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Database**: Prisma (PostgreSQL + pgvector for AI search)
- **AI**: OpenAI GPT-5-nano (questions, evaluation, assistant), text embeddings
- **Speech**: Deepgram Nova-2 transcription + browser speech recognition
- **Video**: LiveKit WebRTC for live interviews
- **Proctoring**: MediaPipe FaceLandmarker (on-device anti-cheating)
- **Storage**: Cloudflare R2 (resume, video, captions)
- **Billing**: Stripe (multi-currency subscriptions)
- **Auth**: JWT + bcrypt, TOTP 2FA
- **Infra**: Upstash rate limiting, Inngest background jobs, Sentry error tracking

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | August 2026 | Initial release with full feature set |
| 1.1.0 | August 2026 | Rebranded to HireRight; added employer portal, AI job matching, live video interviews, transcription, 2FA, AI assistant, enterprise & government solutions, admin analytics |

---

*Last Updated: August 15, 2026*
