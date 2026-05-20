import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      partnerOnboardingSteps: number;
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
    partnerOnboardingSteps?: number;
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
              // 'role' and 'partnerOnboardingSteps' will automatically default based on our Prisma schema
            },
          });
        }

        // Attach DB info to the NextAuth user object
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.partnerOnboardingSteps = dbUser.partnerOnboardingSteps;
      }
      return true;
    },

    // token ke andar user ka data dalta hai ye function
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.partnerOnboardingSteps = user.partnerOnboardingSteps;
      }

      // Update trigger logic so frontend can manually refresh the token
      if (trigger === "update" && session?.user) {
        if (session.user.role) token.role = session.user.role;
        if (session.user.partnerOnboardingSteps !== undefined) {
          token.partnerOnboardingSteps = session.user.partnerOnboardingSteps;
        }
      }
      return token;
    },

    // session ke andar token ka data use karke user ka data dalta hai ye function
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.partnerOnboardingSteps =
          token.partnerOnboardingSteps as number;
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
