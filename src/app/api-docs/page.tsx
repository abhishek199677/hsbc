"use client";

import { useState } from "react";

const SECTIONS = [
  { id: "auth", label: "Authentication" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "auth-api", label: "Auth Endpoints" },
  { id: "profile", label: "Profile" },
  { id: "interview", label: "Interview" },
  { id: "ai-interview", label: "AI Interview" },
  { id: "upload", label: "Upload" },
  { id: "admin", label: "Admin" },
  { id: "billing", label: "Billing" },
  { id: "account", label: "Account" },
  { id: "errors", label: "Error Codes" },
  { id: "webhooks", label: "Webhooks" },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
    PATCH: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold rounded border ${colors[method] || colors.GET}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10">
      {title && (
        <div className="bg-gray-800 px-4 py-1.5 text-xs text-slate-400 font-mono border-b border-white/10">
          {title}
        </div>
      )}
      <pre className="bg-gray-900 text-green-400 p-4 text-sm overflow-x-auto font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  description,
  auth,
  children,
}: {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/95 rounded-xl p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <MethodBadge method={method} />
        <code className="text-sm font-mono font-semibold text-gray-800">{path}</code>
        {auth !== false && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            Auth Required
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children}
    </div>
  );
}

function FieldTable({ fields }: { fields: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 pr-4 font-semibold text-gray-700">Field</th>
            <th className="py-2 pr-4 font-semibold text-gray-700">Type</th>
            <th className="py-2 font-semibold text-gray-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-4 font-mono text-xs text-indigo-700 whitespace-nowrap">
                {f.name}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
              </td>
              <td className="py-2 pr-4 text-xs text-gray-500">{f.type}</td>
              <td className="py-2 text-xs text-gray-600">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("auth");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#1a1a2e] border-r border-white/10 sticky top-0 h-screen overflow-y-auto">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">API Reference</h2>
            <p className="text-xs text-slate-400 mt-1">v1.0 &middot; Base URL</p>
            <code className="block mt-2 text-xs text-green-400 bg-black/30 rounded px-2 py-1 font-mono break-all">
              /api
            </code>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === s.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Techcitta API Documentation
              </h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full">
                v1.0
              </span>
            </div>
            <p className="text-slate-300 text-lg mt-4 max-w-2xl">
              RESTful API for the Techcitta AI interview platform. All endpoints
              return JSON and require JWT authentication unless noted.
            </p>
          </div>

          {/* Mobile nav */}
          <div className="lg:hidden mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeSection === s.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">

            {/* ── Authentication ─────────────────────── */}
            <section id="auth">
              <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
              <div className="bg-white/95 rounded-xl p-6 border border-slate-200 space-y-4 text-sm text-gray-700">
                <p>
                  All authenticated endpoints require a <strong>JWT Bearer token</strong> in
                  the <code className="bg-slate-100 px-1 rounded font-mono text-xs">Authorization</code> header.
                </p>
                <CodeBlock title="Header">
{`Authorization: Bearer <your-jwt-token>`}
                </CodeBlock>
                <p>
                  Obtain a token by calling <code className="bg-slate-100 px-1 rounded font-mono text-xs">POST /api/auth/login</code> or{" "}
                  <code className="bg-slate-100 px-1 rounded font-mono text-xs">POST /api/auth/signup</code>.
                  Tokens are included in the login/signup response body as{" "}
                  <code className="bg-slate-100 px-1 rounded font-mono text-xs">token</code>.
                </p>
                <CodeBlock title="Example — Get a token">
{`POST /api/auth/login
Content-Type: application/json

{
  "email": "candidate@example.com",
  "password": "securePassword123"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "...", "name": "..." }
}`}
                </CodeBlock>
              </div>
            </section>

            {/* ── Rate Limits ────────────────────────── */}
            <section id="rate-limits">
              <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
              <div className="bg-white/95 rounded-xl p-6 border border-slate-200">
                <p className="text-sm text-gray-600 mb-4">
                  Rate limits are enforced per IP address and per user. Exceeding the limit
                  returns <code className="bg-slate-100 px-1 rounded font-mono text-xs">429 Too Many Requests</code>.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4 font-semibold text-gray-700">Endpoint</th>
                        <th className="py-2 pr-4 font-semibold text-gray-700">Limit</th>
                        <th className="py-2 font-semibold text-gray-700">Window</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">POST /api/auth/signup</td>
                        <td className="py-2 pr-4">5 requests</td>
                        <td className="py-2">1 minute</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">POST /api/auth/login</td>
                        <td className="py-2 pr-4">10 requests</td>
                        <td className="py-2">1 minute</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">POST /api/ai-interview</td>
                        <td className="py-2 pr-4">120 requests (per IP + per user)</td>
                        <td className="py-2">1 minute</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">POST /api/upload</td>
                        <td className="py-2 pr-4">60 requests</td>
                        <td className="py-2">1 minute</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">POST /api/billing/checkout</td>
                        <td className="py-2 pr-4">20 requests</td>
                        <td className="py-2">1 minute</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Auth Endpoints ─────────────────────── */}
            <section id="auth-api">
              <h2 className="text-2xl font-bold text-white mb-4">Auth Endpoints</h2>
              <div className="space-y-6">

                {/* POST /api/auth/signup */}
                <EndpointCard
                  method="POST"
                  path="/api/auth/signup"
                  description="Register a new user account. Creates a user, organization, and profile. Returns a JWT token."
                  auth={false}
                >
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</h4>
                  <FieldTable
                    fields={[
                      { name: "email", type: "string", required: true, desc: "Valid email address" },
                      { name: "password", type: "string", required: true, desc: "Minimum 8 characters" },
                      { name: "name", type: "string", desc: "Full name" },
                      { name: "phone", type: "string", desc: "Phone number" },
                      { name: "role", type: "string", desc: "\"jobseeker\" (default), \"employer\", or \"admin\"" },
                      { name: "orgName", type: "string", desc: "Organization display name" },
                    ]}
                  />
                  <CodeBlock title="Example">
{`POST /api/auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Priya Sharma",
  "phone": "+919876543210",
  "role": "jobseeker"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "newuser@example.com",
    "name": "Priya Sharma",
    "role": "jobseeker",
    "organizationId": "clx..."
  },
  "organization": {
    "id": "clx...",
    "name": "Priya Sharma's Workspace",
    "slug": "priya-sharma",
    "plan": "starter"
  }
}`}
                  </CodeBlock>
                </EndpointCard>

                {/* POST /api/auth/login */}
                <EndpointCard
                  method="POST"
                  path="/api/auth/login"
                  description="Authenticate an existing user. Returns a JWT token and user details."
                  auth={false}
                >
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</h4>
                  <FieldTable
                    fields={[
                      { name: "email", type: "string", required: true, desc: "Registered email address" },
                      { name: "password", type: "string", required: true, desc: "Account password" },
                    ]}
                  />
                  <CodeBlock title="Example">
{`POST /api/auth/login
Content-Type: application/json

{
  "email": "candidate@example.com",
  "password": "securePassword123"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "candidate@example.com",
    "name": "Rahul Verma",
    "role": "jobseeker",
    "emailVerified": true
  },
  "organization": {
    "id": "clx...",
    "name": "Tech Startup",
    "slug": "tech-startup",
    "plan": "pro",
    "planStatus": "active"
  }
}`}
                  </CodeBlock>
                </EndpointCard>
              </div>
            </section>

            {/* ── Profile ────────────────────────────── */}
            <section id="profile">
              <h2 className="text-2xl font-bold text-white mb-4">Profile</h2>
              <div className="space-y-6">

                <EndpointCard method="GET" path="/api/profile" description="Fetch the authenticated user's profile with linked user data.">
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "profile": {
    "id": "clx...",
    "userId": "clx...",
    "step": 5,
    "aboutYou": "Passionate software engineer...",
    "currentRole": "Senior Developer",
    "totalExperience": "5 years",
    "currentLocation": "Mumbai",
    "skills": "React, Node.js, TypeScript",
    "isComplete": true,
    "resumeUrl": "https://storage.../resumes/file.pdf",
    "user": {
      "id": "clx...",
      "email": "candidate@example.com",
      "name": "Rahul Verma",
      "phone": "+919876543210"
    }
  }
}`}
                  </CodeBlock>
                </EndpointCard>

                <EndpointCard method="PUT" path="/api/profile" description="Create or update the authenticated user's profile. Supports partial updates — send only the fields you want to change.">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body (all optional)</h4>
                  <FieldTable
                    fields={[
                      { name: "step", type: "number", desc: "Profile wizard step (1–5)" },
                      { name: "aboutYou", type: "string", desc: "Self-description" },
                      { name: "whatDrivesYou", type: "string", desc: "Motivations" },
                      { name: "strengths", type: "string", desc: "Key strengths" },
                      { name: "currentRole", type: "string", desc: "Current job title" },
                      { name: "totalExperience", type: "string", desc: "Years of experience" },
                      { name: "currentLocation", type: "string", desc: "City / location" },
                      { name: "noticePeriod", type: "string", desc: "Notice period duration" },
                      { name: "skills", type: "string", desc: "Comma-separated skills" },
                      { name: "currentCompany", type: "string", desc: "Current employer" },
                      { name: "education", type: "string", desc: "Education background" },
                      { name: "jobType", type: "string", desc: "Preferred job type" },
                      { name: "salaryRange", type: "string", desc: "Expected salary range" },
                      { name: "preferredLocation", type: "string", desc: "Preferred work location" },
                      { name: "workMode", type: "string", desc: "\"remote\", \"onsite\", or \"hybrid\"" },
                      { name: "preferredDate", type: "string", desc: "Interview preferred date" },
                      { name: "preferredTimeSlot", type: "string", desc: "Interview preferred time" },
                      { name: "timezone", type: "string", desc: "IANA timezone, e.g. \"Asia/Kolkata\"" },
                      { name: "resumeUrl", type: "string", desc: "URL of uploaded resume" },
                      { name: "resumeFileName", type: "string", desc: "Original filename" },
                    ]}
                  />
                  <CodeBlock title="Example">
{`PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentRole": "Full Stack Developer",
  "skills": "React, Next.js, Prisma, PostgreSQL",
  "totalExperience": "4 years"
}`}
                  </CodeBlock>
                </EndpointCard>
              </div>
            </section>

            {/* ── Interview ──────────────────────────── */}
            <section id="interview">
              <h2 className="text-2xl font-bold text-white mb-4">Interview</h2>
              <div className="space-y-6">

                <EndpointCard method="GET" path="/api/interview" description="Fetch the authenticated user's scheduled interview.">
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "interview": {
    "id": "clx...",
    "userId": "clx...",
    "date": "2026-08-15",
    "time": "14:00",
    "timezone": "Asia/Kolkata",
    "mode": "AI Video Interview",
    "type": "Technical + Behavioral Assessment",
    "duration": 15,
    "status": "scheduled",
    "emailSent": true,
    "whatsappSent": false
  }
}`}
                  </CodeBlock>
                </EndpointCard>

                <EndpointCard method="POST" path="/api/interview" description="Schedule a new interview or reschedule an existing one. Sends confirmation email and WhatsApp. Enforces plan limits.">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</h4>
                  <FieldTable
                    fields={[
                      { name: "date", type: "string", required: true, desc: "Date in YYYY-MM-DD format" },
                      { name: "time", type: "string", required: true, desc: "Time in HH:MM format" },
                      { name: "mode", type: "string", desc: "Interview mode (default: \"AI Video Interview\")" },
                      { name: "type", type: "string", desc: "Assessment type (default: \"Technical + Behavioral Assessment\")" },
                      { name: "duration", type: "number", desc: "Duration in minutes (default: 15)" },
                    ]}
                  />
                  <CodeBlock title="Example">
{`POST /api/interview
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-08-20",
  "time": "15:30",
  "duration": 15
}`}
                  </CodeBlock>
                </EndpointCard>
              </div>
            </section>

            {/* ── AI Interview ───────────────────────── */}
            <section id="ai-interview">
              <h2 className="text-2xl font-bold text-white mb-4">AI Interview</h2>
              <p className="text-sm text-slate-300 mb-4">
                The AI interview engine is a single endpoint with three actions:{" "}
                <code className="bg-white/10 px-1 rounded font-mono text-xs">start</code>,{" "}
                <code className="bg-white/10 px-1 rounded font-mono text-xs">respond</code>, and{" "}
                <code className="bg-white/10 px-1 rounded font-mono text-xs">evaluate</code>.
              </p>

              <div className="space-y-6">

                {/* Action: start */}
                <EndpointCard method="POST" path="/api/ai-interview" description="Start a new AI interview. Returns the interviewer&apos;s greeting and first question.">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body — action: &quot;start&quot;</h4>
                  <FieldTable
                    fields={[
                      { name: "action", type: "string", required: true, desc: "\"start\"" },
                      { name: "profile", type: "object", required: true, desc: "{ name, currentRole, totalExperience, skills }" },
                    ]}
                  />
                  <CodeBlock title="Request">
{`POST /api/ai-interview
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "start",
  "profile": {
    "name": "Rahul Verma",
    "currentRole": "Full Stack Developer",
    "totalExperience": "4 years",
    "skills": "React, Node.js, PostgreSQL"
  }
}`}
                  </CodeBlock>
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "message": "Hello Rahul! Welcome to your Techcitta interview...",
  "messageCount": 1
}`}
                  </CodeBlock>
                </EndpointCard>

                {/* Action: respond */}
                <EndpointCard method="POST" path="/api/ai-interview" description="Send the candidate&apos;s response and receive the interviewer&apos;s follow-up question.">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body — action: &quot;respond&quot;</h4>
                  <FieldTable
                    fields={[
                      { name: "action", type: "string", required: true, desc: "\"respond\"" },
                      { name: "userMessage", type: "string", required: true, desc: "Candidate&apos;s answer" },
                      { name: "conversationHistory", type: "array", required: true, desc: "Array of { role: \"user\"|\"assistant\", content: string }" },
                    ]}
                  />
                  <CodeBlock title="Request">
{`{
  "action": "respond",
  "userMessage": "I have 4 years of experience with React and Node.js...",
  "conversationHistory": [
    { "role": "assistant", "content": "Tell me about your experience..." },
    { "role": "user", "content": "I have 4 years of experience..." }
  ]
}`}
                  </CodeBlock>
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "message": "Great, that sounds solid. Can you tell me about a challenging project...",
  "messageCount": 2,
  "isComplete": false
}`}
                  </CodeBlock>
                </EndpointCard>

                {/* Action: evaluate */}
                <EndpointCard method="POST" path="/api/ai-interview" description="Evaluate the completed interview. Returns a structured score, strengths, weaknesses, and recommendation.">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body — action: &quot;evaluate&quot;</h4>
                  <FieldTable
                    fields={[
                      { name: "action", type: "string", required: true, desc: "\"evaluate\"" },
                      { name: "profile", type: "object", required: true, desc: "{ name, currentRole }" },
                      { name: "conversationHistory", type: "array", required: true, desc: "Full conversation history" },
                      { name: "proctoring", type: "object", desc: "Proctoring report { lookAwayCount, faceHiddenCount, ... }" },
                    ]}
                  />
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "evaluation": "{\\"score\\": 7.5, \\"strengths\\": [...], \\"recommendation\\": \\"Hire\\"}"
}`}
                  </CodeBlock>
                </EndpointCard>
              </div>
            </section>

            {/* ── Upload ─────────────────────────────── */}
            <section id="upload">
              <h2 className="text-2xl font-bold text-white mb-4">Upload</h2>
              <EndpointCard
                method="POST"
                path="/api/upload"
                description="Upload files — resumes (PDF/DOC/DOCX, ≤5MB), video recordings (MP4/WebM/MOV, ≤200MB), or caption files (VTT). Supports both multipart form-data and JSON presigned-URL mode for large videos."
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mode 1: Multipart Form-Data</h4>
                    <CodeBlock title="Request">
{`POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>`}
                    </CodeBlock>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mode 2: JSON Presigned URL (large video)</h4>
                    <CodeBlock title="Request">
{`POST /api/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "interview.webm",
  "type": "video/webm",
  "size": 52428800,
  "kind": "interview"
}

