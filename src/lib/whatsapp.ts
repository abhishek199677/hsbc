// WhatsApp Business API Integration
// To use this, you need:
// 1. WhatsApp Business account
// 2. Meta (Facebook) Developer account
// 3. WhatsApp Business API credentials

import { timezoneLabel } from "@/lib/timezone";

interface SendWhatsAppParams {
  to: string;
  message: string;
}

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

const config: WhatsAppConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  apiVersion: "v18.0",
};

export async function sendWhatsAppMessage({ to, message }: SendWhatsAppParams): Promise<boolean> {
  try {
    // Validate config
    if (!config.phoneNumberId || !config.accessToken) {
      console.error("WhatsApp API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env");
      return false;
    }

    // Format phone number (remove spaces, dashes, and ensure country code)
    let formattedPhone = to.replace(/[\s\-\(\)]/g, "");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone}`; // Default to India (+91)
    }
    formattedPhone = formattedPhone.replace("+", "");

    // Send message via WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log("WhatsApp message sent:", data.messages?.[0]?.id);
      return true;
    } else {
      console.error("WhatsApp API error:", data.error?.message);
      return false;
    }
  } catch (error) {
    console.error("Failed to send WhatsApp:", error);
    return false;
  }
}

export function generateInterviewConfirmationWhatsApp(data: {
  name: string;
  date: string;
  time: string;
  timezone?: string;
}): string {
  const tz = timezoneLabel(data.timezone);
  return `Hi ${data.name}! 👋

Your 15-minute AI Interview is confirmed.

📅 ${data.date}
🕐 ${data.time} (${tz})

We're excited to connect with you and help you find the right opportunities.

– Team Techcitta`;
}

export function generateReminderWhatsApp(data: {
  name: string;
  type: string;
  date: string;
  time: string;
  timezone?: string;
}): string {
  const tz = timezoneLabel(data.timezone);
  return `Hi ${data.name}! ⏰

Interview Reminder: Your AI interview is in ${data.type}.

📅 ${data.date}
🕐 ${data.time} (${tz})

Get ready and make sure you're in a quiet location!

– Team Techcitta`;
}
