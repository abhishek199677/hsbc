import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/hireright",
  });
  return new PrismaClient({ adapter });
}

const cachedPrisma = globalForPrisma.prisma;
const hasCurrentSchema = cachedPrisma && "client" in cachedPrisma && "loginLog" in cachedPrisma;

export const prisma = hasCurrentSchema ? cachedPrisma : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