// Response 200
{
  "success": true,
  "uploadUrl": "https://r2.cloudflarestorage.com/...",
  "fileUrl": "https://storage.../org-xxx/interviews/xxx.webm",
  "publicUrl": "https://pub-xxx.r2.dev/...",
  "filename": "interview.webm"
}`}
                    </CodeBlock>
                  </div>
                  <CodeBlock title="Response 200 — Multipart">
{`{
  "success": true,
  "file": {
    "url": "https://storage.../org-xxx/resumes/abc123.pdf",
    "filename": "resume.pdf",
    "size": 1048576,
    "type": "application/pdf"
  }
}`}
                  </CodeBlock>
                </div>
              </EndpointCard>
            </section>

            {/* ── Admin ──────────────────────────────── */}
            <section id="admin">
              <h2 className="text-2xl font-bold text-white mb-4">Admin</h2>
              <div className="space-y-6">
                <EndpointCard
                  method="GET"
                  path="/api/admin/stats"
                  description="Get organization-level statistics. Requires admin or employer role."
                >
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "stats": {
    "totalUsers": 42,
    "totalProfiles": 38,
    "completedProfiles": 30,
    "totalInterviews": 25,
    "completedInterviews": 18,
    "scheduledInterviews": 7
  }
}`}
                  </CodeBlock>
                </EndpointCard>

                <EndpointCard
                  method="GET"
                  path="/api/admin/users"
                  description="List all users in the organization with profile and interview data. Requires admin or employer role. Video URLs are resolved to presigned playback URLs."
                >
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "users": [
    {
      "id": "clx...",
      "email": "candidate@example.com",
      "name": "Rahul Verma",
      "phone": "+919876543210",
      "createdAt": "2026-07-01T10:00:00Z",
      "profile": {
        "isComplete": true,
        "currentRole": "Full Stack Developer",
        "totalExperience": "4 years",
        "skills": "React, Node.js"
      },
      "interview": {
        "date": "2026-08-15",
        "time": "14:00",
        "status": "completed",
        "evaluationScore": 7.5,
        "proctoringStatus": "clean",
        "videoUrl": "https://pub-xxx.r2.dev/..."
      }
    }
  ]
}`}
                  </CodeBlock>
                </EndpointCard>
              </div>
            </section>

            {/* ── Billing ────────────────────────────── */}
            <section id="billing">
              <h2 className="text-2xl font-bold text-white mb-4">Billing</h2>
              <EndpointCard
                method="POST"
                path="/api/billing/checkout"
                description="Create a Stripe Checkout session for upgrading to Pro or Enterprise. Returns a redirect URL."
              >
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</h4>
                <FieldTable
                  fields={[
                    { name: "plan", type: "string", required: true, desc: "\"pro\" or \"enterprise\"" },
                    { name: "currency", type: "string", desc: "ISO 4217 code: \"USD\", \"INR\", \"EUR\", \"GBP\", \"AED\" (default: \"USD\")" },
                  ]}
                />
                <CodeBlock title="Request">
{`POST /api/billing/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "pro",
  "currency": "USD"
}

