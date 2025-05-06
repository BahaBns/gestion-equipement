import { PrismaClient } from "@prisma/client";

// Default client for backward compatibility
const defaultPrisma = new PrismaClient();

export async function main(prisma: PrismaClient = defaultPrisma) {
  try {
    console.log("Starting to seed etats...");

    // Create the states
    const etats = [
      { name: "opérationnel" },
      { name: "en maintenance" },
      { name: "en panne" },
      { name: "expiré" },
    ];

    // Insert each state with a unique ID
    for (const etat of etats) {
      await prisma.etat.upsert({
        where: { name: etat.name },
        update: {}, // No updates if already exists
        create: {
          etatId: etat.name.replace(/\s+/g, "_").toLowerCase(), // Create ID from name (e.g., "en_panne")
          name: etat.name,
        },
      });
      console.log(`Created etat: ${etat.name}`);
    }

    console.log("Etats seeded successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
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
