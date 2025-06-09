// scripts/setup-all-dbs.ts
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import { Pool } from "pg";

// Load environment variables
dotenv.config();

async function createDatabaseIfNotExists(dbName: string) {
  const pool = new Pool({
    user: "postgres",
    password: "123456",
    host: "localhost",
    port: 5432,
    database: "postgres", // Connect to default database
  });

  try {
    // Check if database exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rowCount === 0) {
      console.log(`Creating database: ${dbName}`);
      // Create the database
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (error) {
    console.error(`Error working with database ${dbName}:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function setupAllDatabases() {
  try {
    console.log("=== CREATING DATABASES IF THEY DON'T EXIST ===");
    await createDatabaseIfNotExists("auth_db");
    await createDatabaseIfNotExists("lagom");
    await createDatabaseIfNotExists("insight");

    console.log("\n=== MIGRATING ALL DATABASES ===");

    /* Migrate auth database
    console.log("\nMigrating auth database...");
    process.env.DATABASE_URL = process.env.AUTH_DATABASE_URL;
    execSync(
      "npx prisma migrate dev --name initial-auth-setup --schema=./prisma/schema.auth.prisma",
      {
        stdio: "inherit",
        env: { ...process.env },
      }
    );*/

    // Migrate lagom database
    console.log("\nMigrating lagom database...");
    process.env.DATABASE_URL = process.env.LAGOM_DATABASE_URL;
    execSync(
      "npx prisma migrate dev --name initial-business-setup --schema=./prisma/schema.business.prisma",
      {
        stdio: "inherit",
        env: { ...process.env },
      }
    );

    // Migrate insight database
    console.log("\nMigrating insight database...");
    process.env.DATABASE_URL = process.env.INSIGHT_DATABASE_URL;
    execSync(
      "npx prisma migrate dev --name initial-business-setup --schema=./prisma/schema.business.prisma",
      {
        stdio: "inherit",
        env: { ...process.env },
      }
    );

    console.log("\n=== ALL DATABASES SET UP SUCCESSFULLY ===");
  } catch (error) {
    console.error("Error during database setup:", error);
    process.exit(1);
  }
}

// Run the setup
setupAllDatabases();
