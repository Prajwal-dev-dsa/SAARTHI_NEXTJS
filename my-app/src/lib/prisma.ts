import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Retrieve the connection string from your environment
const connectionString = `${process.env.DATABASE_URL}`;

// 2. Setup a global variable to prevent connection exhaustion in Next.js development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 3. Helper function to initialize Prisma with the new v7 Adapter pattern
const createPrismaClient = () => {
  // Create a standard PostgreSQL connection pool
  const pool = new Pool({ connectionString });

  // Wrap the pool in the Prisma adapter
  const adapter = new PrismaPg(pool);

  // Initialize the Prisma Client with the adapter
  return new PrismaClient({ adapter });
};

// 4. Export the instantiated client
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
