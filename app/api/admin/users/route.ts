import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/admin";
import { AdminRole } from "@prisma/client";

// GET /api/admin/users  — list all users with roles (ADMIN+)
export async function GET() {
  const user = await getCurrentUser();

  if (!user || !hasRole(user.role, AdminRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
