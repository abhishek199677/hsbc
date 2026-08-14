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

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true, organizationId: true },
    });

    if (!requester || (requester.role !== "admin" && requester.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobs = await prisma.job.findMany({
      where: { organizationId: requester.organizationId },
      include: {
        organization: {
          select: { name: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Get employer jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true, organizationId: true },
    });

    if (!requester || (requester.role !== "admin" && requester.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }
    if (employmentType && !VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
      return NextResponse.json(
        { error: `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (experienceLevel && !VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return NextResponse.json(
        { error: `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }
    if (status && !VALID_STATUSES.includes(status)) {
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

    const job = await prisma.job.create({
      data: {
        organizationId: requester.organizationId,
        title: title.trim(),
        description: description.trim(),
        department: department?.trim() || null,
        location: location?.trim() || null,
        employmentType: employmentType || null,
        experienceLevel: experienceLevel || null,
        salaryMin: min,
        salaryMax: max,
        currency: currency?.trim() || "INR",
        requiredSkills: requiredSkills?.trim() || null,
        preferredSkills: preferredSkills?.trim() || null,
        status: status || "active",
      },
      include: {
        organization: {
          select: { name: true, logoUrl: true },
        },
      },
    });

    // Best-effort: generate and store the job embedding so AI matching works.
    // Failures here should not block job creation.
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
      console.error("Failed to index job embedding:", embedError);
    }

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("Create employer job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
