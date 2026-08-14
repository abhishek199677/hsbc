import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { generateEmbedding, jobToText, storeJobEmbedding } from "@/lib/embeddings";

const VALID_EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];
const VALID_EXPERIENCE_LEVELS = ["junior", "mid", "senior", "lead", "executive"];
const VALID_STATUSES = ["active", "paused", "closed", "draft"];

function toInt(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

async function getOrgScopedJob(jobId: string, userId: string) {
  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
  });

  if (!requester || (requester.role !== "admin" && requester.role !== "employer")) {
    return { error: "Forbidden" as const, status: 403 };
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return { error: "Job not found" as const, status: 404 };
  }
  if (job.organizationId !== requester.organizationId) {
    return { error: "Forbidden" as const, status: 403 };
  }

  return { job };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scoped = await getOrgScopedJob(id, auth.userId);
    if (!scoped.job) {
      return NextResponse.json({ error: scoped.error }, { status: scoped.status });
    }

    const body = await request.json();
    const {
      title,
      description,
      department,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency,
      requiredSkills,
      preferredSkills,
      status,
    } = body;

    if (title !== undefined && (!title || typeof title !== "string" || !title.trim())) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }
    if (description !== undefined && (!description || typeof description !== "string" || !description.trim())) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }
    if (employmentType !== undefined && !VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
      return NextResponse.json(
        { error: `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (experienceLevel !== undefined && !VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return NextResponse.json(
        { error: `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const min = toInt(salaryMin);
    const max = toInt(salaryMax);
    if (min !== undefined && max !== undefined && min > max) {
      return NextResponse.json({ error: "salaryMin cannot exceed salaryMax" }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(department !== undefined && { department: department?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(employmentType !== undefined && { employmentType: employmentType || null }),
        ...(experienceLevel !== undefined && { experienceLevel: experienceLevel || null }),
        ...(salaryMin !== undefined && { salaryMin: min }),
        ...(salaryMax !== undefined && { salaryMax: max }),
        ...(currency !== undefined && { currency: currency?.trim() || "INR" }),
        ...(requiredSkills !== undefined && { requiredSkills: requiredSkills?.trim() || null }),
        ...(preferredSkills !== undefined && { preferredSkills: preferredSkills?.trim() || null }),
        ...(status !== undefined && { status }),
      },
      include: {
        organization: {
          select: { name: true, logoUrl: true },
        },
      },
    });

    // Re-index embedding when the job content changes so matches stay accurate.
    if (
      title !== undefined ||
      description !== undefined ||
      requiredSkills !== undefined ||
      preferredSkills !== undefined ||
      location !== undefined ||
      experienceLevel !== undefined ||
      employmentType !== undefined
    ) {
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
        console.error("Failed to re-index job embedding:", embedError);
      }
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Update employer job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scoped = await getOrgScopedJob(id, auth.userId);
    if (!scoped.job) {
      return NextResponse.json({ error: scoped.error }, { status: scoped.status });
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employer job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
