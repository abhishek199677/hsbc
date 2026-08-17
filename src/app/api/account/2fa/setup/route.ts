import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationRole } from "@/lib/authorization";
import { generateTwoFactorSecret, generateQRCode } from "@/lib/two-factor";

export async function POST(request: Request) {
  try {
    const authUser = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, role: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);
    const qrCodeDataUrl = await generateQRCode(otpauthUrl);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      success: true,
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
