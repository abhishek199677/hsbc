import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveUser, requireOrganizationRole } from "@/lib/authorization";
import {
  generateEmbedding,
  storeProfileEmbedding,
  storeJobEmbedding,
  profileToText,
  jobToText,
  findMatchingJobs,
  findMatchingCandidates,
  searchTranscripts,
} from "@/lib/embeddings";

/**
 * POST /api/match - Generate embeddings and find matches
 * Body:
 *   { action: "index_profile" | "index_job" | "find_jobs" | "find_candidates" | "search_transcripts",
 *     jobId?: string, query?: string, limit?: number }
 */
export async function POST(request: Request) {
  try {
    const user = await getActiveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, jobId, query, limit } = body;

    // --- Index user profile embedding ---
    if (action === "index_profile") {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      const text = profileToText({
        currentRole: profile.currentRole,
        totalExperience: profile.totalExperience,
        skills: profile.skills,
        aboutYou: profile.aboutYou,
        education: profile.education,
        currentCompany: profile.currentCompany,
        preferredLocation: profile.preferredLocation,
        jobType: profile.jobType,
      });

      if (!text.trim()) {
        return NextResponse.json(
          { error: "Profile is too sparse to generate an embedding" },
          { status: 400 }
        );
      }

      const embedding = await generateEmbedding(text);
      await storeProfileEmbedding(user.id, embedding);

      return NextResponse.json({
        success: true,
        message: "Profile embedding generated",
        dimensions: embedding.length,
      });
    }

    // --- Index job embedding ---
    if (action === "index_job") {
      const operator = await requireOrganizationRole(request, ["owner", "admin", "interviewer"]);
      if (!operator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (!jobId) {
        return NextResponse.json(
          { error: "Job ID required" },
          { status: 400 }
        );
      }

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      if (job.organizationId !== operator.organizationId) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const text = jobToText({
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        location: job.location,
        experienceLevel: job.experienceLevel,
        employmentType: job.employmentType,
      });

      const embedding = await generateEmbedding(text);
      await storeJobEmbedding(jobId, embedding);

      return NextResponse.json({
        success: true,
        message: "Job embedding generated",
        dimensions: embedding.length,
      });
    }

    // --- Find matching jobs for current user ---
    if (action === "find_jobs") {
      const matchLimit = Math.min(limit || 10, 50);
      const matches = await findMatchingJobs(user.id, user.organizationId, matchLimit);

      const jobIds = matches.map((m) => m.jobId);
      const jobs = await prisma.job.findMany({
        where: { id: { in: jobIds } },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          employmentType: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          requiredSkills: true,
          organization: {
            select: { name: true, logoUrl: true },
          },
        },
      });

      const results = matches.map((m) => {
        const job = jobs.find((j: { id: string }) => j.id === m.jobId);
        return {
          ...job,
          similarity: Math.round(m.similarity * 10000) / 100,
        };
      });

      return NextResponse.json({ success: true, matches: results });
    }

    // --- Find matching candidates for a job ---
    if (action === "find_candidates") {
      const operator = await requireOrganizationRole(request, ["owner", "admin", "interviewer", "viewer"]);
      if (!operator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (!jobId) {
        return NextResponse.json(
          { error: "Job ID required" },
          { status: 400 }
        );
      }

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { organizationId: true },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      if (job.organizationId !== operator.organizationId) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const matchLimit = Math.min(limit || 10, 50);
      const matches = await findMatchingCandidates(jobId, operator.organizationId, matchLimit);

      const userIds = matches.map((m) => m.userId);
      const profiles = await prisma.profile.findMany({
        where: {
          userId: { in: userIds },
          user: { organizationId: operator.organizationId },
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      const results = matches.flatMap((m) => {
        const profile = profiles.find((p: { userId: string }) => p.userId === m.userId);
        if (!profile) return [];
        return [{
          userId: m.userId,
          name: profile?.user?.name || "Unknown",
          email: profile?.user?.email,
          currentRole: profile?.currentRole,
          skills: profile?.skills,
          totalExperience: profile?.totalExperience,
          similarity: Math.round(m.similarity * 10000) / 100,
        }];
      });

      return NextResponse.json({ success: true, matches: results });
    }

    // --- Semantic search across transcripts ---
    if (action === "search_transcripts") {
      const operator = await requireOrganizationRole(request, ["owner", "admin", "interviewer", "viewer"]);
      if (!operator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (!query) {
        return NextResponse.json(
          { error: "Query required" },
          { status: 400 }
        );
      }

      const queryEmbedding = await generateEmbedding(query);
      const searchLimit = Math.min(limit || 10, 50);
      const results = await searchTranscripts(queryEmbedding, operator.organizationId, searchLimit);

      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Match API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
