import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";

import { authConfig } from "./auth.config";
import bcrypt from "bcrypt";
import { createDefaultTeam } from "./app/_actions/team/create";
import { Language } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;
        const user = await prisma.user.findUnique({
          where: { email: email as string },
        });

        if (!user || !user.password) return null;
        if (!user.emailVerified) {
          throw new Error("Email not verified");
        }
        const passwordsMatch = await bcrypt.compare(
          password as string,
          user.password as string
        );
        if (passwordsMatch) {
          return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user, session, trigger }) {
      if (trigger === "update" && session?.user) {
        token = {
          ...token,
          ...session.user,
        };
      }

      if (user) {
        token = {
          ...token,
          ...user,
        };

        // Create default team for user if they don't have any team
        // Run asynchronously to not block login process
        await createDefaultTeam(user.id!, user.name, user.image).catch(
          (error) => {
            console.error("Failed to create default team:", error);
          }
        );
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          emailVerified: token.emailVerified as Date,
          image: token.image as string,
          language: token.language as Language,
          createdAt: token.createdAt as Date,
        };
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}`;
    },
    ...authConfig,
  },

  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
