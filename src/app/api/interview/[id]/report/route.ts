import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!interview.resultsUnlocked) {
      return NextResponse.json(
        { error: "Results are locked. Please unlock to download." },
        { status: 402 }
      );
    }

    if (!interview.evaluation) {
      return NextResponse.json(
        { error: "Evaluation not available yet." },
        { status: 404 }
      );
    }

    // Parse evaluation
    let evaluation;
    try {
      evaluation = typeof interview.evaluation === "string"
        ? JSON.parse(interview.evaluation)
        : interview.evaluation;
    } catch {
      return NextResponse.json(
        { error: "Invalid evaluation data." },
        { status: 500 }
      );
    }

    // Fetch user name
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    });

    // Return JSON that the client will use to generate PDF
    return NextResponse.json({
      success: true,
      report: {
        candidateName: userData?.name || "Candidate",
        interviewDate: interview.date,
        duration: `${interview.duration} min`,
        evaluation: {
          score: evaluation.score || 0,
          strengths: evaluation.strengths || [],
          weaknesses: evaluation.weaknesses || [],
          areasForImprovement: evaluation.areasForImprovement || [],
          topicsToLearn: evaluation.topicsToLearn || [],
          recommendation: evaluation.recommendation || "N/A",
          questionScores: evaluation.questionScores || [],
        },
      },
    });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
