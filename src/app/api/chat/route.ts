import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get user data for context
    let userContext = "";
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, name: true, email: true },
        });

        if (user) {
          userContext = `
User profile:
- Name: ${user.name || "Not provided"}
- Role: ${user.role || "Not set"}
- Email: ${user.email || "Not provided"}

`;
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }

    // Build system prompt with user context
    const systemPrompt = `
You are Techcitta AI Assistant, a helpful guide for the Techcitta platform.

${userContext}

Your role is to help users with:
1. Profile completion and building their job seeker/employer profile
2. Interview preparation and scheduling AI video interviews
3. Navigating the Techcitta platform features
4. Understanding the AI-powered matching and job search functionality
5. Answering questions about plans, features, and how the platform works

Guidelines:
- Be concise and helpful (keep responses under 3-4 sentences)
- Use a friendly, professional tone
- If you don't know something specific, direct them to relevant pages or features
- Always be encouraging and supportive
- Never make up specific user data or claim access to private information
- Help with common friction points like missing profile fields, interview preparation, etc.

Current conversation context will be provided in the user message.

IMPORTANT: You are an assistant for the Techcitta platform. Do not discuss topics outside of helping users with this website's features, interview process, profile building, or platform navigation.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I don't have a response for that.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}