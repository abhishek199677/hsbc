import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  transcribeAudio,
  wordsToVtt,
  isDeepgramEnabled,
} from "@/lib/deepgram";
import { generateEmbedding, storeTranscriptEmbedding } from "@/lib/embeddings";
import { getFile } from "@/lib/storage";

/**
 * POST /api/transcribe - Transcribe interview audio
 * Body: { interviewId: string }
 */
export async function POST(request: Request) {
  try {
    const user = await getActiveUser(request);
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
    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID required" },
        { status: 400 }
      );
    }

    // Verify the interview belongs to this user — use persisted audioUrl only
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      select: { id: true, audioUrl: true, transcript: true },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    if (interview.transcript) {
      return NextResponse.json({
        success: true,
        message: "Interview already transcribed",
        transcript: interview.transcript,
      });
    }

    // Only use the persisted audioUrl — never trust caller-supplied URLs
    const audioSource = interview.audioUrl;
    if (!audioSource) {
      return NextResponse.json(
        { error: "No audio file available for transcription" },
        { status: 400 }
      );
    }

    // Enforce tenant prefix on storage key
    const orgPrefix = `/api/files/org-${user.organizationId}/interviews/`;
    if (!audioSource.startsWith(orgPrefix)) {
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    const key = audioSource.replace("/api/files/", "");
    const audioBuffer = await getFile(key) as Buffer | null;

    if (!audioBuffer) {
      return NextResponse.json(
        { error: "Could not retrieve audio file" },
        { status: 500 }
      );
    }

    const { transcript, words, paragraphs } = await transcribeAudio(audioBuffer);

    const vtt = wordsToVtt(words);

    const segmentData = paragraphs.map((p) => ({
      interviewId,
      speaker: p.speaker === 0 ? "candidate" : "ai_interviewer",
      text: p.text,
      startMs: Math.round(p.start * 1000),
      endMs: Math.round(p.end * 1000),
    }));

    if (segmentData.length > 0) {
      await prisma.transcriptSegment.createMany({ data: segmentData });

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
