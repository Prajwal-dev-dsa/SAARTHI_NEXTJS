import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Extend NextAuth types to include our new fields and error states
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      partnerOnboardingSteps: number;
      partnerStatus: string;
      rejectReason?: string | null;
      videoKycStatus: string;
      videoKycRoomId?: string | null;
      videoKycRejectReason?: string | null;
    } & DefaultSession["user"];
    error?: string;
  }
  interface User {
    role?: string;
    partnerOnboardingSteps?: number;
    partnerStatus?: string;
    rejectReason?: string | null;
    videoKycStatus: string;
    videoKycRoomId?: string | null;
    videoKycRejectReason?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("No user found");
        }

        if (user.isVerified === false) {
          throw new Error("Please verify your email before logging in.");
        }

        if (!user.password) {
          throw new Error("Please log in using Google.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return user;
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Check if user exists in our Postgres DB
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // If they don't exist, create a new user record
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: user.name || "User",
              email: user.email,
            },
          });
        }

        // Attach DB info to the NextAuth user object
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.partnerOnboardingSteps = dbUser.partnerOnboardingSteps;
        user.partnerStatus = dbUser.partnerStatus;
        user.rejectReason = dbUser.rejectReason;
        user.videoKycStatus = dbUser.videoKycStatus;
        user.videoKycRoomId = dbUser.videoKycRoomId;
        user.videoKycRejectReason = dbUser.videoKycRejectReason;
      }
      return true;
    },

    async jwt({ token, user }) {
      // 1. Initial Login: Grab the user ID
      if (user) {
        token.id = user.id;
      }

      // 2. On EVERY request, verify against the absolute latest DB state
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            name: true,
            email: true,
            role: true,
            partnerOnboardingSteps: true,
            partnerStatus: true,
            rejectReason: true,
            videoKycStatus: true,
            videoKycRoomId: true,
            videoKycRejectReason: true,
          },
        });

        if (!dbUser) {
          token.error = "UserDeleted";
          return token;
        }

        token.name = dbUser.name;
        token.email = dbUser.email;
        token.role = dbUser.role;
        token.partnerOnboardingSteps = dbUser.partnerOnboardingSteps;
        token.partnerStatus = dbUser.partnerStatus;
        token.rejectReason = dbUser.rejectReason;
        token.videoKycStatus = dbUser.videoKycStatus;
        token.videoKycRoomId = dbUser.videoKycRoomId;
        token.videoKycRejectReason = dbUser.videoKycRejectReason;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.error === "UserDeleted") {
        session.error = "UserDeleted";
      }

      if (session.user && token.id && !token.error) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.partnerOnboardingSteps =
          token.partnerOnboardingSteps as number;
        session.user.partnerStatus = token.partnerStatus as string;
        session.user.rejectReason = token.rejectReason as string | null;
        session.user.videoKycStatus = token.videoKycStatus as string;
        session.user.videoKycRoomId = token.videoKycRoomId as string | null;
        session.user.videoKycRejectReason = token.videoKycRejectReason as
          | string
          | null;
      }

      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 Day
  },
  secret: process.env.AUTH_SECRET,
});
