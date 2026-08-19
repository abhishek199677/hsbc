import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const SCREENING_SERVICE_URL = process.env.SCREENING_SERVICE_URL || "http://localhost:8001";

/**
 * POST /api/agency/screen/bulk - Proxy bulk screening to Python service
 */
export async function POST(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true, organizationId: true },
    });

    if (!user || (user.role !== "admin" && user.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { jdKey, jdId, clientName, jobTitle, candidateIds, autoSubmit, autoReject } = body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: "candidateIds array is required" }, { status: 400 });
    }

    if (candidateIds.length > 50) {
      return NextResponse.json({ error: "Maximum 50 candidates per bulk screening" }, { status: 400 });
    }

    const candidates = await prisma.agencyCandidate.findMany({
      where: {
        id: { in: candidateIds },
        organizationId: user.organizationId,
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No candidates found" }, { status: 404 });
    }

    const candidateData = candidates.map((c) => {
      const parts: string[] = [];
      if (c.name) parts.push(`Name: ${c.name}`);
      if (c.email) parts.push(`Email: ${c.email}`);
      if (c.currentRole) parts.push(`Current Role: ${c.currentRole}`);
      if (c.currentCompany) parts.push(`Current Company: ${c.currentCompany}`);
      if (c.totalExperience) parts.push(`Total Experience: ${c.totalExperience}`);
      if (c.skills) parts.push(`Skills: ${c.skills}`);
      if (c.location) parts.push(`Location: ${c.location}`);
      if (c.notes) parts.push(`Summary: ${c.notes}`);

      return {
        id: c.id,
        name: c.name || "Unknown",
        resume_text: parts.join("\n"),
      };
    });

    const response = await fetch(`${SCREENING_SERVICE_URL}/screen/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jd_id: jdId,
        jd_key: jdKey,
        client_name: clientName,
        job_title: jobTitle,
        candidates: candidateData,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    if (autoSubmit || autoReject) {
      const results = data.results || [];
      for (const result of results) {
        if (autoReject && result.verdict === "DO NOT SUBMIT" && !result.error) {
          await prisma.agencyCandidate.update({
            where: { id: result.candidateId },
            data: {
              status: "rejected",
              notes: `[AI Screen] DO NOT SUBMIT — Score: ${result.matchScore}/100. ${result.finalRecommendation || ""}`,
            },
          });
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Bulk screening proxy error:", error);
    return NextResponse.json(
      {
        error: "Screening service unavailable. Make sure the Python service is running on port 8001.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
