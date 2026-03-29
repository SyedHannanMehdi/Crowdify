-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');

-- AlterTable: add role column to existing User table
ALTER TABLE "User" ADD COLUMN "role" "AdminRole";

-- CreateTable: AdminInvite
CREATE TABLE "AdminInvite" (
    "id"          TEXT         NOT NULL,
    "email"       TEXT         NOT NULL,
    "role"        "AdminRole"  NOT NULL DEFAULT 'ADMIN',
    "token"       TEXT         NOT NULL,
    "invitedById" TEXT         NOT NULL,
    "accepted"    BOOLEAN      NOT NULL DEFAULT false,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_token_key" ON "AdminInvite"("token");

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
