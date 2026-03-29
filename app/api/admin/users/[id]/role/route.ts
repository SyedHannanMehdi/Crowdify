import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole } from "@/lib/admin";
import { AdminRole } from "@prisma/client";

// PATCH /api/admin/users/[id]/role  — update a user's role (SUPER_ADMIN only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !hasRole(currentUser.role, AdminRole.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const { role } = body as { role: AdminRole | null };

  // Cannot change your own role
  if (id === currentUser.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Validate role value
  if (role !== null && !Object.values(AdminRole).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Cannot promote another SUPER_ADMIN
  if (role === AdminRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Cannot assign SUPER_ADMIN role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: role ?? null },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user: updated });
}

// DELETE /api/admin/users/[id]/role  — remove a user's admin role (SUPER_ADMIN only)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !hasRole(currentUser.role, AdminRole.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (id === currentUser.id) {
    return NextResponse.json({ error: "Cannot remove your own role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: null },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
