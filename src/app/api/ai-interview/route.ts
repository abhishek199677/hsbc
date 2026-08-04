import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Generate interview questions based on resume/profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, profile, userMessage, conversationHistory } = body;

    if (action === "start") {
      // Start interview - generate introduction and first question
      const systemPrompt = `You are an AI interviewer for HireRight, a job screening platform. 
      You are conducting a 15-minute professional interview.
      
      Candidate Profile:
      - Name: ${profile?.name || "Candidate"}
      - Role: ${profile?.currentRole || "Professional"}
      - Experience: ${profile?.totalExperience || "Not specified"}
      - Skills: ${profile?.skills || "Not specified"}
      
      Your role:
      1. Be professional, friendly, and concise
      2. Ask one question at a time
      3. Evaluate answers based on relevance, depth, and communication
      4. Keep the interview moving (15 minutes total)
      5. Ask behavioral and technical questions relevant to their role
      
      Start by introducing yourself and asking the first question.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Start the interview" },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0]?.message?.content;

      return NextResponse.json({
        success: true,
        message: assistantMessage,
        messageCount: 1,
      });
    }

    if (action === "respond") {
      // Continue conversation
      const systemPrompt = `You are an AI interviewer for HireRight. 
      Continue the interview professionally. 
      Ask relevant follow-up questions or move to the next topic.
      Keep responses concise (2-3 sentences max).
      After 5-6 questions, wrap up the interview and thank the candidate.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        ...(conversationHistory || []),
        { role: "user", content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0]?.message?.content;
      const messageCount = (conversationHistory?.length || 0) / 2 + 1;

      return NextResponse.json({
        success: true,
        message: assistantMessage,
        messageCount,
        isComplete: messageCount >= 6,
      });
    }

    if (action === "evaluate") {
      // Evaluate the entire interview
      const evaluationPrompt = `Evaluate this interview and provide a score and feedback.
      
      Candidate: ${profile?.name}
      Role: ${profile?.currentRole}
      
      Interview Conversation:
      ${conversationHistory?.map((m: Message) => `${m.role}: ${m.content}`).join("\n")}
      
      Provide:
      1. Score (1-10)
      2. Strengths (3 bullet points)
      3. Areas for improvement (3 bullet points)
      4. Overall recommendation (Hire/Consider/Pass)
      
      Format as JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an interview evaluator. Provide structured feedback." },
          { role: "user", content: evaluationPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const evaluation = completion.choices[0]?.message?.content;

      return NextResponse.json({
        success: true,
        evaluation,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("AI Interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
