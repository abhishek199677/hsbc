import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("pgvector extension enabled successfully!");
  } catch (error) {
    console.log("Note: pgvector extension setup note:", error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
