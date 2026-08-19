import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const SCREENING_SERVICE_URL = process.env.SCREENING_SERVICE_URL || "http://localhost:8001";

/**
 * POST /api/agency/screen - Proxy to Python screening service
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

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const jdKey = formData.get("jdKey") as string;
      const clientName = formData.get("clientName") as string;
      const jobTitle = formData.get("jobTitle") as string;
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
      }

      const pythonForm = new FormData();
      pythonForm.append("file", file);
      if (jdKey) pythonForm.append("jd_key", jdKey);
      if (clientName) pythonForm.append("client_name", clientName);
      if (jobTitle) pythonForm.append("job_title", jobTitle);

      const response = await fetch(`${SCREENING_SERVICE_URL}/screen/file`, {
        method: "POST",
        body: pythonForm,
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }
      return NextResponse.json(data);
    }

    const body = await request.json();
    const { jdKey, clientName, jobTitle, candidateId, resumeText } = body;

    let resumeTextToSend = resumeText;

    if (!resumeTextToSend && candidateId) {
      const candidate = await prisma.agencyCandidate.findFirst({
        where: { id: candidateId, organizationId: user.organizationId },
      });

      if (!candidate) {
        return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
      }

      if (candidate.resumeUrl) {
        return NextResponse.json(
          {
            error: "Candidate has a resume URL. Upload the file directly or provide resumeText.",
            candidateId: candidate.id,
            resumeUrl: candidate.resumeUrl,
          },
          { status: 400 }
        );
      }

      const parts: string[] = [];
      if (candidate.name) parts.push(`Name: ${candidate.name}`);
      if (candidate.currentRole) parts.push(`Current Role: ${candidate.currentRole}`);
      if (candidate.currentCompany) parts.push(`Current Company: ${candidate.currentCompany}`);
      if (candidate.totalExperience) parts.push(`Total Experience: ${candidate.totalExperience}`);
      if (candidate.skills) parts.push(`Skills: ${candidate.skills}`);
      if (candidate.location) parts.push(`Location: ${candidate.location}`);
      if (candidate.notes) parts.push(`Summary: ${candidate.notes}`);

      resumeTextToSend = parts.join("\n");
    }

    if (!resumeTextToSend) {
      return NextResponse.json(
        { error: "Provide resumeText, candidateId, or upload a file" },
        { status: 400 }
      );
    }

    const response = await fetch(`${SCREENING_SERVICE_URL}/screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jd_key: jdKey,
        client_name: clientName,
        job_title: jobTitle,
        resume_text: resumeTextToSend,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Screening proxy error:", error);
    return NextResponse.json(
      {
        error: "Screening service unavailable. Make sure the Python service is running on port 8001.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

/**
 * GET /api/agency/screen - List available client JDs from Python service
 */
export async function GET() {
  try {
    const response = await fetch(`${SCREENING_SERVICE_URL}/clients`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Screening service unavailable" },
      { status: 503 }
    );
  }
}
