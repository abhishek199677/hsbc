import OpenAI from "openai";
import { prisma } from "./prisma";
import { trackedEmbedding } from "./openai-usage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleaned = text.replace(/\n/g, " ").trim();
  if (!cleaned) return new Array(EMBEDDING_DIMENSIONS).fill(0);

  const response = await trackedEmbedding(
    () => openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleaned,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
    {
      model: EMBEDDING_MODEL,
      endpoint: "embeddings/single",
    }
  );

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleaned = texts.map((t) => t.replace(/\n/g, " ").trim());
  const response = await trackedEmbedding(
    () => openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleaned,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
    {
      model: EMBEDDING_MODEL,
      endpoint: "embeddings/batch",
    }
  );

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function storeProfileEmbedding(userId: string, embedding: number[]): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO profile_embeddings (user_id, embedding, updated_at)
     VALUES ($1, $2::vector, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET embedding = $2::vector, updated_at = NOW()`,
    userId,
    vectorStr
  );
}

export async function storeJobEmbedding(jobId: string, embedding: number[]): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO job_embeddings (job_id, embedding, updated_at)
     VALUES ($1, $2::vector, NOW())
     ON CONFLICT (job_id)
     DO UPDATE SET embedding = $2::vector, updated_at = NOW()`,
    jobId,
    vectorStr
  );
}

export async function storeTranscriptEmbedding(
  segmentId: string,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO transcript_embeddings (segment_id, embedding, updated_at)
     VALUES ($1, $2::vector, NOW())
     ON CONFLICT (segment_id)
     DO UPDATE SET embedding = $2::vector, updated_at = NOW()`,
    segmentId,
    vectorStr
  );
}

export function profileToText(profile: {
  currentRole?: string | null;
  totalExperience?: string | null;
  skills?: string | null;
  aboutYou?: string | null;
  education?: string | null;
  currentCompany?: string | null;
  preferredLocation?: string | null;
  jobType?: string | null;
}): string {
  const parts: string[] = [];
  if (profile.currentRole) parts.push(`Role: ${profile.currentRole}`);
  if (profile.totalExperience) parts.push(`Experience: ${profile.totalExperience}`);
  if (profile.skills) parts.push(`Skills: ${profile.skills}`);
  if (profile.aboutYou) parts.push(`About: ${profile.aboutYou}`);
  if (profile.education) parts.push(`Education: ${profile.education}`);
  if (profile.currentCompany) parts.push(`Company: ${profile.currentCompany}`);
  if (profile.preferredLocation) parts.push(`Location: ${profile.preferredLocation}`);
  if (profile.jobType) parts.push(`Job Type: ${profile.jobType}`);
  return parts.join(". ");
}

export function jobToText(job: {
  title: string;
  description: string;
  requiredSkills?: string | null;
  preferredSkills?: string | null;
  location?: string | null;
  experienceLevel?: string | null;
  employmentType?: string | null;
}): string {
  const parts: string[] = [
    `Title: ${job.title}`,
    `Description: ${job.description}`,
  ];
  if (job.requiredSkills) parts.push(`Required Skills: ${job.requiredSkills}`);
  if (job.preferredSkills) parts.push(`Preferred Skills: ${job.preferredSkills}`);
  if (job.location) parts.push(`Location: ${job.location}`);
  if (job.experienceLevel) parts.push(`Level: ${job.experienceLevel}`);
  if (job.employmentType) parts.push(`Type: ${job.employmentType}`);
  return parts.join(". ");
}

/**
 * Find the top N most similar active jobs for a user using cosine similarity.
 * Tenant-scoped: only returns jobs belonging to the user's organization.
 */
export async function findMatchingJobs(
  userId: string,
  organizationId: string,
  limit: number = 10
): Promise<{ jobId: string; similarity: number }[]> {
  interface JobMatchResult {
    job_id: string;
    similarity: number;
  }

  const results: JobMatchResult[] = await prisma.$queryRawUnsafe(
    `SELECT j.id as job_id,
            1 - (pe.embedding <=> (SELECT embedding FROM profile_embeddings WHERE user_id = $1)) as similarity
     FROM "Job" j
     JOIN job_embeddings je ON je.job_id = j.id
     JOIN profile_embeddings pe ON pe.user_id = $1
     WHERE j.status = 'active' AND j."organizationId" = $2
     ORDER BY pe.embedding <=> je.embedding
     LIMIT $3`,
    userId,
    organizationId,
    limit
  );

  return results.map((r) => ({ jobId: r.job_id, similarity: Number(r.similarity) }));
}

/**
 * Find the top N most similar candidates for a job.
 * Tenant-scoped: only returns users belonging to the job's organization.
 */
export async function findMatchingCandidates(
  jobId: string,
  organizationId: string,
  limit: number = 10
): Promise<{ userId: string; similarity: number }[]> {
  interface CandidateMatchResult {
    user_id: string;
    similarity: number;
  }

  const results: CandidateMatchResult[] = await prisma.$queryRawUnsafe(
    `SELECT pe.user_id,
            1 - (je.embedding <=> pe.embedding) as similarity
     FROM profile_embeddings pe
     JOIN job_embeddings je ON je.job_id = $1
     JOIN "Profile" p ON p."userId" = pe.user_id
     JOIN "User" u ON u."id" = pe.user_id
     WHERE u."organizationId" = $2
     ORDER BY pe.embedding <=> je.embedding
     LIMIT $3`,
    jobId,
    organizationId,
    limit
  );

  return results.map((r) => ({ userId: r.user_id, similarity: Number(r.similarity) }));
}

/**
 * Semantic search across transcripts.
 * Tenant-scoped: only returns transcripts belonging to the organization's interviews.
 */
export async function searchTranscripts(
  queryEmbedding: number[],
  organizationId: string,
  limit: number = 10
): Promise<{
  segmentId: string;
  interviewId: string;
  speaker: string;
  text: string;
  similarity: number;
}[]> {
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  interface TranscriptSearchResult {
    segment_id: string;
    interview_id: string;
    speaker: string;
    text: string;
    similarity: number;
  }

  const results: TranscriptSearchResult[] = await prisma.$queryRawUnsafe(
    `SELECT ts.id as segment_id, ts."interviewId" as interview_id, ts.speaker, ts.text,
            1 - (te.embedding <=> $1::vector) as similarity
     FROM "TranscriptSegment" ts
     JOIN transcript_embeddings te ON te.segment_id = ts.id
     JOIN "Interview" i ON i."id" = ts."interviewId"
     JOIN "User" u ON u."id" = i."userId"
     WHERE u."organizationId" = $2
     ORDER BY te.embedding <=> $1::vector
     LIMIT $3`,
    vectorStr,
    organizationId,
    limit
  );

  return results.map((r) => ({
    segmentId: r.segment_id,
    interviewId: r.interview_id,
    speaker: r.speaker,
    text: r.text,
    similarity: Number(r.similarity),
  }));
}
