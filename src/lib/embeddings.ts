import OpenAI from "openai";
import { prisma } from "./prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate an embedding vector for a text string using OpenAI.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleaned = text.replace(/\n/g, " ").trim();
  if (!cleaned) return new Array(EMBEDDING_DIMENSIONS).fill(0);

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleaned = texts.map((t) => t.replace(/\n/g, " ").trim());
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/**
 * Store a profile embedding in pgvector.
 * Uses raw SQL since Prisma doesn't natively support the vector type.
 */
export async function storeProfileEmbedding(userId: string, embedding: number[]): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO profile_embeddings (user_id, embedding, updated_at)
     VALUES ($1::uuid, $2::vector, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET embedding = $2::vector, updated_at = NOW()`,
    userId,
    vectorStr
  );
}

/**
 * Store a job embedding in pgvector.
 */
export async function storeJobEmbedding(jobId: string, embedding: number[]): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO job_embeddings (job_id, embedding, updated_at)
     VALUES ($1::uuid, $2::vector, NOW())
     ON CONFLICT (job_id) 
     DO UPDATE SET embedding = $2::vector, updated_at = NOW()`,
    jobId,
    vectorStr
  );
}

/**
 * Store a transcript segment embedding.
 */
export async function storeTranscriptEmbedding(
  segmentId: string,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO transcript_embeddings (segment_id, embedding, updated_at)
     VALUES ($1::uuid, $2::vector, NOW())
     ON CONFLICT (segment_id) 
     DO UPDATE SET embedding = $2::vector, updated_at = NOW()`,
    segmentId,
    vectorStr
  );
}

/**
 * Build a text representation of a user profile for embedding.
 */
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

/**
 * Build a text representation of a job for embedding.
 */
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
 * Find the top N most similar jobs for a user using cosine similarity.
 */
export async function findMatchingJobs(
  userId: string,
  limit: number = 10
): Promise<
  {
    jobId: string;
    similarity: number;
  }[]
> {
  const results: any[] = await prisma.$queryRawUnsafe(
    `SELECT j.id as job_id, 
            1 - (pe.embedding <=> (SELECT embedding FROM profile_embeddings WHERE user_id = $1::uuid)) as similarity
     FROM jobs j
     JOIN job_embeddings je ON je.job_id = j.id
     JOIN profile_embeddings pe ON pe.user_id = $1::uuid
     WHERE j.status = 'active'
     ORDER BY pe.embedding <=> je.embedding
     LIMIT $2`,
    userId,
    limit
  );

  return results.map((r: any) => ({ jobId: r.job_id, similarity: Number(r.similarity) }));
}

/**
 * Find the top N most similar candidates for a job.
 */
export async function findMatchingCandidates(
  jobId: string,
  limit: number = 10
): Promise<
  {
    userId: string;
    similarity: number;
  }[]
> {
  const results: any[] = await prisma.$queryRawUnsafe(
    `SELECT pe.user_id,
            1 - (je.embedding <=> pe.embedding) as similarity
     FROM profile_embeddings pe
     JOIN job_embeddings je ON je.job_id = $1::uuid
     JOIN profiles p ON p.user_id = pe.user_id
     ORDER BY pe.embedding <=> je.embedding
     LIMIT $2`,
    jobId,
    limit
  );

  return results.map((r: any) => ({ userId: r.user_id, similarity: Number(r.similarity) }));
}

/**
 * Semantic search across transcripts.
 */
export async function searchTranscripts(
  queryEmbedding: number[],
  limit: number = 10
): Promise<
  {
    segmentId: string;
    interviewId: string;
    speaker: string;
    text: string;
    similarity: number;
  }[]
> {
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const results: any[] = await prisma.$queryRawUnsafe(
    `SELECT ts.id as segment_id, ts.interview_id, ts.speaker, ts.text,
            1 - (te.embedding <=> $1::vector) as similarity
     FROM transcript_segments ts
     JOIN transcript_embeddings te ON te.segment_id = ts.id
     ORDER BY te.embedding <=> $1::vector
     LIMIT $2`,
    vectorStr,
    limit
  );

  return results.map((r: any) => ({
    segmentId: r.segment_id,
    interviewId: r.interview_id,
    speaker: r.speaker,
    text: r.text,
    similarity: Number(r.similarity),
  }));
}

/**
 * Initialize pgvector extension and create embedding tables.
 * Run this once when setting up the database.
 */
export async function initializeVectorTables(): Promise<void> {
  await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");

  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS profile_embeddings (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      embedding vector(${EMBEDDING_DIMENSIONS}),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  );

  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS job_embeddings (
      job_id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
      embedding vector(${EMBEDDING_DIMENSIONS}),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  );

  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS transcript_embeddings (
      segment_id UUID PRIMARY KEY REFERENCES transcript_segments(id) ON DELETE CASCADE,
      embedding vector(${EMBEDDING_DIMENSIONS}),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  );

  // Create HNSW indexes for fast approximate nearest neighbor search
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_profile_embedding 
    ON profile_embeddings USING hnsw (embedding vector_cosine_ops)`
  );

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_job_embedding 
    ON job_embeddings USING hnsw (embedding vector_cosine_ops)`
  );

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_transcript_embedding 
    ON transcript_embeddings USING hnsw (embedding vector_cosine_ops)`
  );
}
