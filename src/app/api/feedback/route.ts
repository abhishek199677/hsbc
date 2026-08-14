import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, message, email, userId, page } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        type: type || "general",
        message: message.trim(),
        email: email || null,
        userId: userId || null,
        page: page || null,
      },
    });

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const typeLabel = type === "bug" ? "Bug Report" : type === "feature" ? "Feature Request" : "General Feedback";
      await sendEmail({
        to: adminEmail,
        subject: `[HireRight] New ${typeLabel} from ${email || "Anonymous"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .field { margin: 10px 0; }
              .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
              .value { font-size: 14px; color: #111827; }
              .message-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 15px 0; }
              .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Feedback Received</h2>
                <p>${typeLabel}</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">From</div>
                  <div class="value">${email || "Anonymous"}</div>
                </div>
                <div class="field">
                  <div class="label">Type</div>
                  <div class="value">${typeLabel}</div>
                </div>
                <div class="field">
                  <div class="label">Page</div>
                  <div class="value">${page || "N/A"}</div>
                </div>
                <div class="field">
                  <div class="label">User ID</div>
                  <div class="value">${userId || "N/A"}</div>
                </div>
                <div class="message-box">
                  <div class="label">Message</div>
                  <div class="value">${message.trim()}</div>
                </div>
              </div>
              <div class="footer">
                <p>This feedback was submitted via the HireRight feedback widget.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
