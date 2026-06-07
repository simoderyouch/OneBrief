import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type AuthenticatedUserResult =
  | { ok: true; user: { id: string; email: string; name: string | null; nickname: string | null } }
  | { ok: false; reason: "no_session" }
  | { ok: false; reason: "user_not_in_db" }
  | { ok: false; reason: "database_unavailable"; message: string };

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.name = (token.name as string | null | undefined) ?? null;
        session.user.email = (token.email as string | null | undefined) ?? session.user.email;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string" || session.name === null) {
          token.name = session.name;
        }
      }
      return token;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

/** Exported for API routes that need to catch Prisma network/timeout errors */
export function isDatabaseConnectivityError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1017", "ETIMEDOUT"].includes(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(msg);
}

/**
 * Resolves the signed-in user against the database.
 * Use this before writes that reference `userId` — JWT can be stale after DB resets or env changes.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, reason: "no_session" };
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, nickname: true },
    });
    if (!user) {
      return { ok: false, reason: "user_not_in_db" };
    }
    return { ok: true, user };
  } catch (err) {
    if (isDatabaseConnectivityError(err)) {
      return {
        ok: false,
        reason: "database_unavailable",
        message:
          "Cannot reach the database (timeout or network). Check DATABASE_URL, VPN, and Supabase pooler settings.",
      };
    }
    throw err;
  }
}
