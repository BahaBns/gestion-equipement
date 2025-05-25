// scripts/seedAuthUser.ts
import { PrismaClient } from "@prisma/auth-client"; // Adjust path if your auth-client is elsewhere
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding User table in auth_db...");

  const adminEmail = "admin@insight-times.com";
  const adminPassword = "admin123"; // The plain text password
  const adminName = "Admin"; // Optional: if you want to seed the name
  const saltRounds = 10;

  const adminEmail1 = "admin@lagomcons.com";
  const adminPassword1 = "admin123"; // The plain text password
  const adminName1 = "Admin"; // Optional: if you want to seed the name
  const saltRounds1 = 10;

  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
  console.log(`Password "${adminPassword}" hashed.`);
  const hashedPassword1 = await bcrypt.hash(adminPassword1, saltRounds1);
 

  try {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        name: adminName, // Add name here if you want to update it
      },
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName, // Add name here for creation
      },
    });
    const adminUser1 = await prisma.user.upsert({
      where: { email: adminEmail1 },
      update: {
        password: hashedPassword1,
        name: adminName1, // Add name here if you want to update it
      },
      create: {
        email: adminEmail1,
        password: hashedPassword1,
        name: adminName1, // Add name here for creation
      },
    });
    console.log(
      `Successfully seeded user: ${adminUser.email} ${adminUser1.email} `
    );
  } catch (error) {
    console.error("Error seeding user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("Finished seeding.");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
