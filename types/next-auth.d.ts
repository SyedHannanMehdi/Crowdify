import { AdminRole } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AdminRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AdminRole | null;
  }
}
