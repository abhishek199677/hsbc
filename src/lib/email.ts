import nodemailer from "nodemailer";
import { escapeHtml } from "./security";
import { formatTimeLabel } from "./time";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  // Dev fallback: without SMTP credentials there is no way to deliver mail, so
  // print the email (and any action links) to the server console. This keeps
  // the full signup/verify/reset flow testable locally before SMTP is set up.
  if (!smtpConfigured) {
    if (process.env.NODE_ENV === "production") {
      console.error("Email not sent: SMTP_* env vars are not configured (required in production).");
      return { success: false, error: "SMTP is not configured" };
    }
    console.log("\n=================================================");
    console.log("[DEV] Email not sent via SMTP (SMTP_* not configured)");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    if (links.length) {
      console.log("  Links:");
      for (const link of links) console.log("   -", link);
    }
    console.log("=================================================\n");
    return { success: true, devFallback: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"HireRight" <${process.env.SMTP_USER || "noreply@hireright.com"}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export function generateInterviewConfirmationEmail(data: {
  name: string;
  date: string;
  time: string;
  mode: string;
  timezone?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4f46e5; }
        .detail-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .detail-value { font-size: 16px; font-weight: bold; color: #111827; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Interview Confirmed!</h1>
          <p>Your AI Interview has been scheduled</p>
        </div>
        <div class="content">
          <p>Hi ${escapeHtml(data.name)},</p>
          <p>Great news! Your 15-minute AI interview is confirmed.</p>
          
          <div class="detail-box">
            <div class="detail-label">📅 Date</div>
            <div class="detail-value">${escapeHtml(data.date)}</div>
          </div>
          
            <div class="detail-box">
              <div class="detail-label">🕐 Time</div>
              <div class="detail-value">${escapeHtml(formatTimeLabel(data.time))} (${escapeHtml(data.timezone || "Asia/Kolkata")})</div>
            </div>
            
            <div class="detail-box">
              <div class="detail-label">🎥 Interview Mode</div>
              <div class="detail-value">${escapeHtml(data.mode)}</div>
            </div>
          
          <p style="margin-top: 20px;">We look forward to meeting you!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview" class="button">View Interview Details</a>
          </div>
        </div>
<div class="footer">
          <p>© 2026 HireRight. All rights reserved.</p>
           <p>Right People. Right Decisions.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateReminderEmail(data: {
  name: string;
  type: string;
  date: string;
  time: string;
  message: string;
  timezone?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .detail-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4f46e5; }
        .detail-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .detail-value { font-size: 16px; font-weight: bold; color: #111827; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Interview Reminder</h1>
          <p>Your interview is in ${escapeHtml(data.type)}</p>
        </div>
        <div class="content">
          <p>Hi ${escapeHtml(data.name)},</p>
          
          <div class="alert-box">
            <strong>${escapeHtml(data.message)}</strong>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">📅 Date</div>
            <div class="detail-value">${escapeHtml(data.date)}</div>
          </div>
          
            <div class="detail-box">
              <div class="detail-label">🕐 Time</div>
              <div class="detail-value">${escapeHtml(formatTimeLabel(data.time))} (${escapeHtml(data.timezone || "Asia/Kolkata")})</div>
            </div>
            
            <p style="margin-top: 20px;">Make sure you're prepared and in a quiet location with a stable internet connection.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/live" class="button">Join Interview</a>
          </div>
        </div>
<div class="footer">
          <p>© 2026 HireRight. All rights reserved.</p>
           <p>Right People. Right Decisions.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmail(name: string, orgName: string = "HireRight") {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${escapeHtml(orgName)}! 🚀</h1>
          <p>Your journey to the right opportunity starts here</p>
        </div>
        <div class="content">
          <p>Hi ${escapeHtml(name)},</p>
          <p>Welcome to ${escapeHtml(orgName)}! We're excited to have you on board.</p>
          <p>Start building your profile to get matched with the right opportunities.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" class="button">Complete Your Profile</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 HireRight. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateVerificationEmail(name: string, verifyUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirm your email ✉️</h1>
        </div>
        <div class="content">
          <p>Hi ${escapeHtml(name)},</p>
          <p>Thanks for signing up for HireRight. Please confirm your email address to secure your account and unlock all features.</p>
          <p>This link expires in 1 hour.</p>
          <div style="text-align: center;">
            <a href="${escapeHtml(verifyUrl)}" class="button">Verify Email</a>
          </div>
        </div>
<div class="footer">
          <p>© 2026 HireRight. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetEmail(name: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset your password 🔐</h1>
        </div>
        <div class="content">
          <p>Hi ${escapeHtml(name)},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <div style="text-align: center;">
            <a href="${escapeHtml(resetUrl)}" class="button">Reset Password</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 HireRight. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateInterviewSchedulingEmail(data: {
  candidateName: string;
  interviewerName: string;
  position: string;
  date: string;
  time: string;
  timezone: string;
  meetingUrl: string;
  meetingId: string;
  meetingPasscode: string;
  duration: string;
  mode: "video" | "phone" | "in-person";
  notes?: string;
}) {
  const meetingLink = data.mode === "video" ? `
    <div class="meeting-box">
      <div class="meeting-header">Microsoft Teams Meeting</div>
      <div class="meeting-details">
        <p><strong>Join:</strong> <a href="${escapeHtml(data.meetingUrl)}" style="color: #4f46e5;">${escapeHtml(data.meetingUrl)}</a></p>
        <p><strong>Meeting ID:</strong> ${escapeHtml(data.meetingId)}</p>
        <p><strong>Passcode:</strong> ${escapeHtml(data.meetingPasscode)}</p>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0078d4, #005a9e); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .event-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .event-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px; }
        .event-subtitle { font-size: 14px; color: #666; margin: 0; }
        .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-icon { width: 20px; margin-right: 12px; color: #666; }
        .detail-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { font-size: 15px; color: #1a1a1a; font-weight: 500; }
        .meeting-box { background: #f0f6ff; border: 1px solid #cce0ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .meeting-header { font-size: 16px; font-weight: 600; color: #0078d4; margin-bottom: 12px; }
        .meeting-details p { margin: 8px 0; font-size: 14px; }
        .meeting-details a { color: #0078d4; text-decoration: none; }
        .meeting-details a:hover { text-decoration: underline; }
        .join-button { display: inline-block; background: #0078d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .join-button:hover { background: #005a9e; }
        .notes-box { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .notes-label { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 8px; }
        .notes-text { font-size: 14px; color: #333; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee; }
        .footer p { margin: 4px 0; font-size: 12px; color: #888; }
        .calendar-note { background: #e8f5e9; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #2e7d32; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>📅 Interview Scheduled</h1>
            <p>You're invited for a ${escapeHtml(data.mode)} interview</p>
          </div>
          <div class="content">
            <div class="greeting">
              <p>Hi ${escapeHtml(data.candidateName)},</p>
              <p>We're pleased to invite you for an interview for the position of <strong>${escapeHtml(data.position)}</strong>.</p>
            </div>

            <div class="event-card">
              <div class="event-title">${escapeHtml(data.position)}</div>
              <div class="event-subtitle">${data.mode === 'video' ? 'Video Interview' : data.mode === 'phone' ? 'Phone Interview' : 'In-Person Interview'}</div>
              
              <div class="detail-row">
                <div class="detail-icon">📅</div>
                <div>
                  <div class="detail-label">Date</div>
                  <div class="detail-value">${escapeHtml(data.date)}</div>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">🕐</div>
                <div>
                  <div class="detail-label">Time</div>
                  <div class="detail-value">${escapeHtml(formatTimeLabel(data.time))} (${escapeHtml(data.timezone)})</div>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">⏱️</div>
                <div>
                  <div class="detail-label">Duration</div>
                  <div class="detail-value">${escapeHtml(data.duration)}</div>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">👤</div>
                <div>
                  <div class="detail-label">Interviewer</div>
                  <div class="detail-value">${escapeHtml(data.interviewerName)}</div>
                </div>
              </div>
            </div>

            ${meetingLink}

            <div class="calendar-note">
              📌 This invite has been sent to your email. Please add it to your calendar.
            </div>

            ${data.notes ? `
            <div class="notes-box">
              <div class="notes-label">Additional Notes</div>
              <div class="notes-text">${escapeHtml(data.notes)}</div>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 24px;">
              ${data.mode === 'video' ? `
              <a href="${escapeHtml(data.meetingUrl)}" class="join-button">Join Microsoft Teams Meeting</a>
              ` : `
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview" class="join-button">View Interview Details</a>
              `}
            </div>
          </div>
          <div class="footer">
            <p>© 2026 HireRight. All rights reserved.</p>
            <p>Right People. Right Decisions.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
