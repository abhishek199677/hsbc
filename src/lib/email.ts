import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"Techcitta" <${process.env.SMTP_USER || "noreply@techcitta.com"}>`,
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
          <p>Hi ${data.name},</p>
          <p>Great news! Your 15-minute AI interview is confirmed.</p>
          
          <div class="detail-box">
            <div class="detail-label">📅 Date</div>
            <div class="detail-value">${data.date}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">🕐 Time</div>
            <div class="detail-value">${data.time} (IST)</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">🎥 Interview Mode</div>
            <div class="detail-value">${data.mode}</div>
          </div>
          
          <p style="margin-top: 20px;">We look forward to meeting you!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview" class="button">View Interview Details</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Techcitta. All rights reserved.</p>
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
          <p>Your interview is in ${data.type}</p>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          
          <div class="alert-box">
            <strong>${data.message}</strong>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">📅 Date</div>
            <div class="detail-value">${data.date}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">🕐 Time</div>
            <div class="detail-value">${data.time} (IST)</div>
          </div>
          
          <p style="margin-top: 20px;">Make sure you're prepared and in a quiet location with a stable internet connection.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/live" class="button">Join Interview</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Techcitta. All rights reserved.</p>
          <p>Right People. Right Decisions.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmail(name: string) {
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
          <h1>Welcome to Techcitta! 🚀</h1>
          <p>Your journey to the right opportunity starts here</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to Techcitta! We're excited to have you on board.</p>
          <p>Start building your profile to get matched with the right opportunities.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" class="button">Complete Your Profile</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 Techcitta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
