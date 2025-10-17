import { prisma } from "@/lib/prisma";
import UsersManager from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        usedAt: true,
      },
    }),
  ]);

  return (
    <UsersManager
      users={users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }))}
      invitations={invitations.map((invitation) => ({
        ...invitation,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
        usedAt: invitation.usedAt ? invitation.usedAt.toISOString() : null,
      }))}
    />
  );
}
