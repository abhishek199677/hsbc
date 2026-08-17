import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationRole } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const authUser = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!authUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        organization: {
          select: {
            id: true,
            onboardingCompleted: true,
            onboardingStep: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      onboarding: {
        completed: user.organization.onboardingCompleted,
        step: user.organization.onboardingStep,
        organizationName: user.organization.name,
      },
    });
  } catch (error) {
    console.error("Onboarding status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!authUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { step, data } = body;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { organizationId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      onboardingStep: step,
    };

    if (step === 5) {
      updateData.onboardingCompleted = true;
    }

    if (step === 2 && data?.name) {
      updateData.name = data.name;
    }

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
