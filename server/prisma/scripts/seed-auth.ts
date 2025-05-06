// scripts/seed-auth-db.ts
// If you're using a separate client for auth, use this import instead:
import { PrismaClient } from '../../prisma/generated/auth-client';

async function seedAuthDatabase() {
  // Use environment variable for auth database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.AUTH_DATABASE_URL,
      },
    },
  });

  try {
    console.log("Seeding auth database...");

    // Create admin user with already hashed password
    const user = await prisma.user.create({
      data: {
        id: "1", // Adding an ID (modify as needed)
        email: "admin@example.com",
        password:
          "$2a$10$r0qjaDXvPi5e8baza.FT3uNOFHUo4WSbcyYszsszrDLHHuALcP5PC", // Pre-hashed password
        name: "admin user",
      },
    });

    console.log("Created user:", user);

    // Grant database access to both business databases
    await prisma.databaseAccess.createMany({
      data: [
        {
          userId: user.id,
          databaseName: "lagom",
        },
        {
          userId: user.id,
          databaseName: "insight",
        },
      ],
    });

    console.log(
      "Database access granted to user for lagom and insight databases"
    );
    console.log("Auth database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding auth database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seed function
seedAuthDatabase();
