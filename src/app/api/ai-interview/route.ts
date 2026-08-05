import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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
      const systemPrompt = `You are an AI interviewer for Techcitta, a job screening platform. 
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
      
      Language style — IMPORTANT: Speak in simple, warm "desi English" (everyday Indian English). Use short, easy sentences and common words so that candidates who are not native English speakers can easily understand you. Keep it friendly and natural, like a helpful recruiter. You may occasionally use a simple Hindi word (like "Let's start, ok?" / "Good, ji") but keep it mostly clear English. Avoid complex vocabulary, slang, and long sentences.
      
      Start by introducing yourself and asking the first question.`;

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Start the interview" },
        ],
        max_completion_tokens: 1000,
        reasoning_effort: "low",
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
      const systemPrompt = `You are an AI interviewer for Techcitta. 
      Continue the interview professionally. 
      Ask relevant follow-up questions or move to the next topic.
      Keep responses concise (2-3 sentences max).
      After 5-6 questions, wrap up the interview and thank the candidate.
      
      Language style — IMPORTANT: Speak in simple, warm "desi English" (everyday Indian English). Use short, easy sentences and common words so that candidates who are not native English speakers can easily understand you. Keep it friendly and natural. Avoid complex vocabulary and long sentences.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        ...(conversationHistory || []),
        { role: "user", content: userMessage },
      ];

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-5-nano",
        messages,
        max_completion_tokens: 1000,
        reasoning_effort: "low",
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
      3. Weaknesses / Areas for improvement (3 bullet points)
      4. Topics to learn and grow (3-5 specific topics the candidate should study to improve, based on the answers they gave — be concrete, e.g. specific technologies, concepts, or skills)
      5. Overall recommendation (Hire/Consider/Reject)
      
      Format as JSON with keys: score, strengths, weaknesses, areasForImprovement, topicsToLearn, recommendation.`;

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: "You are an interview evaluator. Provide structured feedback. Always return valid JSON." },
          { role: "user", content: evaluationPrompt },
        ],
        max_completion_tokens: 2000,
        reasoning_effort: "low",
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
