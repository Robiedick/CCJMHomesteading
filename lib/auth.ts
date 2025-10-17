import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

const isDev = process.env.NODE_ENV !== "production";

if (!process.env.NEXTAUTH_URL && isDev) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

if (!process.env.NEXTAUTH_SECRET && isDev) {
  process.env.NEXTAUTH_SECRET = "ccjm-homesteading-dev-secret-placeholder-key-123456";
}

const authSecret = process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error(
    "NEXTAUTH_SECRET is not configured. Set it in your environment before starting the app.",
  );
}

type SeedUser = {
  username: string;
  passwordHash: string;
  role: UserRole;
};

const ADMIN_SEEDS: SeedUser[] = [
  {
    username: "Robiedick",
    passwordHash: "$2b$10$QMWdx7stqvVPVJQe2AYhNuVbl76j4mDAz4Jl5v2iPRqorleoKtZCi",
    role: "admin",
  },
  {
    username: "Corina",
    passwordHash: "$2b$10$iyz/hkr2mbTlPzjYyzjrRu48MCGMN9emf24ioaz9ffWhLJnGGV0q.",
    role: "admin",
  },
];

let adminSeeded = false;

async function ensureAdminUsers() {
  if (adminSeeded) return;

  await Promise.all(
    ADMIN_SEEDS.map((seed) =>
      prisma.user.upsert({
        where: { username: seed.username },
        update: {
          username: seed.username,
          usernameNormalized: seed.username.toLowerCase(),
          passwordHash: seed.passwordHash,
          role: seed.role,
        },
        create: {
          username: seed.username,
          usernameNormalized: seed.username.toLowerCase(),
          passwordHash: seed.passwordHash,
          role: seed.role,
        },
      }),
    ),
  );

  adminSeeded = true;
}

type AuthorizedUser = NextAuthUser & {
  role: UserRole;
};

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username?.trim();
        const password = credentials?.password;

        if (!username || !password) {
          return null;
        }

        await ensureAdminUsers();

        const normalizedUsername = username.toLowerCase();

        const user =
          (await prisma.user.findUnique({
            where: { usernameNormalized: normalizedUsername },
          })) ??
          (await prisma.user.findUnique({
            where: { username: username },
          }));

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        const authorizedUser: AuthorizedUser = {
          id: user.id.toString(),
          name: user.username,
          role: user.role,
        };

        return authorizedUser;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = (user as AuthorizedUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions).catch((error) => {
    console.error("Failed to load auth session", error);
    return null;
  });
}

export async function requireAdminSession() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
