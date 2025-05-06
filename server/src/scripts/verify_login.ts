// src/scripts/verify_login.ts
import { PrismaClient } from "../../prisma/generated/auth-client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Email and password to test
const testEmail = "admin@insight.com";
const testPassword = "admin123";

async function verifyCredentials() {
  const prisma = new PrismaClient();
  
  try {
    console.log(`Testing login for: ${testEmail}`);
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    if (!user) {
      console.log("❌ User not found in database");
      return;
    }
    
    console.log("✅ User found:");
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.name}`);
    
    const validPassword = await bcrypt.compare(testPassword, user.password);
    
    if (validPassword) {
      console.log("✅ Password is correct");
    } else {
      console.log("❌ Password is incorrect");
      
      // Check if the hash format is valid
      if (!user.password.startsWith('$2a$')) {
        console.log("⚠️ Hash doesn't appear to be bcrypt format");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCredentials()
  .then(() => console.log("Verification complete"))
  .catch(e => console.error("Verification failed:", e));
