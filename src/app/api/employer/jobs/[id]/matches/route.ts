import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import {
  generateEmbedding,
  jobToText,
  storeJobEmbedding,
  findMatchingCandidates,
} from "@/lib/embeddings";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const requester = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true, organizationId: true },
    });

    if (!requester || (requester.role !== "admin" && requester.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.organizationId !== requester.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If the job has no embedding yet (e.g. created before this feature,
    // or embedding generation failed at creation), index it now.
    const [embeddingRow] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*) as count FROM job_embeddings WHERE job_id = $1::uuid",
      id
    );
    if (!embeddingRow || Number(embeddingRow.count) === 0) {
      try {
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
        await storeJobEmbedding(job.id, embedding);
      } catch (embedError) {
        console.error("Failed to index job embedding on match request:", embedError);
        return NextResponse.json({ success: true, matches: [], indexed: false });
      }
    }

    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 20, 50);
    const matches = await findMatchingCandidates(id, limit);

    const userIds = matches.map((m) => m.userId);
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        currentRole: true,
        currentLocation: true,
        totalExperience: true,
        skills: true,
        education: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            interview: {
              select: { evaluationScore: true, evaluation: true, status: true },
            },
          },
        },
      },
    });

    const results = matches.map((m) => {
      const profile = profiles.find((p: { userId: string }) => p.userId === m.userId);
      return {
        userId: m.userId,
        name: profile?.user?.name || "Unknown",
        email: profile?.user?.email || null,
        phone: profile?.user?.phone || null,
        currentRole: profile?.currentRole || null,
        currentLocation: profile?.currentLocation || null,
        totalExperience: profile?.totalExperience || null,
        skills: profile?.skills || null,
        education: profile?.education || null,
        evaluationScore: profile?.user?.interview?.evaluationScore ?? null,
        interviewStatus: profile?.user?.interview?.status ?? null,
        similarity: Math.round(m.similarity * 10000) / 100,
      };
    });

    return NextResponse.json({ success: true, indexed: true, matches: results });
  } catch (error) {
    console.error("Get job matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
