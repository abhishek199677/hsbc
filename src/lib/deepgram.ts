import { DefaultDeepgramClient } from "@deepgram/sdk";
import { prisma } from "./prisma";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

let deepgramClient: DefaultDeepgramClient | null = null;

function getDeepgram(): DefaultDeepgramClient {
  if (!deepgramClient) {
    deepgramClient = new DefaultDeepgramClient({
      auth: { apiKey: DEEPGRAM_API_KEY as string },
    });
  }
  return deepgramClient;
}

/**
 * Transcribe an audio file using Deepgram Nova-2.
 * Returns the full transcript with word-level timestamps.
 */
export async function transcribeAudio(
  audioBuffer: Buffer | Uint8Array,
  options: {
    language?: string;
    model?: string;
    punctuate?: boolean;
    diarize?: boolean;
    smart_format?: boolean;
  } = {}
): Promise<{
  transcript: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: number;
  }>;
  paragraphs: Array<{
    text: string;
    start: number;
    end: number;
    speaker: number;
  }>;
}> {
  const dg = getDeepgram();
  const audioData = Buffer.isBuffer(audioBuffer) ? audioBuffer : Buffer.from(audioBuffer);

  const response = await dg.listen.v1.media.transcribeFile(audioData, {
    model: options.model || "nova-2",
    language: options.language || "en",
    punctuate: options.punctuate !== false,
    diarize: options.diarize !== false,
    smart_format: options.smart_format !== false,
    paragraphs: true,
  });

  const result = (response as any)?.result || response;
  const transcript =
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  const words =
    result?.results?.channels?.[0]?.alternatives?.[0]?.words?.map(
      (w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
        speaker: w.speaker,
      })
    ) || [];

  // Build paragraphs from utterances
  const paragraphs =
    result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs
      ?.paragraphs?.map((p: any) => ({
      text: p.text,
      start: p.start,
      end: p.end,
      speaker: p.speaker || 0,
    })) || [];

  return { transcript, words, paragraphs };
}

/**
 * Transcribe audio and store segments in the database with embeddings.
 */
export async function transcribeAndStore(
  interviewId: string,
  audioBuffer: Buffer | Uint8Array
): Promise<{
  fullTranscript: string;
  segmentCount: number;
}> {
  const { transcript, words, paragraphs } = await transcribeAudio(audioBuffer);

  if (!transcript.trim()) {
    return { fullTranscript: "", segmentCount: 0 };
  }

  // Store transcript segments
  const segmentData = paragraphs.map((p) => ({
    interviewId,
    speaker: p.speaker === 0 ? "candidate" : "ai_interviewer",
    text: p.text,
    startMs: Math.round(p.start * 1000),
    endMs: Math.round(p.end * 1000),
  }));

  if (segmentData.length > 0) {
    await prisma.transcriptSegment.createMany({ data: segmentData });
  }

  return {
    fullTranscript: transcript,
    segmentCount: segmentData.length,
  };
}

/**
 * Generate VTT captions from words with timestamps.
 */
export function wordsToVtt(
  words: Array<{ word: string; start: number; end: number; speaker?: number }>,
  maxWordsPerCue: number = 12
): string {
  if (!words.length) return "WEBVTT\n";

  const lines = ["WEBVTT", ""];
  let cueIndex = 1;
  let currentCueWords: typeof words = [];
  let cueStart = words[0].start;
  let lastSpeaker = words[0].speaker;

  for (const word of words) {
    const speakerChanged = word.speaker !== undefined && word.speaker !== lastSpeaker;

    if (currentCueWords.length >= maxWordsPerCue || speakerChanged) {
      if (currentCueWords.length > 0) {
        const cueEnd = currentCueWords[currentCueWords.length - 1].end;
        const text = currentCueWords.map((w) => w.word).join(" ");
        const speakerLabel =
          lastSpeaker === 0
            ? "Candidate"
            : lastSpeaker === 1
            ? "AI Interviewer"
            : `Speaker ${lastSpeaker}`;
        lines.push(`${formatVttTime(cueStart)} --> ${formatVttTime(cueEnd)}`);
        lines.push(`${speakerLabel}: ${text}`);
        lines.push("");
        cueIndex++;
      }
      currentCueWords = [];
      cueStart = word.start;
    }

    currentCueWords.push(word);
    lastSpeaker = word.speaker;
  }

  // Final cue
  if (currentCueWords.length > 0) {
    const cueEnd = currentCueWords[currentCueWords.length - 1].end;
    const text = currentCueWords.map((w) => w.word).join(" ");
    const speakerLabel =
      lastSpeaker === 0
        ? "Candidate"
        : lastSpeaker === 1
        ? "AI Interviewer"
        : `Speaker ${lastSpeaker}`;
    lines.push(`${formatVttTime(cueStart)} --> ${formatVttTime(cueEnd)}`);
    lines.push(`${speakerLabel}: ${text}`);
    lines.push("");
  }

  return lines.join("\n");
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  const pad = (n: number, l = 2) => n.toString().padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

/**
 * Check if Deepgram is configured.
 */
export function isDeepgramEnabled(): boolean {
  return Boolean(DEEPGRAM_API_KEY);
}
