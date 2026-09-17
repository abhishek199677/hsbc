import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json({ error: "email and newPassword required" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
      select: { id: true, email: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: "User not found or error" }, { status: 500 });
  }
}
