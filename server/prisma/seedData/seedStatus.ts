import { PrismaClient } from "@prisma/client";

// Default client for backward compatibility
const defaultPrisma = new PrismaClient();

export async function main(prisma: PrismaClient = defaultPrisma) {
  try {
    console.log("Starting to seed database with status types...");

    // Define status types
    const statusTypes = [
      {
        statusId: "STATUS_DISPONIBLE",
        name: "Disponible",
      },
      {
        statusId: "STATUS_RESERVE",
        name: "Réservé",
      },
      {
        statusId: "STATUS_ASSIGNE",
        name: "Assigné",
      },
    ];

    // Create all the status types
    for (const status of statusTypes) {
      try {
        await prisma.status.upsert({
          where: { statusId: status.statusId },
          update: {
            name: status.name,
          },
          create: {
            statusId: status.statusId,
            name: status.name,
          },
        });
        console.log(`Created status: ${status.name}`);
      } catch (error) {
        console.error(`Error creating status ${status.name}:`, error);
      }
    }

    console.log("Status database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
  // No need to disconnect here, as it will be handled by the calling function
}

// For direct execution of this seed file
if (require.main === module) {
  main()
    .then(async () => {
      await defaultPrisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await defaultPrisma.$disconnect();
      process.exit(1);
    });
}
