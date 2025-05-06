// scripts/seed-business-dbs.ts
import { withDatabaseUrl } from "../../src/utils/seedUtils";
import * as dotenv from "dotenv";

// Import your seed files
import * as seed from "../seedData/seed";
import * as seed1 from "../seedData/seed1";
import * as seedEtat from "../seedData/seedEtat";
import * as seedStatus from "../seedData/seedStatus";

// Load environment variables
dotenv.config();

async function seedBusinessDatabases() {
  const databases = [
    {
      name: "lagom",
      url: process.env.LAGOM_DATABASE_URL,
    },
    {
      name: "insight",
      url: process.env.INSIGHT_DATABASE_URL,
    },
  ];

  for (const db of databases) {
    if (!db.url) {
      console.error(`Missing database URL for ${db.name}`);
      continue;
    }

    console.log(`\n=== Starting seeding process for ${db.name} database ===\n`);

    try {
      // Run each seed file against this database
      await withDatabaseUrl(db.url, async (prisma) => {
        console.log(`Running seedStatus for ${db.name}...`);
        await seedStatus.main(prisma);
        console.log(`Status seeding complete for ${db.name}.`);

        console.log(`Running seedEtat for ${db.name}...`);
        await seedEtat.main(prisma);
        console.log(`Etat seeding complete for ${db.name}.`);

        console.log(`Running seed for ${db.name}...`);
        await seed.main(prisma);
        console.log(`Main seed complete for ${db.name}.`);

        console.log(`Running seed1 for ${db.name}...`);
        await seed1.main(prisma);
        console.log(`Additional seed1 complete for ${db.name}.`);
      });

      console.log(
        `\n=== Seeding completed successfully for ${db.name} database ===\n`
      );
    } catch (error) {
      console.error(`Error seeding ${db.name} database:`, error);
    }
  }

  console.log("All database seeding operations completed.");
}

// Run the seeding function
seedBusinessDatabases();