// Response 200
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}`}
                </CodeBlock>
              </EndpointCard>
            </section>

            {/* ── Account ────────────────────────────── */}
            <section id="account">
              <h2 className="text-2xl font-bold text-white mb-4">Account</h2>
              <div className="space-y-6">

                <EndpointCard method="GET" path="/api/account/me" description="Get the current user&apos;s account info and organization details.">
                  <CodeBlock title="Response 200">
{`{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "candidate@example.com",
    "name": "Rahul Verma",
    "role": "jobseeker",
    "phone": "+919876543210",
    "emailVerified": true
  },
  "organization": {
    "id": "clx...",
    "name": "Tech Startup",
    "plan": "pro",
    "planStatus": "active",
    "trialEndsAt": null
  }
}`}
                  </CodeBlock>
                </EndpointCard>

                <EndpointCard method="GET" path="/api/account/export" description="Export all user data as a downloadable JSON file (GDPR compliance).">
                  <CodeBlock title="Response 200">
{`{
  "generatedAt": "2026-08-11T12:00:00Z",
  "user": {
    "id": "clx...",
    "email": "candidate@example.com",
    "name": "Rahul Verma",
    "role": "jobseeker",
    "createdAt": "2026-07-01T10:00:00Z"
  },
  "profile": { ... },
  "interview": { ... }
}`}
                  </CodeBlock>
                </EndpointCard>

                <EndpointCard method="POST" path="/api/account/delete" description="Permanently delete the account and all associated data. Requires typing &quot;DELETE&quot; as confirmation.">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</h4>
                  <FieldTable
                    fields={[
                      { name: "confirmation", type: "string", required: true, desc: "Must be exactly \"DELETE\"" },
                    ]}
                  />
                  <CodeBlock title="Request & Response">
{`POST /api/account/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "confirmation": "DELETE"
}

