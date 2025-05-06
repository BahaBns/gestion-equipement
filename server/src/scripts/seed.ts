// src/scripts/seedAdmin.ts

import { PrismaClient } from "../../prisma/generated/auth-client";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Starting to seed admin user...");
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@example.com" }
    });
    
    if (existingUser) {
      console.log("Admin user already exists");
      return;
    }
    
    // Create new admin user
    // Using the same hashed password from your hardcoded user
    const user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: "$2a$10$r0qjaDXvPi5e8baza.FT3uNOFHUo4WSbcyYszsszrDLHHuALcP5PC", // admin123
        name: "Administrator"
      }
    });
    
    console.log("✅ Admin user created successfully:");
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log("Password: admin123 (hashed in database)");
    
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
seedAdmin()
  .then(() => console.log("Seeding completed"))
  .catch(e => console.error("Seeding failed:", e));
