import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/admin";
import { AdminRole } from "@prisma/client";
import crypto from "crypto";

// POST /api/admin/invite  — send an admin invite (SUPER_ADMIN only)
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !hasRole(user.role, AdminRole.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body as { email: string; role: AdminRole };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  if (!Object.values(AdminRole).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent inviting a SUPER_ADMIN (only one super admin allowed)
  if (role === AdminRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Cannot invite another SUPER_ADMIN" }, { status: 400 });
  }

  // Check if user already has a role
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if (existing?.role) {
    return NextResponse.json({ error: "User already has an admin role" }, { status: 409 });
  }

  // Delete any pending (unaccepted) invite for this email
  await prisma.adminInvite.deleteMany({
    where: { email, accepted: false },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours

  const invite = await prisma.adminInvite.create({
    data: {
      email,
      role,
      token,
      invitedById: user.id,
      expiresAt,
    },
  });

  // In production you'd send an email here. We return the invite link.
  const inviteLink = `${process.env.NEXTAUTH_URL}/admin/accept-invite?token=${token}`;

  return NextResponse.json({ invite, inviteLink }, { status: 201 });
}

// GET /api/admin/invite  — list pending invites (SUPER_ADMIN only)
export async function GET() {
  const user = await getCurrentUser();

  if (!user || !hasRole(user.role, AdminRole.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.adminInvite.findMany({
    where: { accepted: false },
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
