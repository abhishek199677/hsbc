import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  validateProctoringReport,
  auditProctoring,
} from "@/lib/proctor-server";

/**
 * POST /api/proctor/validate - Validate a proctoring report server-side
 * Body: { interviewId: string, report: ProctoringReport }
 */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { interviewId, report } = body;

    if (!interviewId || !report) {
      return NextResponse.json(
        { error: "Interview ID and report required" },
        { status: 400 }
      );
    }

    // Verify the interview belongs to this user
    const interview = await prisma.interview.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!interview || interview.id !== interviewId) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Validate the report
    const validation = await validateProctoringReport(interviewId, report);

    // Store audit record
    await auditProctoring(interviewId, report, validation);

    // If tampering detected, update the interview proctoring status
    if (validation.tampered) {
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          proctoringStatus: "fail",
          proctoringReport: JSON.stringify({
            ...report,
            serverValidation: validation,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("Proctoring validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
