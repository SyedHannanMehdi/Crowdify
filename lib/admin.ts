import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole } from "@prisma/client";

/**
 * Returns the current session's user with their role,
 * or null if the user is not authenticated.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, image: true, role: true },
  });

  return user;
}

/**
 * Returns true if the user has at least the given role.
 * Role hierarchy: SUPER_ADMIN > ADMIN > MODERATOR
 */
export function hasRole(userRole: AdminRole | null | undefined, requiredRole: AdminRole): boolean {
  if (!userRole) return false;

  const hierarchy: Record<AdminRole, number> = {
    SUPER_ADMIN: 3,
    ADMIN: 2,
    MODERATOR: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Returns true if the current session user is any kind of admin.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role != null;
}

/**
 * Returns true if the current session user is a SUPER_ADMIN.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === AdminRole.SUPER_ADMIN;
}

/**
 * Seed helper: call this once to assign the first SUPER_ADMIN by email.
 * Only intended for use in server-side scripts / seeding.
 */
export async function seedSuperAdmin(email: string) {
  return prisma.user.update({
    where: { email },
    data: { role: AdminRole.SUPER_ADMIN },
  });
}