// Response 200
{
  "success": true,
  "message": "Your account and all associated data have been permanently deleted."
}`}
                  </CodeBlock>
                </EndpointCard>
              </div>
            </section>

            {/* ── Error Codes ────────────────────────── */}
            <section id="errors">
              <h2 className="text-2xl font-bold text-white mb-4">Error Codes</h2>
              <div className="bg-white/95 rounded-xl p-6 border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4 font-semibold text-gray-700">Status</th>
                        <th className="py-2 pr-4 font-semibold text-gray-700">Meaning</th>
                        <th className="py-2 font-semibold text-gray-700">Typical Cause</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">400</td>
                        <td className="py-2 pr-4">Bad Request</td>
                        <td className="py-2">Missing or invalid fields in request body</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">401</td>
                        <td className="py-2 pr-4">Unauthorized</td>
                        <td className="py-2">Missing, expired, or invalid JWT token</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">402</td>
                        <td className="py-2 pr-4">Payment Required</td>
                        <td className="py-2">Plan limit reached or subscription inactive</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">403</td>
                        <td className="py-2 pr-4">Forbidden</td>
                        <td className="py-2">User lacks required role (admin/employer)</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">404</td>
                        <td className="py-2 pr-4">Not Found</td>
                        <td className="py-2">Requested resource does not exist</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">409</td>
                        <td className="py-2 pr-4">Conflict</td>
                        <td className="py-2">Email already registered (signup)</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">429</td>
                        <td className="py-2 pr-4">Too Many Requests</td>
                        <td className="py-2">Rate limit exceeded</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs font-bold">500</td>
                        <td className="py-2 pr-4">Internal Server Error</td>
                        <td className="py-2">Unexpected server failure</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs font-bold">503</td>
                        <td className="py-2 pr-4">Service Unavailable</td>
                        <td className="py-2">Stripe not configured on this deployment</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <CodeBlock title="Error Response Shape">
{`{
  "error": "Human-readable error message",
  "details": "Optional additional info (dev only)"
}`}
                </CodeBlock>
              </div>
            </section>

            {/* ── Webhooks ───────────────────────────── */}
            <section id="webhooks">
              <h2 className="text-2xl font-bold text-white mb-4">Webhooks — Stripe Events</h2>
              <div className="bg-white/95 rounded-xl p-6 border border-slate-200 space-y-4 text-sm text-gray-700">
                <p>
                  Stripe sends webhook events to{" "}
                  <code className="bg-slate-100 px-1 rounded font-mono text-xs">POST /api/billing/webhook</code>.
                  The endpoint verifies the <code className="bg-slate-100 px-1 rounded font-mono text-xs">stripe-signature</code> header
                  before processing.
                </p>

                <h4 className="font-semibold text-gray-800">Handled Events</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4 font-semibold text-gray-700">Event Type</th>
                        <th className="py-2 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">checkout.session.completed</td>
                        <td className="py-2">Sets organization plan to &quot;pro&quot; or &quot;enterprise&quot;, marks status as active, stores Stripe customer &amp; subscription IDs</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-xs">customer.subscription.updated</td>
                        <td className="py-2">Updates plan status (active, past_due, canceled, etc.)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">customer.subscription.deleted</td>
                        <td className="py-2">Marks subscription as inactive/canceled</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="font-semibold text-gray-800">Setup</h4>
                <CodeBlock title="Environment Variables">
{`STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_USD=price_...
STRIPE_PRICE_ENTERPRISE_USD=price_...`}
                </CodeBlock>
                <CodeBlock title="Stripe CLI (local testing)">
{`stripe listen --forward-to localhost:3000/api/billing/webhook`}
                </CodeBlock>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-slate-400 text-sm border-t border-white/10 pt-8">
            <p>
              Questions? Reach out at{" "}
              <a href="mailto:support@techcitta.com" className="text-slate-200 underline">
                support@techcitta.com
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
