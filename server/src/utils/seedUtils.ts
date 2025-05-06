// utils/seedUtils.ts
import { PrismaClient } from "@prisma/client";

// Create a function that sets the active database URL environment variable
export async function withDatabaseUrl(
  databaseUrl: string,
  callback: (prisma: PrismaClient) => Promise<void>
) {
  // Store the original DATABASE_URL
  const originalUrl = process.env.DATABASE_URL;

  try {
    // Set the DATABASE_URL to the target database
    process.env.DATABASE_URL = databaseUrl;

    // Create a new Prisma client with this database URL
    const prisma = new PrismaClient();

    // Run the callback with the prisma client
    await callback(prisma);

    // Cleanup
    await prisma.$disconnect();
  } finally {
    // Restore the original DATABASE_URL
    process.env.DATABASE_URL = originalUrl;
  }
}
