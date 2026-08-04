# HireRight - Client Documentation

## What is HireRight?

**HireRight** is a modern background screening and job matching platform that connects talented professionals with the right opportunities. It uses AI-powered technology to verify candidate information and match them with employers who are looking for their specific skill set.

---

## How It Works

### For Job Seekers

HireRight makes the job search process faster, more secure, and more transparent. Here's the step-by-step journey:

---

### Step 1: Create Your Profile

![Profile Step](https://img.shields.io/badge/Step-1-blue)

You start by building your professional profile:

- **Upload Your Resume** - Simply drag and drop your resume (PDF, DOC, or DOCX format, max 5MB). Our system will parse and analyze your resume to understand your background.

- **Tell Us About Yourself** - Share a brief introduction about who you are, what drives you in your career, and your key strengths. This helps us understand your personality and career goals.

- **Current Snapshot** - Provide details about your current role, total years of experience, current location, and notice period. This helps us match you with opportunities that fit your timeline.

> **Your Privacy Matters**: All your information is encrypted and secure. We never share your data without your consent.

---

### Step 2: Upload Resume

![Resume Step](https://img.shields.io/badge/Step-2-blue)

- Upload your latest resume
- Our AI analyzes your skills, experience, and qualifications
- You receive instant confirmation once uploaded successfully

**Supported Formats**: PDF, DOC, DOCX (Maximum file size: 5MB)

---

### Step 3: Skills & Experience

![Skills Step](https://img.shields.io/badge/Step-3-blue)

- List your primary technical skills
- Specify your total years of professional experience
- Add your current company information
- Include your educational background

---

### Step 4: Your Preferences

![Preferences Step](https://img.shields.io/badge/Step-4-blue)

Tell us what you're looking for:

- **Job Type**: Full-time, Part-time, Contract, or Freelance
- **Expected Salary Range**: Your desired compensation
- **Preferred Location**: Where you want to work
- **Work Mode**: Remote, Hybrid, or On-site

---

### Step 5: AI Interview Scheduling

![Interview Step](https://img.shields.io/badge/Step-5-blue)

Schedule your 15-minute AI-powered video interview:

- **Select a Date**: Choose from available dates on the calendar
- **Pick a Time Slot**: Morning, Afternoon, or Evening slots available
- **Confirmation**: Receive instant confirmation via Email and WhatsApp

#### Interview Features:
| Feature | Description |
|---------|-------------|
| Duration | 15 minutes |
| Mode | AI Video Interview |
| Assessment | Technical + Behavioral |
| Security | Encrypted and private |

---

### Step 6: Confirmation & Reminders

![Confirmation Step](https://img.shields.io/badge/Step-6-blue)

Once your interview is scheduled:

- **Email Confirmation**: Detailed email sent to your registered email address
- **WhatsApp Confirmation**: Quick confirmation via WhatsApp
- **Calendar Reminder**: Add to your calendar with one click
- **Automated Reminders**:
  - 24 hours before the interview
  - 1 hour before the interview
  - 15 minutes before the interview

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

### For Employers

| Feature | Benefit |
|---------|---------|
| Trusted Candidates | Accurate background checks build employer trust |
| Faster Hiring | Quick turnaround on verification reports |
| Verified Reports | Seamless sharing of verification results |
| Compliance | Aligned with global hiring standards |

---

## Trusted By

HireRight is trusted by leading companies worldwide:

- TATA
- Wipro
- Infosys
- Accenture
- Amazon
- Deloitte

---

## User Ratings

| Category | Rating |
|----------|--------|
| Job Seekers | 4.8/5 |
| Employers | 4.7/5 |

---

## Technical Overview

### Technology Stack

- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React

### Project Structure

```
hreright/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── profile/page.tsx      # Profile wizard
│   │   ├── interview/page.tsx    # Interview scheduling
│   │   └── confirmation/page.tsx # Confirmation page
│   └── components/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── CompanyLogos.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── CTA.tsx
│       ├── Footer.tsx
│       ├── Sidebar.tsx
│       └── StepIndicator.tsx
```

---

## Pages Overview

### 1. Landing Page (`/`)

The main entry point for users. Features:
- Hero section with call-to-action
- Company logos showcase
- Features and benefits section
- How it works guide
- Ratings and testimonials
- Footer with links

### 2. Profile Wizard (`/profile`)

Multi-step form for building user profiles:
- Step 1: Upload resume and basic info
- Step 2: Resume confirmation
- Step 3: Skills and experience
- Step 4: Job preferences
- Step 5: AI interview preparation
- Step 6: Completion confirmation

### 3. Interview Scheduling (`/interview`)

Interactive calendar interface for scheduling interviews:
- Monthly calendar view
- Available time slots
- Real-time slot availability
- Instant confirmation

### 4. Confirmation Page (`/confirmation`)

Post-booking confirmation with:
- Interview details
- Email confirmation preview
- WhatsApp confirmation preview
- Reminder timeline
- Calendar integration

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd hreright

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Support

For any questions or assistance:

- **Email**: care@hreright.com
- **Website**: www.hreright.com

---

## Security & Privacy

- All data is encrypted in transit and at rest
- We never share your information without explicit consent
- GDPR compliant data handling
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
A: The interview is conducted live with our AI system. Recording policies will be clearly communicated before the interview begins.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | August 2026 | Initial release with full feature set |

---

*Last Updated: August 4, 2026*
