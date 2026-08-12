import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  transcribeAudio,
  transcribeAndStore,
  wordsToVtt,
  isDeepgramEnabled,
} from "@/lib/deepgram";
import { generateEmbedding, storeTranscriptEmbedding } from "@/lib/embeddings";
import { getFile } from "@/lib/storage";

/**
 * POST /api/transcribe - Transcribe interview audio
 * Body: { interviewId: string, audioUrl?: string }
 */
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDeepgramEnabled()) {
      return NextResponse.json(
        { error: "Deepgram transcription is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { interviewId, audioUrl } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID required" },
        { status: 400 }
      );
    }

    // Verify the interview belongs to this user
    const interview = await prisma.interview.findUnique({
      where: { userId: user.userId },
      select: { id: true, audioUrl: true, transcript: true },
    });

    if (!interview || interview.id !== interviewId) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Check if already transcribed
    if (interview.transcript) {
      return NextResponse.json({
        success: true,
        message: "Interview already transcribed",
        transcript: interview.transcript,
      });
    }

    // Get the audio file from storage
    const audioSource = audioUrl || interview.audioUrl;
    if (!audioSource) {
      return NextResponse.json(
        { error: "No audio file available for transcription" },
        { status: 400 }
      );
    }

    // Extract storage key from URL
    let audioBuffer: Buffer | null = null;
    if (audioSource.startsWith("/api/files/")) {
      const key = audioSource.replace("/api/files/", "");
      audioBuffer = await getFile(key) as Buffer | null;
    }

    if (!audioBuffer) {
      return NextResponse.json(
        { error: "Could not retrieve audio file" },
        { status: 500 }
      );
    }

    // Transcribe with Deepgram
    const { transcript, words, paragraphs } = await transcribeAudio(audioBuffer);

    // Generate VTT captions
    const vtt = wordsToVtt(words);

    // Store transcript segments and embeddings
    const segmentData = paragraphs.map((p) => ({
      interviewId,
      speaker: p.speaker === 0 ? "candidate" : "ai_interviewer",
      text: p.text,
      startMs: Math.round(p.start * 1000),
      endMs: Math.round(p.end * 1000),
    }));

    if (segmentData.length > 0) {
      await prisma.transcriptSegment.createMany({ data: segmentData });

      // Generate and store embeddings for each segment
      for (const segment of segmentData) {
        try {
          const embedding = await generateEmbedding(segment.text);
          const createdSegment = await prisma.transcriptSegment.findFirst({
            where: {
              interviewId,
              text: segment.text,
              startMs: segment.startMs,
            },
            select: { id: true },
          });
          if (createdSegment) {
            await storeTranscriptEmbedding(createdSegment.id, embedding);
          }
        } catch (error) {
          console.error("Failed to generate segment embedding:", error);
        }
      }
    }

    // Update interview with transcript
    await prisma.interview.update({
      where: { id: interviewId },
      data: { transcript },
    });

    return NextResponse.json({
      success: true,
      transcript,
      vtt,
      segmentCount: segmentData.length,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
