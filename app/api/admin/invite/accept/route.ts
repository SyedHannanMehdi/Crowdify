import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/admin";

// POST /api/admin/invite/accept  — accept an admin invite by token
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { token } = body as { token: string };

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const invite = await prisma.adminInvite.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }

  if (invite.accepted) {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 409 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address" },
      { status: 403 }
    );
  }

  // Assign the role and mark invite as accepted in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { role: invite.role },
    }),
    prisma.adminInvite.update({
      where: { id: invite.id },
      data: { accepted: true },
    }),
  ]);

  return NextResponse.json({ message: "Invite accepted", role: invite.role });
}
